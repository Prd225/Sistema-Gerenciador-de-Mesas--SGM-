import {
  Play,
  Square,
  Keyboard,
  ListOrdered,
  StepForward,
  Film,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTimerStore } from '@/store/useTimerStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import { useEffect, useState, useRef } from 'react';

const playAlarmSound = () => {
  const AudioContext =
    window.AudioContext || (window as any).webkitAudioContext;
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
  const {
    totalSeconds,
    isRunning,
    minimized,
    setTotalSeconds,
    decrement,
    stop,
    toggleIsRunning,
    toggleMinimize,
  } = useTimerStore();
  const {
    scene,
    round,
    turn,
    urgency,
    turnsPerRound,
    changeUrgency,
    setUrgency,
    nextScene,
    addTurn,
    setTurnsPerRound,
    setShowInitModal,
    nextRound,
    setRound,
  } = useCampaignStore();
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
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleManualTimer = () => {
    const min = prompt('Digite os minutos:');
    if (min && !isNaN(Number(min))) {
      setTotalSeconds(Number(min) * 60);
      stop();
    }
  };
  return (
    <footer className="h-[60px] bg-surface-elevated border-t border-subtle flex items-center justify-center gap-5 px-5 z-50 transition-colors duration-200">
      {/* Timer */}
      <div
        className={`flex items-center gap-4 border rounded-lg px-3 py-1 shadow-sm backdrop-blur-sm transition-all ${
          timerFlashing
            ? 'bg-red-950/50 border-red-500 shadow-[0_0_15px_red] animate-pulse'
            : 'bg-surface border-subtle'
        }`}
      >
        <div
          className={`text-2xl font-bold font-mono cursor-pointer w-[70px] text-left select-none transition-colors ${timerFlashing ? 'text-white' : 'text-main hover:text-brand-gold'}`}
          onClick={toggleMinimize}
        >
          {formatTime(totalSeconds)}
        </div>
        {!minimized && (
          <>
            <div className="flex gap-1">
              <Button
                onClick={() => setTotalSeconds(60)}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[0.7rem] bg-transparent border-muted text-main hover:bg-surface-elevated"
              >
                1m
              </Button>
              <Button
                onClick={() => setTotalSeconds(180)}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[0.7rem] bg-transparent border-muted text-main hover:bg-surface-elevated"
              >
                3m
              </Button>
              <Button
                onClick={() => setTotalSeconds(300)}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[0.7rem] bg-transparent border-muted text-main hover:bg-surface-elevated"
              >
                5m
              </Button>
              <Button
                onClick={() => setTotalSeconds(600)}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[0.7rem] bg-transparent border-muted text-main hover:bg-surface-elevated"
              >
                10m
              </Button>
            </div>
            <div className="flex gap-1 border-l border-subtle pl-2">
              <Button
                onClick={toggleIsRunning}
                variant="outline"
                size="icon"
                className={`h-7 w-7 bg-transparent border-muted hover:bg-surface-elevated cursor-pointer ${
                  isRunning ? 'text-brand-green' : 'text-muted-custom'
                }`}
                title={isRunning ? 'Pausar' : 'Iniciar'}
              >
                <Play className="h-3 w-3" fill="currentColor" />
              </Button>
              <Button
                onClick={stop}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-transparent border-muted text-muted-custom hover:bg-surface-elevated cursor-pointer"
                title="Parar"
              >
                <Square className="h-3 w-3" fill="currentColor" />
              </Button>
              <Button
                onClick={handleManualTimer}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-transparent border-muted text-muted-custom hover:bg-surface-elevated cursor-pointer"
                title="Inserir minutos manualmente"
              >
                <Keyboard className="h-3 w-3" />
              </Button>
            </div>
          </>
        )}
      </div>

      <div className="w-[1px] h-[30px] bg-subtle" />

      {/* Counters */}
      <div className="flex items-center gap-2 text-[1.1rem]">
        <span className="text-muted-custom font-medium">Cena</span>
        <span className="font-bold text-brand-gold text-[1.4rem] min-w-[30px] text-center">
          {scene}
        </span>
      </div>

      <div className="w-[1px] h-[30px] bg-subtle" />

      {/* Rounds & Turns */}
      <div className="flex items-center gap-2 text-[1.1rem]">
        <span className="text-muted-custom font-medium">Rodada</span>
        <span className="font-bold text-brand-gold text-[1.4rem] min-w-[30px] text-center">
          {round}
        </span>
        <div className="flex flex-col ml-1">
          <button
            onClick={nextRound}
            className="text-muted-custom hover:text-main h-[12px] flex items-center justify-center p-0 cursor-pointer"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setRound(Math.max(1, round - 1))}
            className="text-muted-custom hover:text-main h-[12px] flex items-center justify-center p-0 cursor-pointer"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[1.1rem]">
        <span className="text-muted-custom font-medium">Turno</span>
        <span className="font-bold text-brand-gold text-[1.4rem] min-w-[30px] text-center">
          {turn}
        </span>
      </div>

      <div className="w-[1px] h-[30px] bg-subtle" />

      {/* Urgency */}
      <div
        className={`flex items-center gap-1 ml-2 pl-2 border-l border-subtle rounded transition-all ${urgencyFlashing ? 'bg-red-950/50 shadow-[0_0_15px_red] animate-pulse' : ''}`}
      >
        <span className="text-muted-custom text-[0.8rem] uppercase font-semibold mr-1">
          Urgência
        </span>
        <div className="flex flex-col ml-1 items-center">
          <button
            onClick={() => changeUrgency(1)}
            className="text-muted-custom hover:text-main h-[10px] flex items-center justify-center p-0 cursor-pointer"
          >
            <ChevronUp className="h-3 w-3" />
          </button>
          <span
            className={`font-bold text-[1.4rem] min-w-[25px] text-center leading-none my-1 ${urgencyFlashing || urgency === 0 ? 'text-red-500' : 'text-brand-red'}`}
          >
            {urgency !== null ? urgency : '---'}
          </span>
          <button
            onClick={() => changeUrgency(-1)}
            className="text-muted-custom hover:text-main h-[10px] flex items-center justify-center p-0 cursor-pointer"
          >
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
        <div className="flex gap-0.5 ml-2">
          <Button
            onClick={() => setUrgency(3)}
            variant="outline"
            size="sm"
            className="h-6 px-1.5 text-[0.7rem] bg-transparent border-muted text-main hover:bg-surface-elevated"
          >
            3
          </Button>
          <Button
            onClick={() => setUrgency(5)}
            variant="outline"
            size="sm"
            className="h-6 px-1.5 text-[0.7rem] bg-transparent border-muted text-main hover:bg-surface-elevated"
          >
            5
          </Button>
          <Button
            onClick={() => setUrgency(7)}
            variant="outline"
            size="sm"
            className="h-6 px-1.5 text-[0.7rem] bg-transparent border-muted text-main hover:bg-surface-elevated"
          >
            7
          </Button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3.5 ml-5 bg-surface border border-subtle px-4 py-1.5 rounded-lg shadow-sm">
        <Button
          onClick={() => setShowInitModal(true)}
          variant="outline"
          className="bg-transparent border-muted text-main hover:bg-surface-elevated font-bold"
        >
          <ListOrdered className="w-4 h-4 mr-2" /> Iniciativa
        </Button>
        <Button
          onClick={addTurn}
          variant="outline"
          className="bg-transparent border-muted text-main hover:bg-surface-elevated"
          title="Próximo Turno"
        >
          <StepForward className="w-4 h-4" />
        </Button>
        <div className="flex flex-col items-center">
          <label className="text-[0.6rem] text-muted-custom m-0 leading-tight">
            T/Rodada
          </label>
          <input
            type="number"
            value={turnsPerRound}
            onChange={(e) => setTurnsPerRound(Number(e.target.value))}
            className="w-10 text-center p-0.5 h-[25px] bg-app border border-muted rounded text-main focus:border-brand-purple outline-none text-xs font-semibold"
          />
        </div>
        <Button
          onClick={nextScene}
          variant="outline"
          className="bg-transparent border-muted text-main hover:bg-surface-elevated font-bold"
          title="Nova Cena (Reset)"
        >
          <Film className="w-4 h-4 mr-2" /> Cena
        </Button>
      </div>
    </footer>
  );
}
