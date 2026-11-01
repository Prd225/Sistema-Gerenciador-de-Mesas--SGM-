export interface LoadingScreenProps {
  title?: string;
  subtitle?: string;
  progress?: number | null;
  fullscreen?: boolean;
  className?: string;
}

export default function LoadingScreen({
  title = 'Recarregando...',
  subtitle,
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
        flex flex-col items-center justify-center p-4
        bg-black/75 backdrop-blur-sm
        select-none animate-in fade-in duration-150
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center max-w-xs w-full text-center">
        {/* Barrinha direta e minimalista */}
        <div className="w-48 sm:w-56 h-1 bg-white/10 rounded-full overflow-hidden relative mb-2.5">
          {isDeterminate ? (
            <div
              className="h-full bg-[#8257e5] rounded-full transition-all duration-300 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          ) : (
            <div className="animate-indeterminate-bar bg-[#8257e5] rounded-full" />
          )}
        </div>

        {/* Letrinhas de descrição dizendo que está em recarregamento */}
        <p className="text-xs text-[#a1a1aa] font-medium tracking-wide">
          {title || 'Recarregando...'}
        </p>

        {subtitle && (
          <p className="text-[11px] text-[#71717a] mt-0.5">
            {subtitle}
          </p>
        )}

        {isDeterminate && (
          <span className="text-[10px] font-mono text-[#71717a] mt-1">
            {clampedProgress}%
          </span>
        )}
      </div>
    </div>
  );
}
