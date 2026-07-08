import { create } from 'zustand';
import { triggerAutoSave } from '@/lib/saveHelpers';
import type { RoulettePage, RouletteData } from '@/types/roulettes';
import { generateId } from '@/lib/uuid';

interface RoulettesState {
  pages: RoulettePage[];
  addPage: (name: string) => void;
  renamePage: (id: string, newName: string) => void;
  removePage: (id: string) => void;
  
  addRoulette: (pageId: string, title?: string, color?: string) => void;
  updateRoulette: (pageId: string, rouletteId: string, updates: Partial<RouletteData>) => void;
  removeRoulette: (pageId: string, rouletteId: string) => void;
}

export const useRoulettesStore = create<RoulettesState>((set) => ({
  pages: [
    {
      id: generateId(),
      name: 'Roletas',
      roulettes: []
    }
  ],

  addPage: (name) => set((state) => {
    const newState = {
      pages: [...state.pages, { id: generateId(), name, roulettes: [] }]
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  renamePage: (id, newName) => set((state) => {
    const newState = {
      pages: state.pages.map(p => p.id === id ? { ...p, name: newName } : p)
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  removePage: (id) => set((state) => {
    const newPages = state.pages.filter(p => p.id !== id);
    if (newPages.length === 0) {
      newPages.push({ id: generateId(), name: 'Roletas', roulettes: [] });
    }
    const newState = { pages: newPages };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  addRoulette: (pageId, title = '', color) => set((state) => {
    const newRoulette: RouletteData = {
      id: generateId(),
      title,
      color,
      updatedAt: Date.now(),
      options: [
        { id: generateId(), text: 'Opção 1', weight: 1, color: '#8257e5' },
        { id: generateId(), text: 'Opção 2', weight: 1, color: '#04d361' }
      ],
    };

    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return { ...p, roulettes: [newRoulette, ...p.roulettes] };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  updateRoulette: (pageId, rouletteId, updates) => set((state) => {
    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return {
            ...p,
            roulettes: p.roulettes.map(r => 
              r.id === rouletteId ? { ...r, ...updates, updatedAt: Date.now() } : r
            )
          };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  removeRoulette: (pageId, rouletteId) => set((state) => {
    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return { ...p, roulettes: p.roulettes.filter(r => r.id !== rouletteId) };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  })
}));
