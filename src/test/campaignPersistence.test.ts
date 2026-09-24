import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/lib/db';
import {
  collectGameState,
  applyGameState,
  saveWorkingSession,
  loadWorkingSession,
  clearWorkingSession,
} from '@/lib/saveHelpers';
import { useTokenStore } from '@/store/useTokenStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useDiaryStore } from '@/store/useDiaryStore';

describe('Campaign Persistence & Slots — Dexie e Serialização', () => {
  beforeEach(async () => {
    await db.campaignSlots.clear();
    await db.sessionState.clear();
    await db.activeScenes.clear();

    useTokenStore.setState({ tokens: [], initiativeQueue: [] });
    useZoneStore.setState({ zones: {}, markers: {}, bgImages: [] });
    useCampaignStore.setState({ scene: 1, round: 1, turn: 1, urgency: null });
    useDiaryStore.setState({ entries: [] });
  });

  it('permite criar, recuperar e deletar slots de campanha (CRUD)', async () => {
    const mockSaveData = {
      version: 1,
      name: 'Campanha Ordem Paranormal',
      campaign: { round: 2, turn: 3, scene: 1 },
    };

    // 1. Create (Put)
    await db.campaignSlots.put({
      slotNumber: 1,
      name: 'Sessão 01',
      updatedAt: Date.now(),
      data: mockSaveData,
    });

    // 2. Read (Get)
    const slot = await db.campaignSlots.get(1);
    expect(slot).toBeDefined();
    expect(slot?.name).toBe('Sessão 01');
    expect(slot?.data.name).toBe('Campanha Ordem Paranormal');

    // 3. Update
    await db.campaignSlots.put({
      slotNumber: 1,
      name: 'Sessão 01 - Final',
      updatedAt: Date.now(),
      data: { ...mockSaveData, name: 'Campanha Atualizada' },
    });
    const updatedSlot = await db.campaignSlots.get(1);
    expect(updatedSlot?.name).toBe('Sessão 01 - Final');
    expect(updatedSlot?.data.name).toBe('Campanha Atualizada');

    // 4. Delete
    await db.campaignSlots.delete(1);
    const deletedSlot = await db.campaignSlots.get(1);
    expect(deletedSlot).toBeUndefined();
  });

  it('coleta e aplica estado completo da mesa (export/import)', async () => {
    // Popula stores
    useTokenStore.setState({
      tokens: [
        {
          id: 'tok-persist-1',
          name: 'Personagem Teste',
          fullName: 'Personagem Teste',
          colorText: '#fff',
          colorBorder: '#000',
          colorFill: '#333',
          x: 10,
          y: 20,
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
            pv: 15,
            maxPv: 20,
            pe: 5,
            maxPe: 10,
            san: 20,
            maxSan: 30,
            pd: 0,
            maxPd: 0,
          },
        },
      ],
      initiativeQueue: [{ tokenId: 'tok-persist-1', value: 15 }],
    });

    useCampaignStore.setState({
      scene: 2,
      round: 4,
      turn: 2,
      urgency: 3,
    });

    useDiaryStore.setState({
      entries: [
        {
          id: 'diary-1',
          name: 'Pistas Encontradas',
          date: '2026-09-24',
          points: [
            {
              id: 'point-1',
              text: 'Uma chave de ferro foi localizada no sótão.',
              isComplex: false,
              createdAt: Date.now(),
            },
          ],
          createdAt: Date.now(),
        },
      ],
    });

    // Serializa (Export)
    const exportedState = await collectGameState();
    expect(exportedState.version).toBe(1);
    expect(exportedState.tokens.tokens).toHaveLength(1);
    expect(exportedState.campaign.round).toBe(4);
    expect(exportedState.diary.entries).toHaveLength(1);

    // Converte para JSON e recupera (simula download/upload de arquivo JSON)
    const jsonString = JSON.stringify(exportedState);
    const parsedFromJson = JSON.parse(jsonString);

    // Limpa estado para testar hidratação
    useTokenStore.setState({ tokens: [], initiativeQueue: [] });
    useCampaignStore.setState({ scene: 1, round: 1, turn: 1, urgency: null });
    useDiaryStore.setState({ entries: [] });

    // Aplica estado (Import)
    await applyGameState(parsedFromJson);

    // Verifica se os stores foram hidratados corretamente
    expect(useTokenStore.getState().tokens).toHaveLength(1);
    expect(useTokenStore.getState().tokens[0].id).toBe('tok-persist-1');
    expect(useCampaignStore.getState().round).toBe(4);
    expect(useCampaignStore.getState().turn).toBe(2);
    expect(useCampaignStore.getState().urgency).toBe(3);
    expect(useDiaryStore.getState().entries).toHaveLength(1);
  });

  it('salva e restaura sessao de trabalho no IndexedDB', async () => {
    useCampaignStore.setState({ round: 7, turn: 1 });
    await saveWorkingSession();

    // Altera memoria
    useCampaignStore.setState({ round: 1, turn: 1 });

    // Restaura da sessao salva
    const loaded = await loadWorkingSession();
    expect(loaded).toBe(true);
    expect(useCampaignStore.getState().round).toBe(7);

    // Limpa sessao de trabalho
    await clearWorkingSession();
    const sessionAfterClear = await db.sessionState.get('currentSession');
    expect(sessionAfterClear).toBeUndefined();
  });
});
