import type { FC } from 'react';
import type { Zone } from '@/types/game';
import { type ZoneTab, getMarkerColor, getMarkerTextColor } from './types';

interface ZoneColorPaletteProps {
  open: boolean;
  activeTab: ZoneTab;
  zone: Zone;
  updateZoneData: (id: string, updates: Partial<Zone['data']>) => void;
}

export const ZoneColorPalette: FC<ZoneColorPaletteProps> = ({
  open,
  activeTab,
  zone,
  updateZoneData,
}) => {
  if (!open) return null;
  const zoneData = zone.data;

  return (
    <div className="absolute top-full right-0 mt-2 bg-[#121214] border border-[#323238] rounded p-3 z-50 w-56 shadow-xl">
      {activeTab === 'geral' ? (
        <>
          <div className="text-xs font-bold text-[#e1e1e6] mb-3 uppercase tracking-wider">
            Zona
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a8b3]">Borda</span>
              <input
                type="color"
                value={zoneData?.style?.borderColor || '#8257e5'}
                onChange={(e) => {
                  updateZoneData(zone.id, {
                    style: {
                      ...zoneData?.style,
                      borderColor: e.target.value,
                      fillColor: zoneData?.style?.fillColor || '#8257e5',
                      textColor: zoneData?.style?.textColor || '#ffffff',
                    },
                  });
                }}
                className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a8b3]">Preenchimento</span>
              <input
                type="color"
                value={zoneData?.style?.fillColor || '#8257e5'}
                onChange={(e) => {
                  updateZoneData(zone.id, {
                    style: {
                      ...zoneData?.style,
                      fillColor: e.target.value,
                      borderColor: zoneData?.style?.borderColor || '#8257e5',
                      textColor: zoneData?.style?.textColor || '#ffffff',
                    },
                  });
                }}
                className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a8b3]">Texto</span>
              <input
                type="color"
                value={zoneData?.style?.textColor || '#ffffff'}
                onChange={(e) => {
                  updateZoneData(zone.id, {
                    style: {
                      ...zoneData?.style,
                      textColor: e.target.value,
                      borderColor: zoneData?.style?.borderColor || '#8257e5',
                      fillColor: zoneData?.style?.fillColor || '#8257e5',
                    },
                  });
                }}
                className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"
              />
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="text-xs font-bold text-[#e1e1e6] mb-3 uppercase tracking-wider">
            Marcador
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a8b3]">Cor</span>
              <input
                type="color"
                value={getMarkerColor(zoneData, activeTab)}
                onChange={(e) => {
                  updateZoneData(zone.id, {
                    markerColors: {
                      ...(zoneData?.markerColors || {}),
                      [activeTab]: e.target.value,
                    },
                  });
                }}
                className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#a8a8b3]">Cor da fonte</span>
              <input
                type="color"
                value={getMarkerTextColor(zoneData, activeTab)}
                onChange={(e) => {
                  updateZoneData(zone.id, {
                    markerTextColors: {
                      ...(zoneData?.markerTextColors || {}),
                      [activeTab]: e.target.value,
                    },
                  });
                }}
                className="bg-transparent border-none w-6 h-6 p-0 cursor-pointer"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};
