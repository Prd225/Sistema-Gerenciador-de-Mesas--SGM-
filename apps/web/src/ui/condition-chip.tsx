import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export interface ConditionChipProps {
  label: string;
  icon?: ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * Chip de condicao/status de um token (atordoado, envenenado...).
 */
function ConditionChip({
  label,
  icon,
  active = true,
  className,
}: ConditionChipProps) {
  return (
    <span
      data-slot="condition-chip"
      className={cn(
        'inline-flex items-center gap-1 rounded-sm border border-control bg-surface px-1.5 py-0.5 text-xs text-text',
        !active && 'opacity-50',
        className,
      )}
    >
      {icon ? (
        <span className="[&_svg]:size-3" aria-hidden>
          {icon}
        </span>
      ) : null}
      {label}
    </span>
  );
}

export { ConditionChip };
