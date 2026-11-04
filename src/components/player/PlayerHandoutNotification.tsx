import { useEffect, useState, useRef } from 'react';
import { Scroll, Sparkles, X, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePlayerHandoutsStore } from '@/store/usePlayerHandoutsStore';

let sharedAudioCtx: AudioContext | null = null;

const playNotificationChime = () => {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
    const ctx = sharedAudioCtx;
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.08); // A5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.08, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.6);
  } catch {
    // Silencia restrições de autoplay do navegador
  }
};

export default function PlayerHandoutNotification() {
  const notification = usePlayerHandoutsStore((state) => state.revealNotification);
  const dismiss = usePlayerHandoutsStore((state) => state.dismissRevealNotification);
  const openRevealedHandout = usePlayerHandoutsStore((state) => state.openRevealedHandout);

  const [dragY, setDragY] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const touchStartRef = useRef<number | null>(null);

  useEffect(() => {
    if (!notification) {
      setDragY(0);
      setIsExiting(false);
      return;
    }

    playNotificationChime();

    // Notificação rápida: fecha automaticamente após 3.8 segundos
    const timer = setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => {
        dismiss();
      }, 180);
    }, 3800);

    return () => clearTimeout(timer);
  }, [notification, dismiss]);

  if (!notification) return null;

  const count = notification.count;
  const messageHeader =
    count > 1 ? `${count} documentos revelados!` : 'Documento revelado!';

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
    if (dragY < -26) {
      setIsExiting(true);
      setTimeout(() => {
        dismiss();
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
      className="pointer-events-auto select-none w-full animate-in slide-in-from-top-4 fade-in duration-200 ease-out"
      style={{
        transform: isExiting ? 'translateY(-120%)' : `translateY(${dragY}px)`,
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
        onClick={() => openRevealedHandout(notification.handout)}
        className="group relative flex flex-col px-3.5 pt-1.5 pb-2.5 bg-[#18181b]/98 hover:bg-[#1f1f23] border border-amber-500/60 hover:border-amber-400 shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl rounded-2xl cursor-pointer transition-colors duration-150 active:scale-[0.99] touch-pan-y"
        title="Toque para ver o documento revelado (ou arraste para cima para dispensar)"
      >
        {/* Glow sutil */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Indicador de deslizar para cima */}
        <div className="w-8 h-1 bg-amber-400/30 rounded-full mx-auto mb-1.5 shrink-0" />

        <div className="relative flex items-center gap-3">
          {/* Ícone com pulso */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-amber-400 opacity-20" />
            <Scroll className="w-4 h-4 text-amber-400" />
          </div>

          {/* Textos */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
              <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
              <span>{messageHeader}</span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-white truncate max-w-[170px] sm:max-w-[240px]">
              {notification.title}
            </p>
          </div>

          {/* Botão Ver */}
          <Button
            size="xs"
            onClick={(e) => {
              e.stopPropagation();
              openRevealedHandout(notification.handout);
            }}
            className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-7 px-2.5 rounded-lg shadow shrink-0 flex items-center gap-1 active:scale-95"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver</span>
          </Button>

          {/* Fechar Notificação */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              dismiss();
            }}
            className="text-[#a1a1aa] hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors shrink-0"
            title="Dispensar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
