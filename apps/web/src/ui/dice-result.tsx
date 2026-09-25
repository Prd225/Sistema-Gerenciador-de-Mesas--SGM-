import { cn } from '@/lib/utils';

export interface DiceResultProps {
  formula: string;
  total: number;
  rolls?: number[];
  critical?: 'success' | 'failure';
  className?: string;
}

/**
 * Resultado de uma rolagem de dado. Total em `tabular-nums`.
 */
function DiceResult({
  formula,
  total,
  rolls,
  critical,
  className,
}: DiceResultProps) {
  return (
    <div
      data-slot="dice-result"
      className={cn(
        'inline-flex items-center gap-2 rounded-md border border-control bg-surface px-2 py-1',
        critical === 'success' && 'border-success/40 bg-success/10',
        critical === 'failure' && 'border-danger/40 bg-danger/10',
        className,
      )}
    >
      <span className="text-xs text-text-muted">{formula}</span>
      {rolls && rolls.length > 0 ? (
        <span className="text-xs tabular-nums text-text-subtle">
          ({rolls.join(', ')})
        </span>
      ) : null}
      <span
        className={cn(
          'text-base font-semibold tabular-nums text-text',
          critical === 'success' && 'text-success',
          critical === 'failure' && 'text-danger',
        )}
      >
        {total}
      </span>
    </div>
  );
}

export { DiceResult };
