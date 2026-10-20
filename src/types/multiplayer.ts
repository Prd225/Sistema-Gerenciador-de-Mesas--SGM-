import type {
  Token,
  Condition,
  InitiativeItem,
  InitiativeSortMode,
  BgImage,
} from './game';
import type { SongSource } from './soundpad';

export type UserRole = 'gm' | 'player';

export interface RoomMember {
  id: string; // socket.id
  name: string;
  role: UserRole;
  color: string;
  isOnline: boolean;
}

export interface RoomPing {
  id: string;
  x: number;
  y: number;
  senderName: string;
  color: string;
  createdAt: number;
}

// ---------------------------------------------------------------------------
// Visão do jogador
//
// O jogador só enxerga o mapa: imagens de fundo, tokens (sem ficha), a fila
// de iniciativa e rodada/turno. Zonas, marcadores, diário, ficha e demais
// dados do mestre NUNCA saem do servidor para um jogador.
// ---------------------------------------------------------------------------

/** Estado de condição sem a descrição (que pode conter anotações do mestre). */
export type PlayerConditionView = Pick<
  Condition,
  'name' | 'color' | 'type' | 'durationTurns'
>;

/** Token como o jogador o enxerga: apenas o necessário para desenhar. */
export interface PlayerTokenView {
  id: string;
  name: string; // iniciais
  fullName: string;
  colorText: string;
  colorBorder: string;
  colorFill: string;
  x: number | null;
  y: number | null;
  imageUrl?: string;
  conditions: PlayerConditionView[];
}

export interface PlayerStatePayload {
  tokens: PlayerTokenView[];
  initiativeQueue: InitiativeItem[];
  initiativeSortMode: InitiativeSortMode;
  bgImages: BgImage[];
  round: number;
  turn: number;
}

// ---------------------------------------------------------------------------
// Estado completo enviado pelo mestre
// ---------------------------------------------------------------------------

export interface SyncStatePayload {
  tokens: Token[];
  initiativeQueue: InitiativeItem[];
  initiativeSortMode: InitiativeSortMode;
  bgImages: BgImage[];
  round: number;
  turn: number;
}

// ---------------------------------------------------------------------------
// Soundpad
// ---------------------------------------------------------------------------

/** Faixa em reprodução, como transmitida aos jogadores. */
export interface RoomSong {
  id: string;
  name: string;
  author: string;
  duration: number; // segundos (0 = desconhecida)
  sourceType: SongSource;
  /** URL direta / data URL (local), id do vídeo (youtube) ou URI (spotify). */
  sourceUrl: string;
}

/** Troca de faixa (ou entrada de um jogador): carrega a faixa inteira. */
export interface SoundpadStatePayload {
  song: RoomSong | null;
  isPlaying: boolean;
  /** Posição da faixa, em segundos, no instante do envio. */
  positionSec: number;
}

/**
 * Controle leve (play/pause/seek/batimento) para a faixa já carregada.
 * Não repete a faixa para não reenviar áudio embutido (data URL).
 */
export interface SoundpadControlPayload {
  songId: string | null;
  isPlaying: boolean;
  positionSec: number;
}

// ---------------------------------------------------------------------------
// Sala
// ---------------------------------------------------------------------------

export interface RoomJoinState {
  code: string;
  members: RoomMember[];
  /** Presente apenas para jogadores; o mestre mantém o estado localmente. */
  view: PlayerStatePayload | null;
  soundpad: SoundpadStatePayload | null;
}

export interface ClientToServerEvents {
  'room:create': (
    payload: { hostName: string },
    callback: (res: {
      success: boolean;
      code?: string;
      /** Segredo do mestre: necessário para reassumir a sala após reconectar. */
      hostToken?: string;
      error?: string;
    }) => void,
  ) => void;
  'room:join': (
    payload: { code: string; name: string; hostToken?: string },
    callback: (res: {
      success: boolean;
      role?: UserRole;
      state?: RoomJoinState;
      error?: string;
    }) => void,
  ) => void;
  'room:leave': () => void;
  'room:sync-state': (payload: SyncStatePayload) => void;

  // Tokens (jogador: apenas token:move)
  'token:move': (payload: {
    tokenId: string;
    x: number | null;
    y: number | null;
  }) => void;
  'token:update': (payload: {
    tokenId: string;
    updates: Partial<Token>;
  }) => void;
  'token:add': (payload: { token: Token }) => void;
  'token:remove': (payload: { tokenId: string }) => void;

  // Initiative
  'initiative:update': (payload: {
    queue: InitiativeItem[];
    sortMode?: InitiativeSortMode;
  }) => void;

  // Campaign Round / Turn
  'campaign:update-round-turn': (payload: {
    round: number;
    turn: number;
  }) => void;

  // Background images
  'bg:add': (payload: { bg: BgImage }) => void;
  'bg:update': (payload: { bgId: string; updates: Partial<BgImage> }) => void;
  'bg:remove': (payload: { bgId: string }) => void;

  // Soundpad (somente mestre)
  'soundpad:state': (payload: SoundpadStatePayload) => void;
  'soundpad:control': (payload: SoundpadControlPayload) => void;

  // Map ping (somente mestre, por enquanto)
  'map:ping': (payload: { x: number; y: number }) => void;
}

export interface ServerToClientEvents {
  'room:member-joined': (payload: { member: RoomMember }) => void;
  'room:member-left': (payload: { memberId: string }) => void;
  'room:members-updated': (payload: { members: RoomMember[] }) => void;
  /** O mestre encerrou a mesa. */
  'room:closed': () => void;
  'room:state-synced': (payload: PlayerStatePayload) => void;

  // Tokens (sempre na visão do jogador)
  'token:moved': (payload: {
    tokenId: string;
    x: number | null;
    y: number | null;
  }) => void;
  'token:updated': (payload: {
    tokenId: string;
    updates: Partial<PlayerTokenView>;
  }) => void;
  'token:added': (payload: { token: PlayerTokenView }) => void;
  'token:removed': (payload: { tokenId: string }) => void;

  // Initiative
  'initiative:updated': (payload: {
    queue: InitiativeItem[];
    sortMode?: InitiativeSortMode;
  }) => void;

  // Campaign Round / Turn
  'campaign:round-turn-updated': (payload: {
    round: number;
    turn: number;
  }) => void;

  // Background images
  'bg:added': (payload: { bg: BgImage }) => void;
  'bg:updated': (payload: { bgId: string; updates: Partial<BgImage> }) => void;
  'bg:removed': (payload: { bgId: string }) => void;

  // Soundpad
  'soundpad:state': (payload: SoundpadStatePayload) => void;
  'soundpad:control': (payload: SoundpadControlPayload) => void;

  // Map ping
  'map:pinged': (payload: RoomPing) => void;
}
