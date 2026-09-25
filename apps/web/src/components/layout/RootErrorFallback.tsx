import type { FallbackProps } from 'react-error-boundary';
import { AlertTriangle, RotateCcw, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/ui/button';
import { clearWorkingSession } from '@/lib/saveHelpers';

export default function RootErrorFallback({
  error,
  resetErrorBoundary,
}: FallbackProps) {
  const handleHardReset = async () => {
    if (
      window.confirm(
        'Isso limpará a sessão temporária em cache e recarregará a aplicação. Deseja continuar?',
      )
    ) {
      await clearWorkingSession();
      window.location.reload();
    }
  };

  return (
    <div className="h-screen w-screen bg-[#121214] text-[#e1e1e6] flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-lg w-full bg-[#1a1a1e] border border-[#323238] rounded-xl p-6 shadow-2xl flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold text-white">
            Falha Inesperada na Interface
          </h1>
          <p className="text-xs text-[#a8a8b3]">
            Ocorreu um erro durante a renderização do sistema. Os dados salvos
            nas campanhas não foram comprometidos.
          </p>
        </div>

        {error instanceof Error && error.message && (
          <div className="w-full bg-[#121214] border border-[#323238] rounded-md p-3 text-left overflow-x-auto max-h-36 text-xs font-mono text-red-300">
            {error.message}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-2 w-full pt-2">
          <Button
            onClick={resetErrorBoundary}
            className="bg-[#8257e5] hover:bg-[#9466ff] text-white text-xs flex items-center gap-2"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Tentar Novamente
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="border-[#323238] text-[#e1e1e6] hover:bg-[#202024] text-xs flex items-center gap-2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recarregar Página
          </Button>

          <Button
            variant="ghost"
            onClick={handleHardReset}
            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs flex items-center gap-2"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Limpar Sessão
          </Button>
        </div>
      </div>
    </div>
  );
}
