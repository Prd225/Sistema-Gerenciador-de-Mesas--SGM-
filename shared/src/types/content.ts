// --- Master Panel Content Types ---

export type RuleWidgetSize = '1x1' | '1x2' | '2x1' | '2x2';

export interface RuleWidget {
  id: string;
  size: RuleWidgetSize;
  title: string;
  content: string;
  contents?: string[];
  contentType?: 'text' | 'image';
  columnCount?: 1 | 2 | 3;
  imageUrl?: string;
}

export interface RulePage {
  id: string;
  name: string;
  widgets: RuleWidget[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  updatedAt: number;
}

export interface NotePage {
  id: string;
  name: string;
  notes: Note[];
}

export interface TableData {
  id: string;
  title: string;
  color?: string;
  updatedAt: number;
  data: string[][];
}

export interface TablePage {
  id: string;
  name: string;
  tables: TableData[];
}

export interface RouletteOption {
  id: string;
  text: string;
  weight: number;
  color: string;
}

export interface RouletteData {
  id: string;
  title: string;
  color?: string;
  updatedAt: number;
  options: RouletteOption[];
}

export interface RoulettePage {
  id: string;
  name: string;
  roulettes: RouletteData[];
}

export interface DiaryPoint {
  id: string;
  text: string;
  isComplex: boolean;
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  name: string;
  date: string;
  color?: string;
  isFavorite?: boolean;
  points: DiaryPoint[];
  createdAt: number;
}
