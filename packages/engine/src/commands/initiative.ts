import type { TableState, InitiativeUpdatePayload } from '@sgm/shared';
import { withScene } from './shared';

export function initiativeUpdate(
  table: TableState,
  payload: InitiativeUpdatePayload,
): TableState | null {
  return withScene(table, payload.sceneId, (scene) => {
    scene.initiative = payload.initiative;
  });
}
