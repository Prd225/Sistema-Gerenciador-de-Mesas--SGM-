import { create } from 'zustand';
import type {
  AudioTrack,
  RoomAudioState,
  AudioControlPayload,
} from '@sgm/shared';
import { socket } from '../lib/socket';
import { useMultiplayerStore } from './useMultiplayerStore';

export interface AudioState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  currentTime: number;
  volume: number; // 0 - 100 (Master Room Volume)
  localVolume: number; // 0 - 100 (Local Client Volume)
  isLocalMuted: boolean;
  loop: boolean;
  updatedAt: number;

  // Actions
  syncFromRemote: (state: RoomAudioState) => void;
  setLocalVolume: (volume: number) => void;
  toggleLocalMute: () => void;
  setCurrentTime: (time: number) => void;

  // Master / GM Controls (repassam para o socket se conectado em sala)
  playTrack: (track: AudioTrack) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  stop: () => void;
  seek: (currentTime: number) => void;
  setRoomVolume: (volume: number) => void;
  toggleLoop: () => void;
}

// Helpers de envio de comando seguro ao socket
function emitAudioControl(payload: AudioControlPayload) {
  const isConnected = useMultiplayerStore.getState().isConnected;
  const role = useMultiplayerStore.getState().role;

  // Se estiver em sala multiplayer, apenas envia ao socket se for GM
  if (isConnected) {
    if (role === 'gm') {
      socket.emit('audio:control', payload);
    }
  }
}

export const useAudioStore = create<AudioState>((set, get) => {
  // Listener do socket para sincronização contínua de áudio
  socket.on('audio:sync', (audioState: RoomAudioState) => {
    set({
      currentTrack: audioState.currentTrack,
      isPlaying: audioState.isPlaying,
      currentTime: audioState.currentTime,
      volume: audioState.volume,
      loop: audioState.loop,
      updatedAt: audioState.updatedAt,
    });
  });

  return {
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    volume: 80,
    localVolume: 80,
    isLocalMuted: false,
    loop: false,
    updatedAt: Date.now(),

    syncFromRemote: (remoteState: RoomAudioState) => {
      set({
        currentTrack: remoteState.currentTrack,
        isPlaying: remoteState.isPlaying,
        currentTime: remoteState.currentTime,
        volume: remoteState.volume,
        loop: remoteState.loop,
        updatedAt: remoteState.updatedAt,
      });
    },

    setLocalVolume: (vol: number) => {
      set({ localVolume: Math.max(0, Math.min(100, vol)) });
    },

    toggleLocalMute: () => {
      set((state) => ({ isLocalMuted: !state.isLocalMuted }));
    },

    setCurrentTime: (currentTime: number) => {
      set({ currentTime });
    },

    // GM Actions
    playTrack: (track: AudioTrack) => {
      const now = Date.now();
      set({
        currentTrack: track,
        isPlaying: true,
        currentTime: 0,
        updatedAt: now,
      });

      emitAudioControl({
        action: 'track',
        track,
      });
    },

    play: () => {
      const now = Date.now();
      set({ isPlaying: true, updatedAt: now });
      emitAudioControl({
        action: 'play',
        currentTime: get().currentTime,
      });
    },

    pause: () => {
      const now = Date.now();
      set({ isPlaying: false, updatedAt: now });
      emitAudioControl({
        action: 'pause',
        currentTime: get().currentTime,
      });
    },

    togglePlayPause: () => {
      if (get().isPlaying) {
        get().pause();
      } else {
        get().play();
      }
    },

    stop: () => {
      const now = Date.now();
      set({ isPlaying: false, currentTime: 0, updatedAt: now });
      emitAudioControl({
        action: 'stop',
      });
    },

    seek: (currentTime: number) => {
      const clampedTime = Math.max(0, currentTime);
      set({ currentTime: clampedTime, updatedAt: Date.now() });
      emitAudioControl({
        action: 'seek',
        currentTime: clampedTime,
      });
    },

    setRoomVolume: (volume: number) => {
      const clampedVolume = Math.max(0, Math.min(100, volume));
      set({ volume: clampedVolume, updatedAt: Date.now() });
      emitAudioControl({
        action: 'volume',
        volume: clampedVolume,
      });
    },

    toggleLoop: () => {
      const nextLoop = !get().loop;
      set({ loop: nextLoop, updatedAt: Date.now() });
      emitAudioControl({
        action: 'loop',
        loop: nextLoop,
      });
    },
  };
});
