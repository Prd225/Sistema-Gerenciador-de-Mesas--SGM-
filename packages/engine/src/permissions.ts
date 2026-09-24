import type { RoomMember, RoomState } from '@sgm/shared';

export function can(
  actor: RoomMember,
  _command: { type: string; payload?: unknown },
  _state: RoomState,
): boolean {
  if (actor.role === 'gm') return true;
  return false;
}
