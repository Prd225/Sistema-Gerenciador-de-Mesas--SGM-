import { Sparkles, Dices } from 'lucide-react';

export interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  progress?: number | null;
  fullscreen?: boolean;
  className?: string;
}

export default function LoadingScreen({
  title = 'Carregando Mesa...',
  subtitle = 'Sincronizando dados e preparando o mapa...',
  progress = null,
  fullscreen = true,
  className = '',
}: LoadingScreenProps) {
  const isDeterminate = typeof progress === 'number' && !isNaN(progress);
  const clampedProgress = isDeterminate
    ? Math.min(100, Math.max(0, Math.round(progress!)))
    : 0;

  return (
    <div
      className={`
        ${fullscreen ? 'fixed inset-0 z-[999]' : 'absolute inset-0 z-50'}
        flex flex-col items-center justify-center p-6
        bg-[#09090b]/90 backdrop-blur-md
        select-none animate-in fade-in duration-200
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {/* Luz ambiente de fundo (Glow) */}
      <div className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-gradient-to-tr from-[#8257e5]/20 via-purple-600/10 to-amber-500/15 blur-3xl pointer-events-none animate-pulse-subtle" />

      {/* Caixa de Conteúdo */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm sm:max-w-md w-full">
        {/* Ícone Emblemático RPG com Animação */}
        <div className="relative mb-5 flex items-center justify-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#141418] border border-[#323238] shadow-[0_0_25px_rgba(130,87,229,0.35)] flex items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-[#8257e5]/20 via-transparent to-amber-500/10" />
            <Dices className="w-8 h-8 sm:w-10 sm:h-10 text-[#ffd700] animate-bounce filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
          </div>

          <Sparkles className="w-5 h-5 text-[#8257e5] absolute -top-1.5 -right-1.5 animate-spin-once" />
        </div>

        {/* Título Principal */}
        <h2 className="text-lg sm:text-xl font-bold tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)] flex items-center gap-2">
          <span>{title}</span>
        </h2>

        {/* Subtítulo / Mensagem de Status */}
        {subtitle && (
          <p className="text-xs sm:text-sm text-[#a1a1aa] mt-1.5 mb-6 max-w-xs sm:max-w-sm leading-relaxed">
            {subtitle}
          </p>
        )}

        {/* Barrinha Clássica de Carregamento */}
        <div className="w-64 sm:w-80 flex flex-col gap-2">
          <div className="w-full h-2.5 sm:h-3 bg-[#131316] border border-[#2e2e34] rounded-full overflow-hidden p-0.5 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.8)]">
            {isDeterminate ? (
              <div
                className="h-full bg-gradient-to-r from-[#8257e5] via-[#a855f7] to-[#ffd700] rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(130,87,229,0.7)]"
                style={{ width: `${clampedProgress}%` }}
              />
            ) : (
              <div className="animate-indeterminate-bar bg-gradient-to-r from-transparent via-[#9d71fd] to-[#ffd700] shadow-[0_0_12px_rgba(157,113,253,0.85)]" />
            )}
          </div>

          {/* Porcentagem ou indicador de leitura */}
          <div className="flex items-center justify-between text-[11px] font-mono text-[#71717a] px-1">
            <span>Sincronizando</span>
            <span>{isDeterminate ? `${clampedProgress}%` : 'Aguarde...'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
