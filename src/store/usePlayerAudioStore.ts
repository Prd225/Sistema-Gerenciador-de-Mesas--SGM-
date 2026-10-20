import { create } from 'zustand';
import type {
  RoomSong,
  SoundpadStatePayload,
  SoundpadControlPayload,
} from '@/types/multiplayer';

interface PlayerAudioState {
  song: RoomSong | null;
  isPlaying: boolean;
  anchorPositionSec: number;
  anchorAt: number;
  version: number;

  // Controle local e independente de áudio do jogador
  volume: number;
  isMuted: boolean;
  blocked: boolean;
  error: string | null;

  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setBlocked: (blocked: boolean) => void;
  setError: (error: string | null) => void;

  applyState: (payload: SoundpadStatePayload | null) => void;
  applyControl: (payload: SoundpadControlPayload) => void;
  getTargetPosition: () => number;
  reset: () => void;
}

export const usePlayerAudioStore = create<PlayerAudioState>((set, get) => ({
  song: null,
  isPlaying: false,
  anchorPositionSec: 0,
  anchorAt: Date.now(),
  version: 0,

  volume:
    typeof window !== 'undefined'
      ? Number(localStorage.getItem('sgm_player_volume') ?? 50)
      : 50,
  isMuted:
    typeof window !== 'undefined'
      ? localStorage.getItem('sgm_player_muted') === 'true'
      : false,
  blocked: false,
  error: null,

  setVolume: (volume) => {
    const clamped = Math.max(0, Math.min(100, volume));
    if (typeof window !== 'undefined') {
      localStorage.setItem('sgm_player_volume', String(clamped));
    }
    set({ volume: clamped, isMuted: false });
  },

  toggleMute: () => {
    set((state) => {
      const next = !state.isMuted;
      if (typeof window !== 'undefined') {
        localStorage.setItem('sgm_player_muted', String(next));
      }
      return { isMuted: next };
    });
  },

  setBlocked: (blocked) => set({ blocked }),
  setError: (error) => set({ error }),

  applyState: (payload) => {
    if (!payload || !payload.song) {
      set((state) => ({
        song: null,
        isPlaying: false,
        anchorPositionSec: 0,
        anchorAt: Date.now(),
        version: state.version + 1,
        error: null,
      }));
      return;
    }

    set((state) => ({
      song: payload.song,
      isPlaying: payload.isPlaying,
      anchorPositionSec: Math.max(0, payload.positionSec || 0),
      anchorAt: Date.now(),
      version: state.version + 1,
      error: null,
    }));
  },

  applyControl: (payload) => {
    const currentSong = get().song;
    // Se o controle for para outra música que não a atual, ignoramos
    if (payload.songId && currentSong && payload.songId !== currentSong.id) {
      return;
    }

    set((state) => ({
      isPlaying: payload.isPlaying,
      anchorPositionSec: Math.max(0, payload.positionSec || 0),
      anchorAt: Date.now(),
      version: state.version + 1,
    }));
  },

  getTargetPosition: () => {
    const { song, isPlaying, anchorPositionSec, anchorAt } = get();
    if (!song) return 0;
    if (!isPlaying) return anchorPositionSec;

    const elapsed = (Date.now() - anchorAt) / 1000;
    const calculated = anchorPositionSec + elapsed;
    if (song.duration > 0 && calculated > song.duration) {
      return song.duration;
    }
    return Math.max(0, calculated);
  },

  reset: () => {
    set({
      song: null,
      isPlaying: false,
      anchorPositionSec: 0,
      anchorAt: Date.now(),
      version: 0,
      blocked: false,
      error: null,
    });
  },
}));
