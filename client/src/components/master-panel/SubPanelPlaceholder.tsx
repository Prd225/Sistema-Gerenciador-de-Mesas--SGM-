import React from 'react';
import type { SubPanelId } from '@/store/useMasterPanelStore';
import {
  BookOpen,
  Scale,
  Clapperboard,
  Music,
  Table,
  Dices,
  NotebookPen,
} from 'lucide-react';

const PANEL_DETAILS: Record<
  SubPanelId,
  { title: string; description: string; icon: React.ElementType }
> = {
  diary: {
    title: 'Diário da Sessão',
    description: 'Registro narrativo, pontos de interesse e acontecimentos',
    icon: BookOpen,
  },
  rules: {
    title: 'Grimório de Regras',
    description: 'Tópicos de regras rápidas, condições e referências',
    icon: Scale,
  },
  scenes: {
    title: 'Roteiro de Cenas',
    description: 'Planejamento de atos, transições e encontros',
    icon: Clapperboard,
  },
  soundpad: {
    title: 'Soundpad & Músicas',
    description: 'Trilha sonora, ambiente e efeitos sonoros sincronizados',
    icon: Music,
  },
  table: {
    title: 'Tabelas Táticas',
    description: 'Tabelas de itens, tesouros e sorteios rápidos',
    icon: Table,
  },
  roulette: {
    title: 'Roletas da Sorte',
    description: 'Roletas visuais animadas para sorteios e eventos',
    icon: Dices,
  },
  notes: {
    title: 'Bloco de Notas',
    description: 'Editor livre de rascunhos e lembretes',
    icon: NotebookPen,
  },
};

export default function SubPanelPlaceholder({
  panelId,
}: {
  panelId: SubPanelId;
}) {
  const details = PANEL_DETAILS[panelId];
  const Icon = details.icon;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-app/60 border border-muted rounded-xl overflow-hidden backdrop-blur-sm shadow-xl p-4 transition-all hover:border-brand-purple/50">
      <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-brand-purple" />
      </div>
      <h3 className="text-xl font-semibold text-main mb-1">{details.title}</h3>
      <p className="text-xs text-brand-purple font-medium text-center mb-2">
        {details.description}
      </p>
      <p className="text-xs text-muted-custom/70 text-center max-w-[80%]">
        Em construção. Espaço reservado para a interface de {details.title}.
      </p>
    </div>
  );
}
