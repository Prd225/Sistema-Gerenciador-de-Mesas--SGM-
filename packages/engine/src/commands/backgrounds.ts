import type { RoomState, BgImage } from '@sgm/shared';

export function handleBgAdd(state: RoomState, bg: BgImage): RoomState {
  return {
    ...state,
    bgImages: [...state.bgImages, bg],
  };
}

export function handleBgRemove(state: RoomState, bgId: string): RoomState {
  return {
    ...state,
    bgImages: state.bgImages.filter((bg) => bg.id !== bgId),
  };
}
