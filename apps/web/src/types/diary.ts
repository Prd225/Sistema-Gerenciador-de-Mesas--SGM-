export interface DiaryPoint {
  id: string;
  text: string; // HTML rich text
  isComplex: boolean;
  createdAt: number;
}

export interface DiaryEntry {
  id: string;
  name: string;
  date: string;
  color?: string; // e.g. hex code or tailwind class for highlighting
  isFavorite?: boolean;
  points: DiaryPoint[];
  createdAt: number;
}
