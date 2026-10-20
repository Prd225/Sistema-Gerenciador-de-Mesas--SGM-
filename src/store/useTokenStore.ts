import { create } from 'zustand';
import type { Token, InitiativeItem, InitiativeSortMode } from '@/types/game';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { socket } from '@/lib/socket';
import { isPlayerMode } from '@/lib/roomRole';

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
  setInitiativeQueueFromRemote: (
    queue: InitiativeItem[],
    sortMode?: InitiativeSortMode,
  ) => void;

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
  // No modo jogador, toda alteração abaixo é ignorada, exceto mover um token que
  // já está no mapa. O servidor também confere o papel; isto evita que a tela
  // do jogador fique diferente da mesa por uma ação que será recusada.
  addToken: (token) => {
    if (isPlayerMode()) return;
    set((state) => ({ tokens: [...state.tokens, token] }));
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('token:add', { token });
    }
  },

  updateToken: (id, updates) => {
    if (isPlayerMode()) {
      const { x, y, ...others } = updates;
      const token = get().tokens.find((t) => t.id === id);
      const isPureMove =
        Object.keys(others).length === 0 &&
        typeof x === 'number' &&
        typeof y === 'number';
      if (!token || token.x === null || token.y === null || !isPureMove) {
        return;
      }
      set((state) => ({
        tokens: state.tokens.map((t) => (t.id === id ? { ...t, x, y } : t)),
      }));
      if (socket.connected) {
        socket.emit('token:move', { tokenId: id, x, y });
      }
      return;
    }

    set((state) => ({
      tokens: state.tokens.map((token) =>
        token.id === id ? { ...token, ...updates } : token,
      ),
    }));
    triggerAutoSave();
    if (socket.connected) {
      const keys = Object.keys(updates);
      const isPureMove =
        keys.length > 0 &&
        keys.every((k) => k === 'x' || k === 'y') &&
        (updates.x !== undefined || updates.y !== undefined);

      if (isPureMove) {
        socket.emit('token:move', {
          tokenId: id,
          x: updates.x ?? null,
          y: updates.y ?? null,
        });
      } else {
        socket.emit('token:update', { tokenId: id, updates });
      }
    }
  },

  removeToken: (id) => {
    if (isPlayerMode()) return;
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
    if (isPlayerMode()) return;
    set({ initiativeQueue });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('initiative:update', {
        queue: initiativeQueue,
        sortMode: get().initiativeSortMode,
      });
    }
  },

  setInitiativeSortMode: (mode) => {
    if (isPlayerMode()) return;
    set({ initiativeSortMode: mode });
    triggerAutoSave();
    // O modo muda como a fila é exibida (valor x posição); repassa junto da fila.
    if (socket.connected) {
      socket.emit('initiative:update', {
        queue: get().initiativeQueue,
        sortMode: mode,
      });
    }
  },

  clearInitiative: () => {
    if (isPlayerMode()) return;
    set({ initiativeQueue: [] });
    triggerAutoSave();
    if (socket.connected) {
      socket.emit('initiative:update', {
        queue: [],
        sortMode: get().initiativeSortMode,
      });
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

  setInitiativeQueueFromRemote: (initiativeQueue, sortMode) => {
    set(sortMode ? { initiativeQueue, initiativeSortMode: sortMode } : { initiativeQueue });
  },

  setActiveCtxTokenId: (activeCtxTokenId) => set({ activeCtxTokenId }),
  setEditingTokenId: (editingTokenId) => set({ editingTokenId }),
  setShowTokenCreateModal: (showTokenCreateModal) =>
    set({ showTokenCreateModal }),
  setTokenContextMenu: (tokenContextMenu) => set({ tokenContextMenu }),

  getTokenById: (id) => get().tokens.find((t) => t.id === id),
}));
