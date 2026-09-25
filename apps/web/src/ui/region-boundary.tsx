import type { ReactNode } from 'react';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';
import { AlertTriangleIcon, RotateCcwIcon } from 'lucide-react';
import { Button } from '@/ui/button';

export interface RegionBoundaryProps {
  children: ReactNode;
  /** Nome da regiao, usado na mensagem de erro (ex.: "Painel do mestre"). */
  region: string;
  /** Chave que, ao mudar, reseta o boundary automaticamente. */
  resetKey?: unknown;
}

function RegionFallback({
  region,
  resetErrorBoundary,
}: FallbackProps & { region: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-lg border border-control bg-surface p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full border border-danger/20 bg-danger/10 text-danger">
        <AlertTriangleIcon className="size-5" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-text">
          Falha em &quot;{region}&quot;
        </p>
        <p className="text-xs text-text-muted">
          Essa região travou, mas o resto do app continua funcionando.
        </p>
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={resetErrorBoundary}
        className="gap-1.5"
      >
        <RotateCcwIcon />
        Recarregar
      </Button>
    </div>
  );
}

/**
 * Error boundary reutilizavel para uma regiao da UI (modal, sidebar,
 * subpainel). O botao "Recarregar" reseta só essa regiao, não a app
 * inteira (docs/specs/ui-design-system.md, secao 5).
 */
function RegionBoundary({ children, region, resetKey }: RegionBoundaryProps) {
  return (
    <ErrorBoundary
      resetKeys={[resetKey]}
      FallbackComponent={(props) => (
        <RegionFallback {...props} region={region} />
      )}
    >
      {children}
    </ErrorBoundary>
  );
}

export { RegionBoundary };
