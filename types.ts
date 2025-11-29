export enum ToolType {
  NONE = 'NONE',
  SELECT_CORRECTION = 'SELECT_CORRECTION',
  DRAW = 'DRAW',
  HIGHLIGHT = 'HIGHLIGHT',
  ERASER = 'ERASER',
}

export interface AppFile {
  id: string;
  name: string;
  blob: Blob;
  type: 'normal' | 'correction';
}

export interface ProjectData {
  id: string;
  timestamp: number;
  normalFile: AppFile | null;
  correctionFile: AppFile | null;
  annotations: Record<number, Annotation[]>; // pageIndex -> annotations
}

export type Annotation = 
  | { type: 'path'; id: string; points: Point[]; color: string; width: number; opacity: number }
  | { type: 'correction'; id: string; x: number; y: number; w: number; h: number };

export interface Point {
  x: number;
  y: number;
}

export interface ToolSettings {
  color: string;
  width: number;
  opacity: number;
}
