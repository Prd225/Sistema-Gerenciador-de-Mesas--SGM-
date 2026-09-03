import type { Token, Zone, Marker } from './game';
import type {
  NotePage,
  RulePage,
  TablePage,
  RoulettePage,
  DiaryEntry,
} from './content';

export type PresetCategory =
  'fantasy' | 'paranormal' | 'cyberpunk' | 'horror' | 'tactical';

export type PresetDifficulty =
  'iniciante' | 'intermediario' | 'avancado' | 'mortal';

export interface PresetCharacterTemplate {
  archetype: 'guerreiro' | 'ladino' | 'mago' | 'clerigo' | string;
  label: string;
  description: string;
  avatarUrl?: string;
  token: Omit<Token, 'id'> & { defaultId?: string };
  recommendedRoleplayNotes?: string[];
}

export interface PresetThreatTemplate {
  archetype: 'goblin' | 'zumbi' | 'dragao' | string;
  label: string;
  threatTier: 'lacaio' | 'padrao' | 'elite' | 'chefe';
  description: string;
  avatarUrl?: string;
  token: Omit<Token, 'id'> & { defaultId?: string };
  tacticalTactics?: string[];
}

export interface PresetBattlemap {
  id: string;
  title: string;
  description: string;
  theme: string;
  gridSize: number;
  bgImage: {
    src: string;
    scale: number;
    rotation: number;
    width: number;
    height: number;
  };
  zones: Zone[];
  markers: Marker[];
  recommendedSpawns?: {
    presetArchetype: string;
    count: number;
    positions: { x: number; y: number }[];
  }[];
}

export interface StarterCampaignPreset {
  id: string;
  name: string;
  tagline: string;
  synopsis: string;
  category: PresetCategory;
  difficulty: PresetDifficulty;
  estimatedPlaytime: string;
  version: string;
  author: string;
  coverImageUrl?: string;
  characters: PresetCharacterTemplate[];
  threats: PresetThreatTemplate[];
  maps: PresetBattlemap[];
  notes?: NotePage[];
  rules?: RulePage[];
  tables?: TablePage[];
  roulettes?: RoulettePage[];
  defaultDiaryEntries?: DiaryEntry[];
}

export interface StarterPackLoadOptions {
  targetSlot?: number;
  loadMode: 'new_slot' | 'overwrite_current' | 'append_content';
  selectedCharacterIds?: string[];
  selectedThreatIds?: string[];
  selectedMapIds?: string[];
  includeRulesAndNotes: boolean;
  autoPlaceOnBoard: boolean;
}

export interface StarterPackCatalog {
  presets: StarterCampaignPreset[];
  lastUpdated: number;
}
