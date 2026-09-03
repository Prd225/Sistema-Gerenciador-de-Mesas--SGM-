import type { ElementType, Token } from './game';

export type CardGalleryViewMode = 'grid-standard' | 'grid-compact' | 'table';

export type CardRoleFilter = 'all' | 'player' | 'threat';

export type ThreatTypeFilter = 'all' | 'realidade' | 'paranormal';

export type MapPresenceFilter = 'all' | 'on-map' | 'in-reserve';

export type CardSortField =
  'name' | 'pv' | 'pe' | 'san' | 'def' | 'presNex' | 'createdAt';

export type SortDirection = 'asc' | 'desc';

export interface CardFilterState {
  search: string;
  role: CardRoleFilter;
  threatType: ThreatTypeFilter;
  elements: ElementType[];
  presence: MapPresenceFilter;
  tags: string[];
  minNex?: number;
  maxNex?: number;
  sortBy: CardSortField;
  sortOrder: SortDirection;
  favoritesOnly: boolean;
}

export interface CardDragData {
  type: 'sgm-token-card';
  tokenId: string;
  isTemplate?: boolean;
  source: 'gallery' | 'roster';
  payload?: Partial<Token>;
}

export interface CardVisualTheme {
  frameColor?: string;
  glowColor?: string;
  badgeStyle?: 'minimal' | 'detailed' | 'rpg-classic';
  showAttributesPreview: boolean;
  showVitalsBars: boolean;
  showActionsList: boolean;
}

export type CardActionType =
  | 'inspect'
  | 'place-on-map'
  | 'recall-from-map'
  | 'duplicate'
  | 'delete'
  | 'quick-heal'
  | 'quick-damage'
  | 'toggle-favorite';

export interface CardActionPayload {
  action: CardActionType;
  tokenId: string;
  amount?: number;
  position?: { x: number; y: number };
}

export interface CardGalleryState {
  isOpen: boolean;
  viewMode: CardGalleryViewMode;
  filters: CardFilterState;
  selectedTokenIds: string[];
  activeCardId: string | null;
  favoriteTokenIds: string[];

  // Actions
  setIsOpen: (open: boolean) => void;
  setViewMode: (mode: CardGalleryViewMode) => void;
  setFilters: (filters: Partial<CardFilterState>) => void;
  resetFilters: () => void;
  toggleSelectToken: (id: string) => void;
  selectAllVisible: (ids: string[]) => void;
  clearSelection: () => void;
  setActiveCardId: (id: string | null) => void;
  toggleFavorite: (id: string) => void;
  batchSpawnToMap: (
    ids: string[],
    centerPosition: { x: number; y: number },
  ) => void;
  batchRecallFromMap: (ids: string[]) => void;
}
