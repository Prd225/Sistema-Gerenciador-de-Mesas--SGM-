import { create } from 'zustand';
import type { Token, InitiativeItem, InitiativeSortMode } from '@/types/game';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { socket } from '@/lib/socket';

interface TokenState {
  tokens: Token[];
  initiativeQueue: InitiativeItem[];
  initiativeSortMode: InitiativeSortMode;
  activeCtxTokenId: string | null; // token being right-clicked or context-menued
  editingTokenId: string | null; // token whose sheet is open
  showTokenCreateModal: boolean;
  tokenContextMenu: { id: string; x: number; y: number } | null;

  // Ações Locais (disparam Socket se conectado)
  addToken: (token: Token) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  removeToken: (id: string) => void;

  setInitiativeQueue: (queue: InitiativeItem[]) => void;
  setInitiativeSortMode: (mode: InitiativeSortMode) => void;
  clearInitiative: () => void;

  // Ações Remotas (recebidas do WebSocket sem re-emitir)
  addTokenFromRemote: (token: Token) => void;
  updateTokenFromRemote: (id: string, updates: Partial<Token>) => void;
  removeTokenFromRemote: (id: string) => void;
  setInitiativeQueueFromRemote: (queue: InitiativeItem[]) => void;

  setActiveCtxTokenId: (id: string | null) => void;
  setEditingTokenId: (id: string | null) => void;
  setShowTokenCreateModal: (show: boolean) => void;
  setTokenContextMenu: (
    menu: { id: string; x: number; y: number } | null,
  ) => void;

  getTokenById: (id: string) => Token | undefined;
}

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: [],
  initiativeQueue: [],
  initiativeSortMode: 'descending',
  activeCtxTokenId: null,
  editingTokenId: null,
  showTokenCreateModal: false,
  tokenContextMenu: null,

  // --- Ações Locais ---
  addToken: (token) => {
    set((state) => ({ tokens: [...state.tokens, token] }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('token:add', { token });
    }
  },

  updateToken: (id, updates) => {
    set((state) => ({
      tokens: state.tokens.map((token) =>
        token.id === id ? { ...token, ...updates } : token,
      ),
    }));
    triggerAutoSave();
    if (socket.connected) {
      if (updates.x !== undefined && updates.y !== undefined) {
        socket.emit('token:move', { tokenId: id, x: updates.x, y: updates.y });
      } else {
        socket.emit('token:update', { tokenId: id, updates });
      }
    }
  },

  removeToken: (id) => {
    set((state) => ({
      tokens: state.tokens.filter((token) => token.id !== id),
      initiativeQueue: state.initiativeQueue.filter(
        (item) => item.tokenId !== id,
      ),
    }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('token:remove', { tokenId: id });
    }
  },

  setInitiativeQueue: (initiativeQueue) => {
    set({ initiativeQueue });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('initiative:update', { queue: initiativeQueue });
    }
  },

  setInitiativeSortMode: (mode) => {
    set({ initiativeSortMode: mode });
    triggerAutoSave();
  },

  clearInitiative: () => {
    set({ initiativeQueue: [] });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('initiative:update', { queue: [] });
    }
  },

  // --- Ações Remotas (sem re-emitir) ---
  addTokenFromRemote: (token) => {
    set((state) => {
      if (state.tokens.find((t) => t.id === token.id)) return state;
      return { tokens: [...state.tokens, token] };
    });
  },

  updateTokenFromRemote: (id, updates) => {
    set((state) => ({
      tokens: state.tokens.map((token) =>
        token.id === id ? { ...token, ...updates } : token,
      ),
    }));
  },

  removeTokenFromRemote: (id) => {
    set((state) => ({
      tokens: state.tokens.filter((token) => token.id !== id),
      initiativeQueue: state.initiativeQueue.filter(
        (item) => item.tokenId !== id,
      ),
    }));
  },

  setInitiativeQueueFromRemote: (initiativeQueue) => {
    set({ initiativeQueue });
  },

  setActiveCtxTokenId: (activeCtxTokenId) => set({ activeCtxTokenId }),
  setEditingTokenId: (editingTokenId) => set({ editingTokenId }),
  setShowTokenCreateModal: (showTokenCreateModal) =>
    set({ showTokenCreateModal }),
  setTokenContextMenu: (tokenContextMenu) => set({ tokenContextMenu }),

  getTokenById: (id) => get().tokens.find((t) => t.id === id),
}));
