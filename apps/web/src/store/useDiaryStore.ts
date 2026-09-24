import { create } from 'zustand';
import type { DiaryEntry, DiaryPoint } from '@/types/diary';
import { triggerAutoSave } from '@/lib/saveHelpers';

export interface DiaryState {
  entries: DiaryEntry[];

  addEntry: (entry: DiaryEntry) => void;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => void;
  removeEntry: (id: string) => void;

  addPoint: (entryId: string, point: DiaryPoint) => void;
  updatePoint: (
    entryId: string,
    pointId: string,
    updates: Partial<DiaryPoint>,
  ) => void;
  removePoint: (entryId: string, pointId: string) => void;
}

export const useDiaryStore = create<DiaryState>((set) => ({
  entries: [],

  addEntry: (entry) => {
    set((state) => ({ entries: [...state.entries, entry] }));
    triggerAutoSave();
  },

  updateEntry: (id, updates) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id ? { ...e, ...updates } : e,
      ),
    }));
    triggerAutoSave();
  },

  removeEntry: (id) => {
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    }));
    triggerAutoSave();
  },

  addPoint: (entryId, point) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId ? { ...e, points: [...e.points, point] } : e,
      ),
    }));
    triggerAutoSave();
  },

  updatePoint: (entryId, pointId, updates) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? {
              ...e,
              points: e.points.map((p) =>
                p.id === pointId ? { ...p, ...updates } : p,
              ),
            }
          : e,
      ),
    }));
    triggerAutoSave();
  },

  removePoint: (entryId, pointId) => {
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === entryId
          ? { ...e, points: e.points.filter((p) => p.id !== pointId) }
          : e,
      ),
    }));
    triggerAutoSave();
  },
}));
