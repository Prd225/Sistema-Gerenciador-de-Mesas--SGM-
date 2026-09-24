import type { RoomState, InitiativeItem } from '../types';

export function handleInitiativeUpdate(
  state: RoomState,
  queue: InitiativeItem[],
): RoomState {
  return {
    ...state,
    initiativeQueue: queue,
  };
}
