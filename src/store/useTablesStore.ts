import { create } from 'zustand';
import { triggerAutoSave } from '@/lib/saveHelpers';
import type { TablePage, TableData } from '@/types/tables';
import { generateId } from '@/lib/uuid';

interface TablesState {
  pages: TablePage[];
  addPage: (name: string) => void;
  renamePage: (id: string, newName: string) => void;
  removePage: (id: string) => void;
  
  addTable: (pageId: string, title?: string, color?: string) => void;
  updateTable: (pageId: string, tableId: string, updates: Partial<TableData>) => void;
  removeTable: (pageId: string, tableId: string) => void;
}

export const useTablesStore = create<TablesState>((set) => ({
  pages: [
    {
      id: generateId(),
      name: 'Tabelas',
      tables: []
    }
  ],

  addPage: (name) => set((state) => {
    const newState = {
      pages: [...state.pages, { id: generateId(), name, tables: [] }]
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
      newPages.push({ id: generateId(), name: 'Tabelas', tables: [] });
    }
    const newState = { pages: newPages };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  addTable: (pageId, title = '', color) => set((state) => {
    const newTable: TableData = {
      id: generateId(),
      title,
      color,
      updatedAt: Date.now(),
      data: [['', ''], ['', '']], // Default 2x2 grid
    };

    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return { ...p, tables: [newTable, ...p.tables] };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  updateTable: (pageId, tableId, updates) => set((state) => {
    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return {
            ...p,
            tables: p.tables.map(t => 
              t.id === tableId ? { ...t, ...updates, updatedAt: Date.now() } : t
            )
          };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  removeTable: (pageId, tableId) => set((state) => {
    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return { ...p, tables: p.tables.filter(t => t.id !== tableId) };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  })
}));
