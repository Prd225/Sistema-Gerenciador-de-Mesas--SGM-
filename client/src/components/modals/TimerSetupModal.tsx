import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTimerStore, type TimerUrgencyMode } from '@/store/useTimerStore';
import { useCampaignStore } from '@/store/useCampaignStore';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Flame,
  AlertTriangle,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface TimerSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function TimerSetupModal({
  open,
  onOpenChange,
}: TimerSetupModalProps) {
  const {
    totalSeconds,
    isRunning,
    urgencyMode,
    setTotalSeconds,
    addSeconds,
    setUrgencyMode,
    start,
    pause,
    reset,
  } = useTimerStore();

  const { setUrgency, urgency } = useCampaignStore();

  // Local state for the minutes input field
  const [minutesInput, setMinutesInput] = useState<string>('');

  // Sync minutesInput when modal opens or when totalSeconds changes externally
  useEffect(() => {
    if (open) {
      const currentMins = Math.floor(totalSeconds / 60);
      setMinutesInput(currentMins > 0 ? currentMins.toString() : '');
    }
  }, [open, totalSeconds]);

  const formatDisplayTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleApplyMinutes = (mins: number) => {
    const valid = Math.max(0, Math.floor(mins));
    setTotalSeconds(valid * 60);
    setMinutesInput(valid > 0 ? valid.toString() : '');
  };

  const handleInputChange = (val: string) => {
    setMinutesInput(val);
    const parsed = parseInt(val, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setTotalSeconds(parsed * 60);
    }
  };

  const handleAddPreset = (mins: number) => {
    addSeconds(mins * 60);
    const newTotal = totalSeconds + mins * 60;
    setMinutesInput(Math.floor(newTotal / 60).toString());
  };

  const handleStepMinutes = (delta: number) => {
    const currentMins = Math.floor(totalSeconds / 60);
    const nextMins = Math.max(0, currentMins + delta);
    setTotalSeconds(nextMins * 60);
    setMinutesInput(nextMins.toString());
  };

  const handleSelectUrgency = (mode: TimerUrgencyMode) => {
    setUrgencyMode(mode);

    // Synchronize with campaign urgency countdown when appropriate
    if (mode === 'critical') {
      if (urgency === null || urgency > 3) {
        setUrgency(3);
      }
    } else if (mode === 'tension') {
      if (urgency === null || urgency < 3 || urgency > 6) {
        setUrgency(5);
      }
    }
  };

  // Color styles based on urgency mode
  const getUrgencyBadge = () => {
    switch (urgencyMode) {
      case 'critical':
        return {
          label: 'Modo Crítico',
          icon: <Flame className="w-3.5 h-3.5 text-brand-red animate-pulse" />,
          classes: 'bg-red-500/15 text-brand-red border-red-500/30',
        };
      case 'tension':
        return {
          label: 'Modo Tensão',
          icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />,
          classes: 'bg-amber-500/15 text-amber-500 border-amber-500/30',
        };
      case 'normal':
      default:
        return {
          label: 'Modo Normal',
          icon: <ShieldCheck className="w-3.5 h-3.5 text-brand-green" />,
          classes: 'bg-brand-green/15 text-brand-green border-brand-green/30',
        };
    }
  };

  const badge = getUrgencyBadge();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-surface border border-subtle text-main sm:max-w-[460px] p-6 shadow-2xl">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-main flex items-center gap-2">
            <Clock className="w-5 h-5 text-brand-gold" />
            Configurar Temporizador
          </DialogTitle>
          <p className="text-xs text-muted-custom">
            Ajuste a contagem regressiva, presets rápidos e o nível de urgência
            da cena.
          </p>
        </DialogHeader>

        <div className="space-y-5 my-2">
          {/* Main Countdown Display */}
          <div className="flex flex-col items-center justify-center p-5 rounded-xl bg-app border border-subtle relative overflow-hidden transition-all">
            {/* Background Glow */}
            <div
              className={`absolute inset-0 opacity-10 pointer-events-none transition-colors duration-500 ${
                urgencyMode === 'critical'
                  ? 'bg-red-500'
                  : urgencyMode === 'tension'
                    ? 'bg-amber-500'
                    : 'bg-brand-purple'
              }`}
            />

            {/* Badges: Status & Urgency */}
            <div className="flex items-center gap-2 mb-2 z-10">
              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${badge.classes}`}
              >
                {badge.icon}
                <span>{badge.label}</span>
              </div>

              <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                  isRunning
                    ? 'bg-brand-green/10 text-brand-green border-brand-green/30'
                    : totalSeconds > 0
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/30'
                      : 'bg-surface border-subtle text-muted-custom'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isRunning
                      ? 'bg-brand-green animate-ping'
                      : totalSeconds > 0
                        ? 'bg-amber-500'
                        : 'bg-muted-custom'
                  }`}
                />
                <span>
                  {isRunning
                    ? 'Em Execução'
                    : totalSeconds > 0
                      ? 'Pausado'
                      : 'Zerado'}
                </span>
              </div>
            </div>

            {/* Big Digital Numbers */}
            <div
              className={`text-5xl font-mono font-black tracking-tight my-1 select-none z-10 transition-colors ${
                urgencyMode === 'critical'
                  ? 'text-brand-red drop-shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                  : urgencyMode === 'tension'
                    ? 'text-amber-500'
                    : 'text-main'
              }`}
            >
              {formatDisplayTime(totalSeconds)}
            </div>

            <span className="text-[0.7rem] text-muted-custom font-medium uppercase tracking-wider z-10">
              Minutos : Segundos
            </span>
          </div>

          {/* Quick Presets (+1 min, +5 min, +10 min, +15 min, +30 min) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-custom uppercase tracking-wider">
              Adicionar Tempo Rápido
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 5, 10, 15, 30].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => handleAddPreset(mins)}
                  className="flex items-center justify-center py-2 px-1 rounded-lg bg-surface-elevated hover:bg-brand-purple hover:text-white border border-subtle hover:border-brand-purple text-main font-semibold text-xs transition-all active:scale-95 shadow-sm cursor-pointer"
                >
                  +{mins} min
                </button>
              ))}
            </div>
          </div>

          {/* Numeric Field for Desired Minutes */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-custom uppercase tracking-wider">
              Definir Minutos Desejados
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1 flex items-center">
                <input
                  type="number"
                  min="0"
                  max="180"
                  placeholder="0"
                  value={minutesInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleApplyMinutes(Number(minutesInput) || 0);
                    }
                  }}
                  className="w-full h-10 px-3 bg-app border border-muted rounded-lg text-main text-base font-mono font-bold focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none transition-colors"
                />
                <span className="absolute right-3 text-xs text-muted-custom pointer-events-none font-medium">
                  minutos
                </span>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => handleApplyMinutes(Number(minutesInput) || 0)}
                className="h-10 px-3 border-subtle bg-surface-elevated hover:bg-brand-purple hover:text-white text-main text-xs font-semibold cursor-pointer transition-colors"
                title="Aplicar minutos definidos"
              >
                Definir
              </Button>

              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleStepMinutes(-1)}
                  className="h-10 w-10 border-subtle bg-surface-elevated hover:bg-surface text-main cursor-pointer"
                  title="Diminuir 1 minuto"
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => handleStepMinutes(1)}
                  className="h-10 w-10 border-subtle bg-surface-elevated hover:bg-surface text-main cursor-pointer"
                  title="Aumentar 1 minuto"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Urgency Mode Selector (Normal, Tensão, Crítico) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-custom uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-brand-gold" />
              Modo de Urgência
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* Normal */}
              <button
                type="button"
                onClick={() => handleSelectUrgency('normal')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  urgencyMode === 'normal'
                    ? 'bg-brand-green/10 border-brand-green text-brand-green shadow-sm ring-1 ring-brand-green/30'
                    : 'bg-surface-elevated border-subtle text-muted-custom hover:text-main hover:border-muted'
                }`}
              >
                <ShieldCheck className="w-4 h-4 mb-1" />
                <span className="text-xs font-bold">Normal</span>
                <span className="text-[0.65rem] opacity-75">Exploração</span>
              </button>

              {/* Tensão */}
              <button
                type="button"
                onClick={() => handleSelectUrgency('tension')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  urgencyMode === 'tension'
                    ? 'bg-amber-500/10 border-amber-500 text-amber-500 shadow-sm ring-1 ring-amber-500/30'
                    : 'bg-surface-elevated border-subtle text-muted-custom hover:text-main hover:border-muted'
                }`}
              >
                <AlertTriangle className="w-4 h-4 mb-1" />
                <span className="text-xs font-bold">Tensão</span>
                <span className="text-[0.65rem] opacity-75">Sob Pressão</span>
              </button>

              {/* Crítico */}
              <button
                type="button"
                onClick={() => handleSelectUrgency('critical')}
                className={`flex flex-col items-center justify-center p-2.5 rounded-lg border text-center transition-all cursor-pointer ${
                  urgencyMode === 'critical'
                    ? 'bg-red-500/15 border-brand-red text-brand-red shadow-sm ring-1 ring-red-500/40'
                    : 'bg-surface-elevated border-subtle text-muted-custom hover:text-main hover:border-muted'
                }`}
              >
                <Flame className="w-4 h-4 mb-1" />
                <span className="text-xs font-bold">Crítico</span>
                <span className="text-[0.65rem] opacity-75">
                  Perigo Iminente
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Action Controls: Iniciar Temporizador, Pausar, Zerar */}
        <DialogFooter className="mt-2 pt-3 border-t border-subtle flex-col sm:flex-row gap-2">
          <div className="flex items-center gap-2 flex-1 w-full">
            {!isRunning ? (
              <Button
                type="button"
                onClick={start}
                className="flex-1 bg-brand-green hover:opacity-90 text-white font-bold cursor-pointer"
              >
                <Play className="w-4 h-4 mr-1.5 fill-current" />
                Iniciar Temporizador
              </Button>
            ) : (
              <Button
                type="button"
                onClick={pause}
                variant="outline"
                className="flex-1 border-amber-500/50 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 font-bold cursor-pointer"
              >
                <Pause className="w-4 h-4 mr-1.5 fill-current" />
                Pausar
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              onClick={reset}
              className="border-subtle bg-transparent text-muted-custom hover:text-brand-red hover:border-red-500/50 hover:bg-red-500/10 cursor-pointer"
              title="Zerar Temporizador"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Zerar
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-subtle bg-transparent text-main hover:bg-surface-elevated cursor-pointer"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
