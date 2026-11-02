import { useEffect } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import { Sparkles, Skull, X, Dices } from 'lucide-react';

export default function DiceTrayOverlayNotification() {
  const activeNotification = useDiceTrayStore((state) => state.activeNotification);
  const dismissNotification = useDiceTrayStore((state) => state.dismissNotification);
  const isOverlayEnabled = useDiceTrayStore((state) => state.isOverlayEnabled);
  const toggleOpen = useDiceTrayStore((state) => state.toggleOpen);

  useEffect(() => {
    if (!activeNotification) return;

    // Fecha o alerta automaticamente após 5.5 segundos
    const timer = setTimeout(() => {
      dismissNotification();
    }, 5500);

    return () => clearTimeout(timer);
  }, [activeNotification, dismissNotification]);

  if (!isOverlayEnabled || !activeNotification) return null;

  const isCrit = activeNotification.outcomeTier === 'crit';
  const isFumble = activeNotification.outcomeTier === 'fumble';
  const isSuccess = activeNotification.outcomeTier === 'success';

  return (
    <div className="fixed bottom-14 left-1/2 -translate-x-1/2 z-[140] pointer-events-none select-none max-w-[92vw] sm:max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div
        className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl border bg-[#18181b]/95 backdrop-blur-md shadow-2xl ${
          isCrit
            ? 'border-amber-400 bg-amber-950/20'
            : isFumble
            ? 'border-red-500 bg-red-950/20'
            : isSuccess
            ? 'border-emerald-500/50 bg-emerald-950/20'
            : 'border-[#323238]'
        }`}
      >
        <div
          onClick={toggleOpen}
          className="flex items-center gap-3 cursor-pointer group"
          title="Clique para abrir a Bandeja de Dados"
        >
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
              isCrit
                ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                : isFumble
                ? 'bg-red-500/20 border-red-500 text-red-400'
                : 'bg-[#202024] border-[#323238] text-[#8257e5]'
            }`}
          >
            {isCrit ? (
              <Sparkles className="w-5 h-5 animate-pulse" />
            ) : isFumble ? (
              <Skull className="w-5 h-5 animate-pulse" />
            ) : (
              <Dices className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-white">
                {activeNotification.senderName}
              </span>
              <span className="text-[10px] text-[#71717a] font-mono">
                {activeNotification.formula}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-extrabold uppercase tracking-wider ${
                  isCrit
                    ? 'text-amber-400'
                    : isFumble
                    ? 'text-red-400'
                    : isSuccess
                    ? 'text-emerald-400'
                    : 'text-[#a1a1aa]'
                }`}
              >
                {activeNotification.outcomeLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pl-2 border-l border-[#27272a]">
          <span
            className={`font-mono font-black text-2xl leading-none ${
              isCrit ? 'text-amber-400' : isFumble ? 'text-red-400' : 'text-white'
            }`}
          >
            {activeNotification.total}
          </span>

          <button
            type="button"
            onClick={dismissNotification}
            className="p-1 rounded-md text-[#71717a] hover:text-white hover:bg-white/10 transition-colors"
            title="Fechar notificação"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
