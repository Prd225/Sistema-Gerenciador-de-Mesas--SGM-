import type { Scene, TableState } from '@sgm/shared';

/** Mesa vazia, sem cenas. Ids e tempo vêm sempre de fora. */
export function createEmptyTable(): TableState {
  return {
    version: 0,
    activeSceneId: null,
    round: 0,
    turn: 0,
    scenes: {},
  };
}

/** Cena vazia, pronta para entrar em `table.scenes`. */
export function createEmptyScene(id: string, name: string): Scene {
  return {
    id,
    name,
    tokens: {},
    zones: {},
    markers: {},
    backgrounds: {},
    initiative: { order: [], values: {} },
  };
}
