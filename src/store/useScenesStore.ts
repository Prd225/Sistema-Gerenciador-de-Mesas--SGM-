import { create } from 'zustand';
import { useTokenStore } from './useTokenStore';
import { useZoneStore } from './useZoneStore';
import { v4 as uuidv4 } from 'uuid';

export interface SceneData {
  id: string;
  name: string;
  tokens: any[];
  initiativeQueue: any[];
  zones: Record<string, any>;
  markers: Record<string, any>;
  bgImages: any[];
}

interface ScenesState {
  scenes: SceneData[];
  activeSceneId: string | null;
  
  saveCurrentSceneState: () => void;
  switchScene: (id: string) => void;
  addScene: (name?: string) => void;
  renameScene: (id: string, name: string) => void;
  removeScene: (id: string) => void;
  loadLegacyData: (tokensData: any, zonesData: any) => void;
}

const createEmptyScene = (name: string): SceneData => ({
  id: uuidv4(),
  name,
  tokens: [],
  initiativeQueue: [],
  zones: {},
  markers: {},
  bgImages: []
});

export const useScenesStore = create<ScenesState>((set, get) => {
  // Inicialização padrão
  const defaultScene = createEmptyScene('Cena 1');

  return {
    scenes: [defaultScene],
    activeSceneId: defaultScene.id,

    saveCurrentSceneState: () => {
      const { activeSceneId, scenes } = get();
      if (!activeSceneId) return;

      const tokenState = useTokenStore.getState();
      const zoneState = useZoneStore.getState();

      set({
        scenes: scenes.map(s => {
          if (s.id === activeSceneId) {
            return {
              ...s,
              tokens: tokenState.tokens,
              initiativeQueue: tokenState.initiativeQueue,
              zones: zoneState.zones,
              markers: zoneState.markers,
              bgImages: zoneState.bgImages,
            };
          }
          return s;
        })
      });
    },

    switchScene: (id: string) => {
      const { activeSceneId, scenes, saveCurrentSceneState } = get();
      if (activeSceneId === id) return;

      // 1. Salvar o estado atual no ID ativo antes de trocar
      saveCurrentSceneState();

      // 2. Buscar a cena de destino
      const targetScene = get().scenes.find(s => s.id === id);
      if (!targetScene) return;

      // 3. Atualizar o ID ativo
      set({ activeSceneId: id });

      // 4. Injetar os dados da cena destino nos stores globais
      useTokenStore.setState({
        tokens: targetScene.tokens,
        initiativeQueue: targetScene.initiativeQueue,
      });

      useZoneStore.setState({
        zones: targetScene.zones,
        markers: targetScene.markers,
        bgImages: targetScene.bgImages,
      });
      
      // Emit an event for components that need to react (like the map panning/zooming reset)
      setTimeout(() => window.dispatchEvent(new Event('scene-switched')), 50);
    },

    addScene: (name = 'Nova Cena') => {
      const { scenes } = get();
      const newScene = createEmptyScene(`${name} ${scenes.length + 1}`);
      set({ scenes: [...scenes, newScene] });
    },

    renameScene: (id: string, name: string) => {
      const { scenes } = get();
      set({
        scenes: scenes.map(s => s.id === id ? { ...s, name } : s)
      });
    },

    removeScene: (id: string) => {
      const { scenes, activeSceneId, switchScene } = get();
      if (scenes.length <= 1) return; // Não permite apagar a última cena
      
      const newScenes = scenes.filter(s => s.id !== id);
      set({ scenes: newScenes });
      
      // Se apagou a cena ativa, muda pra primeira da lista
      if (activeSceneId === id) {
        switchScene(newScenes[0].id);
      }
    },

    loadLegacyData: (tokensData: any, zonesData: any) => {
      const legacyScene = createEmptyScene('Cena 1 (Migrada)');
      legacyScene.tokens = tokensData?.tokens || [];
      legacyScene.initiativeQueue = tokensData?.initiativeQueue || [];
      legacyScene.zones = zonesData?.zones || {};
      legacyScene.markers = zonesData?.markers || {};
      legacyScene.bgImages = zonesData?.bgImages || [];

      set({
        scenes: [legacyScene],
        activeSceneId: legacyScene.id
      });
      
      // Injeta no store
      useTokenStore.setState({
        tokens: legacyScene.tokens,
        initiativeQueue: legacyScene.initiativeQueue,
      });

      useZoneStore.setState({
        zones: legacyScene.zones,
        markers: legacyScene.markers,
        bgImages: legacyScene.bgImages,
      });
    }
  };
});
