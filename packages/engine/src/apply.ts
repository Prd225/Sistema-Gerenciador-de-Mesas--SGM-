import type {
  Command,
  EventType,
  ErrorCode,
  RoomMember,
  TableState,
} from '@sgm/shared';
import { can } from './permissions';
import type { HandlerResult } from './commands/shared';
import {
  tokenCreate,
  tokenMove,
  tokenUpdate,
  tokenDelete,
  zoneCreate,
  zoneUpdate,
  zoneDelete,
  markerCreate,
  markerUpdate,
  markerDelete,
  backgroundCreate,
  backgroundUpdate,
  backgroundDelete,
  sceneCreate,
  sceneUpdate,
  sceneDelete,
  sceneActivate,
  initiativeUpdate,
  roundNext,
  turnNext,
  ping,
} from './commands';

export interface EngineEvent {
  type: EventType;
  payload: unknown;
}

export type ApplyResult =
  | { ok: true; table: TableState; events: EngineEvent[] }
  | { ok: false; code: ErrorCode; message: string };

function forbidden(): ApplyResult {
  return { ok: false, code: 'FORBIDDEN', message: 'Permissão negada.' };
}

function notFound(): ApplyResult {
  return { ok: false, code: 'NOT_FOUND', message: 'Alvo não encontrado.' };
}

function conflict(): ApplyResult {
  return {
    ok: false,
    code: 'CONFLICT',
    message: 'Já existe um item com esse id.',
  };
}

function applied(
  table: TableState,
  nextTable: HandlerResult,
  type: EventType,
  payload: unknown,
): ApplyResult {
  if (nextTable === null) return notFound();
  if (nextTable === 'conflict') return conflict();
  if (nextTable === 'invalid') {
    return {
      ok: false,
      code: 'INVALID_PAYLOAD',
      message: 'Dados incompletos.',
    };
  }
  const version = table.version + 1;
  return {
    ok: true,
    table: { ...nextTable, version },
    events: [{ type, payload }],
  };
}

/**
 * Aplica um comando à mesa: checa permissão, executa o handler do grupo
 * e incrementa a versão (exceto `ping`, que não altera a mesa).
 */
export function applyCommand(
  table: TableState,
  command: Command,
  actor: RoomMember,
): ApplyResult {
  if (!can(actor, command, table)) return forbidden();

  switch (command.type) {
    case 'token.create': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        tokenCreate(table, command.payload),
        'token.created',
        {
          sceneId,
          token: command.payload.token,
        },
      );
    }
    case 'token.move': {
      const sceneId = command.payload.sceneId;
      return applied(table, tokenMove(table, command.payload), 'token.moved', {
        sceneId,
        tokenId: command.payload.tokenId,
        x: command.payload.x,
        y: command.payload.y,
      });
    }
    case 'token.update': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        tokenUpdate(table, command.payload),
        'token.updated',
        {
          sceneId,
          tokenId: command.payload.tokenId,
          updates: command.payload.updates,
        },
      );
    }
    case 'token.delete': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        tokenDelete(table, command.payload),
        'token.deleted',
        {
          sceneId,
          tokenId: command.payload.tokenId,
        },
      );
    }
    case 'zone.create': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        zoneCreate(table, command.payload),
        'zone.created',
        {
          sceneId,
          zone: command.payload.zone,
        },
      );
    }
    case 'zone.update': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        zoneUpdate(table, command.payload),
        'zone.updated',
        {
          sceneId,
          zoneId: command.payload.zoneId,
          updates: command.payload.updates,
        },
      );
    }
    case 'zone.delete': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        zoneDelete(table, command.payload),
        'zone.deleted',
        {
          sceneId,
          zoneId: command.payload.zoneId,
        },
      );
    }
    case 'marker.create': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        markerCreate(table, command.payload),
        'marker.created',
        {
          sceneId,
          marker: command.payload.marker,
        },
      );
    }
    case 'marker.update': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        markerUpdate(table, command.payload),
        'marker.updated',
        {
          sceneId,
          markerId: command.payload.markerId,
          updates: command.payload.updates,
        },
      );
    }
    case 'marker.delete': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        markerDelete(table, command.payload),
        'marker.deleted',
        {
          sceneId,
          markerId: command.payload.markerId,
        },
      );
    }
    case 'background.create': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        backgroundCreate(table, command.payload),
        'background.created',
        { sceneId, background: command.payload.background },
      );
    }
    case 'background.update': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        backgroundUpdate(table, command.payload),
        'background.updated',
        {
          sceneId,
          backgroundId: command.payload.backgroundId,
          updates: command.payload.updates,
        },
      );
    }
    case 'background.delete': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        backgroundDelete(table, command.payload),
        'background.deleted',
        { sceneId, backgroundId: command.payload.backgroundId },
      );
    }
    case 'scene.create': {
      return applied(
        table,
        sceneCreate(table, command.payload),
        'scene.created',
        {
          scene: command.payload.scene,
        },
      );
    }
    case 'scene.update': {
      return applied(
        table,
        sceneUpdate(table, command.payload),
        'scene.updated',
        {
          sceneId: command.payload.sceneId,
          updates: command.payload.updates,
        },
      );
    }
    case 'scene.delete': {
      return applied(
        table,
        sceneDelete(table, command.payload),
        'scene.deleted',
        {
          sceneId: command.payload.sceneId,
        },
      );
    }
    case 'scene.activate': {
      return applied(
        table,
        sceneActivate(table, command.payload),
        'scene.activated',
        {
          sceneId: command.payload.sceneId,
        },
      );
    }
    case 'initiative.update': {
      const sceneId = command.payload.sceneId;
      return applied(
        table,
        initiativeUpdate(table, command.payload),
        'initiative.updated',
        { sceneId, initiative: command.payload.initiative },
      );
    }
    case 'round.next': {
      const nextTable = roundNext(table, command.payload);
      return applied(table, nextTable, 'round.advanced', {
        round: nextTable.round,
      });
    }
    case 'turn.next': {
      const nextTable = turnNext(table, command.payload);
      return applied(table, nextTable, 'turn.advanced', {
        turn: nextTable.turn,
      });
    }
    case 'ping': {
      return {
        ok: true,
        table,
        events: [{ type: 'pinged', payload: ping(command.payload) }],
      };
    }
  }
}
