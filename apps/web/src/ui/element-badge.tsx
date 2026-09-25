import type { ComponentProps } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

export type Element = 'sangue' | 'morte' | 'conhecimento' | 'energia' | 'medo';

const elementLabels: Record<Element, string> = {
  sangue: 'Sangue',
  morte: 'Morte',
  conhecimento: 'Conhecimento',
  energia: 'Energia',
  medo: 'Medo',
};

const elementBadgeVariants = cva(
  'inline-flex items-center rounded-sm border px-1.5 py-0.5 text-xs font-medium',
  {
    variants: {
      element: {
        sangue:
          'border-element-sangue/30 bg-element-sangue/10 text-element-sangue',
        morte: 'border-element-morte/30 bg-element-morte/10 text-element-morte',
        conhecimento:
          'border-element-conhecimento/30 bg-element-conhecimento/10 text-element-conhecimento',
        energia:
          'border-element-energia/30 bg-element-energia/10 text-element-energia',
        medo: 'border-element-medo/30 bg-element-medo/10 text-element-medo',
      },
    },
  },
);

export interface ElementBadgeProps
  extends ComponentProps<'span'>, VariantProps<typeof elementBadgeVariants> {
  element: Element;
}

/**
 * Marca um elemento do sistema (sangue, morte, conhecimento, energia, medo):
 * texto na cor do elemento, borda a 30% e fundo a 10% (docs/specs/ui-design-system.md).
 */
function ElementBadge({ element, className, ...props }: ElementBadgeProps) {
  return (
    <span
      data-slot="element-badge"
      className={cn(elementBadgeVariants({ element }), className)}
      {...props}
    >
      {elementLabels[element]}
    </span>
  );
}

export { ElementBadge, elementBadgeVariants, elementLabels };
