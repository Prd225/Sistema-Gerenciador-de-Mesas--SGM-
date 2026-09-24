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
