import { create } from 'zustand';
import type { Zone, Marker, BgImage, ActiveTool } from '@/types/game';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { socket } from '@/lib/socket';

interface ZoneState {
  zones: Record<string, Zone>;
  markers: Record<string, Marker>;
  bgImages: BgImage[];
  selectedZoneId: string | null;
  editingZone: boolean;
  editingMarkers: boolean;
  activeTool: ActiveTool;
  selectedNodeIds: string[];

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

  // Local actions (emitem pro Socket se conectado)
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

  // Remote actions (recebidas via WebSocket sem re-emitir)
  addZoneFromRemote: (zone: Zone) => void;
  updateZoneFromRemote: (id: string, updates: Partial<Zone>) => void;
  removeZoneFromRemote: (id: string) => void;

  addMarkerFromRemote: (marker: Marker) => void;
  updateMarkerFromRemote: (id: string, updates: Partial<Marker>) => void;
  removeMarkerFromRemote: (id: string) => void;

  addBgImageFromRemote: (bg: BgImage) => void;
  updateBgImageFromRemote: (id: string, updates: Partial<BgImage>) => void;
  removeBgImageFromRemote: (id: string) => void;

  setSelectedZoneId: (id: string | null) => void;
  setEditingZone: (isEditing: boolean) => void;
  setEditingMarkers: (isEditing: boolean) => void;
  setActiveTool: (tool: ActiveTool) => void;
  setSelectedNodeIds: (ids: string[]) => void;

  selectZone: (id: string) => void;
  openZoneSidebar: (id: string) => void;
  updateZoneTransform: (id: string, updates: Partial<Zone>) => void;
}

export const useZoneStore = create<ZoneState>((set) => ({
  zones: {},
  markers: {},
  bgImages: [],
  selectedZoneId: null,
  editingZone: false,
  editingMarkers: false,
  activeTool: 'pan',
  selectedNodeIds: [],
  leftSidebarOpen: false,
  rightSidebarOpen: false,
  leftSidebarWidth: 420,
  rightSidebarWidth: 360,

  setLeftSidebarOpen: (open) => set({ leftSidebarOpen: open }),
  setRightSidebarOpen: (open) => set({ rightSidebarOpen: open }),
  setLeftSidebarWidth: (width) => set({ leftSidebarWidth: width }),
  setRightSidebarWidth: (width) => set({ rightSidebarWidth: width }),
  toggleLeftSidebar: () =>
    set((state) => ({ leftSidebarOpen: !state.leftSidebarOpen })),
  toggleRightSidebar: () =>
    set((state) => ({ rightSidebarOpen: !state.rightSidebarOpen })),

  // --- Local Zone Actions ---
  addZone: (zone) => {
    set((state) => ({ zones: { ...state.zones, [zone.id]: zone } }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('zone:add', { zone });
    }
  },

  updateZone: (id, updates) => {
    set((state) => ({
      zones: {
        ...state.zones,
        [id]: { ...state.zones[id], ...updates },
      },
    }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('zone:update', { zoneId: id, updates });
    }
  },

  updateZoneData: (id, dataUpdates) => {
    set((state) => {
      const zone = state.zones[id];
      if (!zone) return state;
      const updatedZone = { ...zone, data: { ...zone.data, ...dataUpdates } };
      if (socket.connected) {
        socket.emit('zone:update', {
          zoneId: id,
          updates: { data: updatedZone.data },
        });
      }
      return {
        zones: {
          ...state.zones,
          [id]: updatedZone,
        },
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
        selectedZoneId:
          state.selectedZoneId === id ? null : state.selectedZoneId,
      };
    });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('zone:remove', { zoneId: id });
    }
  },

  // --- Local Marker Actions ---
  addMarker: (marker) => {
    set((state) => ({
      markers: { ...state.markers, [marker.id]: marker },
    }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('marker:add', { marker });
    }
  },

  updateMarker: (id, updates) => {
    set((state) => ({
      markers: {
        ...state.markers,
        [id]: { ...state.markers[id], ...updates },
      },
    }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('marker:update', { markerId: id, updates });
    }
  },

  removeMarker: (id) => {
    set((state) => {
      const newMarkers = { ...state.markers };
      delete newMarkers[id];
      return { markers: newMarkers };
    });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('marker:remove', { markerId: id });
    }
  },

  // --- Local Background Image Actions ---
  addBgImage: (bg) => {
    set((state) => ({
      bgImages: [...state.bgImages, bg],
    }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('bg:add', { bg });
    }
  },

  updateBgImage: (id, updates) => {
    set((state) => ({
      bgImages: state.bgImages.map((bg) =>
        bg.id === id ? { ...bg, ...updates } : bg,
      ),
    }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('bg:update', { bgId: id, updates });
    }
  },

  removeBgImage: (id) => {
    set((state) => ({
      bgImages: state.bgImages.filter((bg) => bg.id !== id),
    }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('bg:remove', { bgId: id });
    }
  },

  // --- Remote Actions (from WebSocket) ---
  addZoneFromRemote: (zone) => {
    set((state) => ({
      zones: { ...state.zones, [zone.id]: zone },
    }));
  },

  updateZoneFromRemote: (id, updates) => {
    set((state) => ({
      zones: {
        ...state.zones,
        [id]: { ...state.zones[id], ...updates },
      },
    }));
  },

  removeZoneFromRemote: (id) => {
    set((state) => {
      const newZones = { ...state.zones };
      delete newZones[id];
      return {
        zones: newZones,
        selectedZoneId:
          state.selectedZoneId === id ? null : state.selectedZoneId,
      };
    });
  },

  addMarkerFromRemote: (marker) => {
    set((state) => ({
      markers: { ...state.markers, [marker.id]: marker },
    }));
  },

  updateMarkerFromRemote: (id, updates) => {
    set((state) => ({
      markers: {
        ...state.markers,
        [id]: { ...state.markers[id], ...updates },
      },
    }));
  },

  removeMarkerFromRemote: (id) => {
    set((state) => {
      const newMarkers = { ...state.markers };
      delete newMarkers[id];
      return { markers: newMarkers };
    });
  },

  addBgImageFromRemote: (bg) => {
    set((state) => {
      if (state.bgImages.some((b) => b.id === bg.id)) return state;
      return { bgImages: [...state.bgImages, bg] };
    });
  },

  updateBgImageFromRemote: (id, updates) => {
    set((state) => ({
      bgImages: state.bgImages.map((bg) =>
        bg.id === id ? { ...bg, ...updates } : bg,
      ),
    }));
  },

  removeBgImageFromRemote: (id) => {
    set((state) => ({
      bgImages: state.bgImages.filter((bg) => bg.id !== id),
    }));
  },

  setSelectedZoneId: (selectedZoneId) => set({ selectedZoneId }),
  setEditingZone: (editingZone) => set({ editingZone }),
  setEditingMarkers: (isEditing) => set({ editingMarkers: isEditing }),
  setActiveTool: (activeTool) => set({ activeTool }),
  setSelectedNodeIds: (ids) => set({ selectedNodeIds: ids }),

  selectZone: (id) => set({ selectedZoneId: id }),

  openZoneSidebar: (id) =>
    set({
      selectedZoneId: id,
      leftSidebarOpen: true,
    }),

  updateZoneTransform: (id, updates) => {
    set((state) => {
      const zone = state.zones[id];
      if (!zone) return state;
      return {
        zones: {
          ...state.zones,
          [id]: { ...zone, ...updates },
        },
      };
    });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('zone:update', { zoneId: id, updates });
    }
  },
}));
