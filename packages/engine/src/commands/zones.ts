import type {
  TableState,
  ZoneCreatePayload,
  ZoneUpdatePayload,
  ZoneDeletePayload,
} from '@sgm/shared';
import { withScene, findScene, type HandlerResult } from './shared';

export function zoneCreate(
  table: TableState,
  payload: ZoneCreatePayload,
): HandlerResult {
  const scene = findScene(table, payload.sceneId);
  if (!scene) return null;
  if (scene.zones[payload.zone.id]) return 'conflict';

  return withScene(table, payload.sceneId, (draftScene) => {
    draftScene.zones[payload.zone.id] = payload.zone;
  });
}

export function zoneUpdate(
  table: TableState,
  payload: ZoneUpdatePayload,
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.zones[payload.zoneId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    const zone = draftScene.zones[payload.zoneId]!;
    Object.assign(zone, payload.updates);
  });
}

export function zoneDelete(
  table: TableState,
  payload: ZoneDeletePayload,
): TableState | null {
  const scene = findScene(table, payload.sceneId);
  if (!scene || !scene.zones[payload.zoneId]) return null;

  return withScene(table, payload.sceneId, (draftScene) => {
    delete draftScene.zones[payload.zoneId];
  });
}
