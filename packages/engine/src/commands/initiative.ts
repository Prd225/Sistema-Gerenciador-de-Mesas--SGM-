import type { RoomState, InitiativeItem } from '@sgm/shared';

export function handleInitiativeUpdate(
  state: RoomState,
  queue: InitiativeItem[],
): RoomState {
  return {
    ...state,
    initiativeQueue: queue,
  };
}
