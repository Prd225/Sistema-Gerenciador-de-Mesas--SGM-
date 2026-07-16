
import { Play, Square, Keyboard, ListOrdered, StepForward, Film, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimerStore } from '@/store/useTimerStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useEffect, useState, useRef } from 'react';

const playAlarmSound = () => {
  const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContext) return;
  const ctx = new AudioContext();

  const playBeep = (startTime: number) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, startTime);
    osc.frequency.setValueAtTime(600, startTime + 0.1);
    gainNode.gain.setValueAtTime(0.1, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.start(startTime);
    osc.stop(startTime + 0.3);
  };

  playBeep(ctx.currentTime);
  playBeep(ctx.currentTime + 0.2);
  playBeep(ctx.currentTime + 0.4);
};

export default function Footer() {
  const { totalSeconds, isRunning, minimized, setTotalSeconds, decrement, stop, toggleIsRunning, toggleMinimize } = useTimerStore();
  const { scene, round, turn, urgency, turnsPerRound, changeUrgency, setUrgency, nextScene, addTurn, setTurnsPerRound, setShowInitModal } = useCampaignStore();
  const [urgencyFlashing, setUrgencyFlashing] = useState(false);
  const [timerFlashing, setTimerFlashing] = useState(false);
  const prevUrgency = useRef(urgency);

  useEffect(() => {
    let interval: any;
    if (isRunning && totalSeconds > 0) {
      interval = setInterval(() => {
        decrement();
      }, 1000);
    } else if (isRunning && totalSeconds === 0) {
      stop();
      playAlarmSound();
      setTimerFlashing(true);
      setTimeout(() => setTimerFlashing(false), 5000);
    }
    return () => clearInterval(interval);
  }, [isRunning, totalSeconds, decrement, stop]);

  useEffect(() => {
    if (urgency === 0 && prevUrgency.current !== 0) {
      playAlarmSound();
      setUrgencyFlashing(true);
      setTimeout(() => setUrgencyFlashing(false), 5000);
    }
    prevUrgency.current = urgency;
  }, [urgency]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleManualTimer = () => {
    const min = prompt("Digite os minutos:");
    if (min && !isNaN(Number(min))) {
      setTotalSeconds(Number(min) * 60);
      stop();
    }
  };
  return (
    <footer className="h-[60px] bg-[#202024] border-t border-[#323238] flex items-center justify-center gap-5 px-5 z-50 transition-colors duration-300">
      
      {/* Timer */}
      <div className={`flex items-center gap-4 border rounded-lg px-3 py-1 shadow-[0_4px_15px_rgba(0,0,0,0.7)] transition-all ${
        timerFlashing ? 'bg-red-950/50 border-red-500 shadow-[0_0_15px_red] animate-pulse' : 'bg-[#202024]/95 border-[#323238]'
      }`}>
        <div 
          className={`text-2xl font-bold font-mono cursor-pointer w-[70px] text-left select-none transition-colors ${timerFlashing ? 'text-white' : 'text-[#e1e1e6] hover:text-[#ffd700]'}`}
          onClick={toggleMinimize}
        >
          {formatTime(totalSeconds)}
        </div>
        {!minimized && (
          <>
            <div className="flex gap-1">
              <Button onClick={() => setTotalSeconds(60)} variant="outline" size="sm" className="h-6 px-2 text-[0.7rem] bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5">1m</Button>
              <Button onClick={() => setTotalSeconds(180)} variant="outline" size="sm" className="h-6 px-2 text-[0.7rem] bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5">3m</Button>
              <Button onClick={() => setTotalSeconds(300)} variant="outline" size="sm" className="h-6 px-2 text-[0.7rem] bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5">5m</Button>
            </div>
            <div className="flex gap-1">
              <Button onClick={toggleIsRunning} variant="outline" size="icon" className={`h-7 w-7 bg-transparent border-[#323238] hover:text-white hover:bg-white/5 ${isRunning ? 'text-[#04d361]' : 'text-[#a8a8b3]'}`}>
                <Play className="h-3 w-3" fill="currentColor" />
              </Button>
              <Button onClick={stop} variant="outline" size="icon" className="h-7 w-7 bg-transparent border-[#323238] text-[#a8a8b3] hover:text-white hover:bg-white/5">
                <Square className="h-3 w-3" fill="currentColor" />
              </Button>
              <Button onClick={handleManualTimer} variant="outline" size="icon" className="h-7 w-7 bg-transparent border-[#323238] text-[#a8a8b3] hover:text-white hover:bg-white/5">
                <Keyboard className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>
      
      <div className="w-[1px] h-[30px] bg-[#323238] ml-2"></div>
      
      {/* Counters */}
      <div className="flex items-center gap-2 text-[1.1rem]">
        <span className="text-[#a8a8b3]">Cena</span>
        <span className="font-bold text-[#ffd700] text-[1.4rem] min-w-[30px] text-center">{scene}</span>
      </div>
      
      <div className="w-[1px] h-[30px] bg-[#323238]"></div>
      
      <div className="flex items-center gap-2 text-[1.1rem]">
        <span className="text-[#a8a8b3]">Rodada</span>
        <span className="font-bold text-[#ffd700] text-[1.4rem] min-w-[30px] text-center">{round}</span>
      </div>
      
      <div className="flex items-center gap-2 text-[1.1rem]">
        <span className="text-[#a8a8b3]">Turno</span>
        <span className="font-bold text-[#ffd700] text-[1.4rem] min-w-[30px] text-center">{turn}</span>
      </div>
      
      <div className="w-[1px] h-[30px] bg-[#323238]"></div>
      
      {/* Urgency */}
      <div className={`flex items-center gap-1 ml-2 pl-2 border-l border-[#323238] rounded transition-all ${urgencyFlashing ? 'bg-red-950/50 shadow-[0_0_15px_red] animate-pulse' : ''}`}>
        <span className="text-[#a8a8b3] text-[0.8rem] uppercase mr-1">Urgência</span>
        <div className="flex flex-col ml-1 items-center">
          <button onClick={() => changeUrgency(1)} className="text-[#a8a8b3] hover:text-[#e1e1e6] h-[10px] flex items-center justify-center p-0"><ChevronUp className="h-3 w-3" /></button>
          <span className={`font-bold text-[1.4rem] min-w-[25px] text-center leading-none my-1 ${urgencyFlashing || urgency === 0 ? 'text-red-500' : 'text-[#e55757]'}`}>
            {urgency !== null ? urgency : '---'}
          </span>
          <button onClick={() => changeUrgency(-1)} className="text-[#a8a8b3] hover:text-[#e1e1e6] h-[10px] flex items-center justify-center p-0"><ChevronDown className="h-3 w-3" /></button>
        </div>
        <div className="flex gap-0.5 ml-2">
          <Button onClick={() => setUrgency(3)} variant="outline" size="sm" className="h-6 px-1.5 text-[0.7rem] bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5">3</Button>
          <Button onClick={() => setUrgency(5)} variant="outline" size="sm" className="h-6 px-1.5 text-[0.7rem] bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5">5</Button>
          <Button onClick={() => setUrgency(7)} variant="outline" size="sm" className="h-6 px-1.5 text-[0.7rem] bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5">7</Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3.5 ml-5 bg-black/20 px-4 py-1.5 rounded-lg">
        <Button onClick={() => setShowInitModal(true)} variant="outline" className="bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5 font-bold">
          <ListOrdered className="w-4 h-4 mr-2" /> Iniciativa
        </Button>
        <Button onClick={addTurn} variant="outline" className="bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5" title="Próximo Turno">
          <StepForward className="w-4 h-4" />
        </Button>
        <div className="flex flex-col items-center">
          <label className="text-[0.6rem] text-[#a8a8b3] m-0 leading-tight">T/Rodada</label>
          <input 
            type="number" 
            value={turnsPerRound}
            onChange={(e) => setTurnsPerRound(Number(e.target.value))}
            className="w-10 text-center p-0.5 h-[25px] bg-[#121214] border border-[#323238] rounded text-[#e1e1e6] focus:border-[#8257e5] outline-none" 
          />
        </div>
        <Button onClick={nextScene} variant="outline" className="bg-transparent border-[#323238] text-[#e1e1e6] hover:bg-white/5 font-bold" title="Nova Cena (Reset)">
          <Film className="w-4 h-4 mr-2" /> Cena
        </Button>
      </div>

    </footer>
  );
}
