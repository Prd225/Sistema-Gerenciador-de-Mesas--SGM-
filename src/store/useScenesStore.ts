import { create } from 'zustand';
import { useTokenStore } from './useTokenStore';
import { useZoneStore } from './useZoneStore';
import { generateId as uuidv4 } from '@/lib/uuid';

import { db } from '@/lib/db';

export interface SceneData {
  id: string;
  name: string;
}

interface ScenesState {
  scenes: SceneData[];
  activeSceneId: string | null;
  isSwitching: boolean;

  saveCurrentSceneState: () => Promise<void>;
  switchScene: (id: string) => Promise<void>;
  addScene: (name?: string) => Promise<void>;
  renameScene: (id: string, name: string) => void;
  removeScene: (id: string) => Promise<void>;
  loadLegacyData: (tokensData: any, zonesData: any) => Promise<void>;
}

const createEmptySceneData = (): any => ({
  tokens: [],
  initiativeQueue: [],
  zones: {},
  markers: {},
  bgImages: [],
});

export const useScenesStore = create<ScenesState>((set, get) => {
  // Inicialização padrão vazia, pois o Load/Setup preencherá
  const defaultId = uuidv4();
  const defaultScene = { id: defaultId, name: 'Cena 1' };

  return {
    scenes: [defaultScene],
    activeSceneId: defaultId,
    isSwitching: false,

    saveCurrentSceneState: async () => {
      const { activeSceneId } = get();
      if (!activeSceneId) return;

      const tokenState = useTokenStore.getState();
      const zoneState = useZoneStore.getState();

      await db.activeScenes.put({
        id: activeSceneId,
        tokens: tokenState.tokens,
        initiativeQueue: tokenState.initiativeQueue,
        zones: zoneState.zones,
        markers: zoneState.markers,
        bgImages: zoneState.bgImages,
      });
    },

    switchScene: async (id: string) => {
      const { activeSceneId, isSwitching, saveCurrentSceneState } = get();
      if (activeSceneId === id || isSwitching) return;

      set({ isSwitching: true });

      try {
        // 1. Salvar o estado atual no Dexie antes de trocar
        await saveCurrentSceneState();

        // 2. Buscar a cena de destino no Dexie
        const targetData = await db.activeScenes.get(id);
        if (!targetData) return;

        // 3. Atualizar o ID ativo
        set({ activeSceneId: id });

        // 4. Injetar os dados da cena destino nos stores globais
        useTokenStore.setState({
          tokens: targetData.tokens,
          initiativeQueue: targetData.initiativeQueue,
        });

        useZoneStore.setState({
          zones: targetData.zones,
          markers: targetData.markers,
          bgImages: targetData.bgImages,
        });

        // Emit an event for components that need to react
        setTimeout(() => window.dispatchEvent(new Event('scene-switched')), 50);
      } finally {
        set({ isSwitching: false });
      }
    },

    addScene: async (name = 'Nova Cena') => {
      const { scenes } = get();
      const newId = uuidv4();

      await db.activeScenes.put({
        id: newId,
        ...createEmptySceneData(),
      });

      set({
        scenes: [
          ...scenes,
          { id: newId, name: `${name} ${scenes.length + 1}` },
        ],
      });
    },

    renameScene: (id: string, name: string) => {
      const { scenes } = get();
      set({
        scenes: scenes.map((s) => (s.id === id ? { ...s, name } : s)),
      });
    },

    removeScene: async (id: string) => {
      const { scenes, activeSceneId, switchScene } = get();
      if (scenes.length <= 1) return; // Não permite apagar a última cena

      const newScenes = scenes.filter((s) => s.id !== id);
      set({ scenes: newScenes });

      await db.activeScenes.delete(id);

      // Se apagou a cena ativa, muda pra primeira da lista
      if (activeSceneId === id) {
        await switchScene(newScenes[0].id);
      }
    },

    loadLegacyData: async (tokensData: any, zonesData: any) => {
      await db.activeScenes.clear();

      const legacyId = uuidv4();

      await db.activeScenes.put({
        id: legacyId,
        tokens: tokensData?.tokens || [],
        initiativeQueue: tokensData?.initiativeQueue || [],
        zones: zonesData?.zones || {},
        markers: zonesData?.markers || {},
        bgImages: zonesData?.bgImages || [],
      });

      set({
        scenes: [{ id: legacyId, name: 'Cena 1 (Migrada)' }],
        activeSceneId: legacyId,
      });

      const targetData = await db.activeScenes.get(legacyId);

      if (targetData) {
        useTokenStore.setState({
          tokens: targetData.tokens,
          initiativeQueue: targetData.initiativeQueue,
        });

        useZoneStore.setState({
          zones: targetData.zones,
          markers: targetData.markers,
          bgImages: targetData.bgImages,
        });
      }
    },
  };
});
