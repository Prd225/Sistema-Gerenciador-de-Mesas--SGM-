import type { Token, InitiativeItem, Zone, Marker, BgImage } from './game';

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

export interface RoomState {
  code: string;
  hostId: string;
  members: RoomMember[];
  tokens: Token[];
  initiativeQueue: InitiativeItem[];
  bgImages: BgImage[];
  zones: Record<string, Zone>;
  markers: Record<string, Marker>;
  round: number;
  turn: number;
}
