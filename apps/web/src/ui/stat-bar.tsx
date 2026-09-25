import { cn } from '@/lib/utils';

export type StatKind = 'pv' | 'pe' | 'san' | 'pd';

const statLabels: Record<StatKind, string> = {
  pv: 'PV',
  pe: 'PE',
  san: 'SAN',
  pd: 'PD',
};

const statColors: Record<StatKind, string> = {
  pv: 'bg-danger',
  pe: 'bg-primary',
  san: 'bg-element-conhecimento',
  pd: 'bg-success',
};

export interface StatBarProps {
  kind: StatKind;
  value: number;
  max: number;
  className?: string;
}

/**
 * Barra de PV, PE, SAN ou PD. Numeros em `tabular-nums`
 * (docs/specs/ui-design-system.md).
 */
function StatBar({ kind, value, max, className }: StatBarProps) {
  const safeMax = max > 0 ? max : 1;
  const percent = Math.max(0, Math.min(100, (value / safeMax) * 100));

  return (
    <div
      data-slot="stat-bar"
      className={cn('flex items-center gap-2', className)}
    >
      <span className="w-8 shrink-0 text-xs font-medium text-text-muted">
        {statLabels[kind]}
      </span>
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={safeMax}
        aria-valuenow={value}
        className="h-2 flex-1 overflow-hidden rounded-sm bg-surface-sunken"
      >
        <div
          className={cn(
            'h-full transition-all duration-fast',
            statColors[kind],
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
      <span className="w-14 shrink-0 text-right text-xs tabular-nums text-text-muted">
        {value}/{max}
      </span>
    </div>
  );
}

export { StatBar, statLabels };
