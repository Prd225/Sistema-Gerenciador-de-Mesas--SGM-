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
  spotifyDeviceId: string | null;

  // Pages
  addPage: (name: string) => void;
  renamePage: (id: string, newName: string) => void;
  removePage: (id: string) => void;

  // Playlists
  addPlaylist: (pageId: string, name: string) => void;
  updatePlaylist: (
    pageId: string,
    playlistId: string,
    updates: Partial<Playlist>,
  ) => void;
  removePlaylist: (pageId: string, playlistId: string) => void;
  reorderPlaylists: (
    pageId: string,
    startIndex: number,
    endIndex: number,
  ) => void;
  addSongToPlaylist: (
    pageId: string,
    playlistId: string,
    songData: Omit<Song, 'id'>,
  ) => void;
  removeSongFromPlaylist: (
    pageId: string,
    playlistId: string,
    songId: string,
  ) => void;
  updatePlaylistSongs: (
    pageId: string,
    playlistId: string,
    songs: Song[],
  ) => void;
  updateSongDuration: (songId: string, duration: number) => void;

  // Player controls
  setActivePlaylist: (id: string | null) => void;
  setActiveSong: (id: string | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setProgress: (progress: number) => void;
  toggleLoop: () => void;
  setSpotifyDeviceId: (id: string | null) => void;

  playbackTrigger: number;
  isSpotifyConnected: boolean;
  spotifyError: string | null;

  setIsSpotifyConnected: (connected: boolean) => void;
  setSpotifyError: (error: string | null) => void;

  playNext: () => void;
  playPrev: () => void;
}

export const useSoundpadStore = create<SoundpadState>((set) => ({
  pages: [
    {
      id: generateId(),
      name: 'Músicas',
      playlists: [],
    },
  ],
  activePlaylistId: null,
  activeSongId: null,
  isPlaying: false,
  progress: 0,
  isLooping: false,
  spotifyDeviceId: null,
  playbackTrigger: 0,
  isSpotifyConnected: false,
  spotifyError: null,

  addPage: (name) =>
    set((state) => {
      const newState = {
        pages: [...state.pages, { id: generateId(), name, playlists: [] }],
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  renamePage: (id, newName) =>
    set((state) => {
      const newState = {
        pages: state.pages.map((p) =>
          p.id === id ? { ...p, name: newName } : p,
        ),
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  removePage: (id) =>
    set((state) => {
      const newPages = state.pages.filter((p) => p.id !== id);
      if (newPages.length === 0) {
        newPages.push({ id: generateId(), name: 'Músicas', playlists: [] });
      }
      const newState = { pages: newPages };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  addPlaylist: (pageId, name) =>
    set((state) => {
      const newPlaylist: Playlist = {
        id: generateId(),
        name,
        tags: [],
        songs: [],
        updatedAt: Date.now(),
      };

      const newState = {
        pages: state.pages.map((p) => {
          if (p.id === pageId) {
            return { ...p, playlists: [...p.playlists, newPlaylist] };
          }
          return p;
        }),
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  updatePlaylist: (pageId, playlistId, updates) =>
    set((state) => {
      const newState = {
        pages: state.pages.map((p) => {
          if (p.id === pageId) {
            return {
              ...p,
              playlists: p.playlists.map((pl) =>
                pl.id === playlistId
                  ? { ...pl, ...updates, updatedAt: Date.now() }
                  : pl,
              ),
            };
          }
          return p;
        }),
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  removePlaylist: (pageId, playlistId) =>
    set((state) => {
      const newState = {
        pages: state.pages.map((p) => {
          if (p.id === pageId) {
            return {
              ...p,
              playlists: p.playlists.filter((pl) => pl.id !== playlistId),
            };
          }
          return p;
        }),
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  reorderPlaylists: (pageId, startIndex, endIndex) =>
    set((state) => {
      const newState = {
        pages: state.pages.map((p) => {
          if (p.id === pageId) {
            const result = Array.from(p.playlists);
            const [removed] = result.splice(startIndex, 1);
            result.splice(endIndex, 0, removed);
            return { ...p, playlists: result };
          }
          return p;
        }),
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  addSongToPlaylist: (pageId, playlistId, songData) =>
    set((state) => {
      const newSong: Song = {
        id: generateId(),
        ...songData,
      };
      const newState = {
        pages: state.pages.map((p) => {
          if (p.id === pageId) {
            return {
              ...p,
              playlists: p.playlists.map((pl) =>
                pl.id === playlistId
                  ? {
                      ...pl,
                      songs: [...pl.songs, newSong],
                      updatedAt: Date.now(),
                    }
                  : pl,
              ),
            };
          }
          return p;
        }),
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  removeSongFromPlaylist: (pageId, playlistId, songId) =>
    set((state) => {
      const newState = {
        pages: state.pages.map((p) => {
          if (p.id === pageId) {
            return {
              ...p,
              playlists: p.playlists.map((pl) =>
                pl.id === playlistId
                  ? {
                      ...pl,
                      songs: pl.songs.filter((s) => s.id !== songId),
                      updatedAt: Date.now(),
                    }
                  : pl,
              ),
            };
          }
          return p;
        }),
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  updatePlaylistSongs: (pageId, playlistId, songs) =>
    set((state) => {
      const newState = {
        pages: state.pages.map((p) => {
          if (p.id === pageId) {
            return {
              ...p,
              playlists: p.playlists.map((pl) =>
                pl.id === playlistId
                  ? { ...pl, songs, updatedAt: Date.now() }
                  : pl,
              ),
            };
          }
          return p;
        }),
      };
      setTimeout(() => triggerAutoSave(), 0);
      return newState;
    }),

  updateSongDuration: (songId, duration) =>
    set((state) => {
      let updated = false;
      const newState = {
        pages: state.pages.map((p) => ({
          ...p,
          playlists: p.playlists.map((pl) => ({
            ...pl,
            songs: pl.songs.map((s) => {
              if (s.id === songId && s.duration !== duration) {
                updated = true;
                return { ...s, duration };
              }
              return s;
            }),
          })),
        })),
      };
      if (updated) setTimeout(() => triggerAutoSave(), 0);
      return updated ? newState : state;
    }),

  setActivePlaylist: (id) => set({ activePlaylistId: id }),
  setActiveSong: (id) =>
    set({ activeSongId: id, isPlaying: false, progress: 0 }),
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setProgress: (progress) => set({ progress }),
  toggleLoop: () => set((state) => ({ isLooping: !state.isLooping })),
  setSpotifyDeviceId: (id) => set({ spotifyDeviceId: id }),
  setIsSpotifyConnected: (connected) => set({ isSpotifyConnected: connected }),
  setSpotifyError: (error) => set({ spotifyError: error }),

  playNext: () =>
    set((state) => {
      if (!state.activePlaylistId) return state;

      let songs: Song[] = [];
      state.pages.forEach((p) => {
        const pl = p.playlists.find((x) => x.id === state.activePlaylistId);
        if (pl) songs = pl.songs;
      });

      if (songs.length === 0) return state;

      const currentIndex = songs.findIndex((s) => s.id === state.activeSongId);

      // If loop is active, repeat the exact same song
      if (state.isLooping && currentIndex !== -1) {
        return {
          playbackTrigger: state.playbackTrigger + 1,
          isPlaying: true,
          progress: 0,
        };
      }

      // Otherwise, go to next song. If at end, loop the playlist.
      if (currentIndex === -1) {
        return { activeSongId: songs[0].id, isPlaying: true, progress: 0 };
      } else if (currentIndex < songs.length - 1) {
        return {
          activeSongId: songs[currentIndex + 1].id,
          isPlaying: true,
          progress: 0,
        };
      } else {
        // Loop entire playlist natively
        return { activeSongId: songs[0].id, isPlaying: true, progress: 0 };
      }
    }),

  playPrev: () =>
    set((state) => {
      if (!state.activePlaylistId) return state;

      let songs: Song[] = [];
      state.pages.forEach((p) => {
        const pl = p.playlists.find((x) => x.id === state.activePlaylistId);
        if (pl) songs = pl.songs;
      });

      if (songs.length === 0) return state;

      const currentIndex = songs.findIndex((s) => s.id === state.activeSongId);
      if (currentIndex > 0) {
        return {
          activeSongId: songs[currentIndex - 1].id,
          isPlaying: true,
          progress: 0,
        };
      } else {
        // Loop around to last song natively
        return {
          activeSongId: songs[songs.length - 1].id,
          isPlaying: true,
          progress: 0,
        };
      }
    }),
}));
