import { describe, expect, it } from 'vitest';
import type { Command } from '@sgm/shared';
import { applyCommand } from './apply';
import { GM, SCENE_ID, buildTable, buildToken } from './fixtures';

const NOPE_ID = '99999999-0000-0000-0000-000000000000';

function run(table: ReturnType<typeof buildTable>, command: Command) {
  return applyCommand(table, command, GM);
}

describe('applyCommand — token', () => {
  it('token.create cria o token e sobe a versao', () => {
    const table = buildTable();
    const token = buildToken();
    const result = run(table, {
      type: 'token.create',
      payload: { sceneId: SCENE_ID, token },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.table.scenes[SCENE_ID]?.tokens[token.id]).toEqual(token);
      expect(result.table.version).toBe(1);
      expect(result.events).toEqual([
        { type: 'token.created', payload: { sceneId: SCENE_ID, token } },
      ]);
    }
    // mesa original intacta
    expect(table.scenes[SCENE_ID]?.tokens[token.id]).toBeUndefined();
    expect(table.version).toBe(0);
  });

  it('token.create sem sceneId usa a cena ativa', () => {
    const table = buildTable();
    const token = buildToken();
    const result = run(table, { type: 'token.create', payload: { token } });
    expect(result.ok).toBe(true);
  });

  it('token.move NOT_FOUND quando token nao existe', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'token.move',
      payload: { sceneId: SCENE_ID, tokenId: NOPE_ID, x: 1, y: 1 },
    });
    expect(result).toEqual({
      ok: false,
      code: 'NOT_FOUND',
      message: expect.any(String),
    });
  });

  it('token.move NOT_FOUND quando cena nao existe', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'token.move',
      payload: { sceneId: NOPE_ID, tokenId: NOPE_ID, x: 1, y: 1 },
    });
    expect(result.ok).toBe(false);
  });

  it('token.move move o token', () => {
    const token = buildToken();
    const table = buildTable({
      scenes: {
        [SCENE_ID]: {
          ...buildTable().scenes[SCENE_ID]!,
          tokens: { [token.id]: token },
        },
      },
    });
    const result = run(table, {
      type: 'token.move',
      payload: { sceneId: SCENE_ID, tokenId: token.id, x: 5, y: 6 },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      const moved = result.table.scenes[SCENE_ID]?.tokens[token.id];
      expect(moved?.x).toBe(5);
      expect(moved?.y).toBe(6);
    }
  });

  it('token.move para a reserva (null)', () => {
    const token = buildToken();
    const table = buildTable({
      scenes: {
        [SCENE_ID]: {
          ...buildTable().scenes[SCENE_ID]!,
          tokens: { [token.id]: token },
        },
      },
    });
    const result = run(table, {
      type: 'token.move',
      payload: { sceneId: SCENE_ID, tokenId: token.id, x: null, y: null },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.table.scenes[SCENE_ID]?.tokens[token.id]?.x).toBeNull();
    }
  });

  it('token.update atualiza campos', () => {
    const token = buildToken();
    const table = buildTable({
      scenes: {
        [SCENE_ID]: {
          ...buildTable().scenes[SCENE_ID]!,
          tokens: { [token.id]: token },
        },
      },
    });
    const result = run(table, {
      type: 'token.update',
      payload: {
        sceneId: SCENE_ID,
        tokenId: token.id,
        updates: { name: 'Novo nome' },
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.table.scenes[SCENE_ID]?.tokens[token.id]?.name).toBe(
        'Novo nome',
      );
    }
  });

  it('token.update NOT_FOUND', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'token.update',
      payload: { sceneId: SCENE_ID, tokenId: NOPE_ID, updates: {} },
    });
    expect(result.ok).toBe(false);
  });

  it('token.delete remove o token', () => {
    const token = buildToken();
    const table = buildTable({
      scenes: {
        [SCENE_ID]: {
          ...buildTable().scenes[SCENE_ID]!,
          tokens: { [token.id]: token },
        },
      },
    });
    const result = run(table, {
      type: 'token.delete',
      payload: { sceneId: SCENE_ID, tokenId: token.id },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.table.scenes[SCENE_ID]?.tokens[token.id]).toBeUndefined();
    }
  });

  it('token.delete NOT_FOUND', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'token.delete',
      payload: { sceneId: SCENE_ID, tokenId: NOPE_ID },
    });
    expect(result.ok).toBe(false);
  });
});

describe('applyCommand — zone', () => {
  const zone = {
    id: '30000000-0000-0000-0000-000000000001',
    type: 'rect' as const,
    x: 0,
    y: 0,
    w: 1,
    h: 1,
    data: { title: 'Zona', desc: '', visits: 0 },
  };

  it('zone.create / update / delete', () => {
    const table = buildTable();
    const created = run(table, {
      type: 'zone.create',
      payload: { sceneId: SCENE_ID, zone },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    expect(created.table.scenes[SCENE_ID]?.zones[zone.id]).toEqual(zone);

    const updated = run(created.table, {
      type: 'zone.update',
      payload: { sceneId: SCENE_ID, zoneId: zone.id, updates: { x: 9 } },
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.table.scenes[SCENE_ID]?.zones[zone.id]?.x).toBe(9);

    const deleted = run(updated.table, {
      type: 'zone.delete',
      payload: { sceneId: SCENE_ID, zoneId: zone.id },
    });
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.table.scenes[SCENE_ID]?.zones[zone.id]).toBeUndefined();
  });

  it('zone.update / delete NOT_FOUND', () => {
    const table = buildTable();
    expect(
      run(table, {
        type: 'zone.update',
        payload: { sceneId: SCENE_ID, zoneId: NOPE_ID, updates: {} },
      }).ok,
    ).toBe(false);
    expect(
      run(table, {
        type: 'zone.delete',
        payload: { sceneId: SCENE_ID, zoneId: NOPE_ID },
      }).ok,
    ).toBe(false);
  });
});

describe('applyCommand — marker', () => {
  const marker = {
    id: '40000000-0000-0000-0000-000000000001',
    x: 0,
    y: 0,
    text: 'X',
  };

  it('marker.create / update / delete', () => {
    const table = buildTable();
    const created = run(table, {
      type: 'marker.create',
      payload: { sceneId: SCENE_ID, marker },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = run(created.table, {
      type: 'marker.update',
      payload: {
        sceneId: SCENE_ID,
        markerId: marker.id,
        updates: { text: 'Y' },
      },
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(updated.table.scenes[SCENE_ID]?.markers[marker.id]?.text).toBe('Y');

    const deleted = run(updated.table, {
      type: 'marker.delete',
      payload: { sceneId: SCENE_ID, markerId: marker.id },
    });
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(deleted.table.scenes[SCENE_ID]?.markers[marker.id]).toBeUndefined();
  });

  it('marker.update / delete NOT_FOUND', () => {
    const table = buildTable();
    expect(
      run(table, {
        type: 'marker.update',
        payload: { sceneId: SCENE_ID, markerId: NOPE_ID, updates: {} },
      }).ok,
    ).toBe(false);
    expect(
      run(table, {
        type: 'marker.delete',
        payload: { sceneId: SCENE_ID, markerId: NOPE_ID },
      }).ok,
    ).toBe(false);
  });
});

describe('applyCommand — background', () => {
  const background = {
    id: '50000000-0000-0000-0000-000000000001',
    imageRef: 'ref.webp',
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0,
  };

  it('background.create / update / delete', () => {
    const table = buildTable();
    const created = run(table, {
      type: 'background.create',
      payload: { sceneId: SCENE_ID, background },
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const updated = run(created.table, {
      type: 'background.update',
      payload: {
        sceneId: SCENE_ID,
        backgroundId: background.id,
        updates: { scale: 2 },
      },
    });
    expect(updated.ok).toBe(true);
    if (!updated.ok) return;
    expect(
      updated.table.scenes[SCENE_ID]?.backgrounds[background.id]?.scale,
    ).toBe(2);

    const deleted = run(updated.table, {
      type: 'background.delete',
      payload: { sceneId: SCENE_ID, backgroundId: background.id },
    });
    expect(deleted.ok).toBe(true);
    if (!deleted.ok) return;
    expect(
      deleted.table.scenes[SCENE_ID]?.backgrounds[background.id],
    ).toBeUndefined();
  });

  it('background.update / delete NOT_FOUND', () => {
    const table = buildTable();
    expect(
      run(table, {
        type: 'background.update',
        payload: { sceneId: SCENE_ID, backgroundId: NOPE_ID, updates: {} },
      }).ok,
    ).toBe(false);
    expect(
      run(table, {
        type: 'background.delete',
        payload: { sceneId: SCENE_ID, backgroundId: NOPE_ID },
      }).ok,
    ).toBe(false);
  });
});

describe('applyCommand — scene', () => {
  it('scene.create adiciona cena', () => {
    const table = buildTable();
    const scene = { ...table.scenes[SCENE_ID]!, id: 'nova-cena', name: 'Nova' };
    const result = run(table, { type: 'scene.create', payload: { scene } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.table.scenes['nova-cena']).toEqual(scene);
  });

  it('scene.update NOT_FOUND', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'scene.update',
      payload: { sceneId: NOPE_ID, updates: { name: 'X' } },
    });
    expect(result.ok).toBe(false);
  });

  it('scene.update muda nome', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'scene.update',
      payload: { sceneId: SCENE_ID, updates: { name: 'Outra' } },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.table.scenes[SCENE_ID]?.name).toBe('Outra');
  });

  it('scene.delete remove e limpa cena ativa', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'scene.delete',
      payload: { sceneId: SCENE_ID },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.table.scenes[SCENE_ID]).toBeUndefined();
      expect(result.table.activeSceneId).toBeNull();
    }
  });

  it('scene.delete NOT_FOUND', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'scene.delete',
      payload: { sceneId: NOPE_ID },
    });
    expect(result.ok).toBe(false);
  });

  it('scene.activate troca a cena ativa', () => {
    const table = buildTable();
    const scene2 = { ...table.scenes[SCENE_ID]!, id: 'cena-2' };
    const withScene2 = {
      ...table,
      scenes: { ...table.scenes, 'cena-2': scene2 },
    };
    const result = run(withScene2, {
      type: 'scene.activate',
      payload: { sceneId: 'cena-2' },
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.table.activeSceneId).toBe('cena-2');
  });

  it('scene.activate NOT_FOUND', () => {
    const table = buildTable();
    const result = run(table, {
      type: 'scene.activate',
      payload: { sceneId: NOPE_ID },
    });
    expect(result.ok).toBe(false);
  });
});

describe('applyCommand — initiative', () => {
  it('initiative.update substitui a iniciativa', () => {
    const table = buildTable();
    const initiative = { order: ['t1'], values: { t1: 10 } };
    const result = run(table, {
      type: 'initiative.update',
      payload: { initiative },
    });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(result.table.scenes[SCENE_ID]?.initiative).toEqual(initiative);
  });

  it('initiative.update NOT_FOUND sem cena ativa', () => {
    const table = buildTable({ activeSceneId: null });
    const result = run(table, {
      type: 'initiative.update',
      payload: { initiative: { order: [], values: {} } },
    });
    expect(result.ok).toBe(false);
  });
});

describe('applyCommand — round e turn', () => {
  it('round.next incrementa por padrao', () => {
    const table = buildTable();
    const result = run(table, { type: 'round.next', payload: {} });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.table.round).toBe(1);
  });

  it('round.next aceita valor explicito', () => {
    const table = buildTable();
    const result = run(table, { type: 'round.next', payload: { round: 9 } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.table.round).toBe(9);
  });

  it('turn.next incrementa por padrao', () => {
    const table = buildTable();
    const result = run(table, { type: 'turn.next', payload: {} });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.table.turn).toBe(1);
  });

  it('turn.next aceita valor explicito', () => {
    const table = buildTable();
    const result = run(table, { type: 'turn.next', payload: { turn: 3 } });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.table.turn).toBe(3);
  });
});

describe('applyCommand — ping', () => {
  it('nao muda a mesa nem a versao', () => {
    const table = buildTable();
    const result = run(table, { type: 'ping', payload: { x: 1, y: 2 } });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.table).toBe(table);
      expect(result.table.version).toBe(0);
      expect(result.events).toEqual([
        { type: 'pinged', payload: { x: 1, y: 2 } },
      ]);
    }
  });
});

describe('applyCommand — permissao', () => {
  it('retorna FORBIDDEN quando o ator nao pode', () => {
    const table = buildTable();
    const result = applyCommand(
      table,
      { type: 'scene.delete', payload: { sceneId: SCENE_ID } },
      { id: 'x', name: 'Jogador', role: 'player', color: '#000' },
    );
    expect(result).toEqual({
      ok: false,
      code: 'FORBIDDEN',
      message: expect.any(String),
    });
  });
});
