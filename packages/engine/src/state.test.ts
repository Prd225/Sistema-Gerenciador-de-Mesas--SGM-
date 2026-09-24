import { describe, it, expect } from 'vitest';
import type { RoomMember } from '@sgm/shared';
import { createEmptyRoom } from './state';
import { applyCommand } from './apply';
import { can } from './permissions';

describe('@sgm/engine — Estado e Comandos Puros', () => {
  const gmMember: RoomMember = {
    id: 'mem-gm-1',
    name: 'Mestre',
    role: 'gm',
    color: '#ff0000',
    isOnline: true,
  };

  const playerMember: RoomMember = {
    id: 'mem-p1-1',
    name: 'Jogador 1',
    role: 'player',
    color: '#00ff00',
    isOnline: true,
  };

  it('cria sala vazia com estrutura inicial valida', () => {
    const room = createEmptyRoom('SALAX1', 'mem-gm-1');

    expect(room.code).toBe('SALAX1');
    expect(room.hostId).toBe('mem-gm-1');
    expect(room.tokens).toEqual([]);
    expect(room.zones).toEqual({});
    expect(room.markers).toEqual({});
    expect(room.bgImages).toEqual([]);
    expect(room.round).toBe(1);
    expect(room.turn).toBe(1);
  });

  it('valida permissoes de mestre e jogador', () => {
    const room = createEmptyRoom('SALAX1', 'mem-gm-1');
    expect(can(gmMember, { type: 'token.move' }, room)).toBe(true);
    expect(can(playerMember, { type: 'token.move' }, room)).toBe(false);
  });

  it('aplica comando de movimentacao de token de forma pura para o mestre', () => {
    const initialRoom = createEmptyRoom('SALAX1', 'mem-gm-1');
    initialRoom.tokens = [
      {
        id: 'tok-1',
        name: 'Monstro',
        fullName: 'Monstro das Sombras',
        colorText: '#fff',
        colorBorder: '#000',
        colorFill: '#333',
        x: 10,
        y: 20,
        desc: '',
        conditions: [],
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
      },
    ];

    const result = applyCommand(
      initialRoom,
      { type: 'token.move', payload: { tokenId: 'tok-1', x: 50, y: 80 } },
      gmMember,
    );

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.state.tokens[0].x).toBe(50);
      expect(result.state.tokens[0].y).toBe(80);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].type).toBe('token.moved');
      // Imutabilidade: estado original inalterado
      expect(initialRoom.tokens[0].x).toBe(10);
    }
  });

  it('rejeita comando quando ator nao possui permissao', () => {
    const room = createEmptyRoom('SALAX1', 'mem-gm-1');
    const result = applyCommand(
      room,
      { type: 'token.move', payload: { tokenId: 'tok-1', x: 50, y: 80 } },
      playerMember,
    );

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.code).toBe('FORBIDDEN');
    }
  });
});
