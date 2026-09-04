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
  { title: string; icon: React.ElementType }
> = {
  diary: { title: 'Diário do Mestre', icon: BookOpen },
  rules: { title: 'Regras', icon: Scale },
  scenes: { title: 'Cenas', icon: Clapperboard },
  soundpad: { title: 'Soundpad', icon: Music },
  table: { title: 'Tabelas', icon: Table },
  roulette: { title: 'Roleta', icon: Dices },
  notes: { title: 'Anotações', icon: NotebookPen },
};

export default function SubPanelPlaceholder({
  panelId,
}: {
  panelId: SubPanelId;
}) {
  const details = PANEL_DETAILS[panelId];
  const Icon = details.icon;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#121214]/80 border border-[#323238] rounded-xl overflow-hidden shadow-xl p-4 transition-all hover:border-[#8257e5]/50">
      <div className="w-16 h-16 bg-[#202024] rounded-full flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-[#8257e5]" />
      </div>
      <h3 className="text-xl font-semibold text-[#e1e1e6] mb-2">
        {details.title}
      </h3>
      <p className="text-sm text-[#a8a8b3] text-center max-w-[80%]">
        Em construção. Espaço reservado para a interface de {details.title}.
      </p>
    </div>
  );
}
