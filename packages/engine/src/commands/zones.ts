import type { RoomState, Zone } from '@sgm/shared';

export function handleZoneAdd(state: RoomState, zone: Zone): RoomState {
  return {
    ...state,
    zones: {
      ...state.zones,
      [zone.id]: zone,
    },
  };
}

export function handleZoneRemove(state: RoomState, zoneId: string): RoomState {
  const nextZones = { ...state.zones };
  delete nextZones[zoneId];
  return {
    ...state,
    zones: nextZones,
  };
}
