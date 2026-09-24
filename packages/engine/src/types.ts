import type { RoomMember } from '@sgm/shared';

export interface BgImage {
  id: string;
  name: string;
  url: string;
}

export interface InitiativeItem {
  id: string;
  name: string;
  value: number;
}

export interface Marker {
  id: string;
  name: string;
  x: number;
  y: number;
  [key: string]: unknown;
}

export interface Zone {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  [key: string]: unknown;
}

export interface Token {
  id: string;
  name: string;
  x: number | null;
  y: number | null;
  [key: string]: unknown;
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
