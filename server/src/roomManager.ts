import { randomUUID, timingSafeEqual } from 'node:crypto';
import type {
  Token,
  InitiativeItem,
  InitiativeSortMode,
  BgImage,
} from '../../src/types/game';
import type {
  RoomJoinState,
  RoomMember,
  SoundpadControlPayload,
  SoundpadStatePayload,
  SyncStatePayload,
  UserRole,
} from '../../src/types/multiplayer';
import type { FogState } from '../../src/types/fog';
import { toPlayerState } from './playerView';

/** Dados do soundpad guardados para quem entra com a música já tocando. */
interface SoundpadSnapshot {
  state: SoundpadStatePayload;
  /** Instante (relógio do servidor) em que `state.positionSec` foi medido. */
  updatedAt: number;
}

export interface ActiveRoom {
  code: string;
  hostSocketId: string;
  /** Segredo que só o criador conhece; é o que autoriza o papel de mestre. */
  hostToken: string;
  members: Map<string, RoomMember>;
  tokens: Token[];
  initiativeQueue: InitiativeItem[];
  initiativeSortMode: InitiativeSortMode;
  bgImages: BgImage[];
  round: number;
  turn: number;
  fog?: FogState;
  soundpad: SoundpadSnapshot | null;
  createdAt: number;
  /** Remoção agendada quando a sala fica vazia (permite o mestre reconectar). */
  cleanupTimer: ReturnType<typeof setTimeout> | null;
}

const MEMBER_COLORS = [
  '#e55757', // vermelho
  '#04d361', // verde
  '#8257e5', // roxo
  '#2ac7e3', // ciano
  '#ffd700', // dourado
  '#ff9000', // laranja
  '#ff69b4', // rosa
];

/** Tempo que uma sala vazia sobrevive, para o mestre recarregar a página. */
const EMPTY_ROOM_GRACE_MS = 2 * 60 * 1000;
const MAX_NAME_LENGTH = 24;

function cleanName(name: unknown, fallback: string): string {
  if (typeof name !== 'string') return fallback;
  const trimmed = name.trim().slice(0, MAX_NAME_LENGTH);
  return trimmed || fallback;
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

export class RoomManager {
  private rooms = new Map<string, ActiveRoom>(); // code -> ActiveRoom
  private socketToRoom = new Map<string, string>(); // socketId -> code

  private generateCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'SGM-';
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) {
      return this.generateCode();
    }
    return code;
  }

  public createRoom(hostSocketId: string, hostName: string): ActiveRoom {
    const code = this.generateCode();
    const hostMember: RoomMember = {
      id: hostSocketId,
      name: cleanName(hostName, 'Mestre'),
      role: 'gm',
      color: '#8257e5',
      isOnline: true,
    };

    const room: ActiveRoom = {
      code,
      hostSocketId,
      hostToken: randomUUID(),
      members: new Map([[hostSocketId, hostMember]]),
      tokens: [],
      initiativeQueue: [],
      initiativeSortMode: 'descending',
      bgImages: [],
      round: 1,
      turn: 1,
      soundpad: null,
      createdAt: Date.now(),
      cleanupTimer: null,
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(hostSocketId, code);
    return room;
  }

  /**
   * Entra na sala. O papel de mestre só é concedido a quem apresenta o
   * `hostToken` da sala; qualquer outra pessoa entra SEMPRE como jogador
   * (mesmo que o mestre esteja momentaneamente offline).
   */
  public joinRoom(
    code: string,
    socketId: string,
    name: string,
    hostToken?: string,
  ): { room: ActiveRoom; member: RoomMember } | null {
    const normalizedCode = code.trim().toUpperCase();
    const room = this.rooms.get(normalizedCode);
    if (!room) return null;

    this.cancelCleanup(room);

    const role: UserRole =
      typeof hostToken === 'string' && safeEqual(hostToken, room.hostToken)
        ? 'gm'
        : 'player';

    if (role === 'gm') {
      // Reassume a sala: descarta a conexão antiga do mestre (aba antiga/queda).
      for (const [id, m] of room.members) {
        if (m.role === 'gm' && id !== socketId) {
          room.members.delete(id);
          this.socketToRoom.delete(id);
        }
      }
      room.hostSocketId = socketId;
    }

    const colorIndex = room.members.size % MEMBER_COLORS.length;
    const fallbackName =
      role === 'gm' ? 'Mestre' : `Jogador ${room.members.size}`;
    const member: RoomMember = {
      id: socketId,
      name: cleanName(name, fallbackName),
      role,
      color: role === 'gm' ? '#8257e5' : MEMBER_COLORS[colorIndex],
      isOnline: true,
    };

    room.members.set(socketId, member);
    this.socketToRoom.set(socketId, normalizedCode);

    return { room, member };
  }

  public leaveRoom(
    socketId: string,
  ): { room: ActiveRoom; memberId: string; member: RoomMember } | null {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;

    const room = this.rooms.get(code);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    const member = room.members.get(socketId);
    room.members.delete(socketId);
    this.socketToRoom.delete(socketId);

    // Sala vazia: não apaga na hora, para o mestre poder reconectar/recarregar.
    if (room.members.size === 0) {
      this.scheduleCleanup(room);
    }

    return {
      room,
      memberId: socketId,
      member: member ?? {
        id: socketId,
        name: 'Jogador',
        role: 'player',
        color: MEMBER_COLORS[0],
        isOnline: false,
      },
    };
  }

  /** Encerra a sala para todos (o mestre saiu de propósito). */
  public closeRoom(code: string): void {
    const room = this.rooms.get(code);
    if (!room) return;
    this.cancelCleanup(room);
    for (const id of room.members.keys()) {
      this.socketToRoom.delete(id);
    }
    this.rooms.delete(code);
  }

  private scheduleCleanup(room: ActiveRoom): void {
    this.cancelCleanup(room);
    room.cleanupTimer = setTimeout(() => {
      if (room.members.size === 0) {
        this.rooms.delete(room.code);
      }
    }, EMPTY_ROOM_GRACE_MS);
    // Não impede o processo de encerrar.
    room.cleanupTimer.unref?.();
  }

  private cancelCleanup(room: ActiveRoom): void {
    if (room.cleanupTimer) {
      clearTimeout(room.cleanupTimer);
      room.cleanupTimer = null;
    }
  }

  public getRoom(code: string): ActiveRoom | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }

  public getRoomBySocketId(socketId: string): ActiveRoom | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  public getMember(socketId: string): RoomMember | undefined {
    return this.getRoomBySocketId(socketId)?.members.get(socketId);
  }

  public membersOf(room: ActiveRoom): RoomMember[] {
    return Array.from(room.members.values());
  }

  /** Estado entregue a quem acabou de entrar, conforme o papel dele. */
  public toJoinState(room: ActiveRoom, role: UserRole): RoomJoinState {
    return {
      code: room.code,
      members: this.membersOf(room),
      view: role === 'player' ? toPlayerState(room) : null,
      soundpad: this.getSoundpadForJoin(room),
    };
  }

  public syncFullState(code: string, payload: SyncStatePayload): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.tokens = Array.isArray(payload.tokens) ? payload.tokens : [];
    room.initiativeQueue = Array.isArray(payload.initiativeQueue)
      ? payload.initiativeQueue
      : [];
    room.initiativeSortMode = payload.initiativeSortMode ?? 'descending';
    room.bgImages = Array.isArray(payload.bgImages) ? payload.bgImages : [];
    room.round = Number.isFinite(payload.round) ? payload.round : 1;
    room.turn = Number.isFinite(payload.turn) ? payload.turn : 1;
    if (payload.fog) {
      room.fog = payload.fog;
    }
  }

  public setFog(code: string, fog: FogState): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.fog = fog;
  }

  /**
   * Retorna `false` se o token não existe na sala (ou, com `onlyIfPlaced`,
   * se ele não está no mapa — um jogador não pode colocar token no mapa).
   */
  public moveToken(
    code: string,
    tokenId: string,
    x: number | null,
    y: number | null,
    onlyIfPlaced = false,
  ): boolean {
    const room = this.getRoom(code);
    if (!room) return false;
    const token = room.tokens.find((t) => t.id === tokenId);
    if (!token) return false;
    if (onlyIfPlaced && (token.x === null || token.y === null)) return false;
    token.x = x;
    token.y = y;
    return true;
  }

  public updateToken(
    code: string,
    tokenId: string,
    updates: Partial<Token>,
  ): void {
    const room = this.getRoom(code);
    if (!room) return;
    const index = room.tokens.findIndex((t) => t.id === tokenId);
    if (index > -1) {
      room.tokens[index] = { ...room.tokens[index], ...updates };
    }
  }

  public addToken(code: string, token: Token): void {
    const room = this.getRoom(code);
    if (!room) return;
    // Evita duplicar um token reenviado (ex.: evento repetido após reconexão).
    if (room.tokens.some((t) => t.id === token.id)) return;
    room.tokens.push(token);
  }

  public removeToken(code: string, tokenId: string): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.tokens = room.tokens.filter((t) => t.id !== tokenId);
    room.initiativeQueue = room.initiativeQueue.filter(
      (i) => i.tokenId !== tokenId,
    );
  }

  public updateInitiative(
    code: string,
    queue: InitiativeItem[],
    sortMode?: InitiativeSortMode,
  ): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.initiativeQueue = queue;
    if (sortMode) room.initiativeSortMode = sortMode;
  }

  // Background Images
  public addBgImage(code: string, bg: BgImage): void {
    const room = this.getRoom(code);
    if (!room) return;
    if (room.bgImages.some((b) => b.id === bg.id)) return;
    room.bgImages.push(bg);
  }

  public updateBgImage(
    code: string,
    bgId: string,
    updates: Partial<BgImage>,
  ): void {
    const room = this.getRoom(code);
    if (!room) return;
    const index = room.bgImages.findIndex((b) => b.id === bgId);
    if (index > -1) {
      room.bgImages[index] = { ...room.bgImages[index], ...updates };
    }
  }

  public removeBgImage(code: string, bgId: string): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.bgImages = room.bgImages.filter((b) => b.id !== bgId);
  }

  // Campaign Round / Turn
  public updateRoundTurn(code: string, round: number, turn: number): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.round = round;
    room.turn = turn;
  }

  // Soundpad
  public setSoundpadState(code: string, state: SoundpadStatePayload): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.soundpad = { state, updatedAt: Date.now() };
  }

  /** Retorna `false` se o controle é de outra faixa (mensagem atrasada). */
  public applySoundpadControl(
    code: string,
    control: SoundpadControlPayload,
  ): boolean {
    const room = this.getRoom(code);
    if (!room?.soundpad) return false;
    if ((room.soundpad.state.song?.id ?? null) !== control.songId) {
      return false;
    }
    room.soundpad = {
      state: {
        ...room.soundpad.state,
        isPlaying: control.isPlaying,
        positionSec: control.positionSec,
      },
      updatedAt: Date.now(),
    };
    return true;
  }

  /** Estado do soundpad com a posição já avançada até agora. */
  private getSoundpadForJoin(room: ActiveRoom): SoundpadStatePayload | null {
    if (!room.soundpad) return null;
    const { state, updatedAt } = room.soundpad;
    if (!state.song || !state.isPlaying) return state;

    const elapsed = (Date.now() - updatedAt) / 1000;
    let positionSec = state.positionSec + elapsed;
    if (state.song.duration > 0) {
      positionSec = Math.min(positionSec, state.song.duration);
    }
    return { ...state, positionSec };
  }
}

export const roomManager = new RoomManager();
