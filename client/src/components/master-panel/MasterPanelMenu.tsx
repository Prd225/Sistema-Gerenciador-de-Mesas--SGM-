import React, { useState } from 'react';
import {
  useMasterPanelStore,
  type SubPanelId,
  type SlotId,
} from '@/store/useMasterPanelStore';
import {
  Settings,
  X,
  BookOpen,
  Scale,
  Clapperboard,
  Music,
  Table,
  Dices,
  NotebookPen,
} from 'lucide-react';
import { SimpleTooltip } from '@/components/ui/tooltip';

export interface PanelDefinition {
  id: SubPanelId;
  title: string;
  description: string;
  allowedSlots: SlotId[];
  icon: React.ElementType;
}

export const AVAILABLE_PANELS: PanelDefinition[] = [
  {
    id: 'diary',
    title: 'Diário da Sessão',
    description: 'Registro narrativo, pontos de interesse e acontecimentos',
    allowedSlots: ['left', 'right'],
    icon: BookOpen,
  },
  {
    id: 'rules',
    title: 'Grimório de Regras',
    description: 'Tópicos de regras rápidas, condições e referências',
    allowedSlots: ['left', 'right'],
    icon: Scale,
  },
  {
    id: 'scenes',
    title: 'Roteiro de Cenas',
    description: 'Planejamento de atos, transições e encontros',
    allowedSlots: ['center'],
    icon: Clapperboard,
  },
  {
    id: 'soundpad',
    title: 'Soundpad & Músicas',
    description: 'Trilha sonora, ambiente e efeitos sonoros sincronizados',
    allowedSlots: ['left', 'center', 'right'],
    icon: Music,
  },
  {
    id: 'table',
    title: 'Tabelas Táticas',
    description: 'Tabelas de itens, tesouros e sorteios rápidos',
    allowedSlots: ['left', 'right'],
    icon: Table,
  },
  {
    id: 'roulette',
    title: 'Roletas da Sorte',
    description: 'Roletas visuais animadas para sorteios e eventos',
    allowedSlots: ['left', 'right'],
    icon: Dices,
  },
  {
    id: 'notes',
    title: 'Bloco de Notas',
    description: 'Editor livre de rascunhos e lembretes',
    allowedSlots: ['left', 'center', 'right'],
    icon: NotebookPen,
  },
];

export default function MasterPanelMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const layout = useMasterPanelStore((state) => state.layout);
  const setSlot = useMasterPanelStore((state) => state.setSlot);

  return (
    <div className="relative">
      <SimpleTooltip content="Configurar painéis e posições" side="bottom">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 bg-surface-elevated hover:bg-surface border border-muted rounded-md px-4 py-1.5 text-main font-medium transition-colors shadow-lg cursor-pointer"
        >
          <Settings className="w-4 h-4" />
          MENU
        </button>
      </SimpleTooltip>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-84 bg-surface-elevated border border-muted rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-3 border-b border-muted bg-surface">
              <h3 className="font-semibold text-sm text-main">
                Configurar Painéis
              </h3>
              <SimpleTooltip content="Fechar menu" side="left">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-muted-custom hover:text-main transition-colors cursor-pointer p-0.5 rounded hover:bg-surface-elevated"
                >
                  <X className="w-4 h-4" />
                </button>
              </SimpleTooltip>
            </div>

            <div className="p-2 max-h-[340px] overflow-y-auto custom-scrollbar flex flex-col gap-1.5">
              {AVAILABLE_PANELS.map((panel) => {
                const Icon = panel.icon;
                const currentSlot = (Object.keys(layout) as SlotId[]).find(
                  (slot) => layout[slot] === panel.id,
                );

                return (
                  <div
                    key={panel.id}
                    className="flex flex-col gap-2 p-2 hover:bg-surface/80 rounded-lg transition-colors border border-transparent hover:border-subtle"
                  >
                    <SimpleTooltip content={panel.description} side="right">
                      <div className="flex items-center gap-2.5 cursor-help group">
                        <div className="p-1 rounded bg-surface border border-subtle/50 group-hover:border-brand-purple/50 transition-colors">
                          <Icon className="w-4 h-4 text-brand-purple shrink-0" />
                        </div>
                        <div className="flex flex-col min-w-0 flex-1">
                          <span className="text-sm font-medium text-main truncate leading-snug">
                            {panel.title}
                          </span>
                          <span className="text-[11px] text-muted-custom/70 truncate leading-snug">
                            {panel.description}
                          </span>
                        </div>
                      </div>
                    </SimpleTooltip>

                    <div className="flex items-center gap-1.5 pt-0.5">
                      {(['left', 'center', 'right'] as SlotId[]).map((slot) => {
                        const isAllowed = panel.allowedSlots.includes(slot);
                        const isSelected = currentSlot === slot;

                        const slotLabel =
                          slot === 'left'
                            ? 'Esq.'
                            : slot === 'center'
                              ? 'Centro'
                              : 'Dir.';

                        const slotName =
                          slot === 'left'
                            ? 'Painel Esquerdo'
                            : slot === 'center'
                              ? 'Painel Central'
                              : 'Painel Direito';

                        const tooltipContent = !isAllowed
                          ? `Indisponível no ${slotName}`
                          : isSelected
                            ? `Ativo no ${slotName} (clique para remover)`
                            : `Fixar no ${slotName}`;

                        return (
                          <SimpleTooltip
                            key={slot}
                            content={tooltipContent}
                            side="bottom"
                          >
                            <span className="flex-1 flex">
                              <button
                                disabled={!isAllowed}
                                onClick={() => {
                                  if (isSelected) setSlot(slot, null);
                                  else setSlot(slot, panel.id);
                                }}
                                className={`w-full text-xs py-1 rounded transition-colors ${
                                  isSelected
                                    ? 'bg-brand-purple text-white font-medium shadow-xs'
                                    : !isAllowed
                                      ? 'bg-app text-muted-custom/30 cursor-not-allowed border border-subtle/40'
                                      : 'bg-app text-muted-custom hover:bg-surface hover:text-main border border-subtle cursor-pointer'
                                }`}
                              >
                                {slotLabel}
                              </button>
                            </span>
                          </SimpleTooltip>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
