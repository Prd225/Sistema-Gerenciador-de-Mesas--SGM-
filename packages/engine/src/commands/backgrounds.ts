import type {
  TableState,
  BackgroundCreatePayload,
  BackgroundUpdatePayload,
  BackgroundDeletePayload,
} from '@sgm/shared';
import { withScene, findScene } from './shared';

export function backgroundCreate(
  table: TableState,
  payload: BackgroundCreatePayload,
): TableState | null {
  return withScene(table, payload.sceneId, (scene) => {
    scene.backgrounds[payload.background.id] = payload.background;
  });
}

export function backgroundUpdate(
  table: TableState,
  payload: BackgroundUpdatePayload,
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.backgrounds[payload.backgroundId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    const background = draftScene.backgrounds[payload.backgroundId]!;
    Object.assign(background, payload.updates);
  });
}

export function backgroundDelete(
  table: TableState,
  payload: BackgroundDeletePayload,
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.backgrounds[payload.backgroundId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    delete draftScene.backgrounds[payload.backgroundId];
  });
}
