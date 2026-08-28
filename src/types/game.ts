export type ElementType = 'Sangue' | 'Morte' | 'Conhecimento' | 'Energia' | 'Medo';

export type DamageType = 'Balístico' | 'Impacto' | 'Perfuração' | 'Corte' | 'Eletricidade' | 'Fogo' | 'Frio' | 'Mental' | 'Químico' | 'Sangue' | 'Morte' | 'Conhecimento' | 'Energia' | 'Medo';

export type ActionType = 'Padrão' | 'Movimento' | 'Reação' | 'Ação Livre' | 'Completa';

// --- Token Types (matching DM_tool_6v AppState.tokens) ---

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
  resistances?: { type: string; val: number }[];
  vulnerabilities?: string[];
  abilities?: { title: string; desc: string }[];
  actions?: { type: string; name: string; test: string; damage: string; mult: string; desc: string }[];
}

export interface Condition {
  id?: string;
  name: string;
  desc: string;
  color: string;
  type?: 'skip_turn' | 'stat_modifier' | 'out_of_combat' | 'custom';
  durationTurns?: number; // undefined = infinite
}

export interface Token {
  id: string;
  name: string;        // initials (displayed on token circle)
  fullName: string;     // full character name
  colorText: string;
  colorBorder: string;
  colorFill: string;
  x: number | null;     // null = not on map
  y: number | null;
  imageUrl?: string;    // Base64 cropped image
  desc: string;         // notes/lore
  conditions: Condition[];
  stats: TokenStats;
}

// --- Zone Types (matching DM_tool_6v AppState.zones) ---

export interface POIOption {
  name: string;
  desc: string;
  isRevealed?: boolean;
}

export interface POICategory {
  title: string;
  icon: 'none' | 'star' | 'spiral' | 'triangle';
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
  clipPath?: string;             // for polygon CSS clip-path
  points?: number[];  // [x1, y1, x2, y2, ...]
  data: {
    title: string;
    desc: string;
    visits: number;
    imageUrl?: string;
    style?: {
      borderColor: string;
      fillColor: string;
      textColor: string;
    };
    customPois: POICategory[];
    customEvents: ZoneEvent[];
    customHighlights?: ZoneHighlightCategory[];
    customThreats?: ZoneThreat[];
    customInventory?: ZoneInventoryItem[];
  };
}

// --- Marker Types ---

export interface Marker {
  id: string;
  x: number;
  y: number;
  text: string;
  description?: string;
  color?: string;
  textColor?: string;
  iconType?: 'pin' | 'sword' | 'chest' | 'skull' | 'jewel';
}

// --- Initiative ---

export type InitiativeSortMode = 'descending' | 'ascending' | 'custom';

export interface InitiativeItem {
  tokenId: string;
  value: number;
}

// --- Background Images ---

export interface BgImage {
  id: string;
  src: string;       // data URL
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

// --- Tool ---

export type ActiveTool = 'pan' | 'select' | 'edit-zone' | 'draw-rect' | 'draw-ellipse' | 'draw-poly' | 'edit-bg' | 'add-marker';
