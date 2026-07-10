import { create } from 'zustand';
import { generateId } from '@/lib/uuid';
import { triggerAutoSave } from '@/lib/saveHelpers';
import type { SoundpadPage, Playlist, Song } from '@/types/soundpad';

interface SoundpadState {
  pages: SoundpadPage[];
  activePlaylistId: string | null;
  activeSongId: string | null;
  isPlaying: boolean;
  progress: number; // 0 to 100 percentage
  isLooping: boolean;

  // Pages
  addPage: (name: string) => void;
  renamePage: (id: string, newName: string) => void;
  removePage: (id: string) => void;

  // Playlists
  addPlaylist: (pageId: string, name: string) => void;
  updatePlaylist: (pageId: string, playlistId: string, updates: Partial<Playlist>) => void;
  removePlaylist: (pageId: string, playlistId: string) => void;
  reorderPlaylists: (pageId: string, startIndex: number, endIndex: number) => void;

  // Player controls
  setActivePlaylist: (id: string | null) => void;
  setActiveSong: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  toggleLoop: () => void;
}

export const useSoundpadStore = create<SoundpadState>((set) => ({
  pages: [
    {
      id: generateId(),
      name: 'Músicas',
      playlists: []
    }
  ],
  activePlaylistId: null,
  activeSongId: null,
  isPlaying: false,
  progress: 0,
  isLooping: false,

  addPage: (name) => set((state) => {
    const newState = {
      pages: [...state.pages, { id: generateId(), name, playlists: [] }]
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
      newPages.push({ id: generateId(), name: 'Músicas', playlists: [] });
    }
    const newState = { pages: newPages };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  addPlaylist: (pageId, name) => set((state) => {
    const newPlaylist: Playlist = {
      id: generateId(),
      name,
      tags: [],
      songs: [],
      updatedAt: Date.now()
    };

    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return { ...p, playlists: [...p.playlists, newPlaylist] };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  updatePlaylist: (pageId, playlistId, updates) => set((state) => {
    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return {
            ...p,
            playlists: p.playlists.map(pl => 
              pl.id === playlistId ? { ...pl, ...updates, updatedAt: Date.now() } : pl
            )
          };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  removePlaylist: (pageId, playlistId) => set((state) => {
    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          return { ...p, playlists: p.playlists.filter(pl => pl.id !== playlistId) };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  reorderPlaylists: (pageId, startIndex, endIndex) => set((state) => {
    const newState = {
      pages: state.pages.map(p => {
        if (p.id === pageId) {
          const result = Array.from(p.playlists);
          const [removed] = result.splice(startIndex, 1);
          result.splice(endIndex, 0, removed);
          return { ...p, playlists: result };
        }
        return p;
      })
    };
    setTimeout(() => triggerAutoSave(), 0);
    return newState;
  }),

  setActivePlaylist: (id) => set({ activePlaylistId: id }),
  setActiveSong: (id) => set({ activeSongId: id }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
  toggleLoop: () => set(state => ({ isLooping: !state.isLooping }))
}));
