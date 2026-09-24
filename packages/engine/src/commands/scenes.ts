import { produce } from 'immer';
import type {
  TableState,
  SceneCreatePayload,
  SceneUpdatePayload,
  SceneDeletePayload,
  SceneActivatePayload,
} from '@sgm/shared';

export function sceneCreate(
  table: TableState,
  payload: SceneCreatePayload,
): TableState | null {
  return produce(table, (draft) => {
    draft.scenes[payload.scene.id] = payload.scene;
  });
}

export function sceneUpdate(
  table: TableState,
  payload: SceneUpdatePayload,
): TableState | null {
  if (!table.scenes[payload.sceneId]) return null;

  return produce(table, (draft) => {
    Object.assign(draft.scenes[payload.sceneId]!, payload.updates);
  });
}

export function sceneDelete(
  table: TableState,
  payload: SceneDeletePayload,
): TableState | null {
  if (!table.scenes[payload.sceneId]) return null;

  return produce(table, (draft) => {
    delete draft.scenes[payload.sceneId];
    if (draft.activeSceneId === payload.sceneId) draft.activeSceneId = null;
  });
}

export function sceneActivate(
  table: TableState,
  payload: SceneActivatePayload,
): TableState | null {
  if (!table.scenes[payload.sceneId]) return null;

  return produce(table, (draft) => {
    draft.activeSceneId = payload.sceneId;
  });
}
