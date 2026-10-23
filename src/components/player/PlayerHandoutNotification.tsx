import { useEffect } from 'react';
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

  useEffect(() => {
    if (!notification) return;

    playNotificationChime();

    const timer = setTimeout(() => {
      dismiss();
    }, 6500);

    return () => clearTimeout(timer);
  }, [notification, dismiss]);

  if (!notification) return null;

  const count = notification.count;
  const messageHeader =
    count > 1 ? `${count} documentos foram Revelados!` : 'Um documento foi Revelado!';

  return (
    <div className="pointer-events-auto select-none animate-in slide-in-from-bottom-8 fade-in duration-300 ease-out max-w-[92vw] sm:max-w-md">
      <div
        onClick={() => openRevealedHandout(notification.handout)}
        className="group relative flex items-center gap-3.5 px-4 py-3 bg-[#18181b]/95 hover:bg-[#1f1f23] border border-amber-500/50 hover:border-amber-400 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-md rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        title="Clique para ver o documento revelado"
      >
        {/* Glow de fundo */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Ícone com pulso */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-amber-400 opacity-25" />
          <Scroll className="w-5 h-5 text-amber-400" />
        </div>

        {/* Textos */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
            <Sparkles className="w-3 h-3 text-amber-300 animate-pulse" />
            <span>{messageHeader}</span>
          </div>
          <p className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-[260px] mt-0.5">
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
          className="bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs h-7 px-3 rounded-lg shadow shrink-0 flex items-center gap-1"
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
          className="text-[#a1a1aa] hover:text-white p-1 rounded-md hover:bg-white/10 transition-colors ml-0.5 shrink-0"
          title="Dispensar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
