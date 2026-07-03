export type ElementType = 'Sangue' | 'Morte' | 'Conhecimento' | 'Energia' | 'Medo';

export type DamageType = 'Balístico' | 'Impacto' | 'Perfuração' | 'Corte' | 'Eletricidade' | 'Fogo' | 'Frio' | 'Mental' | 'Químico' | 'Sangue' | 'Morte' | 'Conhecimento' | 'Energia' | 'Medo';

export type ActionType = 'Padrão' | 'Movimento' | 'Reação' | 'Ação Livre' | 'Completa';

export interface BaseToken {
  id: string;
  name: string;
  initials: string;
  type: 'player' | 'threat';
  colorText: string;
  colorBorder: string;
  colorFill: string;
  x: number;
  y: number;
  onMap: boolean;
  notes: string;
  conditions: Condition[];
}

export interface PlayerStats {
  system: 'san' | 'det'; // sanidade or determinação
  agi: number;
  for: number;
  int: number;
  pre: number;
  vig: number;
  
  defesa: number;
  bloqueio: number;
  esquiva: number;
  
  pvAtual: number;
  pvMax: number;
  
  peAtual: number;
  peMax: number;
  
  sanAtual?: number;
  sanMax?: number;
  
  pdAtual?: number;
  pdMax?: number;
}

export interface ThreatStats extends PlayerStats {
  threatType: 'realidade' | 'paranormal';
  size: 'Minúsculo' | 'Pequeno' | 'Médio' | 'Grande' | 'Enorme' | 'Colossal';
  speed: string;
  
  // Paranormal specific
  elements?: ElementType[];
  presDt?: number;
  presDamage?: string;
  presImmuneNex?: number;
  
  fortitude?: string;
  vontade?: string;
  
  enigma?: string;
  
  senses: string[];
  resistances: string[];
  vulnerabilities: string[];
  abilities: string[];
  actions: string[];
}

export interface PlayerToken extends BaseToken {
  type: 'player';
  stats: PlayerStats;
}

export interface ThreatToken extends BaseToken {
  type: 'threat';
  stats: ThreatStats;
}

export type Token = PlayerToken | ThreatToken;

export interface Condition {
  id: string;
  name: string;
  desc: string;
  color: string;
}

export interface POI {
  id: string;
  name: string;
  category: string; // Used for grouping
  description: string;
}

export interface ZoneEvent {
  id: string;
  name: string;
  type: 'red' | 'yellow' | 'green' | 'purple'; // Color coding
  description: string;
}

export interface Zone {
  id: string;
  title: string;
  description: string;
  visits: number;
  shape: 'rect' | 'ellipse' | 'polygon';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[]; // For polygons
  pois: POI[];
  events: ZoneEvent[];
}

export interface Marker {
  id: string;
  x: number;
  y: number;
  title: string;
  description: string;
}

export interface InitiativeItem {
  id: string;
  tokenId: string;
  value: number;
}
