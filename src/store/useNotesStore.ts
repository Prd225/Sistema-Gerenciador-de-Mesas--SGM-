import { create } from 'zustand';
import type { NotePage, Note } from '@/types/notes';
import { triggerAutoSave } from '@/lib/saveHelpers';
import { generateId } from '@/lib/uuid';

interface NotesState {
  pages: NotePage[];
  
  // Page actions
  addPage: (name: string) => void;
  removePage: (pageId: string) => void;
  renamePage: (pageId: string, newName: string) => void;
  
  // Note actions
  addNote: (pageId: string) => string;
  updateNote: (pageId: string, noteId: string, updates: Partial<Note>) => void;
  removeNote: (pageId: string, noteId: string) => void;
}

export const useNotesStore = create<NotesState>()((set) => ({
  pages: [
    {
      id: generateId(),
      name: 'Página Inicial',
      notes: []
    }
  ],

  addPage: (name) => {
    set((state) => ({
      pages: [...state.pages, { id: generateId(), name, notes: [] }]
    }));
    triggerAutoSave();
  },

  removePage: (pageId) => {
    set((state) => ({
      pages: state.pages.filter(p => p.id !== pageId)
    }));
    triggerAutoSave();
  },

  renamePage: (pageId, newName) => {
    set((state) => ({
      pages: state.pages.map(p => 
        p.id === pageId ? { ...p, name: newName } : p
      )
    }));
    triggerAutoSave();
  },

  addNote: (pageId) => {
    const newNoteId = generateId();
    set((state) => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        const newNote: Note = {
          id: newNoteId,
          title: 'Nova Anotação',
          content: '',
          color: '#8257e5',
          updatedAt: Date.now(),
        };
        return { ...p, notes: [...p.notes, newNote] };
      })
    }));
    triggerAutoSave();
    return newNoteId;
  },

  updateNote: (pageId, noteId, updates) => {
    set((state) => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          notes: p.notes.map(n => n.id === noteId ? { ...n, ...updates, updatedAt: Date.now() } : n)
        };
      })
    }));
    triggerAutoSave();
  },

  removeNote: (pageId, noteId) => {
    set((state) => ({
      pages: state.pages.map(p => {
        if (p.id !== pageId) return p;
        return {
          ...p,
          notes: p.notes.filter(n => n.id !== noteId)
        };
      })
    }));
    triggerAutoSave();
  }
}));
