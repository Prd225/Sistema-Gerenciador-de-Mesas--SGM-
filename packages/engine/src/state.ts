import type { RoomState } from './types';

export function createEmptyRoom(code: string, hostId: string): RoomState {
  return {
    code,
    hostId,
    members: [],
    tokens: [],
    initiativeQueue: [],
    bgImages: [],
    zones: {},
    markers: {},
    round: 1,
    turn: 1,
  };
}
