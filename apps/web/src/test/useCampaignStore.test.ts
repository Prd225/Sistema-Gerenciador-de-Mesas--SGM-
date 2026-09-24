import { describe, it, expect, beforeEach } from 'vitest';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useTokenStore } from '@/store/useTokenStore';
import type { Token } from '@shared';

const createMockToken = (id: string, name: string): Token => ({
  id,
  name,
  fullName: name,
  colorText: '#ffffff',
  colorBorder: '#ff0000',
  colorFill: '#1a1a1e',
  x: 0,
  y: 0,
  desc: '',
  conditions: [],
  stats: {
    type: 'player',
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
    pe: 10,
    maxPe: 10,
    san: 30,
    maxSan: 30,
    pd: 0,
    maxPd: 0,
  },
});

describe('useCampaignStore — Rodadas, Turnos e Urgência', () => {
  beforeEach(() => {
    localStorage.clear();
    useTokenStore.setState({
      tokens: [],
      initiativeQueue: [],
    });
    useCampaignStore.setState({
      scene: 1,
      round: 1,
      turn: 1,
      urgency: null,
      turnsPerRound: 3,
      showInitModal: false,
      showLoadModal: false,
      showSaveModal: false,
      autoSaveSlot: null,
      autoSaveStatus: 'idle',
    });
  });

  it('controla navegacao de cenas e rodadas simples', () => {
    const store = useCampaignStore.getState();

    store.setRound(3);
    expect(useCampaignStore.getState().round).toBe(3);

    store.nextRound();
    expect(useCampaignStore.getState().round).toBe(4);

    store.setTurn(2);
    expect(useCampaignStore.getState().turn).toBe(2);

    store.nextScene();
    expect(useCampaignStore.getState().scene).toBe(2);
    expect(useCampaignStore.getState().round).toBe(1);
    expect(useCampaignStore.getState().turn).toBe(1);
  });

  it('avanca turnos e incrementa rodada quando fila de iniciativa esta vazia', () => {
    useCampaignStore.setState({
      turn: 1,
      round: 1,
      turnsPerRound: 3,
      urgency: 5,
    });

    useCampaignStore.getState().addTurn();
    expect(useCampaignStore.getState().turn).toBe(2);
    expect(useCampaignStore.getState().round).toBe(1);

    useCampaignStore.getState().addTurn();
    expect(useCampaignStore.getState().turn).toBe(3);
    expect(useCampaignStore.getState().round).toBe(1);

    // No 4º avanco, excede turnsPerRound (3), reseta turno para 1, incrementa round e diminui urgencia
    useCampaignStore.getState().addTurn();
    expect(useCampaignStore.getState().turn).toBe(1);
    expect(useCampaignStore.getState().round).toBe(2);
    expect(useCampaignStore.getState().urgency).toBe(4);
  });

  it('avanca turno considerando fila de iniciativa e condicoes dos tokens', () => {
    const tok1 = createMockToken('tok-1', 'Arthur');
    const tok2 = createMockToken('tok-2', 'Monstro Atordoado');
    tok2.conditions = [
      {
        name: 'Atordoado',
        desc: 'Pula turno',
        color: '#ffd700',
        type: 'skip_turn',
        durationTurns: 1,
      },
    ];

    useTokenStore.setState({
      tokens: [tok1, tok2],
      initiativeQueue: [
        { tokenId: 'tok-1', value: 20 },
        { tokenId: 'tok-2', value: 15 },
      ],
    });

    useCampaignStore.setState({ turn: 1, round: 1, turnsPerRound: 2 });

    // Turno 1 atual: Arthur
    // Ao chamar addTurn, o proximo na fila e o Monstro Atordoado que tem skip_turn
    useCampaignStore.getState().addTurn();

    // Como o tok2 tem skip_turn, ele deve ter consumido o turno dele e o loop avancado
    const updatedTok2 = useTokenStore.getState().getTokenById('tok-2');
    // A duracao da condicao deve ter sido decrementada para 0
    expect(updatedTok2?.conditions[0]?.durationTurns).toBe(0);
  });

  it('gerencia nivel de urgencia com limite minimo zero', () => {
    useCampaignStore.getState().setUrgency(3);
    expect(useCampaignStore.getState().urgency).toBe(3);

    useCampaignStore.getState().changeUrgency(-2);
    expect(useCampaignStore.getState().urgency).toBe(1);

    useCampaignStore.getState().changeUrgency(-5);
    expect(useCampaignStore.getState().urgency).toBe(0);
  });

  it('gerencia persistencia do autoSaveSlot no localStorage', () => {
    useCampaignStore.getState().setAutoSaveSlot(5);
    expect(useCampaignStore.getState().autoSaveSlot).toBe(5);
    expect(localStorage.getItem('sgm_autoSaveSlot')).toBe('5');

    useCampaignStore.getState().setAutoSaveSlot(null);
    expect(useCampaignStore.getState().autoSaveSlot).toBeNull();
    expect(localStorage.getItem('sgm_autoSaveSlot')).toBeNull();
  });

  it('atualiza estado a partir de sincronizacao remota', () => {
    useCampaignStore.getState().setRoundTurnFromRemote(5, 3);
    expect(useCampaignStore.getState().round).toBe(5);
    expect(useCampaignStore.getState().turn).toBe(3);
  });
});
