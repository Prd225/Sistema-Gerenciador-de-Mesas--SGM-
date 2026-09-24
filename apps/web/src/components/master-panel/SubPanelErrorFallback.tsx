import type { FallbackProps } from 'react-error-boundary';
import { AlertCircle, RotateCcw, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { SubPanelId } from '@/store/useMasterPanelStore';

const PANEL_NAMES: Record<SubPanelId, string> = {
  diary: 'Diário do Mestre',
  rules: 'Regras',
  scenes: 'Cenas',
  soundpad: 'Soundpad',
  table: 'Tabelas',
  roulette: 'Roletas',
  notes: 'Anotações',
};

interface SubPanelErrorFallbackProps extends FallbackProps {
  panelId: string;
  onClose?: () => void;
}

export default function SubPanelErrorFallback({
  error,
  resetErrorBoundary,
  panelId,
  onClose,
}: SubPanelErrorFallbackProps) {
  const panelName = PANEL_NAMES[panelId as SubPanelId] || 'Subpainel';

  return (
    <div className="flex flex-col items-center justify-center h-full w-full p-4 text-center bg-[#121214] text-[#e1e1e6] gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
        <AlertCircle className="w-5 h-5" />
      </div>

      <div className="flex flex-col gap-1 max-w-xs">
        <h3 className="text-sm font-semibold text-white">
          Falha no painel: {panelName}
        </h3>
        <p className="text-xs text-[#a8a8b3]">
          Ocorreu um erro interno de renderização neste subpainel. Os outros
          painéis permanecem operacionais.
        </p>
      </div>

      {error instanceof Error && error.message && (
        <div className="bg-[#1a1a1e] border border-[#323238] rounded p-2 text-left max-w-xs w-full overflow-x-auto text-[0.7rem] font-mono text-red-400 max-h-24">
          {error.message}
        </div>
      )}

      <div className="flex items-center gap-2 mt-1">
        <Button
          size="sm"
          onClick={resetErrorBoundary}
          className="bg-[#8257e5] hover:bg-[#9466ff] text-white text-xs h-7 px-3 flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3" />
          Tentar Novamente
        </Button>

        {onClose && (
          <Button
            size="sm"
            variant="outline"
            onClick={onClose}
            className="border-[#323238] text-[#e1e1e6] hover:bg-[#202024] text-xs h-7 px-3 flex items-center gap-1.5"
          >
            <X className="w-3 h-3" />
            Fechar
          </Button>
        )}
      </div>
    </div>
  );
}
