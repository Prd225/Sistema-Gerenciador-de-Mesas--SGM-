import type { RoomMember } from '@sgm/shared';
import type { RoomState } from './types';

export function projectFor(state: RoomState, _member: RoomMember): RoomState {
  return state;
}

export function projectEvent(
  event: unknown,
  _member: RoomMember,
  _state: RoomState,
): unknown {
  return event;
}
