import { useSoundpadStore } from '@/store/useSoundpadStore';
import { Play, Pause, SkipBack, SkipForward, Square, Repeat } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

export default function SoundpadPlayer() {
  const isPlaying = useSoundpadStore(state => state.isPlaying);
  const setIsPlaying = useSoundpadStore(state => state.setIsPlaying);
  const isLooping = useSoundpadStore(state => state.isLooping);
  const toggleLoop = useSoundpadStore(state => state.toggleLoop);
  const progress = useSoundpadStore(state => state.progress);
  const setProgress = useSoundpadStore(state => state.setProgress);
  const activeSongId = useSoundpadStore(state => state.activeSongId);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const formatTime = (percentage: number) => {
    // Fake 3:00 minute song for UI purposes until logic is implemented
    const totalSeconds = 180; 
    const currentSeconds = Math.floor((percentage / 100) * totalSeconds);
    const m = Math.floor(currentSeconds / 60);
    const s = currentSeconds % 60;
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
          className="w-10 h-10 flex items-center justify-center rounded-full bg-[#8257e5] hover:bg-[#9466ff] text-white transition-colors shadow-lg shadow-[#8257e5]/20"
          title={isPlaying ? "Pausar" : "Tocar"}
        >
          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current translate-x-0.5" />}
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
          {formatTime(progress)}
        </span>
        <div className="flex-1 cursor-pointer">
          <Slider
            value={[progress]}
            max={100}
            step={1}
            onValueChange={(vals) => setProgress(vals[0])}
            className="[&_[role=slider]]:h-3 [&_[role=slider]]:w-3 [&_[role=slider]]:bg-[#8257e5] [&_[role=slider]]:border-none"
          />
        </div>
        <span className="text-[0.65rem] text-[#7a7a80] font-mono w-8">
          3:00
        </span>
      </div>
    </div>
  );
}
