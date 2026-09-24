import type { RoomState, Token } from '@sgm/shared';

export function handleTokenMove(
  state: RoomState,
  payload: { tokenId: string; x: number | null; y: number | null },
): RoomState {
  return {
    ...state,
    tokens: state.tokens.map((t) =>
      t.id === payload.tokenId ? { ...t, x: payload.x, y: payload.y } : t,
    ),
  };
}

export function handleTokenAdd(state: RoomState, token: Token): RoomState {
  return {
    ...state,
    tokens: [...state.tokens, token],
  };
}

export function handleTokenRemove(
  state: RoomState,
  tokenId: string,
): RoomState {
  return {
    ...state,
    tokens: state.tokens.filter((t) => t.id !== tokenId),
  };
}
