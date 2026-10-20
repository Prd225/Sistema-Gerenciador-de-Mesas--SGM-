import { useSoundpadStore } from '@/store/useSoundpadStore';
import { socket } from '@/lib/socket';
import type {
  RoomSong,
  SoundpadStatePayload,
  SoundpadControlPayload,
} from '@/types/multiplayer';
import type { Song } from '@/types/soundpad';

function getActiveSong(pages: any[], activeSongId: string | null): Song | undefined {
  if (!activeSongId || !pages) return undefined;
  return pages
    .flatMap((p) => p.playlists || [])
    .flatMap((pl) => pl.songs || [])
    .find((s) => s.id === activeSongId);
}

export function broadcastCurrentSoundpad(): void {
  if (!socket.connected) return;

  const { activeSongId, pages, isPlaying, progress } = useSoundpadStore.getState();
  const activeSong = getActiveSong(pages, activeSongId);

  if (!activeSong) {
    const payload: SoundpadStatePayload = {
      song: null,
      isPlaying: false,
      positionSec: 0,
    };
    socket.emit('soundpad:state', payload);
    return;
  }

  const duration = activeSong.duration || 0;
  const positionSec = duration > 0 ? (progress / 100) * duration : 0;

  const roomSong: RoomSong = {
    id: activeSong.id,
    name: activeSong.name,
    author: activeSong.author,
    duration: activeSong.duration || 0,
    sourceType: activeSong.sourceType,
    sourceUrl: activeSong.sourceUrl,
  };

  const payload: SoundpadStatePayload = {
    song: roomSong,
    isPlaying,
    positionSec,
  };

  socket.emit('soundpad:state', payload);
}

let cleanupFn: (() => void) | null = null;

export function startSoundpadBroadcast(): () => void {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }

  let prevSongId = useSoundpadStore.getState().activeSongId;
  let prevIsPlaying = useSoundpadStore.getState().isPlaying;
  let prevTrigger = useSoundpadStore.getState().playbackTrigger;
  let prevIsSeeking = useSoundpadStore.getState().isSeeking;

  const unsubscribe = useSoundpadStore.subscribe((state) => {
    if (!socket.connected) return;

    const songChanged = state.activeSongId !== prevSongId;
    const playChanged = state.isPlaying !== prevIsPlaying;
    const triggerChanged = state.playbackTrigger !== prevTrigger;
    const seekReleased = prevIsSeeking && !state.isSeeking;

    prevSongId = state.activeSongId;
    prevIsPlaying = state.isPlaying;
    prevTrigger = state.playbackTrigger;
    prevIsSeeking = state.isSeeking;

    if (songChanged) {
      broadcastCurrentSoundpad();
      return;
    }

    if (playChanged || triggerChanged || seekReleased) {
      const activeSong = getActiveSong(state.pages, state.activeSongId);
      const duration = activeSong?.duration || 0;
      const positionSec = duration > 0 ? (state.progress / 100) * duration : 0;

      const controlPayload: SoundpadControlPayload = {
        songId: state.activeSongId,
        isPlaying: state.isPlaying,
        positionSec,
      };
      socket.emit('soundpad:control', controlPayload);
    }
  });

  // Batimento periódico a cada 5s para manter clientes sincronizados
  const heartbeatTimer = setInterval(() => {
    if (!socket.connected) return;
    const state = useSoundpadStore.getState();
    if (!state.isPlaying || !state.activeSongId || state.isSeeking) return;

    const activeSong = getActiveSong(state.pages, state.activeSongId);
    if (!activeSong) return;

    const duration = activeSong.duration || 0;
    const positionSec = duration > 0 ? (state.progress / 100) * duration : 0;

    const controlPayload: SoundpadControlPayload = {
      songId: state.activeSongId,
      isPlaying: true,
      positionSec,
    };
    socket.emit('soundpad:control', controlPayload);
  }, 5000);

  cleanupFn = () => {
    unsubscribe();
    clearInterval(heartbeatTimer);
    cleanupFn = null;
  };

  return cleanupFn;
}

export function stopSoundpadBroadcast(): void {
  if (cleanupFn) {
    cleanupFn();
    cleanupFn = null;
  }
}
