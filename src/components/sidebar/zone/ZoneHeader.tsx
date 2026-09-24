import { useState, useRef, useEffect, type FC } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  Palette,
  Lock,
  Unlock,
  Map,
} from 'lucide-react';
import type { Zone } from '@/types/game';
import {
  type ZoneTab,
  TAB_CONFIGS,
  getMarkerColor,
  getMarkerTextColor,
} from './types';
import { ZoneColorPalette } from './ZoneColorPalette';

interface ZoneHeaderProps {
  zone: Zone | null;
  activeTab: ZoneTab;
  setActiveTab: (tab: ZoneTab) => void;
  currentTabs: ZoneTab[];
  editingZone: boolean;
  setEditingZone: (val: boolean) => void;
  toggle: () => void;
  updateZoneData: (id: string, updates: Partial<Zone['data']>) => void;
}

export const ZoneHeader: FC<ZoneHeaderProps> = ({
  zone,
  activeTab,
  setActiveTab,
  currentTabs,
  editingZone,
  setEditingZone,
  toggle,
  updateZoneData,
}) => {
  const [showPalette, setShowPalette] = useState(false);
  const [showSubmenuDropdown, setShowSubmenuDropdown] = useState(false);
  const headerDropdownRef = useRef<HTMLDivElement>(null);

  const zoneData = zone?.data;
  const activeMarkerColor = getMarkerColor(zoneData, activeTab);
  const activeMarkerTextColor = getMarkerTextColor(zoneData, activeTab);
  const currentTabConfig = TAB_CONFIGS[activeTab];
  const ActiveTabIcon = currentTabConfig.icon;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        headerDropdownRef.current &&
        !headerDropdownRef.current.contains(e.target as Node)
      ) {
        setShowSubmenuDropdown(false);
      }
    };
    if (showSubmenuDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSubmenuDropdown]);

  if (!zone || !zoneData) {
    return (
      <div className="flex justify-between items-center mb-5 text-[#8257e5] font-bold uppercase tracking-wide border-b-2 border-[#323238] pb-2 shrink-0">
        <span className="flex items-center gap-2">
          <Map className="w-5 h-5" /> Dados da Zona
        </span>
        <div className="flex items-center gap-1 relative">
          <button
            onClick={toggle}
            className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 rounded hover:bg-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative mb-5 -mx-5 -mt-5 p-4 border-b shrink-0 transition-colors shadow-md overflow-visible"
      style={{
        borderColor: activeMarkerColor,
        background: `linear-gradient(135deg, ${activeMarkerColor}22 0%, #202024 100%)`,
      }}
    >
      <div className="flex justify-between items-center pt-1">
        <div
          ref={headerDropdownRef}
          className="flex items-center gap-2.5 min-w-0 relative"
        >
          <div
            className="p-2 rounded-md flex items-center justify-center shrink-0 shadow-inner"
            style={{
              backgroundColor: `${activeMarkerColor}25`,
              color: activeMarkerTextColor,
            }}
          >
            <ActiveTabIcon className="w-5 h-5" />
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={() => setShowSubmenuDropdown(!showSubmenuDropdown)}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer group text-left"
            >
              <span
                className="text-base font-extrabold tracking-wide uppercase truncate"
                style={{ color: activeMarkerTextColor }}
              >
                {currentTabConfig.label}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[#a8a8b3] transition-transform ${
                  showSubmenuDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>
          </div>

          {/* Dropdown de Marcadores */}
          {showSubmenuDropdown && (
            <div className="absolute top-full left-0 mt-2 bg-[#18181b] border border-[#323238] rounded-lg p-1.5 z-50 w-52 shadow-2xl backdrop-blur-md">
              <div className="text-[10px] font-bold text-[#71717a] uppercase px-2 py-1">
                Marcadores
              </div>
              {currentTabs.map((tabKey) => {
                const cfg = TAB_CONFIGS[tabKey];
                const TabIcon = cfg.icon;
                const itemColor = getMarkerColor(zoneData, tabKey);
                const isCur = activeTab === tabKey;
                return (
                  <button
                    key={tabKey}
                    onClick={() => {
                      setActiveTab(tabKey);
                      setShowSubmenuDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs font-semibold cursor-pointer ${
                      isCur
                        ? 'bg-white/10 text-white'
                        : 'text-[#a8a8b3] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <TabIcon
                      className="w-4 h-4"
                      style={{ color: itemColor }}
                    />
                    <span>{cfg.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={`p-1 rounded hover:bg-white/5 ${showPalette ? 'text-[#ffd700]' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'}`}
            title={activeTab === 'geral' ? 'Cores da Zona' : 'Cor do Marcador'}
          >
            <Palette className="w-4 h-4" />
          </button>

          <ZoneColorPalette
            open={showPalette}
            activeTab={activeTab}
            zone={zone}
            updateZoneData={updateZoneData}
          />

          <button
            onClick={() => setEditingZone(!editingZone)}
            className={`p-1 rounded hover:bg-white/5 ${editingZone ? 'text-[#ffd700]' : 'text-[#a8a8b3] hover:text-[#e1e1e6]'}`}
            title="Alternar Leitura/Edição"
          >
            {editingZone ? (
              <Unlock className="w-4 h-4" />
            ) : (
              <Lock className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={toggle}
            className="text-[#a8a8b3] hover:text-[#e1e1e6] p-1 rounded hover:bg-white/5"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
