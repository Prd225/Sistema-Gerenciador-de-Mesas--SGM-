import { useState, useEffect, useRef } from 'react';
import { useSoundpadStore } from '@/store/useSoundpadStore';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Square,
  Repeat,
  Volume2,
  Volume1,
  VolumeX,
  AlertCircle,
} from 'lucide-react';
import {
  pauseSpotifyTrack,
  resumeSpotifyTrack,
  seekSpotifyTrack,
} from '@/lib/spotifyPlayer';
import { touchSpotifyActivity } from '@/lib/spotifyAuth';
import type { Song } from '@/types/soundpad';


export default function SoundpadPlayer() {
  const isPlaying = useSoundpadStore((state) => state.isPlaying);
  const setIsPlaying = useSoundpadStore((state) => state.setIsPlaying);
  const isLooping = useSoundpadStore((state) => state.isLooping);
  const toggleLoop = useSoundpadStore((state) => state.toggleLoop);
  const progress = useSoundpadStore((state) => state.progress);
  const setProgress = useSoundpadStore((state) => state.setProgress);
  const activeSongId = useSoundpadStore((state) => state.activeSongId);
  const setActiveSong = useSoundpadStore((state) => state.setActiveSong);
  const activePlaylistId = useSoundpadStore((state) => state.activePlaylistId);
  const setActivePlaylist = useSoundpadStore(
    (state) => state.setActivePlaylist,
  );

  const volume = useSoundpadStore((state) => state.volume);
  const isMuted = useSoundpadStore((state) => state.isMuted);
  const setVolume = useSoundpadStore((state) => state.setVolume);
  const toggleMute = useSoundpadStore((state) => state.toggleMute);
  const setIsSeeking = useSoundpadStore((state) => state.setIsSeeking);
  const audioError = useSoundpadStore((state) => state.audioError);

  const playNext = useSoundpadStore((state) => state.playNext);
  const playPrev = useSoundpadStore((state) => state.playPrev);
  const pages = useSoundpadStore((state) => state.pages);

  // Local drag state for smooth progress bar without rubber-banding
  const [localProgress, setLocalProgress] = useState(progress);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setLocalProgress(progress);
    }
  }, [progress]);

  const activeSong: Song | undefined = pages
    ?.flatMap((p) => p.playlists || [])
    .flatMap((pl) => pl.songs || [])
    .find((s) => s.id === activeSongId);

  const handlePlayPause = async () => {
    touchSpotifyActivity();
    if (!activeSong) {
      if (activePlaylistId) {
        let songs: Song[] = [];
        pages?.forEach((p) => {
          const pl = p.playlists?.find((x) => x.id === activePlaylistId);
          if (pl) songs = pl.songs || [];
        });
        if (songs.length > 0) {
          setActiveSong(songs[0].id);
          setIsPlaying(true);
        }
      }
      return;
    }

    if (activeSong.sourceType === 'spotify') {
      if (isPlaying) {
        await pauseSpotifyTrack();
      } else {
        await resumeSpotifyTrack();
      }
    } else if (activeSong.sourceType === 'youtube') {
      if (isPlaying) {
        window.dispatchEvent(new Event('soundpad-pause-yt'));
        setIsPlaying(false);
      } else {
        window.dispatchEvent(new Event('soundpad-play-yt'));
        setIsPlaying(true);
      }
    } else if (activeSong.sourceType === 'local') {
      if (isPlaying) {
        window.dispatchEvent(new Event('soundpad-pause-local'));
        setIsPlaying(false);
      } else {
        window.dispatchEvent(new Event('soundpad-play-local'));
        setIsPlaying(true);
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = async () => {
    touchSpotifyActivity();
    // Pause all potential audio sources
    await pauseSpotifyTrack().catch(() => {});
    window.dispatchEvent(new Event('soundpad-pause-yt'));
    window.dispatchEvent(new Event('soundpad-pause-local'));

    setIsPlaying(false);
    setProgress(0);
    setLocalProgress(0);
    setActiveSong(null);
    setActivePlaylist(null);
  };

  const handleSeekCommit = async (newVal: number) => {
    touchSpotifyActivity();
    setProgress(newVal);

    if (activeSong?.sourceType === 'spotify') {
      const positionMs = (newVal / 100) * (activeSong.duration * 1000);
      await seekSpotifyTrack(positionMs);
    } else if (activeSong?.sourceType === 'youtube') {
      const positionSec = (newVal / 100) * (activeSong.duration || 0);
      window.dispatchEvent(
        new CustomEvent('soundpad-seek-yt', { detail: { positionSec } }),
      );
    } else if (activeSong?.sourceType === 'local') {
      const positionSec = (newVal / 100) * (activeSong.duration || 0);
      window.dispatchEvent(
        new CustomEvent('soundpad-seek-local', { detail: { positionSec } }),
      );
    }
  };


  const formatTime = (percentage: number, totalSeconds: number) => {
    if (!totalSeconds) return '0:00';
    const currentSeconds = Math.floor((percentage / 100) * totalSeconds);
    const m = Math.floor(currentSeconds / 60);
    const s = Math.floor(currentSeconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds) return '0:00';
    const sec = Math.floor(totalSeconds);
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-[#1a1a1e] border-b border-[#323238] p-2 flex flex-col gap-1.5 shrink-0 select-none">
      {/* Apenas o nome da música: texto puro, sem ícone, sem caixinha/card, sem artista, cortado se extenso */}
      {activeSong && (
        <div className="px-3 py-0.5 min-w-0 overflow-hidden text-center">
          <p
            className="text-xs text-[#e1e1e6] font-medium truncate select-text"
            title={activeSong.name}
          >
            {activeSong.name}
          </p>
        </div>
      )}

      {/* Audio Error Banner */}
      {audioError && (
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-[0.65rem] animate-in fade-in">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate flex-1">{audioError}</span>
        </div>
      )}

      {/* Controls Row */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={handleStop}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#323238] text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
          title="Parar"
        >
          <Square className="w-3.5 h-3.5 fill-current" />
        </button>

        <button
          onClick={() => {
            touchSpotifyActivity();
            playPrev();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#323238] text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors disabled:opacity-50"
          title="Música Anterior"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={handlePlayPause}
          disabled={!activeSong && !activePlaylistId}
          className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shadow-md ${
            !activeSong && !activePlaylistId
              ? 'bg-[#323238] text-[#7a7a80] cursor-not-allowed'
              : 'bg-[#8257e5] hover:bg-[#9466ff] text-white shadow-[#8257e5]/25 hover:scale-105 active:scale-95'
          }`}
          title={isPlaying ? 'Pausar' : 'Tocar'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current translate-x-0.5" />
          )}
        </button>

        <button
          onClick={() => {
            touchSpotifyActivity();
            playNext();
          }}
          className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#323238] text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors disabled:opacity-50"
          title="Próxima Música"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={() => {
            touchSpotifyActivity();
            toggleLoop();
          }}
          className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
            isLooping
              ? 'text-[#8257e5] bg-[#8257e5]/10'
              : 'text-[#a8a8b3] hover:bg-[#323238] hover:text-[#e1e1e6]'
          }`}
          title={isLooping ? 'Repetir ativado' : 'Repetir desativado'}
        >
          <Repeat className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Progress Seekbar Row */}
      <div className="flex items-center gap-2.5 px-2">
        <span className="text-[0.65rem] text-[#7a7a80] font-mono w-7 text-right">
          {formatTime(localProgress, activeSong?.duration || 0)}
        </span>
        <div className="flex-1 flex items-center h-4 cursor-pointer">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={localProgress}
            onMouseDown={() => {
              isDraggingRef.current = true;
              setIsSeeking(true);
            }}
            onTouchStart={() => {
              isDraggingRef.current = true;
              setIsSeeking(true);
            }}
            onChange={(e) => {
              setLocalProgress(Number(e.target.value));
            }}
            onMouseUp={(e) => {
              isDraggingRef.current = false;
              const val = Number((e.target as HTMLInputElement).value);
              handleSeekCommit(val);
              setTimeout(() => setIsSeeking(false), 250);
            }}
            onTouchEnd={(e) => {
              isDraggingRef.current = false;
              const val = Number((e.target as HTMLInputElement).value);
              handleSeekCommit(val);
              setTimeout(() => setIsSeeking(false), 250);
            }}
            disabled={!activeSong}
            className={`w-full h-1.5 rounded-full appearance-none accent-[#8257e5] transition-all ${
              !activeSong
                ? 'bg-[#202024] cursor-not-allowed opacity-50'
                : 'bg-[#323238] cursor-pointer hover:bg-[#3d3d45]'
            }`}
          />
        </div>
        <span className="text-[0.65rem] text-[#7a7a80] font-mono w-7">
          {formatDuration(activeSong?.duration || 0)}
        </span>
      </div>

      {/* Volume Row - Abaixo da barra de duração sem pop-up */}
      <div className="flex items-center gap-2 px-2 pt-0.5">
        <button
          onClick={() => {
            touchSpotifyActivity();
            toggleMute();
          }}
          className={`shrink-0 p-1 rounded hover:bg-[#323238] transition-colors ${
            isMuted || volume === 0 ? 'text-red-400' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'
          }`}
          title={isMuted ? 'Desmutar' : `Volume: ${volume}%`}
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-3.5 h-3.5" />
          ) : volume < 50 ? (
            <Volume1 className="w-3.5 h-3.5" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
        </button>

        <div className="flex-1 flex items-center h-3 cursor-pointer">
          <input
            type="range"
            min={0}
            max={100}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              touchSpotifyActivity();
              setVolume(Number(e.target.value));
            }}
            className="w-full h-1 rounded-full appearance-none accent-[#8257e5] bg-[#323238] hover:bg-[#3d3d45] cursor-pointer"
          />
        </div>

        <span className="text-[0.65rem] font-mono text-[#7a7a80] w-7 text-right shrink-0">
          {isMuted ? '0%' : `${volume}%`}
        </span>
      </div>
    </div>
  );
}
