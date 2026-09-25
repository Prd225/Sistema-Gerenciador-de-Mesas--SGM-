import { describe, expect, it } from 'vitest';
import { createEmptyScene, createEmptyTable } from './state';

describe('createEmptyTable', () => {
  it('cria mesa vazia sem cenas', () => {
    const table = createEmptyTable();
    expect(table).toEqual({
      version: 0,
      activeSceneId: null,
      round: 0,
      turn: 0,
      scenes: {},
    });
  });
});

describe('createEmptyScene', () => {
  it('cria cena vazia com id e nome informados', () => {
    const scene = createEmptyScene('cena-1', 'Taverna');
    expect(scene).toEqual({
      id: 'cena-1',
      name: 'Taverna',
      tokens: {},
      zones: {},
      markers: {},
      backgrounds: {},
      initiative: { order: [], values: {} },
    });
  });
});
