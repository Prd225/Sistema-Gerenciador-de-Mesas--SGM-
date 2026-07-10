import { useSoundpadStore } from '@/store/useSoundpadStore';
import { Play, Pause, SkipBack, SkipForward, Square, Repeat, Loader2 } from 'lucide-react';
import { playSpotifyTrack, pauseSpotifyTrack, resumeSpotifyTrack, seekSpotifyTrack } from '@/lib/spotifyPlayer';
import { useEffect, useState } from 'react';
import type { Song } from '@/types/soundpad';

export default function SoundpadPlayer() {
  const isPlaying = useSoundpadStore(state => state.isPlaying);
  const setIsPlaying = useSoundpadStore(state => state.setIsPlaying);
  const isLooping = useSoundpadStore(state => state.isLooping);
  const toggleLoop = useSoundpadStore(state => state.toggleLoop);
  const progress = useSoundpadStore(state => state.progress);
  const setProgress = useSoundpadStore(state => state.setProgress);
  const activeSongId = useSoundpadStore(state => state.activeSongId);

  const pages = useSoundpadStore(state => state.pages);
  const spotifyDeviceId = useSoundpadStore(state => state.spotifyDeviceId);
  const [isChangingTrack, setIsChangingTrack] = useState(false);

  let activeSong: Song | null = null;
  pages.forEach(p => p.playlists.forEach(pl => pl.songs.forEach(s => {
    if (s.id === activeSongId) activeSong = s;
  })));

  // Auto-play when a new song is selected
  useEffect(() => {
    if (activeSong && activeSong.sourceType === 'spotify' && spotifyDeviceId) {
      setIsChangingTrack(true);
      playSpotifyTrack(activeSong.sourceUrl).then(() => {
        setIsChangingTrack(false);
      });
    }
  }, [activeSongId, spotifyDeviceId]);

  const handlePlayPause = async () => {
    if (!activeSong) return;
    
    if (activeSong.sourceType === 'spotify') {
      if (isPlaying) {
        await pauseSpotifyTrack();
      } else {
        await resumeSpotifyTrack();
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStop = async () => {
    if (activeSong?.sourceType === 'spotify') {
      await pauseSpotifyTrack();
    }
    setIsPlaying(false);
    setProgress(0);
  };

  const handleSeek = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = Number(e.target.value);
    setProgress(newProgress);
    
    if (activeSong?.sourceType === 'spotify') {
      const positionMs = (newProgress / 100) * (activeSong.duration * 1000);
      await seekSpotifyTrack(positionMs);
    }
  };

  const formatTime = (percentage: number, totalSeconds: number) => {
    if (!totalSeconds) return '0:00';
    const currentSeconds = Math.floor((percentage / 100) * totalSeconds);
    const m = Math.floor(currentSeconds / 60);
    const s = currentSeconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (totalSeconds: number) => {
    if (!totalSeconds) return '0:00';
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
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
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#323238] text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
          title="Música Anterior"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>
        
        <button 
          onClick={handlePlayPause}
          disabled={isChangingTrack || !activeSong}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors shadow-lg ${
            !activeSong ? 'bg-[#323238] text-[#7a7a80] cursor-not-allowed' : 'bg-[#8257e5] hover:bg-[#9466ff] text-white shadow-[#8257e5]/20'
          }`}
          title={isPlaying ? "Pausar" : "Tocar"}
        >
          {isChangingTrack ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current translate-x-0.5" />
          )}
        </button>
        
        <button 
          className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#323238] text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
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
