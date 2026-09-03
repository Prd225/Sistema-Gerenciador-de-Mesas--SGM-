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

const AVAILABLE_PANELS: {
  id: SubPanelId;
  title: string;
  allowedSlots: SlotId[];
  icon: React.ElementType;
}[] = [
  {
    id: 'diary',
    title: 'Diário do Mestre',
    allowedSlots: ['left', 'right'],
    icon: BookOpen,
  },
  {
    id: 'rules',
    title: 'Regras',
    allowedSlots: ['left', 'right'],
    icon: Scale,
  },
  {
    id: 'scenes',
    title: 'Cenas',
    allowedSlots: ['center'],
    icon: Clapperboard,
  },
  { id: 'soundpad', title: 'Soundpad', allowedSlots: ['center'], icon: Music },
  {
    id: 'table',
    title: 'Tabelas',
    allowedSlots: ['left', 'right'],
    icon: Table,
  },
  {
    id: 'roulette',
    title: 'Roleta',
    allowedSlots: ['left', 'right'],
    icon: Dices,
  },
  {
    id: 'notes',
    title: 'Anotações',
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
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="flex items-center gap-2 bg-[#202024] hover:bg-[#323238] border border-[#323238] rounded-md px-4 py-1.5 text-[#e1e1e6] font-medium transition-colors shadow-lg"
      >
        <Settings className="w-4 h-4" />
        MENU
      </button>

      {menuOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-80 bg-[#202024] border border-[#323238] rounded-xl shadow-2xl z-50 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-3 border-b border-[#323238] bg-[#121214]">
              <h3 className="font-semibold text-sm text-[#e1e1e6]">
                Configurar Painéis
              </h3>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-[#a8a8b3] hover:text-[#e1e1e6] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 max-h-[300px] overflow-y-auto custom-scrollbar flex flex-col gap-1">
              {AVAILABLE_PANELS.map((panel) => {
                const Icon = panel.icon;
                const currentSlot = (Object.keys(layout) as SlotId[]).find(
                  (slot) => layout[slot] === panel.id,
                );

                return (
                  <div
                    key={panel.id}
                    className="flex flex-col gap-2 p-2 hover:bg-[#29292e] rounded-md transition-colors border border-transparent hover:border-[#323238]"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#8257e5]" />
                      <span className="text-sm font-medium text-[#e1e1e6] flex-1">
                        {panel.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {(['left', 'center', 'right'] as SlotId[]).map((slot) => {
                        const isAllowed = panel.allowedSlots.includes(slot);
                        const isSelected = currentSlot === slot;

                        return (
                          <button
                            key={slot}
                            disabled={!isAllowed}
                            onClick={() => {
                              if (isSelected) setSlot(slot, null);
                              else setSlot(slot, panel.id);
                            }}
                            className={`flex-1 text-xs py-1 rounded transition-colors ${
                              isSelected
                                ? 'bg-[#8257e5] text-white'
                                : !isAllowed
                                  ? 'bg-[#121214] text-[#4d4d57] cursor-not-allowed border border-[#323238]/50'
                                  : 'bg-[#121214] text-[#a8a8b3] hover:bg-[#323238] hover:text-[#e1e1e6] border border-[#323238]'
                            }`}
                          >
                            {slot === 'left'
                              ? 'Esq.'
                              : slot === 'center'
                                ? 'Centro'
                                : 'Dir.'}
                          </button>
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
