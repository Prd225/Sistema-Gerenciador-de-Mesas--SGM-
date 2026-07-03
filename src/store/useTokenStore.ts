import { create } from 'zustand';
import { Token, InitiativeItem } from '@/types/game';

interface TokenState {
  tokens: Token[];
  initiativeQueue: InitiativeItem[];
  activeInitiativeId: string | null;
  
  addToken: (token: Token) => void;
  updateToken: (id: string, updates: Partial<Token>) => void;
  removeToken: (id: string) => void;
  
  setInitiativeQueue: (queue: InitiativeItem[]) => void;
  clearInitiative: () => void;
  setActiveInitiativeId: (id: string | null) => void;
  
  // Helper derived getters can be added as regular functions
  getTokenById: (id: string) => Token | undefined;
}

export const useTokenStore = create<TokenState>((set, get) => ({
  tokens: [],
  initiativeQueue: [],
  activeInitiativeId: null,
  
  addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
  
  updateToken: (id, updates) => set((state) => ({
    tokens: state.tokens.map(token => 
      token.id === id ? { ...token, ...updates } : token
    )
  })),
  
  removeToken: (id) => set((state) => ({
    tokens: state.tokens.filter(token => token.id !== id),
    initiativeQueue: state.initiativeQueue.filter(item => item.tokenId !== id),
    activeInitiativeId: state.activeInitiativeId === id ? null : state.activeInitiativeId
  })),
  
  setInitiativeQueue: (initiativeQueue) => set({ initiativeQueue }),
  
  clearInitiative: () => set({ initiativeQueue: [], activeInitiativeId: null }),
  
  setActiveInitiativeId: (activeInitiativeId) => set({ activeInitiativeId }),
  
  getTokenById: (id) => get().tokens.find(t => t.id === id),
}));
