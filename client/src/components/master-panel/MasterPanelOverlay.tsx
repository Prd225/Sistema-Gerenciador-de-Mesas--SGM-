import { useMasterPanelStore } from '@/store/useMasterPanelStore';
import { ChevronDown, Sparkles } from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/tooltip';
import MasterPanelMenu from './MasterPanelMenu';
import SubPanelPlaceholder from './SubPanelPlaceholder';
import MasterDiary from './diary/MasterDiary';

import MasterRules from './rules/MasterRules';
import MasterNotes from './notes/MasterNotes';
import MasterTables from './tables/MasterTables';
import MasterRoulettes from './roulettes/MasterRoulettes';
import SoundpadPanel from './soundpad/SoundpadPanel';

function RenderPanel({ panelId }: { panelId: string }) {
  if (panelId === 'diary') return <MasterDiary />;
  if (panelId === 'rules') return <MasterRules />;
  if (panelId === 'notes') return <MasterNotes />;
  if (panelId === 'table') return <MasterTables />;
  if (panelId === 'roulette') return <MasterRoulettes />;
  if (panelId === 'soundpad') return <SoundpadPanel />;
  return <SubPanelPlaceholder panelId={panelId as any} />;
}

export default function MasterPanelOverlay() {
  const isOpen = useMasterPanelStore((state) => state.isOpen);
  const toggleOpen = useMasterPanelStore((state) => state.toggleOpen);
  const layout = useMasterPanelStore((state) => state.layout);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col pointer-events-auto bg-canvas/95 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Cabeçalho do Painel */}
      <div className="relative flex flex-col items-center pt-8 pb-2 w-full">
        {/* Decorative GM Title */}
        <div className="absolute left-6 top-4 flex items-center gap-2 opacity-60">
          <Sparkles className="w-5 h-5 text-brand-purple" />
          <span className="text-brand-purple font-semibold tracking-wider text-sm uppercase">
            Painel do Mestre
          </span>
        </div>

        {/* Aba de Fechar */}
        <SimpleTooltip content="Fechar / Recolher Painel" side="bottom">
          <button
            onClick={toggleOpen}
            className="group flex flex-col items-center justify-center bg-surface-elevated hover:bg-surface border border-muted border-t-0 rounded-b-full w-24 h-6 transition-all shadow-md absolute top-0 left-1/2 -translate-x-1/2 cursor-pointer"
          >
            <ChevronDown className="w-4 h-4 text-brand-purple group-hover:translate-y-0.5 transition-transform" />
          </button>
        </SimpleTooltip>

        <div className="mt-2">
          <MasterPanelMenu />
        </div>
      </div>

      {/* Grid de Sub-Painéis */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Esquerda (40%) */}
        <div className="flex-[4] flex flex-col h-full bg-app/60 rounded-xl overflow-hidden border border-muted/50">
          {layout.left ? (
            <RenderPanel panelId={layout.left} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-custom gap-1 p-4 text-center">
              <span className="font-semibold text-sm text-main/70">
                Painel Esquerdo
              </span>
              <span className="text-xs text-muted-custom/70">
                Nenhum painel selecionado
              </span>
            </div>
          )}
        </div>

        {/* Centro (20%) */}
        <div className="flex-[2] flex flex-col h-full bg-app/60 rounded-xl overflow-hidden border border-muted/50">
          {layout.center ? (
            <RenderPanel panelId={layout.center} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-custom gap-1 p-4 text-center">
              <span className="font-semibold text-sm text-main/70">
                Painel Central
              </span>
              <span className="text-xs text-muted-custom/70">
                Nenhum painel selecionado
              </span>
            </div>
          )}
        </div>

        {/* Direita (40%) */}
        <div className="flex-[4] flex flex-col h-full bg-app/60 rounded-xl overflow-hidden border border-muted/50">
          {layout.right ? (
            <RenderPanel panelId={layout.right} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-custom gap-1 p-4 text-center">
              <span className="font-semibold text-sm text-main/70">
                Painel Direito
              </span>
              <span className="text-xs text-muted-custom/70">
                Nenhum painel selecionado
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
