import { describe, expect, it } from 'vitest';
import type { Marker, Zone } from '@sgm/shared';
import { projectEvent, projectFor } from './project';
import {
  GM,
  OTHER_SCENE_ID,
  PLAYER,
  SCENE_ID,
  SPECTATOR,
  buildScene,
  buildTable,
  buildThreatToken,
  buildToken,
} from './fixtures';

const HIDDEN_MARKER: Marker = {
  id: 'marker-1',
  x: 0,
  y: 0,
  text: 'Secreto',
  hidden: true,
};
const VISIBLE_MARKER: Marker = { id: 'marker-2', x: 0, y: 0, text: 'Publico' };

const ZONE: Zone = {
  id: 'zone-1',
  type: 'rect',
  x: 0,
  y: 0,
  w: 1,
  h: 1,
  data: {
    title: 'Zona',
    desc: '',
    visits: 0,
    customPois: [
      {
        title: 'POIs',
        options: [
          { name: 'oculto', desc: '', isRevealed: false },
          { name: 'revelado', desc: '', isRevealed: true },
        ],
      },
    ],
    customHighlights: [
      {
        title: 'Marcas',
        options: [
          {
            name: 'oculto',
            desc: '',
            tags: '',
            color: 'red',
            isRevealed: false,
          },
          {
            name: 'revelado',
            desc: '',
            tags: '',
            color: 'red',
            isRevealed: true,
          },
        ],
      },
    ],
    customThreats: [
      {
        name: 'oculto',
        type: '',
        effect: '',
        damage: '',
        damageType: '',
        isRevealed: false,
      },
      {
        name: 'revelado',
        type: '',
        effect: '',
        damage: '',
        damageType: '',
        isRevealed: true,
      },
    ],
    customInventory: [
      {
        name: 'oculto',
        type: '',
        weight: '',
        element: 'Comum',
        effect: '',
        desc: '',
        isFound: false,
      },
      {
        name: 'revelado',
        type: '',
        weight: '',
        element: 'Comum',
        effect: '',
        desc: '',
        isFound: true,
      },
    ],
    customJournal: [
      {
        id: 'j1',
        title: 'oculto',
        session: '',
        author: '',
        text: '',
        isRevealed: false,
      },
      {
        id: 'j2',
        title: 'revelado',
        session: '',
        author: '',
        text: '',
        isRevealed: true,
      },
    ],
    customNpcs: [
      {
        id: 'n1',
        name: 'oculto',
        role: '',
        disposition: '',
        notes: '',
        isRevealed: false,
      },
      {
        id: 'n2',
        name: 'revelado',
        role: '',
        disposition: '',
        notes: '',
        isRevealed: true,
      },
    ],
  },
};

describe('projectFor', () => {
  it('mestre recebe a mesa inteira sem alteracoes', () => {
    const table = buildTable();
    expect(projectFor(table, GM)).toBe(table);
  });

  it('jogador nao ve cenas fora da ativa', () => {
    const table = buildTable({
      scenes: {
        [SCENE_ID]: buildScene(),
        [OTHER_SCENE_ID]: buildScene({ id: OTHER_SCENE_ID }),
      },
    });
    const projected = projectFor(table, PLAYER);
    expect(Object.keys(projected.scenes)).toEqual([SCENE_ID]);
  });

  it('remove tokens visibility gm', () => {
    const gmToken = buildToken({ id: 'tok-gm', visibility: 'gm' });
    const publicToken = buildToken({ id: 'tok-all', visibility: 'all' });
    const table = buildTable({
      scenes: {
        [SCENE_ID]: buildScene({
          tokens: { [gmToken.id]: gmToken, [publicToken.id]: publicToken },
        }),
      },
    });
    const projected = projectFor(table, PLAYER);
    const tokens = projected.scenes[SCENE_ID]!.tokens;
    expect(tokens['tok-gm']).toBeUndefined();
    expect(tokens['tok-all']).toBeDefined();
  });

  it('remove stats de tokens de ameaca mas mantem o resto', () => {
    const threat = buildThreatToken({ id: 'tok-threat' });
    const table = buildTable({
      scenes: { [SCENE_ID]: buildScene({ tokens: { [threat.id]: threat } }) },
    });
    const projected = projectFor(table, PLAYER);
    const token = projected.scenes[SCENE_ID]!.tokens['tok-threat'];
    expect(token?.stats).toBeUndefined();
    expect(token?.name).toBe(threat.name);
  });

  it('mantem stats de token de jogador', () => {
    const table = buildTable({
      scenes: {
        [SCENE_ID]: buildScene({ tokens: { t1: buildToken({ id: 't1' }) } }),
      },
    });
    const projected = projectFor(table, PLAYER);
    expect(projected.scenes[SCENE_ID]!.tokens.t1).toEqual(
      table.scenes[SCENE_ID]!.tokens.t1,
    );
  });

  it('remove marcadores ocultos', () => {
    const table = buildTable({
      scenes: {
        [SCENE_ID]: buildScene({
          markers: {
            [HIDDEN_MARKER.id]: HIDDEN_MARKER,
            [VISIBLE_MARKER.id]: VISIBLE_MARKER,
          },
        }),
      },
    });
    const projected = projectFor(table, PLAYER);
    const markers = projected.scenes[SCENE_ID]!.markers;
    expect(markers[HIDDEN_MARKER.id]).toBeUndefined();
    expect(markers[VISIBLE_MARKER.id]).toBeDefined();
  });

  it('remove itens de zona nao revelados/achados', () => {
    const table = buildTable({
      scenes: { [SCENE_ID]: buildScene({ zones: { [ZONE.id]: ZONE } }) },
    });
    const projected = projectFor(table, SPECTATOR);
    const data = projected.scenes[SCENE_ID]!.zones[ZONE.id]!.data;
    expect(data.customPois![0]!.options).toHaveLength(1);
    expect(data.customPois![0]!.options[0]!.name).toBe('revelado');
    expect(data.customHighlights![0]!.options).toHaveLength(1);
    expect(data.customThreats).toHaveLength(1);
    expect(data.customInventory).toHaveLength(1);
    expect(data.customJournal).toHaveLength(1);
    expect(data.customNpcs).toHaveLength(1);
  });

  it('quando nao ha cena ativa, jogador nao ve nenhuma cena', () => {
    const table = buildTable({ activeSceneId: null });
    const projected = projectFor(table, PLAYER);
    expect(projected.scenes).toEqual({});
  });
});

describe('projectEvent', () => {
  it('mestre recebe todos os eventos', () => {
    const table = buildTable();
    const event = {
      type: 'token.created' as const,
      payload: { sceneId: SCENE_ID, token: buildToken({ visibility: 'gm' }) },
    };
    expect(projectEvent(event, table, GM)).toBe(event);
  });

  it('esconde criacao de token gm', () => {
    const table = buildTable();
    const event = {
      type: 'token.created' as const,
      payload: { sceneId: SCENE_ID, token: buildToken({ visibility: 'gm' }) },
    };
    expect(projectEvent(event, table, PLAYER)).toBeNull();
  });

  it('mostra criacao de token publico', () => {
    const table = buildTable();
    const event = {
      type: 'token.created' as const,
      payload: { sceneId: SCENE_ID, token: buildToken({ visibility: 'all' }) },
    };
    expect(projectEvent(event, table, PLAYER)).toBe(event);
  });

  it('esconde evento de token existente com visibility gm', () => {
    const token = buildToken({ id: 'tok-1', visibility: 'gm' });
    const table = buildTable({
      scenes: { [SCENE_ID]: buildScene({ tokens: { [token.id]: token } }) },
    });
    const event = {
      type: 'token.moved' as const,
      payload: { sceneId: SCENE_ID, tokenId: token.id, x: 1, y: 1 },
    };
    expect(projectEvent(event, table, PLAYER)).toBeNull();
  });

  it('esconde evento de marcador oculto', () => {
    const table = buildTable();
    const event = {
      type: 'marker.created' as const,
      payload: { sceneId: SCENE_ID, marker: HIDDEN_MARKER },
    };
    expect(projectEvent(event, table, PLAYER)).toBeNull();
  });

  it('mostra evento de marcador visivel', () => {
    const table = buildTable();
    const event = {
      type: 'marker.created' as const,
      payload: { sceneId: SCENE_ID, marker: VISIBLE_MARKER },
    };
    expect(projectEvent(event, table, PLAYER)).toBe(event);
  });

  it('esconde evento fora da cena ativa', () => {
    const table = buildTable();
    const event = {
      type: 'zone.created' as const,
      payload: { sceneId: OTHER_SCENE_ID, zone: ZONE },
    };
    expect(projectEvent(event, table, PLAYER)).toBeNull();
  });

  it('mostra evento sem sceneId (round/turn/ping)', () => {
    const table = buildTable();
    const event = { type: 'round.advanced' as const, payload: { round: 1 } };
    expect(projectEvent(event, table, PLAYER)).toBe(event);
  });

  it('mostra evento de token deletado (sem token para checar) quando nao ha cena ativa', () => {
    const table = buildTable({ activeSceneId: null });
    const event = {
      type: 'token.deleted' as const,
      payload: { tokenId: 'sumiu' },
    };
    expect(projectEvent(event, table, PLAYER)).toBe(event);
  });

  it('mostra evento de token deletado quando o token ja nao existe na mesa', () => {
    const table = buildTable();
    const event = {
      type: 'token.deleted' as const,
      payload: { sceneId: SCENE_ID, tokenId: 'sumiu' },
    };
    expect(projectEvent(event, table, PLAYER)).toBe(event);
  });
});
