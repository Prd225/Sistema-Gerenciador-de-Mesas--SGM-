export type ElementType =
  'Sangue' | 'Morte' | 'Conhecimento' | 'Energia' | 'Medo';

export type DamageType =
  | 'Balístico'
  | 'Impacto'
  | 'Perfuração'
  | 'Corte'
  | 'Eletricidade'
  | 'Fogo'
  | 'Frio'
  | 'Mental'
  | 'Químico'
  | 'Sangue'
  | 'Morte'
  | 'Conhecimento'
  | 'Energia'
  | 'Medo';

export type ActionType =
  'Padrão' | 'Movimento' | 'Reação' | 'Ação Livre' | 'Completa';

export interface Condition {
  id?: string;
  name: string;
  desc: string;
  color: string;
  type?: 'skip_turn' | 'stat_modifier' | 'out_of_combat' | 'custom';
  durationTurns?: number;
}

export interface Resistance {
  type: string;
  val: number;
}

export interface Ability {
  title: string;
  desc: string;
}

export interface AttackAction {
  type: string;
  name: string;
  test: string;
  damage: string;
  mult: string;
  desc: string;
}

export interface TokenStats {
  type: 'player' | 'threat';
  system: 'san' | 'det';
  threatType?: 'realidade' | 'paranormal';

  // Attributes
  agi: number;
  for: number;
  int: number;
  pre: number;
  vig: number;

  // Defenses
  def: number;
  bloq: number | string;
  esq: number | string;
  fort?: string;
  von?: string;

  // Vitals
  pv: number;
  maxPv: number;
  pe: number;
  maxPe: number;
  san: number;
  maxSan: number;
  pd: number;
  maxPd: number;

  // Threat-specific
  size?: string;
  speed?: string;
  elements?: ElementType[];
  presDt?: number;
  presDano?: string;
  presNex?: number;
  enigma?: string;
  senses?: string[];
  resistances?: Resistance[];
  vulnerabilities?: string[];
  abilities?: Ability[];
  actions?: AttackAction[];
}

export type TokenVisibility = 'all' | 'gm';

export interface Token {
  id: string;
  name: string;
  ownerMemberId?: string | null;
  visibility?: TokenVisibility;
  imageRef?: string | null;
  imageUrl?: string;
  x: number | null;
  y: number | null;
  size?: number;
  hp?: number;
  maxHp?: number;
  fullName?: string;
  colorText?: string;
  colorBorder?: string;
  colorFill?: string;
  desc?: string;
  conditions: Condition[];
  stats: TokenStats;
  rotation?: number;
}

export type ActiveTool =
  | 'pan'
  | 'select'
  | 'edit-zone'
  | 'draw-rect'
  | 'draw-ellipse'
  | 'draw-poly'
  | 'edit-bg'
  | 'add-marker';

export interface POIReferenceLink {
  id: string;
  targetType: 'item' | 'poi';
  targetName: string;
}

export interface POIOption {
  name: string;
  desc: string;
  descriptions?: string[];
  isRevealed?: boolean;
  referenceLinks?: POIReferenceLink[];
}

export interface POICategory {
  title: string;
  color?: string;
  icon?: 'none' | 'star' | 'spiral' | 'triangle';
  isCollapsed?: boolean;
  options: POIOption[];
}

export interface ZoneEvent {
  name: string;
  desc: string;
  color: 'red' | 'yellow' | 'green' | 'purple';
}

export interface ZoneHighlight {
  name: string;
  desc: string;
  tags: string;
  color: 'red' | 'yellow' | 'green' | 'purple' | 'blue' | 'gray';
  isRevealed?: boolean;
}

export interface ZoneHighlightCategory {
  title: string;
  options: ZoneHighlight[];
}

export interface ZoneThreat {
  name: string;
  type: string;
  effect: string;
  damage: string;
  damageType: string;
  isRevealed?: boolean;
}

export interface ZoneInventoryItem {
  name: string;
  type: string;
  weight: string;
  element: 'Sangue' | 'Morte' | 'Conhecimento' | 'Energia' | 'Medo' | 'Comum';
  effect: string;
  desc: string;
  isFound?: boolean;
}

export interface ZoneJournalEntry {
  id: string;
  title: string;
  session: string;
  author: string;
  text: string;
  isRevealed?: boolean;
}

export interface ZoneNpcNode {
  id: string;
  name: string;
  role: string;
  disposition: string;
  notes: string;
  isRevealed?: boolean;
}

export interface ZoneQuestNode {
  id: string;
  title: string;
  priority: string;
  reward: string;
  objective: string;
  isCompleted?: boolean;
}

export interface ZoneStyle {
  borderColor: string;
  fillColor: string;
  textColor: string;
}

export interface ZoneData {
  title: string;
  desc: string;
  visits: number;
  imageUrl?: string;
  imageRef?: string | null;
  style?: ZoneStyle;
  customPois?: POICategory[];
  customEvents?: ZoneEvent[];
  customHighlights?: ZoneHighlightCategory[];
  customThreats?: ZoneThreat[];
  customInventory?: ZoneInventoryItem[];
  customJournal?: ZoneJournalEntry[];
  customNpcs?: ZoneNpcNode[];
  customQuests?: ZoneQuestNode[];
  activeMarkers?: string[];
  markerColors?: Record<string, string>;
  markerTextColors?: Record<string, string>;
}

export interface Zone {
  id: string;
  type: 'rect' | 'ellipse' | 'polygon';
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  clipPath?: string;
  points?: number[];
  data: ZoneData;
}

export type MarkerIconType = 'pin' | 'sword' | 'chest' | 'skull' | 'jewel';

export interface Marker {
  id: string;
  x: number;
  y: number;
  text: string;
  description?: string;
  color?: string;
  textColor?: string;
  iconType?: MarkerIconType;
  completed?: boolean;
  hidden?: boolean;
}

export type InitiativeSortMode = 'descending' | 'ascending' | 'custom';

export interface InitiativeItem {
  tokenId: string;
  value: number;
}

export interface BgImage {
  id: string;
  src: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

export interface CampaignSlot {
  slotNumber: number;
  name: string;
  updatedAt: number;
  data?: unknown;
}

export interface CampaignData {
  version: number;
  tokens: {
    tokens: Token[];
    initiativeQueue: InitiativeItem[];
  };
  zones: {
    zones: Record<string, Zone>;
    markers: Record<string, Marker>;
    bgImages: BgImage[];
  };
  campaign: {
    scene: number;
    round: number;
    turn: number;
    urgency: number | null;
    turnsPerRound: number;
  };
  diary?: {
    entries: unknown[];
  };
  rules?: {
    pages: unknown[];
  };
  notes?: {
    pages: unknown[];
  };
  tables?: {
    pages: unknown[];
  };
  roulettes?: {
    pages: unknown[];
  };
  soundpad?: {
    playlists: unknown[];
  };
  scenes?: {
    activeScenes: unknown[];
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  role?: string;
  createdAt?: string;
}
