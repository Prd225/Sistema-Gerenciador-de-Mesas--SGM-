import type {
  TableState,
  MarkerCreatePayload,
  MarkerUpdatePayload,
  MarkerDeletePayload,
} from '@sgm/shared';
import { withScene, findScene, type HandlerResult } from './shared';

export function markerCreate(
  table: TableState,
  payload: MarkerCreatePayload,
): HandlerResult {
  const scene = findScene(table, payload.sceneId);
  if (!scene) return null;
  if (scene.markers[payload.marker.id]) return 'conflict';

  return withScene(table, payload.sceneId, (draftScene) => {
    draftScene.markers[payload.marker.id] = payload.marker;
  });
}

export function markerUpdate(
  table: TableState,
  payload: MarkerUpdatePayload,
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.markers[payload.markerId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    const marker = draftScene.markers[payload.markerId]!;
    Object.assign(marker, payload.updates);
  });
}

export function markerDelete(
  table: TableState,
  payload: MarkerDeletePayload,
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.markers[payload.markerId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    delete draftScene.markers[payload.markerId];
  });
}
