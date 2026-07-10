import { useSoundpadStore } from '@/store/useSoundpadStore';
import { Play, Pause, SkipBack, SkipForward, Square, Repeat } from 'lucide-react';
import { pauseSpotifyTrack, resumeSpotifyTrack, seekSpotifyTrack } from '@/lib/spotifyPlayer';
import type { Song } from '@/types/soundpad';

export default function SoundpadPlayer() {
  const isPlaying = useSoundpadStore(state => state.isPlaying);
  const setIsPlaying = useSoundpadStore(state => state.setIsPlaying);
  const isLooping = useSoundpadStore(state => state.isLooping);
  const toggleLoop = useSoundpadStore(state => state.toggleLoop);
  const progress = useSoundpadStore(state => state.progress);
  const setProgress = useSoundpadStore(state => state.setProgress);
  const activeSongId = useSoundpadStore(state => state.activeSongId);
  const setActiveSong = useSoundpadStore(state => state.setActiveSong);
  const activePlaylistId = useSoundpadStore(state => state.activePlaylistId);
  const setActivePlaylist = useSoundpadStore(state => state.setActivePlaylist);
  
  const playNext = useSoundpadStore(state => state.playNext);
  const playPrev = useSoundpadStore(state => state.playPrev);
  const pages = useSoundpadStore(state => state.pages);

  let activeSong: Song | null = null;
  pages?.forEach(p => p.playlists?.forEach(pl => pl.songs?.forEach(s => {
    if (s.id === activeSongId) activeSong = s;
  })));

  // Auto-play, interval, and track switching logic have been moved to SoundpadEngine.tsx
  // to ensure playback continues even when the master panel is minimized or closed.

  const handlePlayPause = async () => {
    if (!activeSong) {
      if (activePlaylistId) {
        let songs: Song[] = [];
        pages?.forEach(p => {
          const pl = p.playlists?.find(x => x.id === activePlaylistId);
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
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = async () => {
    // Always attempt to pause both sources to prevent orphaned audio
    await pauseSpotifyTrack().catch(() => {});
    window.dispatchEvent(new Event('soundpad-pause-yt'));
    
    setIsPlaying(false);
    setProgress(0);
    setActiveSong(null);
    setActivePlaylist(null);
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    
    if (activeSong?.sourceType === 'spotify') {
      const positionMs = (newProgress / 100) * (activeSong.duration * 1000);
      await seekSpotifyTrack(positionMs);
    } else if (activeSong?.sourceType === 'youtube') {
      const positionSec = (newProgress / 100) * (activeSong.duration || 0);
      window.dispatchEvent(new CustomEvent('soundpad-seek-yt', { detail: { positionSec } }));
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
    <div className="bg-[#1a1a1e] border-b border-[#323238] p-3 flex flex-col gap-2 shrink-0">
      <div className="flex items-center justify-center gap-4">
        <button 
          onClick={handleStop}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#323238] text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
          title="Parar"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
        
        <button 
          onClick={playPrev}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#323238] text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors disabled:opacity-50"
          title="Música Anterior"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>
        
        <button 
          onClick={handlePlayPause}
          disabled={!activeSong && !activePlaylistId}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors shadow-lg ${
            (!activeSong && !activePlaylistId) ? 'bg-[#323238] text-[#7a7a80] cursor-not-allowed' : 'bg-[#8257e5] hover:bg-[#9466ff] text-white shadow-[#8257e5]/20'
          }`}
          title={isPlaying ? "Pausar" : "Tocar"}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          )}
        </button>
        
        <button 
          onClick={playNext}
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#323238] text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors disabled:opacity-50"
          title="Próxima Música"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
        
        <button 
          onClick={toggleLoop}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors ${
            isLooping ? 'text-[#8257e5] bg-[#8257e5]/10' : 'text-[#a8a8b3] hover:bg-[#323238] hover:text-[#e1e1e6]'
          }`}
          title="Repetir (Looping)"
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      <div className="flex items-center gap-3 px-2">
        <span className="text-[0.65rem] text-[#7a7a80] font-mono w-8 text-right">
          {formatTime(progress, activeSong?.duration || 0)}
        </span>
        <div className="flex-1 flex items-center h-4 cursor-pointer">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={progress}
            onChange={handleSeek}
            disabled={!activeSong}
            className={`w-full h-1.5 rounded-full appearance-none accent-[#8257e5] ${
              !activeSong ? 'bg-[#202024] cursor-not-allowed' : 'bg-[#323238] cursor-pointer'
            }`}
          />
        </div>
        <span className="text-[0.65rem] text-[#7a7a80] font-mono w-8">
          {formatDuration(activeSong?.duration || 0)}
        </span>
      </div>
    </div>
  );
}
