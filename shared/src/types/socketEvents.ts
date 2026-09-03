import type { Token, InitiativeItem, Zone, Marker, BgImage } from './game';
import type { RoomMember, RoomPing, RoomState } from './room';
import type { RoomAudioState, AudioControlPayload } from './audio';

export interface SyncStatePayload {
  tokens: Token[];
  initiativeQueue: InitiativeItem[];
  bgImages: BgImage[];
  zones: Record<string, Zone>;
  markers: Record<string, Marker>;
  round: number;
  turn: number;
}

export interface ClientToServerEvents {
  'room:create': (
    payload: { hostName: string },
    callback: (res: {
      success: boolean;
      code?: string;
      error?: string;
    }) => void,
  ) => void;
  'room:join': (
    payload: { code: string; name: string },
    callback: (res: {
      success: boolean;
      state?: RoomState;
      error?: string;
    }) => void,
  ) => void;
  'room:leave': () => void;
  'room:sync-state': (payload: SyncStatePayload) => void;

  // Tokens
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
  'initiative:update': (payload: { queue: InitiativeItem[] }) => void;

  // Campaign Round / Turn
  'campaign:update-round-turn': (payload: {
    round: number;
    turn: number;
  }) => void;

  // Background images
  'bg:add': (payload: { bg: BgImage }) => void;
  'bg:update': (payload: { bgId: string; updates: Partial<BgImage> }) => void;
  'bg:remove': (payload: { bgId: string }) => void;

  // Zones
  'zone:add': (payload: { zone: Zone }) => void;
  'zone:update': (payload: { zoneId: string; updates: Partial<Zone> }) => void;
  'zone:remove': (payload: { zoneId: string }) => void;

  // Markers
  'marker:add': (payload: { marker: Marker }) => void;
  'marker:update': (payload: {
    markerId: string;
    updates: Partial<Marker>;
  }) => void;
  'marker:remove': (payload: { markerId: string }) => void;

  // Map ping
  'map:ping': (payload: { x: number; y: number }) => void;

  // Audio / Soundpad
  'audio:control': (payload: AudioControlPayload) => void;
}

export interface ServerToClientEvents {
  'room:member-joined': (payload: { member: RoomMember }) => void;
  'room:member-left': (payload: { memberId: string }) => void;
  'room:members-updated': (payload: { members: RoomMember[] }) => void;
  'room:state-synced': (payload: SyncStatePayload) => void;

  // Audio / Soundpad
  'audio:sync': (state: RoomAudioState) => void;

  // Tokens
  'token:moved': (payload: {
    tokenId: string;
    x: number | null;
    y: number | null;
  }) => void;
  'token:updated': (payload: {
    tokenId: string;
    updates: Partial<Token>;
  }) => void;
  'token:added': (payload: { token: Token }) => void;
  'token:removed': (payload: { tokenId: string }) => void;

  // Initiative
  'initiative:updated': (payload: { queue: InitiativeItem[] }) => void;

  // Campaign Round / Turn
  'campaign:round-turn-updated': (payload: {
    round: number;
    turn: number;
  }) => void;

  // Background images
  'bg:added': (payload: { bg: BgImage }) => void;
  'bg:updated': (payload: { bgId: string; updates: Partial<BgImage> }) => void;
  'bg:removed': (payload: { bgId: string }) => void;

  // Zones
  'zone:added': (payload: { zone: Zone }) => void;
  'zone:updated': (payload: { zoneId: string; updates: Partial<Zone> }) => void;
  'zone:removed': (payload: { zoneId: string }) => void;

  // Markers
  'marker:added': (payload: { marker: Marker }) => void;
  'marker:updated': (payload: {
    markerId: string;
    updates: Partial<Marker>;
  }) => void;
  'marker:removed': (payload: { markerId: string }) => void;

  // Map ping
  'map:pinged': (payload: RoomPing) => void;
}
