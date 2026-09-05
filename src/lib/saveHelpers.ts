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

export const applyGameState = async (data: any) => {
  if (!data) return;

  try {
    if (data.tokens) {
      useTokenStore.setState({
        tokens: data.tokens.tokens || [],
        initiativeQueue: data.tokens.initiativeQueue || [],
      });
    }

    if (data.zones) {
      const migratedZones = data.zones.zones || {};
      // Migração para formato legado de customHighlights
      Object.values(migratedZones).forEach((zone: any) => {
        if (
          zone.data?.customHighlights &&
          zone.data.customHighlights.length > 0
        ) {
          if (!('options' in zone.data.customHighlights[0])) {
            const oldHighlights = zone.data.customHighlights;
            zone.data.customHighlights = [
              {
                title: 'Migrados',
                options: oldHighlights,
              },
            ];
          }
        }
      });

      useZoneStore.setState({
        zones: migratedZones,
        markers: data.zones.markers || {},
        bgImages: data.zones.bgImages || [],
      });
    }

    if (data.campaign) {
      useCampaignStore.setState({
        scene: data.campaign.scene || 1,
        round: data.campaign.round || 1,
        turn: data.campaign.turn || 1,
        urgency:
          data.campaign.urgency !== undefined ? data.campaign.urgency : null,
        turnsPerRound: data.campaign.turnsPerRound || 10,
      });
    }

    if (data.diary) {
      useDiaryStore.setState({
        entries: data.diary.entries || [],
      });
    }

    if (data.rules) {
      useRulesStore.setState({
        pages: data.rules.pages || [],
      });
    }

    if (data.notes) {
      useNotesStore.setState({
        pages: data.notes.pages || [],
      });
    }

    if (data.tables) {
      useTablesStore.setState({
        pages: data.tables.pages || [],
      });
    }

    if (data.roulettes) {
      useRoulettesStore.setState({
        pages: data.roulettes.pages || [],
      });
    }

    if (data.soundpad) {
      useSoundpadStore.setState({
        pages: data.soundpad.pages || [],
      });
    }

    if (data.scenes) {
      await db.activeScenes.clear();
      if (data.scenes.sceneData && data.scenes.sceneData.length > 0) {
        await db.activeScenes.bulkAdd(data.scenes.sceneData);
      }

      useScenesStore.setState({
        scenes: data.scenes.scenes || [],
        activeSceneId: data.scenes.activeSceneId || null,
      });
    } else if (data.tokens || data.zones) {
      // Fallback para saves antigos sem gerenciador de cenas
      await useScenesStore.getState().loadLegacyData(data.tokens, data.zones);
    }

    // Dispara evento para componentes ouvintes atualizarem renderização/posição
    window.dispatchEvent(new Event('scene-switched'));
  } catch (error) {
    console.error('[SGM] Erro ao aplicar estado da mesa:', error);
    throw error;
  }
};

export const saveWorkingSession = async (customData?: any) => {
  try {
    const data = customData || (await collectGameState());
    await db.sessionState.put({
      key: 'currentSession',
      updatedAt: Date.now(),
      data,
    });
  } catch (error) {
    console.error('[SGM] Falha ao salvar sessão atual de trabalho:', error);
  }
};

export const loadWorkingSession = async (): Promise<boolean> => {
  try {
    const session = await db.sessionState.get('currentSession');
    if (session?.data) {
      await applyGameState(session.data);
      return true;
    }
  } catch (error) {
    console.error('[SGM] Falha ao carregar sessão de trabalho:', error);
  }
  return false;
};

export const clearWorkingSession = async () => {
  try {
    await db.sessionState.delete('currentSession');
  } catch (e) {
    console.error('[SGM] Erro ao limpar sessionState:', e);
  }
  try {
    await db.activeScenes.clear();
  } catch (e) {
    console.error('[SGM] Erro ao limpar activeScenes:', e);
  }
  localStorage.removeItem('sgm_autoSaveSlot');
  sessionStorage.removeItem('sgm_viewport');
};

export const resetGameState = async () => {
  await clearWorkingSession();
  window.location.reload();
};

let debounceTimeout: ReturnType<typeof setTimeout> | null = null;
let fadeOutTimeout: ReturnType<typeof setTimeout> | null = null;

export const triggerAutoSave = (forceImmediate = false) => {
  const campaignState = useCampaignStore.getState();

  // Pause se modais meta de salvar/carregar estiverem abertos
  if (campaignState.showSaveModal || campaignState.showLoadModal) return;

  const executeSave = async () => {
    try {
      const data = await collectGameState();

      // 1. SEMPRE persiste o estado de trabalho da mesa (para F5 não zerar nada!)
      await db.sessionState.put({
        key: 'currentSession',
        updatedAt: Date.now(),
        data,
      });

      // 2. Se houver um slot de salvamento manual/automático ativo (Slot 1-50)
      const slot = campaignState.autoSaveSlot;
      if (slot !== null) {
        campaignState.setAutoSaveStatus('saving');

        const existingSlot = await db.campaignSlots.get(slot);
        if (!existingSlot) {
          campaignState.setAutoSaveSlot(null);
          campaignState.setAutoSaveStatus('idle');
          return;
        }

        await db.campaignSlots.put({
          slotNumber: slot,
          name: existingSlot.name,
          updatedAt: Date.now(),
          data,
        });

        campaignState.setAutoSaveStatus('success');

        if (fadeOutTimeout) clearTimeout(fadeOutTimeout);
        fadeOutTimeout = setTimeout(() => {
          useCampaignStore.getState().setAutoSaveStatus('idle');
        }, 3000);
      }
    } catch (error) {
      console.error('[SGM] Falha no salvamento automático:', error);
      if (campaignState.autoSaveSlot !== null) {
        campaignState.setAutoSaveStatus('idle');
      }
    }
  };

  if (forceImmediate) {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    executeSave();
  } else {
    // Debounce de 800ms para acúmulo suave de eventos
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(() => {
      executeSave();
    }, 800);
  }
};
