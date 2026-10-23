import { useEffect } from 'react';
import { Film, Sparkles, X } from 'lucide-react';
import { useCampaignStore } from '@/store/useCampaignStore';

let sharedAudioCtx: AudioContext | null = null;

const playSceneChime = () => {
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

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(440, now); // A4
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.1);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.7);
  } catch {
    // Silencia restrições de autoplay do navegador
  }
};

export default function PlayerSceneNotification() {
  const sceneNotification = useCampaignStore((state) => state.sceneNotification);
  const dismiss = useCampaignStore((state) => state.dismissSceneNotification);

  useEffect(() => {
    if (sceneNotification === null) return;

    playSceneChime();

    const timer = setTimeout(() => {
      dismiss();
    }, 5500);

    return () => clearTimeout(timer);
  }, [sceneNotification, dismiss]);

  if (sceneNotification === null) return null;

  return (
    <div className="pointer-events-auto select-none animate-in slide-in-from-bottom-8 fade-in duration-300 ease-out max-w-[92vw] sm:max-w-md">
      <div
        onClick={dismiss}
        className="group relative flex items-center gap-3.5 px-4 py-3 bg-[#18181b]/95 hover:bg-[#1f1f23] border border-purple-500/50 hover:border-purple-400 shadow-[0_12px_40px_rgba(0,0,0,0.85)] backdrop-blur-md rounded-2xl cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
        title="Clique para dispensar"
      >
        {/* Glow de fundo */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500/20 via-fuchsia-500/10 to-purple-500/20 rounded-2xl blur-sm opacity-50 group-hover:opacity-100 transition-opacity pointer-events-none" />

        {/* Ícone com pulso */}
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-300 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-purple-400 opacity-25" />
          <Film className="w-5 h-5 text-purple-400" />
        </div>

        {/* Textos */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-purple-400">
            <Sparkles className="w-3 h-3 text-purple-300 animate-pulse" />
            <span>Transição de Cena</span>
          </div>
          <p className="text-base font-extrabold text-white tracking-wide mt-0.5">
            Cena — {sceneNotification}
          </p>
        </div>

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
