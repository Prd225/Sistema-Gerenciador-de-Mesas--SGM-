import { describe, expect, it } from 'vitest';
import type { Command } from '@sgm/shared';
import { can } from './permissions';
import {
  GM,
  OTHER_PLAYER,
  PLAYER,
  SCENE_ID,
  SPECTATOR,
  buildTable,
  buildToken,
} from './fixtures';

const PING: Command = { type: 'ping', payload: { x: 0, y: 0 } };

describe('can', () => {
  it('todos podem dar ping', () => {
    const table = buildTable();
    expect(can(GM, PING, table)).toBe(true);
    expect(can(PLAYER, PING, table)).toBe(true);
    expect(can(SPECTATOR, PING, table)).toBe(true);
  });

  it('espectador so pode dar ping', () => {
    const table = buildTable();
    expect(can(SPECTATOR, { type: 'round.next', payload: {} }, table)).toBe(
      false,
    );
  });

  it('mestre pode tudo', () => {
    const table = buildTable();
    expect(
      can(GM, { type: 'scene.delete', payload: { sceneId: SCENE_ID } }, table),
    ).toBe(true);
  });

  it('jogador nao pode comandos exclusivos do mestre', () => {
    const table = buildTable();
    const commands: Command[] = [
      { type: 'token.create', payload: { token: buildToken() } },
      {
        type: 'zone.create',
        payload: {
          zone: {
            id: 'z',
            type: 'rect',
            x: 0,
            y: 0,
            w: 1,
            h: 1,
            data: { title: '', desc: '', visits: 0 },
          },
        },
      },
      {
        type: 'marker.create',
        payload: { marker: { id: 'm', x: 0, y: 0, text: '' } },
      },
      {
        type: 'background.create',
        payload: {
          background: {
            id: 'b',
            imageRef: 'r',
            x: 0,
            y: 0,
            scale: 1,
            rotation: 0,
          },
        },
      },
      {
        type: 'initiative.update',
        payload: { initiative: { order: [], values: {} } },
      },
      { type: 'scene.create', payload: { scene: table.scenes[SCENE_ID]! } },
      { type: 'round.next', payload: {} },
      { type: 'turn.next', payload: {} },
    ];
    for (const command of commands) {
      expect(can(PLAYER, command, table)).toBe(false);
    }
  });

  describe('token.move', () => {
    it('mestre pode mover qualquer token', () => {
      const token = buildToken({ ownerMemberId: PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          GM,
          {
            type: 'token.move',
            payload: { sceneId: SCENE_ID, tokenId: token.id, x: 1, y: 1 },
          },
          table,
        ),
      ).toBe(true);
    });

    it('dono pode mover o proprio token', () => {
      const token = buildToken({ ownerMemberId: PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          PLAYER,
          {
            type: 'token.move',
            payload: { sceneId: SCENE_ID, tokenId: token.id, x: 1, y: 1 },
          },
          table,
        ),
      ).toBe(true);
    });

    it('jogador nao pode mover token alheio', () => {
      const token = buildToken({ ownerMemberId: OTHER_PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          PLAYER,
          {
            type: 'token.move',
            payload: { sceneId: SCENE_ID, tokenId: token.id, x: 1, y: 1 },
          },
          table,
        ),
      ).toBe(false);
    });

    it('jogador nao pode mover token inexistente', () => {
      const table = buildTable();
      expect(
        can(
          PLAYER,
          {
            type: 'token.move',
            payload: { sceneId: SCENE_ID, tokenId: 'nope', x: 1, y: 1 },
          },
          table,
        ),
      ).toBe(false);
    });

    it('jogador nao pode mover token quando nao ha cena ativa nem sceneId', () => {
      const table = buildTable({ activeSceneId: null });
      expect(
        can(
          PLAYER,
          { type: 'token.move', payload: { tokenId: 'nope', x: 1, y: 1 } },
          table,
        ),
      ).toBe(false);
    });

    it('jogador nao pode mover token de cena inexistente', () => {
      const table = buildTable();
      expect(
        can(
          PLAYER,
          {
            type: 'token.move',
            payload: { sceneId: 'nope-scene', tokenId: 'nope', x: 1, y: 1 },
          },
          table,
        ),
      ).toBe(false);
    });
  });

  describe('token.update', () => {
    it('mestre pode atualizar qualquer campo de qualquer token', () => {
      const token = buildToken({ ownerMemberId: PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          GM,
          {
            type: 'token.update',
            payload: {
              sceneId: SCENE_ID,
              tokenId: token.id,
              updates: { name: 'X' },
            },
          },
          table,
        ),
      ).toBe(true);
    });

    it('dono pode alterar conditions', () => {
      const token = buildToken({ ownerMemberId: PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          PLAYER,
          {
            type: 'token.update',
            payload: {
              sceneId: SCENE_ID,
              tokenId: token.id,
              updates: { conditions: [] },
            },
          },
          table,
        ),
      ).toBe(true);
    });

    it('dono pode alterar stats.pv', () => {
      const token = buildToken({ ownerMemberId: PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          PLAYER,
          {
            type: 'token.update',
            payload: {
              sceneId: SCENE_ID,
              tokenId: token.id,
              updates: { stats: { pv: 1 } as never },
            },
          },
          table,
        ),
      ).toBe(true);
    });

    it('dono nao pode alterar nome (campo fora da lista)', () => {
      const token = buildToken({ ownerMemberId: PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          PLAYER,
          {
            type: 'token.update',
            payload: {
              sceneId: SCENE_ID,
              tokenId: token.id,
              updates: { name: 'X' },
            },
          },
          table,
        ),
      ).toBe(false);
    });

    it('dono nao pode alterar outro campo de stats alem de pv', () => {
      const token = buildToken({ ownerMemberId: PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          PLAYER,
          {
            type: 'token.update',
            payload: {
              sceneId: SCENE_ID,
              tokenId: token.id,
              updates: { stats: { maxPv: 1 } as never },
            },
          },
          table,
        ),
      ).toBe(false);
    });

    it('jogador nao pode atualizar token alheio', () => {
      const token = buildToken({ ownerMemberId: OTHER_PLAYER.id });
      const table = buildTable({
        scenes: {
          [SCENE_ID]: {
            ...buildTable().scenes[SCENE_ID]!,
            tokens: { [token.id]: token },
          },
        },
      });
      expect(
        can(
          PLAYER,
          {
            type: 'token.update',
            payload: {
              sceneId: SCENE_ID,
              tokenId: token.id,
              updates: { conditions: [] },
            },
          },
          table,
        ),
      ).toBe(false);
    });

    it('jogador nao pode atualizar token inexistente', () => {
      const table = buildTable();
      expect(
        can(
          PLAYER,
          {
            type: 'token.update',
            payload: { sceneId: SCENE_ID, tokenId: 'nope', updates: {} },
          },
          table,
        ),
      ).toBe(false);
    });
  });
});
