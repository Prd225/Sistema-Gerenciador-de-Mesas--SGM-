import { useTokenStore } from '@/store/useTokenStore';
import { useZoneStore } from '@/store/useZoneStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useDiaryStore } from '@/store/useDiaryStore';
import { useRulesStore } from '@/store/useRulesStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useTablesStore } from '@/store/useTablesStore';
import { useRoulettesStore } from '@/store/useRoulettesStore';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import { useScenesStore } from '@/store/useScenesStore';
import { db } from '@/lib/db';

export const collectGameState = async () => {
  const tokenState = useTokenStore.getState();
  const zoneState = useZoneStore.getState();
  const campaignState = useCampaignStore.getState();

  const scenesStore = useScenesStore.getState();
  await scenesStore.saveCurrentSceneState();
  const activeScenesData = await db.activeScenes.toArray();

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
    soundpad: {
      pages: useSoundpadStore.getState().pages,
    },
    scenes: {
      scenes: useScenesStore.getState().scenes,
      activeSceneId: useScenesStore.getState().activeSceneId,
      sceneData: activeScenesData,
    },
  };
};

export const resetGameState = async () => {
  await db.activeScenes.clear();
  window.location.reload();
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

      const data = await collectGameState();

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
    // Debounce de 3 segundos para acúmulo de eventos
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      executeSave();
    }, 3000);
  }
};
