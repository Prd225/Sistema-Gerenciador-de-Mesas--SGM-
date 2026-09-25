import { useMasterPanelStore, type SlotId } from '@/store/useMasterPanelStore';
import { ChevronDown, Sparkles } from 'lucide-react';
import { ErrorBoundary } from 'react-error-boundary';
import MasterPanelMenu from './MasterPanelMenu';
import SubPanelPlaceholder from './SubPanelPlaceholder';
import SubPanelErrorFallback from './SubPanelErrorFallback';
import MasterDiary from './diary/MasterDiary';
import MasterRules from './rules/MasterRules';
import MasterNotes from './notes/MasterNotes';
import MasterTables from './tables/MasterTables';
import MasterRoulettes from './roulettes/MasterRoulettes';
import MasterSoundpad from './soundpad/MasterSoundpad';
import ScenesPanel from './scenes/ScenesPanel';

function PanelDispatcher({ panelId }: { panelId: string }) {
  if (panelId === 'diary') return <MasterDiary />;
  if (panelId === 'rules') return <MasterRules />;
  if (panelId === 'notes') return <MasterNotes />;
  if (panelId === 'table') return <MasterTables />;
  if (panelId === 'roulette') return <MasterRoulettes />;
  if (panelId === 'soundpad') return <MasterSoundpad />;
  if (panelId === 'scenes') return <ScenesPanel />;
  return <SubPanelPlaceholder panelId={panelId as any} />;
}

function RenderPanel({ panelId, slot }: { panelId: string; slot: SlotId }) {
  const setSlot = useMasterPanelStore((state) => state.setSlot);

  return (
    <ErrorBoundary
      key={panelId}
      FallbackComponent={(props) => (
        <SubPanelErrorFallback
          {...props}
          panelId={panelId}
          onClose={() => setSlot(slot, null)}
        />
      )}
    >
      <PanelDispatcher panelId={panelId} />
    </ErrorBoundary>
  );
}

export default function MasterPanelOverlay() {
  const isOpen = useMasterPanelStore((state) => state.isOpen);
  const toggleOpen = useMasterPanelStore((state) => state.toggleOpen);
  const layout = useMasterPanelStore((state) => state.layout);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col pointer-events-auto bg-[#09090bfa] animate-in fade-in duration-200">
      {/* Cabeçalho do Painel */}
      <div className="relative flex flex-col items-center pt-8 pb-2 w-full">
        {/* Decorative GM Title */}
        <div className="absolute left-6 top-4 flex items-center gap-2 opacity-60">
          <Sparkles className="w-5 h-5 text-[#8257e5]" />
          <span className="text-[#8257e5] font-semibold tracking-wider text-sm uppercase">
            Painel do Mestre
          </span>
        </div>

        {/* Aba de Fechar */}
        {/* Faixa inteira do topo fecha o painel (44 px de altura); a pilula
            no centro mostra que a area e clicavel */}
        <button
          onClick={toggleOpen}
          aria-label="Fechar Painel do Mestre"
          className="group absolute inset-x-0 top-0 flex h-11 items-start justify-center outline-none transition-colors duration-150 hover:bg-surface/40"
        >
          <span className="flex h-7 min-w-48 items-center justify-center gap-1.5 rounded-b-xl border border-t-0 border-control bg-surface px-6 text-xs font-semibold uppercase tracking-wider text-primary shadow-sm transition-[background-color,transform] duration-150 group-hover:bg-control group-active:scale-95 group-focus-visible:ring-2 group-focus-visible:ring-primary">
            <ChevronDown className="h-4 w-4 transition-transform duration-150 group-hover:translate-y-0.5" />
            Fechar
          </span>
        </button>

        <div className="mt-2">
          <MasterPanelMenu />
        </div>
      </div>

      {/* Grid de Sub-Painéis */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Esquerda (40%) */}
        <div className="flex-[4] flex flex-col h-full bg-[#121214]/40 rounded-xl overflow-hidden border border-[#323238]/50">
          {layout.left ? (
            <RenderPanel panelId={layout.left} slot="left" />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#4d4d57] font-medium italic">
              Nenhum painel selecionado
            </div>
          )}
        </div>

        {/* Centro (20%) */}
        <div className="flex-[2] flex flex-col h-full bg-[#121214]/40 rounded-xl overflow-hidden border border-[#323238]/50">
          {layout.center ? (
            <RenderPanel panelId={layout.center} slot="center" />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#4d4d57] font-medium italic">
              Nenhum painel selecionado
            </div>
          )}
        </div>

        {/* Direita (40%) */}
        <div className="flex-[4] flex flex-col h-full bg-[#121214]/40 rounded-xl overflow-hidden border border-[#323238]/50">
          {layout.right ? (
            <RenderPanel panelId={layout.right} slot="right" />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#4d4d57] font-medium italic">
              Nenhum painel selecionado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
