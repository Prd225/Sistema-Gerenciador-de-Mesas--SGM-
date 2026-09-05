import type {
  Token,
  InitiativeItem,
  BgImage,
  Zone,
  Marker,
} from '../../src/types/game';
import type {
  RoomMember,
  RoomState,
  SyncStatePayload,
} from '../../src/types/multiplayer';

export interface ActiveRoom {
  code: string;
  hostSocketId: string;
  members: Map<string, RoomMember>;
  tokens: Token[];
  initiativeQueue: InitiativeItem[];
  bgImages: BgImage[];
  zones: Record<string, Zone>;
  markers: Record<string, Marker>;
  round: number;
  turn: number;
  createdAt: number;
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
      name: hostName || 'Mestre',
      role: 'gm',
      color: '#8257e5',
      isOnline: true,
    };

    const room: ActiveRoom = {
      code,
      hostSocketId,
      members: new Map([[hostSocketId, hostMember]]),
      tokens: [],
      initiativeQueue: [],
      bgImages: [],
      zones: {},
      markers: {},
      round: 1,
      turn: 1,
      createdAt: Date.now(),
    };

    this.rooms.set(code, room);
    this.socketToRoom.set(hostSocketId, code);
    return room;
  }

  public joinRoom(
    code: string,
    socketId: string,
    name: string,
  ): { room: ActiveRoom; member: RoomMember } | null {
    const normalizedCode = code.trim().toUpperCase();
    const room = this.rooms.get(normalizedCode);
    if (!room) return null;

    const colorIndex = room.members.size % MEMBER_COLORS.length;
    const member: RoomMember = {
      id: socketId,
      name: name || `Jogador ${room.members.size}`,
      role: 'player',
      color: MEMBER_COLORS[colorIndex],
      isOnline: true,
    };

    room.members.set(socketId, member);
    this.socketToRoom.set(socketId, normalizedCode);

    return { room, member };
  }

  public leaveRoom(
    socketId: string,
  ): { room: ActiveRoom; memberId: string } | null {
    const code = this.socketToRoom.get(socketId);
    if (!code) return null;

    const room = this.rooms.get(code);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return null;
    }

    room.members.delete(socketId);
    this.socketToRoom.delete(socketId);

    // Se a sala ficou vazia por completo, limpa
    if (room.members.size === 0) {
      this.rooms.delete(code);
    }

    return { room, memberId: socketId };
  }

  public getRoom(code: string): ActiveRoom | undefined {
    return this.rooms.get(code.trim().toUpperCase());
  }

  public getRoomBySocketId(socketId: string): ActiveRoom | undefined {
    const code = this.socketToRoom.get(socketId);
    if (!code) return undefined;
    return this.rooms.get(code);
  }

  public toState(room: ActiveRoom): RoomState {
    return {
      code: room.code,
      hostId: room.hostSocketId,
      members: Array.from(room.members.values()),
      tokens: room.tokens,
      initiativeQueue: room.initiativeQueue,
      bgImages: room.bgImages,
      zones: room.zones,
      markers: room.markers,
      round: room.round,
      turn: room.turn,
    };
  }

  public syncFullState(code: string, payload: SyncStatePayload): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.tokens = payload.tokens;
    room.initiativeQueue = payload.initiativeQueue;
    room.bgImages = payload.bgImages;
    room.zones = payload.zones;
    room.markers = payload.markers;
    room.round = payload.round;
    room.turn = payload.turn;
  }

  public moveToken(
    code: string,
    tokenId: string,
    x: number | null,
    y: number | null,
  ): void {
    const room = this.getRoom(code);
    if (!room) return;
    const token = room.tokens.find((t) => t.id === tokenId);
    if (token) {
      token.x = x;
      token.y = y;
    }
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

  public updateInitiative(code: string, queue: InitiativeItem[]): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.initiativeQueue = queue;
  }

  // Background Images
  public addBgImage(code: string, bg: BgImage): void {
    const room = this.getRoom(code);
    if (!room) return;
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

  // Zones
  public addZone(code: string, zone: Zone): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.zones = { ...room.zones, [zone.id]: zone };
  }

  public updateZone(
    code: string,
    zoneId: string,
    updates: Partial<Zone>,
  ): void {
    const room = this.getRoom(code);
    if (!room) return;
    if (room.zones[zoneId]) {
      room.zones[zoneId] = { ...room.zones[zoneId], ...updates };
    }
  }

  public removeZone(code: string, zoneId: string): void {
    const room = this.getRoom(code);
    if (!room) return;
    delete room.zones[zoneId];
  }

  // Markers
  public addMarker(code: string, marker: Marker): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.markers = { ...room.markers, [marker.id]: marker };
  }

  public updateMarker(
    code: string,
    markerId: string,
    updates: Partial<Marker>,
  ): void {
    const room = this.getRoom(code);
    if (!room) return;
    if (room.markers[markerId]) {
      room.markers[markerId] = { ...room.markers[markerId], ...updates };
    }
  }

  public removeMarker(code: string, markerId: string): void {
    const room = this.getRoom(code);
    if (!room) return;
    delete room.markers[markerId];
  }

  // Campaign Round / Turn
  public updateRoundTurn(code: string, round: number, turn: number): void {
    const room = this.getRoom(code);
    if (!room) return;
    room.round = round;
    room.turn = turn;
  }
}

export const roomManager = new RoomManager();
