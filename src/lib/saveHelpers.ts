import { useTokenStore } from '@/store/useTokenStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useRulesStore } from '@/store/useRulesStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useTablesStore } from '@/store/useTablesStore';
import { useRoulettesStore } from '@/store/useRoulettesStore';
import { db } from '@/lib/db';

export const collectGameState = () => {
  const tokenState = useTokenStore.getState();
  const zoneState = useZoneStore.getState();
  const campaignState = useCampaignStore.getState();

  return {
    version: 1,
    tokens: {
      tokens: tokenState.tokens,
      initiativeQueue: tokenState.initiativeQueue,
    },
    zones: {
      zones: zoneState.zones,
      markers: zoneState.markers,
      bgImages: zoneState.bgImages,
    },
    campaign: {
      scene: campaignState.scene,
      round: campaignState.round,
      turn: campaignState.turn,
      urgency: campaignState.urgency,
      turnsPerRound: campaignState.turnsPerRound,
    },
    diary: {
      entries: useDiaryStore.getState().entries,
    },
    rules: {
      pages: useRulesStore.getState().pages,
    },
    notes: {
      pages: useNotesStore.getState().pages,
    },
    tables: {
      pages: useTablesStore.getState().pages,
    },
    roulettes: {
      pages: useRoulettesStore.getState().pages,
    },
  };
};

let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
let fadeOutTimeout: ReturnType<typeof setTimeout> | null = null;

export const triggerAutoSave = (forceImmediate = false) => {
  const campaignState = useCampaignStore.getState();

  // Pause se modais meta estiverem abertos
  if (campaignState.showSaveModal || campaignState.showLoadModal) return;

  // Se não tem autoSave configurado, aborta
  if (campaignState.autoSaveSlot === null) return;

  const executeSave = async () => {
    try {
      const slot = campaignState.autoSaveSlot;
      if (slot === null) return;

      campaignState.setAutoSaveStatus('saving');

      const existingSlot = await db.campaignSlots.get(slot);
      if (!existingSlot) {
        // Se o slot for deletado no bd de alguma forma
        campaignState.setAutoSaveSlot(null);
        campaignState.setAutoSaveStatus('idle');
        return;
      }

      const data = collectGameState();

      await db.campaignSlots.put({
        slotNumber: slot,
        name: existingSlot.name,
        updatedAt: Date.now(),
        data,
      });

      campaignState.setAutoSaveStatus('success');

      // Limpa o sucesso após 3 segundos para fadeout
      if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
      fadeOutTimeout = setTimeout(() => {
        useCampaignStore.getState().setAutoSaveStatus('idle');
      }, 3000);
    } catch (error) {
      console.error('Falha no Auto-Save assíncrono:', error);
      campaignState.setAutoSaveStatus('idle');
    }
  };

  if (forceImmediate) {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    executeSave();
  } else {
    // Debounce de 25 segundos para acúmulo de eventos
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      executeSave();
    }, 25000);
  }
};
