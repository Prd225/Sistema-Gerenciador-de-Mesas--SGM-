import { describe, it, expect, beforeEach } from 'vitest';
import { useTokenStore } from '@/store/useTokenStore';
import type { Token } from '@shared';

const createMockToken = (id: string, name = 'Token de Teste'): Token => ({
  id,
  name,
  fullName: `${name} Completo`,
  colorText: '#ffffff',
  colorBorder: '#ff0000',
  colorFill: '#1a1a1e',
  x: 100,
  y: 200,
  desc: 'Descricao de teste',
  conditions: [],
  stats: {
    type: 'player',
    system: 'san',
    agi: 1,
    for: 2,
    int: 3,
    pre: 4,
    vig: 5,
    def: 10,
    bloq: 12,
    esq: 14,
    pv: 20,
    maxPv: 20,
    pe: 10,
    maxPe: 10,
    san: 30,
    maxSan: 30,
    pd: 0,
    maxPd: 0,
  },
});

describe('useTokenStore — Gestão de Tokens e Iniciativa', () => {
  beforeEach(() => {
    useTokenStore.setState({
      tokens: [],
      initiativeQueue: [],
      initiativeSortMode: 'descending',
      activeCtxTokenId: null,
      editingTokenId: null,
      showTokenCreateModal: false,
      tokenContextMenu: null,
    });
  });

  it('adiciona tokens ao estado local', () => {
    const token = createMockToken('tok-1', 'Investigador 1');
    useTokenStore.getState().addToken(token);

    const state = useTokenStore.getState();
    expect(state.tokens).toHaveLength(1);
    expect(state.tokens[0].id).toBe('tok-1');
    expect(state.tokens[0].name).toBe('Investigador 1');
  });

  it('move o token atualizando as coordenadas x e y', () => {
    const token = createMockToken('tok-2');
    useTokenStore.getState().addToken(token);

    useTokenStore.getState().updateToken('tok-2', { x: 350, y: 450 });

    const updated = useTokenStore.getState().getTokenById('tok-2');
    expect(updated?.x).toBe(350);
    expect(updated?.y).toBe(450);
  });

  it('atualiza atributos vitais e status do token', () => {
    const token = createMockToken('tok-3');
    useTokenStore.getState().addToken(token);

    useTokenStore.getState().updateToken('tok-3', {
      stats: {
        ...token.stats,
        pv: 12,
        san: 25,
      },
    });

    const updated = useTokenStore.getState().getTokenById('tok-3');
    expect(updated?.stats.pv).toBe(12);
    expect(updated?.stats.san).toBe(25);
  });

  it('adiciona condicoes de status ao token', () => {
    const token = createMockToken('tok-4');
    useTokenStore.getState().addToken(token);

    useTokenStore.getState().updateToken('tok-4', {
      conditions: [
        {
          name: 'Sangrando',
          desc: 'Perde 1d6 PV por rodada',
          color: '#e55757',
          type: 'stat_modifier',
          durationTurns: 3,
        },
      ],
    });

    const updated = useTokenStore.getState().getTokenById('tok-4');
    expect(updated?.conditions).toHaveLength(1);
    expect(updated?.conditions[0].name).toBe('Sangrando');
    expect(updated?.conditions[0].durationTurns).toBe(3);
  });

  it('remove token e o expurga da fila de iniciativa simultaneamente', () => {
    const tok1 = createMockToken('tok-5', 'Guerreiro');
    const tok2 = createMockToken('tok-6', 'Monstro');

    useTokenStore.getState().addToken(tok1);
    useTokenStore.getState().addToken(tok2);

    useTokenStore.getState().setInitiativeQueue([
      { tokenId: 'tok-5', value: 18 },
      { tokenId: 'tok-6', value: 14 },
    ]);

    expect(useTokenStore.getState().initiativeQueue).toHaveLength(2);

    useTokenStore.getState().removeToken('tok-5');

    const state = useTokenStore.getState();
    expect(state.tokens).toHaveLength(1);
    expect(state.tokens[0].id).toBe('tok-6');
    expect(state.initiativeQueue).toHaveLength(1);
    expect(state.initiativeQueue[0].tokenId).toBe('tok-6');
  });

  it('gerencia a ordenacao e limpeza da iniciativa', () => {
    useTokenStore.getState().setInitiativeSortMode('ascending');
    expect(useTokenStore.getState().initiativeSortMode).toBe('ascending');

    useTokenStore.getState().setInitiativeQueue([
      { tokenId: 'tok-a', value: 10 },
      { tokenId: 'tok-b', value: 20 },
    ]);

    expect(useTokenStore.getState().initiativeQueue).toHaveLength(2);

    useTokenStore.getState().clearInitiative();
    expect(useTokenStore.getState().initiativeQueue).toHaveLength(0);
  });

  it('trata operacoes remotas (from remote) sem duplicacoes', () => {
    const tok = createMockToken('tok-remote', 'Inimigo Remoto');

    useTokenStore.getState().addTokenFromRemote(tok);
    expect(useTokenStore.getState().tokens).toHaveLength(1);

    // Evita duplicar se ja existir
    useTokenStore.getState().addTokenFromRemote(tok);
    expect(useTokenStore.getState().tokens).toHaveLength(1);

    useTokenStore
      .getState()
      .updateTokenFromRemote('tok-remote', { name: 'Novo Nome Remoto' });
    expect(useTokenStore.getState().getTokenById('tok-remote')?.name).toBe(
      'Novo Nome Remoto',
    );

    useTokenStore.getState().removeTokenFromRemote('tok-remote');
    expect(useTokenStore.getState().tokens).toHaveLength(0);
  });
});
