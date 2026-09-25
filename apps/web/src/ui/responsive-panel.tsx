import type { ReactNode } from 'react';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/ui/drawer';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/ui/dialog';

export interface ResponsivePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  /** Acima de 768px: "sheet" (padrao) ou "dialog". */
  desktopVariant?: 'sheet' | 'dialog';
  className?: string;
}

/**
 * Decide o continer certo pela largura da tela (docs/specs/ui-design-system.md,
 * secao 4): Drawer abaixo de 768px, Sheet ou Dialog a partir dali. As telas
 * não escolhem — só usam este componente.
 */
function ResponsivePanel({
  open,
  onOpenChange,
  title,
  description,
  children,
  desktopVariant = 'sheet',
  className,
}: ResponsivePanelProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)');

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className={className}>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            {description ? (
              <DrawerDescription>{description}</DrawerDescription>
            ) : null}
          </DrawerHeader>
          {children}
        </DrawerContent>
      </Drawer>
    );
  }

  if (desktopVariant === 'dialog') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={className}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className={className}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description ? (
            <SheetDescription>{description}</SheetDescription>
          ) : null}
        </SheetHeader>
        {children}
      </SheetContent>
    </Sheet>
  );
}

export { ResponsivePanel };
