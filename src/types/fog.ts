export type FogShapeType = 'rect' | 'circle' | 'polygon' | 'brush';
export type FogMode = 'hide' | 'reveal';
export type FogBrushShape = 'round' | 'square';

export interface FogArea {
  id: string;
  mode: FogMode;
  type: FogShapeType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: number[];
  brushSize?: number;
  brushShape?: FogBrushShape;
  createdAt: number;
}

export interface FogState {
  enabled: boolean;
  defaultCovered: boolean;
  areas: FogArea[];
}
