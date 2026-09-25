import * as React from 'react';
import { MinusIcon, PlusIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/button';

export interface NumberInputProps extends Omit<
  React.ComponentProps<'input'>,
  'type' | 'value' | 'defaultValue' | 'onChange'
> {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number) => void;
}

/**
 * Campo numerico com botoes de incremento/decremento. O shadcn (style
 * base-nova) nao tem um item pronto para isso; escrito a mao com os
 * tokens do design system.
 */
function NumberInput({
  className,
  value,
  defaultValue,
  min,
  max,
  step = 1,
  onValueChange,
  disabled,
  ...props
}: NumberInputProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = React.useState(defaultValue ?? 0);
  const currentValue = isControlled ? value : internalValue;

  const clamp = React.useCallback(
    (next: number) => {
      let result = next;
      if (min !== undefined) result = Math.max(min, result);
      if (max !== undefined) result = Math.min(max, result);
      return result;
    },
    [min, max],
  );

  const commit = React.useCallback(
    (next: number) => {
      const clamped = clamp(next);
      if (!isControlled) setInternalValue(clamped);
      onValueChange?.(clamped);
    },
    [clamp, isControlled, onValueChange],
  );

  return (
    <div
      data-slot="number-input"
      className={cn(
        'flex h-8 w-full items-center overflow-hidden rounded-md border border-input bg-transparent dark:bg-input/30',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="h-full rounded-none"
        disabled={disabled || (min !== undefined && currentValue <= min)}
        aria-label="Diminuir"
        onClick={() => commit(currentValue - step)}
      >
        <MinusIcon />
      </Button>
      <input
        {...props}
        type="number"
        inputMode="numeric"
        disabled={disabled}
        value={currentValue}
        min={min}
        max={max}
        step={step}
        onChange={(event) => {
          const parsed = Number(event.target.value);
          if (!Number.isNaN(parsed)) commit(parsed);
        }}
        className="h-full w-full min-w-0 flex-1 bg-transparent text-center text-sm tabular-nums outline-none [appearance:textfield]"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="h-full rounded-none"
        disabled={disabled || (max !== undefined && currentValue >= max)}
        aria-label="Aumentar"
        onClick={() => commit(currentValue + step)}
      >
        <PlusIcon />
      </Button>
    </div>
  );
}

export { NumberInput };
