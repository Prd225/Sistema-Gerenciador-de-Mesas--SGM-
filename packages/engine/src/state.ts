import type { RoomState } from '@sgm/shared';

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
