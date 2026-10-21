export type FogShapeType = 'rect' | 'circle' | 'polygon';
export type FogMode = 'hide' | 'reveal';

export interface FogArea {
  id: string;
  mode: FogMode;
  type: FogShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  createdAt: number;
}

export interface FogState {
  enabled: boolean;
  defaultCovered: boolean;
  areas: FogArea[];
}
