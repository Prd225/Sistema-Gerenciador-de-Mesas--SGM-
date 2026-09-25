import type { RoomMember, Scene, TableState, Token } from '@sgm/shared';
import { createEmptyScene, createEmptyTable } from './state';

/** Construtores usados só nos testes do engine. */

export const GM: RoomMember = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Mestre',
  role: 'gm',
  color: '#ff0000',
};

export const PLAYER: RoomMember = {
  id: '00000000-0000-0000-0000-000000000002',
  name: 'Jogador',
  role: 'player',
  color: '#00ff00',
};

export const OTHER_PLAYER: RoomMember = {
  id: '00000000-0000-0000-0000-000000000003',
  name: 'Outro jogador',
  role: 'player',
  color: '#0000ff',
};

export const SPECTATOR: RoomMember = {
  id: '00000000-0000-0000-0000-000000000004',
  name: 'TV',
  role: 'spectator',
  color: '#888888',
};

export const SCENE_ID = '10000000-0000-0000-0000-000000000001';
export const OTHER_SCENE_ID = '10000000-0000-0000-0000-000000000002';

export function buildToken(overrides: Partial<Token> = {}): Token {
  return {
    id: '20000000-0000-0000-0000-000000000001',
    name: 'Token',
    ownerMemberId: null,
    visibility: 'all',
    imageRef: null,
    x: 0,
    y: 0,
    size: 1,
    conditions: [],
    ...overrides,
  };
}

export function buildThreatToken(overrides: Partial<Token> = {}): Token {
  return buildToken({
    stats: {
      type: 'threat',
      system: 'san',
      agi: 1,
      for: 1,
      int: 1,
      pre: 1,
      vig: 1,
      def: 10,
      bloq: 10,
      esq: 10,
      pv: 20,
      maxPv: 20,
      pe: 0,
      maxPe: 0,
      san: 0,
      maxSan: 0,
      pd: 0,
      maxPd: 0,
    },
    ...overrides,
  });
}

export function buildScene(overrides: Partial<Scene> = {}): Scene {
  return { ...createEmptyScene(SCENE_ID, 'Cena'), ...overrides };
}

export function buildTable(overrides: Partial<TableState> = {}): TableState {
  const scene = buildScene();
  return {
    ...createEmptyTable(),
    activeSceneId: SCENE_ID,
    scenes: { [SCENE_ID]: scene },
    ...overrides,
  };
}
