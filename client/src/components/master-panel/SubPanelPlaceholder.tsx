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
    <div className="w-full h-full flex flex-col items-center justify-center bg-app/60 border border-muted rounded-xl overflow-hidden backdrop-blur-sm shadow-xl p-4 transition-all hover:border-brand-purple/50">
      <div className="w-16 h-16 bg-surface-elevated rounded-full flex items-center justify-center mb-4 shadow-inner">
        <Icon className="w-8 h-8 text-brand-purple" />
      </div>
      <h3 className="text-xl font-semibold text-main mb-2">{details.title}</h3>
      <p className="text-sm text-muted-custom text-center max-w-[80%]">
        Em construção. Espaço reservado para a interface de {details.title}.
      </p>
    </div>
  );
}
