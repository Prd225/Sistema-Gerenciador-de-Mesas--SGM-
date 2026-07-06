import { create } from 'zustand';
import type { Zone, Marker, BgImage, ActiveTool } from '@/types/game';
import { triggerAutoSave } from '@/lib/saveHelpers';

interface ZoneState {
  zones: Record<string, Zone>;
  markers: Record<string, Marker>;
  bgImages: BgImage[];
  selectedZoneId: string | null;
  editingZone: boolean;
  editingMarkers: boolean;
  activeTool: ActiveTool;

  // Sidebar control (centralized so canvas can open them)
  leftSidebarOpen: boolean;
  rightSidebarOpen: boolean;
  leftSidebarWidth: number;
  rightSidebarWidth: number;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  setLeftSidebarWidth: (width: number) => void;
  setRightSidebarWidth: (width: number) => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;

  addZone: (zone: Zone) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  updateZoneData: (id: string, updates: Partial<Zone['data']>) => void;
  removeZone: (id: string) => void;

  addMarker: (marker: Marker) => void;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  removeMarker: (id: string) => void;

  addBgImage: (bg: BgImage) => void;
  updateBgImage: (id: string, updates: Partial<BgImage>) => void;
  removeBgImage: (id: string) => void;

  setSelectedZoneId: (id: string | null) => void;
  setEditingZone: (isEditing: boolean) => void;
  setEditingMarkers: (isEditing: boolean) => void;
  setActiveTool: (tool: ActiveTool) => void;

  // Select zone and open sidebar (matching original selectZone behavior)
  selectZone: (id: string) => void;
}

export const useZoneStore = create<ZoneState>((set) => ({
  zones: {},
  markers: {},
  bgImages: [],
  selectedZoneId: null,
  editingZone: false,
  editingMarkers: false,
  activeTool: 'pan',
  leftSidebarOpen: false,
  rightSidebarOpen: false,
  leftSidebarWidth: 320,
  rightSidebarWidth: 320,

  setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
  setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
  setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
  setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
  toggleLeftSidebar: () => set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () => set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

  addZone: (zone) => {
    set((state) => ({ zones: { ...state.zones, [zone.id]: zone } }));
    triggerAutoSave();
  },

  updateZone: (id, updates) => {
    set((state) => ({
      zones: {
        ...state.zones,
        [id]: { ...state.zones[id], ...updates }
      }
    }));
    triggerAutoSave();
  },

  updateZoneData: (id, dataUpdates) => {
    set((state) => {
      const zone = state.zones[id];
      if (!zone) return state;
      return {
        zones: {
          ...state.zones,
          [id]: { ...zone, data: { ...zone.data, ...dataUpdates } }
        }
      };
    });
    triggerAutoSave();
  },

  removeZone: (id) => {
    set((state) => {
      const newZones = { ...state.zones };
      delete newZones[id];
      return {
        zones: newZones,
        selectedZoneId: state.selectedZoneId === id ? null : state.selectedZoneId
      };
    });
    triggerAutoSave();
  },

  addMarker: (marker) => {
    set((state) => ({
      markers: { ...state.markers, [marker.id]: marker }
    }));
    triggerAutoSave();
  },

  updateMarker: (id, updates) => {
    set((state) => ({
      markers: {
        ...state.markers,
        [id]: { ...state.markers[id], ...updates }
      }
    }));
    triggerAutoSave();
  },

  removeMarker: (id) => {
    set((state) => {
      const newMarkers = { ...state.markers };
      delete newMarkers[id];
      return { markers: newMarkers };
    });
    triggerAutoSave();
  },

  addBgImage: (bg) => {
    set((state) => ({
      bgImages: [...state.bgImages, bg]
    }));
    triggerAutoSave();
  },

  updateBgImage: (id, updates) => {
    set((state) => ({
      bgImages: state.bgImages.map(bg => bg.id === id ? { ...bg, ...updates } : bg)
    }));
    triggerAutoSave();
  },

  removeBgImage: (id) => {
    set((state) => ({
      bgImages: state.bgImages.filter(bg => bg.id !== id)
    }));
    triggerAutoSave();
  },

  setSelectedZoneId: (selectedZoneId) => set({ selectedZoneId }),
  setEditingZone: (editingZone) => set({ editingZone }),
  setEditingMarkers: (editingMarkers) => set({ editingMarkers }),
  setActiveTool: (activeTool) => set({ activeTool }),

  // Select zone AND open left sidebar (matching original `mapSystem.selectZone`)
  selectZone: (id) => set({
    selectedZoneId: id,
    leftSidebarOpen: true,
  }),
}));
