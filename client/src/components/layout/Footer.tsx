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
import TimerSetupModal from '@/components/modals/TimerSetupModal';
import { SimpleTooltip } from '@/components/ui/tooltip';

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
    urgencyMode,
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
  const [showTimerModal, setShowTimerModal] = useState(false);
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

  return (
    <footer className="h-[60px] bg-surface-elevated border-t border-subtle flex items-center justify-center gap-5 px-5 z-50 transition-colors duration-200">
      {/* Timer Setup Modal */}
      <TimerSetupModal open={showTimerModal} onOpenChange={setShowTimerModal} />

      {/* Timer */}
      <div
        className={`flex items-center gap-4 border rounded-lg px-3 py-1 shadow-sm backdrop-blur-sm transition-all ${
          timerFlashing
            ? 'bg-red-950/50 border-red-500 shadow-[0_0_15px_red] animate-pulse'
            : urgencyMode === 'critical'
              ? 'bg-red-950/20 border-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
              : urgencyMode === 'tension'
                ? 'bg-amber-950/20 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)]'
                : 'bg-surface border-subtle'
        }`}
      >
        <div
          className={`text-2xl font-bold font-mono cursor-pointer w-[70px] text-left select-none transition-colors ${
            timerFlashing
              ? 'text-white'
              : urgencyMode === 'critical'
                ? 'text-brand-red animate-pulse'
                : urgencyMode === 'tension'
                  ? 'text-amber-500'
                  : 'text-main hover:text-brand-gold'
          }`}
          onClick={() => setShowTimerModal(true)}
          title="Clique para configurar o temporizador"
        >
          {formatTime(totalSeconds)}
        </div>
        <button
          type="button"
          onClick={toggleMinimize}
          className="text-muted-custom hover:text-main p-0.5 rounded hover:bg-surface-elevated cursor-pointer transition-colors"
          title={minimized ? 'Expandir atalhos' : 'Recolher atalhos'}
        >
          {minimized ? (
            <ChevronDown className="w-3.5 h-3.5" />
          ) : (
            <ChevronUp className="w-3.5 h-3.5" />
          )}
        </button>
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
                onClick={() => setShowTimerModal(true)}
                variant="outline"
                size="icon"
                className="h-7 w-7 bg-transparent border-muted text-muted-custom hover:bg-surface-elevated cursor-pointer"
                title="Configurar temporizador"
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
      <div className="flex items-center gap-2.5 ml-5 bg-surface border border-subtle px-3 py-1.5 rounded-lg shadow-sm">
        <SimpleTooltip
          side="top"
          content="Abrir Gerenciador e Fila de Iniciativa de Combate"
        >
          <Button
            onClick={() => setShowInitModal(true)}
            variant="outline"
            className="bg-transparent border-muted text-main hover:bg-surface-elevated font-bold h-9 cursor-pointer"
          >
            <ListOrdered className="w-4 h-4 mr-2 text-brand-gold" /> Iniciativa
          </Button>
        </SimpleTooltip>

        <SimpleTooltip side="top" content="Avançar para o Próximo Turno">
          <Button
            onClick={addTurn}
            variant="outline"
            className="bg-transparent border-muted text-main hover:bg-surface-elevated h-9 w-9 p-0 cursor-pointer"
          >
            <StepForward className="w-4 h-4" />
          </Button>
        </SimpleTooltip>

        <SimpleTooltip
          side="top"
          content={
            <div className="space-y-0.5 text-center">
              <p className="font-bold text-brand-gold">Turnos por Rodada</p>
              <p className="text-[11px] text-muted-custom">
                Quantidade de turnos antes de avançar a rodada automaticamente
              </p>
            </div>
          }
        >
          <div className="flex items-center gap-1 px-2.5 h-9 bg-app border border-muted rounded-md text-xs font-semibold text-main hover:border-brand-purple transition-colors cursor-pointer select-none">
            <span className="text-muted-custom text-[11px] font-bold">
              T/R:
            </span>
            <input
              type="number"
              min={1}
              max={99}
              value={turnsPerRound}
              onChange={(e) =>
                setTurnsPerRound(Math.max(1, Number(e.target.value) || 1))
              }
              className="w-6 text-center bg-transparent border-0 text-main font-bold outline-none text-xs p-0 cursor-text"
            />
          </div>
        </SimpleTooltip>

        <SimpleTooltip
          side="top"
          content="Iniciar Nova Cena (Reinicia contagem de rodadas e turnos)"
        >
          <Button
            onClick={nextScene}
            variant="outline"
            className="bg-transparent border-muted text-main hover:bg-surface-elevated font-bold h-9 cursor-pointer"
          >
            <Film className="w-4 h-4 mr-2 text-brand-purple" /> Cena
          </Button>
        </SimpleTooltip>
      </div>
    </footer>
  );
}
