import type {
  TableState,
  TokenCreatePayload,
  TokenMovePayload,
  TokenUpdatePayload,
  TokenDeletePayload,
} from '@sgm/shared';
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
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.tokens[payload.tokenId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    const token = draftScene.tokens[payload.tokenId]!;
    Object.assign(token, payload.updates);
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
