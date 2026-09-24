import type { FC } from 'react';
import { Plus } from 'lucide-react';
import type { Zone } from '@/types/game';
import {
  type ZoneTab,
  TAB_CONFIGS,
  getMarkerColor,
  getMarkerTextColor,
} from './types';

interface ZoneFloatingTabsProps {
  zone: Zone | null;
  isOpen: boolean;
  currentTabs: ZoneTab[];
  activeTab: ZoneTab;
  setActiveTab: (tab: ZoneTab) => void;
  onOpenMarkerModal: () => void;
}

export const ZoneFloatingTabs: FC<ZoneFloatingTabsProps> = ({
  zone,
  isOpen,
  currentTabs,
  activeTab,
  setActiveTab,
  onOpenMarkerModal,
}) => {
  if (!zone || !isOpen) return null;
  const zoneData = zone.data;

  return (
    <div className="absolute left-full top-16 flex flex-col gap-2.5 z-50 pointer-events-auto select-none items-start overflow-visible transition-opacity duration-200">
      {/* Marcadores Ativos na Zona */}
      {currentTabs.map((tabKey) => {
        const cfg = TAB_CONFIGS[tabKey];
        const TabIcon = cfg.icon;
        const tabColor = getMarkerColor(zoneData, tabKey);
        const rawTextColor = getMarkerTextColor(zoneData, tabKey);
        const textColor =
          rawTextColor && rawTextColor.toLowerCase() !== tabColor.toLowerCase()
            ? rawTextColor
            : '#ffffff';
        const isSelected = activeTab === tabKey;

        return (
          <button
            key={tabKey}
            onClick={() => setActiveTab(tabKey)}
            title={cfg.label}
            className="relative group h-7 w-[16px] hover:w-[165px] transition-[width] duration-150 ease-out cursor-pointer select-none shrink-0 p-0 border-none bg-transparent outline-none overflow-visible flex items-center -ml-[1px]"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            }}
          >
            {/* Camada externa (Borda contornando todo o formato incluindo a ponta triangular) */}
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: isSelected
                  ? 'rgba(255, 255, 255, 0.6)'
                  : 'rgba(0, 0, 0, 0.8)',
                clipPath:
                  'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)',
                WebkitClipPath:
                  'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)',
              }}
            />

            {/* Camada interna (Cor do marcador com a ponta triangular e conteúdo) */}
            <div
              className={`absolute inset-y-[1.5px] left-0 right-[1.5px] flex items-center overflow-hidden ${
                isSelected
                  ? 'opacity-40 hover:opacity-85'
                  : 'opacity-100 hover:brightness-110'
              }`}
              style={{
                backgroundColor: tabColor,
                clipPath:
                  'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)',
                WebkitClipPath:
                  'polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)',
              }}
            >
              <div className="flex items-center gap-2 pl-2.5 pr-5 shrink-0 opacity-0 group-hover:opacity-100 whitespace-nowrap">
                <TabIcon
                  className="w-3.5 h-3.5 shrink-0"
                  style={{ color: textColor }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: textColor }}
                >
                  {cfg.label}
                </span>
              </div>
            </div>
          </button>
        );
      })}

      {/* Marcador Modular: Adicionar Novo Marcador (Ponta quadrada, coloração cinza apagada, expande no hover) */}
      <button
        onClick={onOpenMarkerModal}
        title="Adicionar Marcador"
        className="relative group h-7 w-[18px] hover:w-[165px] transition-[width] duration-150 ease-out cursor-pointer select-none shrink-0 p-0 border-none bg-transparent outline-none overflow-visible flex items-center -ml-[1px]"
        style={{
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
        }}
      >
        {/* Camada externa (Borda quadrada escura) */}
        <div className="absolute inset-0 bg-black/80 rounded-r-[2px]" />

        {/* Camada interna (Cinza apagado com formato quadrado) */}
        <div className="absolute inset-y-[1.5px] left-0 right-[1.5px] bg-[#27272a] hover:bg-[#323238] rounded-r-[1px] border-r border-t border-b border-[#3f3f46] flex items-center overflow-hidden">
          <div className="w-[15px] flex items-center justify-center shrink-0">
            <Plus className="w-3.5 h-3.5 text-[#a8a8b3] group-hover:text-white shrink-0" />
          </div>
          <div className="flex items-center pl-1 pr-3 shrink-0 opacity-0 group-hover:opacity-100 whitespace-nowrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#a8a8b3] group-hover:text-white drop-shadow-sm">
              Adicionar
            </span>
          </div>
        </div>
      </button>
    </div>
  );
};
