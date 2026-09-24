import type { RoomState, Marker } from '@sgm/shared';

export function handleMarkerAdd(state: RoomState, marker: Marker): RoomState {
  return {
    ...state,
    markers: {
      ...state.markers,
      [marker.id]: marker,
    },
  };
}

export function handleMarkerRemove(
  state: RoomState,
  markerId: string,
): RoomState {
  const nextMarkers = { ...state.markers };
  delete nextMarkers[markerId];
  return {
    ...state,
    markers: nextMarkers,
  };
}
