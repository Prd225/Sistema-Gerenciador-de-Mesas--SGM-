import type { FC } from 'react';
import { ChevronLeft, Plus } from 'lucide-react';
import type { Zone } from '@/types/game';
import {
  type ZoneTab,
  TAB_CONFIGS,
  getMarkerColor,
  getMarkerTextColor,
} from './types';

interface ZoneCollapsedBarProps {
  isOpen: boolean;
  toggle: () => void;
  zone: Zone | null;
  currentTabs: ZoneTab[];
  activeTab: ZoneTab;
  setActiveTab: (tab: ZoneTab) => void;
  onOpenMarkerModal: () => void;
}

export const ZoneCollapsedBar: FC<ZoneCollapsedBarProps> = ({
  isOpen,
  toggle,
  zone,
  currentTabs,
  activeTab,
  setActiveTab,
  onOpenMarkerModal,
}) => {
  const zoneData = zone?.data;

  return (
    <div
      className={`absolute inset-y-0 left-0 w-12 flex flex-col items-start py-4 overflow-visible select-none transition-all duration-200 ${
        isOpen
          ? 'opacity-0 pointer-events-none invisible -z-10'
          : 'opacity-100 pointer-events-auto visible z-30 delay-100'
      }`}
    >
      <div className="w-full flex justify-center mb-6 shrink-0">
        <button
          onClick={toggle}
          className="text-[#a8a8b3] hover:text-[#e1e1e6] p-2 hover:bg-white/5 rounded transition-colors cursor-pointer"
          title="Expandir Barra Lateral"
        >
          <ChevronLeft className="rotate-180 w-5 h-5 transition-transform duration-300" />
        </button>
      </div>

      {/* Marcadores estendidos pela aba reduzida (Todos os marcadores ativos + botão Adicionar) */}
      {zone && (
        <div className="w-full flex flex-col items-start gap-2.5 select-none overflow-visible">
          {currentTabs.map((tabKey) => {
            const cfg = TAB_CONFIGS[tabKey];
            const TabIcon = cfg.icon;
            const tabColor = getMarkerColor(zoneData, tabKey);
            const rawTextColor = getMarkerTextColor(zoneData, tabKey);
            const textColor =
              rawTextColor &&
              rawTextColor.toLowerCase() !== tabColor.toLowerCase()
                ? rawTextColor
                : '#ffffff';
            const isSelected = activeTab === tabKey;

            return (
              <button
                key={tabKey}
                onClick={() => {
                  setActiveTab(tabKey);
                  toggle();
                }}
                title={cfg.label}
                className="relative group h-7 w-[64px] hover:w-[175px] transition-[width] duration-150 ease-out cursor-pointer select-none shrink-0 p-0 border-none bg-transparent outline-none overflow-visible flex items-center"
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
                  <div className="flex items-center gap-2 pl-3.5 pr-5 shrink-0 opacity-0 group-hover:opacity-100 whitespace-nowrap">
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

          {/* Marcador Modular: Adicionar Novo Marcador na aba reduzida (Ponta quadrada, coloração cinza apagada, expande no hover) */}
          <button
            onClick={onOpenMarkerModal}
            title="Adicionar Marcador"
            className="relative group h-7 w-[66px] hover:w-[175px] transition-[width] duration-150 ease-out cursor-pointer select-none shrink-0 p-0 border-none bg-transparent outline-none overflow-visible flex items-center"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))',
            }}
          >
            {/* Camada externa (Borda quadrada escura) */}
            <div className="absolute inset-0 bg-black/80 rounded-r-[2px]" />

            {/* Camada interna (Cinza apagado com formato quadrado) */}
            <div className="absolute inset-y-[1.5px] left-0 right-[1.5px] bg-[#27272a] hover:bg-[#323238] rounded-r-[1px] border-r border-t border-b border-[#3f3f46] flex items-center overflow-hidden">
              <div className="w-[48px] shrink-0" />
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
      )}
    </div>
  );
};
