import { create } from 'zustand';
import type { FogArea, FogState } from '@/types/fog';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { isPlayerMode } from '@/lib/roomRole';
import { socket } from '@/lib/socket';

const generateId = () =>
  window.crypto?.randomUUID?.() ?? Math.random().toString(36).substring(2, 11);

interface FogStoreState extends FogState {
  toggleEnabled: () => void;
  setEnabled: (enabled: boolean) => void;
  setDefaultCovered: (covered: boolean) => void;
  addArea: (area: Omit<FogArea, 'id' | 'createdAt'>) => void;
  removeArea: (id: string) => void;
  coverAll: () => void;
  revealAll: () => void;
  clearAll: () => void;
  applyState: (state?: Partial<FogState> | null) => void;
}

function broadcastFog(state: FogState) {
  if (isPlayerMode()) return;
  if (socket.connected) {
    socket.emit('fog:update', {
      enabled: state.enabled,
      defaultCovered: state.defaultCovered,
      areas: state.areas,
    });
  }
}

export const useFogStore = create<FogStoreState>((set, get) => ({
  enabled: false,
  defaultCovered: false,
  areas: [],

  toggleEnabled: () => {
    if (isPlayerMode()) return;
    const next = !get().enabled;
    set({ enabled: next });
    triggerAutoSave();
    broadcastFog({
      enabled: next,
      defaultCovered: get().defaultCovered,
      areas: get().areas,
    });
  },

  setEnabled: (enabled: boolean) => {
    if (isPlayerMode()) return;
    set({ enabled });
    triggerAutoSave();
    broadcastFog({
      enabled,
      defaultCovered: get().defaultCovered,
      areas: get().areas,
    });
  },

  setDefaultCovered: (defaultCovered: boolean) => {
    if (isPlayerMode()) return;
    set({ defaultCovered });
    triggerAutoSave();
    broadcastFog({
      enabled: get().enabled,
      defaultCovered,
      areas: get().areas,
    });
  },

  addArea: (areaInput) => {
    if (isPlayerMode()) return;
    const newArea: FogArea = {
      ...areaInput,
      id: generateId(),
      createdAt: Date.now(),
    };
    const nextAreas = [...get().areas, newArea];
    set({ areas: nextAreas });
    triggerAutoSave();
    broadcastFog({
      enabled: get().enabled,
      defaultCovered: get().defaultCovered,
      areas: nextAreas,
    });
  },

  removeArea: (id: string) => {
    if (isPlayerMode()) return;
    const nextAreas = get().areas.filter((a) => a.id !== id);
    set({ areas: nextAreas });
    triggerAutoSave();
    broadcastFog({
      enabled: get().enabled,
      defaultCovered: get().defaultCovered,
      areas: nextAreas,
    });
  },

  coverAll: () => {
    if (isPlayerMode()) return;
    set({ enabled: true, defaultCovered: true, areas: [] });
    triggerAutoSave();
    broadcastFog({ enabled: true, defaultCovered: true, areas: [] });
  },

  revealAll: () => {
    if (isPlayerMode()) return;
    set({ enabled: false, defaultCovered: false, areas: [] });
    triggerAutoSave();
    broadcastFog({ enabled: false, defaultCovered: false, areas: [] });
  },

  clearAll: () => {
    if (isPlayerMode()) return;
    set({ areas: [] });
    triggerAutoSave();
    broadcastFog({
      enabled: get().enabled,
      defaultCovered: get().defaultCovered,
      areas: [],
    });
  },

  applyState: (state) => {
    if (!state) return;
    set({
      enabled: Boolean(state.enabled),
      defaultCovered: Boolean(state.defaultCovered),
      areas: state.areas || [],
    });
  },
}));
