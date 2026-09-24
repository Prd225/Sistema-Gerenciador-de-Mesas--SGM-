import type { RoomMember } from '@sgm/shared';
import type { RoomState, Token } from './types';
import { can } from './permissions';
import { handleTokenMove, handleTokenAdd, handleTokenRemove } from './commands';

export interface EngineRejection {
  success: false;
  error: string;
  code: string;
}

export interface EngineSuccess {
  success: true;
  state: RoomState;
  events: Array<{ type: string; payload: unknown }>;
}

export type EngineResult = EngineSuccess | EngineRejection;

export interface Command<T = unknown> {
  type: string;
  payload: T;
}

export function applyCommand(
  state: RoomState,
  command: Command,
  actor: RoomMember,
): EngineResult {
  if (!can(actor, command, state)) {
    return {
      success: false,
      error: 'Permissão negada para executar esta ação',
      code: 'FORBIDDEN',
    };
  }

  switch (command.type) {
    case 'token.move': {
      const nextState = handleTokenMove(
        state,
        command.payload as {
          tokenId: string;
          x: number | null;
          y: number | null;
        },
      );
      return {
        success: true,
        state: nextState,
        events: [{ type: 'token.moved', payload: command.payload }],
      };
    }
    case 'token.add': {
      const nextState = handleTokenAdd(state, command.payload as Token);
      return {
        success: true,
        state: nextState,
        events: [{ type: 'token.added', payload: command.payload }],
      };
    }
    case 'token.remove': {
      const nextState = handleTokenRemove(
        state,
        (command.payload as { tokenId: string }).tokenId,
      );
      return {
        success: true,
        state: nextState,
        events: [{ type: 'token.removed', payload: command.payload }],
      };
    }
    default:
      return {
        success: true,
        state: { ...state },
        events: [{ type: `${command.type}.applied`, payload: command.payload }],
      };
  }
}
