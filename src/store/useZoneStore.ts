import { create } from 'zustand';
import { Zone, Marker } from '@/types/game';

interface ZoneState {
  zones: Record<string, Zone>;
  markers: Record<string, Marker>;
  selectedZoneId: string | null;
  editingZone: boolean;
  editingMarkers: boolean;
  
  addZone: (zone: Zone) => void;
  updateZone: (id: string, updates: Partial<Zone>) => void;
  removeZone: (id: string) => void;
  
  addMarker: (marker: Marker) => void;
  updateMarker: (id: string, updates: Partial<Marker>) => void;
  removeMarker: (id: string) => void;
  
  setSelectedZoneId: (id: string | null) => void;
  setEditingZone: (isEditing: boolean) => void;
  setEditingMarkers: (isEditing: boolean) => void;
}

export const useZoneStore = create<ZoneState>((set) => ({
  zones: {},
  markers: {},
  selectedZoneId: null,
  editingZone: false,
  editingMarkers: false,
  
  addZone: (zone) => set((state) => ({
    zones: { ...state.zones, [zone.id]: zone }
  })),
  
  updateZone: (id, updates) => set((state) => ({
    zones: {
      ...state.zones,
      [id]: { ...state.zones[id], ...updates }
    }
  })),
  
  removeZone: (id) => set((state) => {
    const newZones = { ...state.zones };
    delete newZones[id];
    return { 
      zones: newZones,
      selectedZoneId: state.selectedZoneId === id ? null : state.selectedZoneId
    };
  }),
  
  addMarker: (marker) => set((state) => ({
    markers: { ...state.markers, [marker.id]: marker }
  })),
  
  updateMarker: (id, updates) => set((state) => ({
    markers: {
      ...state.markers,
      [id]: { ...state.markers[id], ...updates }
    }
  })),
  
  removeMarker: (id) => set((state) => {
    const newMarkers = { ...state.markers };
    delete newMarkers[id];
    return { markers: newMarkers };
  }),
  
  setSelectedZoneId: (selectedZoneId) => set({ selectedZoneId }),
  setEditingZone: (editingZone) => set({ editingZone }),
  setEditingMarkers: (editingMarkers) => set({ editingMarkers }),
}));
