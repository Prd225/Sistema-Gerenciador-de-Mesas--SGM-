import type {
  TableState,
  TokenCreatePayload,
  TokenMovePayload,
  TokenUpdatePayload,
  TokenDeletePayload,
} from '@sgm/shared';
import { TokenStats } from '@sgm/shared';
import { withScene, findScene, type HandlerResult } from './shared';

export function tokenCreate(
  table: TableState,
  payload: TokenCreatePayload,
): HandlerResult {
  const scene = findScene(table, payload.sceneId);
  if (!scene) return null;
  if (scene.tokens[payload.token.id]) return 'conflict';

  return withScene(table, payload.sceneId, (draftScene) => {
    draftScene.tokens[payload.token.id] = payload.token;
  });
}

export function tokenMove(
  table: TableState,
  payload: TokenMovePayload,
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.tokens[payload.tokenId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    const token = draftScene.tokens[payload.tokenId]!;
    token.x = payload.x;
    token.y = payload.y;
  });
}

export function tokenUpdate(
  table: TableState,
  payload: TokenUpdatePayload,
): HandlerResult {
  const scene = findScene(table, payload.sceneId);
  const current = scene?.tokens[payload.tokenId];
  if (!current) return null;

  // stats vem parcial e é mesclado. Token sem ficha precisa receber a ficha
  // completa, senão o resultado seria um TokenStats inválido.
  const { stats, ...rest } = payload.updates;
  let nextStats: TokenStats | undefined;
  if (stats) {
    if (current.stats) {
      nextStats = { ...current.stats, ...stats };
    } else {
      const parsed = TokenStats.safeParse(stats);
      if (!parsed.success) return 'invalid';
      nextStats = parsed.data;
    }
  }

  return withScene(table, payload.sceneId, (draftScene) => {
    const token = draftScene.tokens[payload.tokenId]!;
    Object.assign(token, rest);
    if (nextStats) token.stats = nextStats;
  });
}

export function tokenDelete(
  table: TableState,
  payload: TokenDeletePayload,
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.tokens[payload.tokenId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    delete draftScene.tokens[payload.tokenId];
  });
}
