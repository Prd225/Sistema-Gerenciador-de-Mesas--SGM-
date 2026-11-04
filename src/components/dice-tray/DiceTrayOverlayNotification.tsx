import { useEffect, useState, useRef } from 'react';
import { useDiceTrayStore } from '@/store/useDiceTrayStore';
import { Sparkles, Skull, Dices } from 'lucide-react';

export default function DiceTrayOverlayNotification() {
  const activeNotification = useDiceTrayStore((state) => state.activeNotification);
  const dismissNotification = useDiceTrayStore((state) => state.dismissNotification);
  const isOverlayEnabled = useDiceTrayStore((state) => state.isOverlayEnabled);
  const toggleOpen = useDiceTrayStore((state) => state.toggleOpen);

  const [dragY, setDragY] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!activeNotification) {
      setDragY(0);
      setIsExiting(false);
      return;
    }

    // Notificação rápida: fecha automaticamente após 3.5 segundos
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        dismissNotification();
      }, 180);
    }, 3500);

    return () => clearTimeout(timer);
  }, [activeNotification, dismissNotification]);

  if (!isOverlayEnabled || !activeNotification) return null;

  const isCrit = activeNotification.outcomeTier === 'crit';
  const isFumble = activeNotification.outcomeTier === 'fumble';
  const isSuccess = activeNotification.outcomeTier === 'success';

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartRef.current;
    if (deltaY < 0) {
      setDragY(deltaY);
    }
  };

  const handleTouchEnd = () => {
    if (dragY < -24) {
      setIsExiting(true);
      setTimeout(() => {
        dismissNotification();
        setDragY(0);
        setIsExiting(false);
      }, 150);
    } else {
      setDragY(0);
    }
    touchStartRef.current = null;
  };

  return (
    <div
      className="fixed top-[calc(0.75rem+env(safe-area-inset-top,0px))] left-1/2 -translate-x-1/2 z-[250] pointer-events-none select-none w-[calc(100vw-1.5rem)] max-w-md animate-in fade-in slide-in-from-top-4 duration-200"
      style={{
        transform: isExiting
          ? 'translate3d(-50%, -120%, 0)'
          : `translate3d(-50%, ${dragY}px, 0)`,
        opacity: isExiting ? 0 : Math.max(0, 1 + dragY / 70),
        transition:
          touchStartRef.current !== null
            ? 'none'
            : 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease-out',
      }}
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={`pointer-events-auto flex flex-col px-3.5 pt-1.5 pb-2.5 rounded-2xl border bg-[#18181b]/98 backdrop-blur-xl shadow-[0_16px_40px_rgba(0,0,0,0.85)] touch-pan-y ${
          isCrit
            ? 'border-amber-400/80 bg-amber-950/30 shadow-[0_16px_40px_rgba(245,158,11,0.2)]'
            : isFumble
            ? 'border-red-500/80 bg-red-950/30 shadow-[0_16px_40px_rgba(239,68,68,0.2)]'
            : isSuccess
            ? 'border-emerald-500/60 bg-emerald-950/25'
            : 'border-[#3f3f46]'
        }`}
      >
        {/* Indicador sutil de arrastar para cima */}
        <div className="w-8 h-1 bg-white/20 rounded-full mx-auto mb-1.5 shrink-0" />

        <div className="flex items-center justify-between gap-2.5">
          <div
            onClick={toggleOpen}
            className="flex items-center gap-2.5 cursor-pointer group flex-1 min-w-0"
            title="Toque para abrir a Bandeja de Dados (ou arraste para cima para dispensar)"
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${
                isCrit
                  ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                  : isFumble
                  ? 'bg-red-500/20 border-red-500 text-red-400'
                  : 'bg-[#202024] border-[#323238] text-[#8257e5]'
              }`}
            >
              {isCrit ? (
                <Sparkles className="w-5 h-5 animate-pulse text-amber-300" />
              ) : isFumble ? (
                <Skull className="w-5 h-5 animate-pulse text-red-400" />
              ) : (
                <Dices className="w-5 h-5 group-hover:rotate-12 transition-transform text-[#8257e5]" />
              )}
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white truncate max-w-[140px] sm:max-w-[200px]">
                  {activeNotification.senderName}
                </span>
                <span className="text-[10px] text-[#a1a1aa] font-mono shrink-0">
                  {activeNotification.formula}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span
                  className={`text-[11px] font-extrabold uppercase tracking-wider ${
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

          <div className="flex items-center gap-2 pl-3 border-l border-[#2e2e33] shrink-0">
            <span
              className={`font-mono font-black text-2xl leading-none ${
                isCrit ? 'text-amber-400' : isFumble ? 'text-red-400' : 'text-white'
              }`}
            >
              {activeNotification.total}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
