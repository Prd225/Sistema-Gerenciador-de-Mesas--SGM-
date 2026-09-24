import {
  BookOpen,
  Sparkles,
  Skull,
  Package,
  Users,
  Compass,
} from 'lucide-react';
import type { Zone } from '@/types/game';

export type ZoneTab =
  | 'geral'
  | 'destaques'
  | 'ameacas'
  | 'inventario'
  | 'diario'
  | 'npcs'
  | 'missoes';

export interface TabConfig {
  label: string;
  icon: any;
  defaultColor: string;
}

export const TAB_CONFIGS: Record<ZoneTab, TabConfig> = {
  geral: {
    label: 'Geral',
    icon: BookOpen,
    defaultColor: '#8257e5',
  },
  destaques: {
    label: 'Destaques',
    icon: Sparkles,
    defaultColor: '#f59e0b',
  },
  ameacas: {
    label: 'Ameaças',
    icon: Skull,
    defaultColor: '#ef4444',
  },
  inventario: {
    label: 'Inventário',
    icon: Package,
    defaultColor: '#06b6d4',
  },
  diario: {
    label: 'Diário',
    icon: BookOpen,
    defaultColor: '#3b82f6',
  },
  npcs: {
    label: 'NPCs',
    icon: Users,
    defaultColor: '#a855f7',
  },
  missoes: {
    label: 'Missões',
    icon: Compass,
    defaultColor: '#10b981',
  },
};

export const getMarkerColor = (
  zoneData: Zone['data'] | undefined,
  tabKey: ZoneTab,
): string => {
  if (tabKey === 'geral') {
    return zoneData?.style?.fillColor || '#8257e5';
  }
  return zoneData?.markerColors?.[tabKey] || TAB_CONFIGS[tabKey].defaultColor;
};

export const getMarkerTextColor = (
  zoneData: Zone['data'] | undefined,
  tabKey: ZoneTab,
): string => {
  if (tabKey === 'geral') {
    return zoneData?.style?.textColor || '#ffffff';
  }
  return zoneData?.markerTextColors?.[tabKey] || '#ffffff';
};

export interface ZoneTabProps {
  zone: Zone;
  isEditing: boolean;
}
