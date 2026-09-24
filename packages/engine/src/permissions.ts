import type { RoomMember } from '@sgm/shared';
import type { RoomState } from './types';

export function can(
  actor: RoomMember,
  _command: { type: string; payload?: unknown },
  _state: RoomState,
): boolean {
  if (actor.role === 'gm') return true;
  return false;
}
