import { create } from 'zustand';
import type { Token, InitiativeItem } from '@/types/game';
import { triggerAutoSave } from '@/lib/saveHelpers';

interface TokenState {
  tokens: Token[];
  initiativeQueue: InitiativeItem[];
  activeCtxTokenId: string | null; // token being right-clicked or context-menued
  editingTokenId: string | null; // token whose sheet is open
  showTokenCreateModal: boolean;
  tokenContextMenu: { id: string; x: number; y: number } | null;

  addToken: (token: Token) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  removeToken: (id: string) => void;

  setInitiativeQueue: (queue: InitiativeItem[]) => void;
  clearInitiative: () => void;

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
  activeCtxTokenId: null,
  editingTokenId: null,
  showTokenCreateModal: false,
  tokenContextMenu: null,

  addToken: (token) => {
    set((state) => ({ tokens: [...state.tokens, token] }));
    triggerAutoSave();
  },

  updateToken: (id, updates) => {
    set((state) => ({
      tokens: state.tokens.map((token) =>
        token.id === id ? { ...token, ...updates } : token,
      ),
    }));
    triggerAutoSave();
  },

  removeToken: (id) => {
    set((state) => ({
      tokens: state.tokens.filter((token) => token.id !== id),
      initiativeQueue: state.initiativeQueue.filter(
        (item) => item.tokenId !== id,
      ),
    }));
    triggerAutoSave();
  },

  setInitiativeQueue: (initiativeQueue) => {
    set({ initiativeQueue });
    triggerAutoSave();
  },

  clearInitiative: () => {
    set({ initiativeQueue: [] });
    triggerAutoSave();
  },

  setActiveCtxTokenId: (activeCtxTokenId) => set({ activeCtxTokenId }),
  setEditingTokenId: (editingTokenId) => set({ editingTokenId }),
  setShowTokenCreateModal: (showTokenCreateModal) =>
    set({ showTokenCreateModal }),
  setTokenContextMenu: (tokenContextMenu) => set({ tokenContextMenu }),

  getTokenById: (id) => get().tokens.find((t) => t.id === id),
}));
