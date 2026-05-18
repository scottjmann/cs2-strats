export type Side = 'CT' | 'T';
export type UtilityType = 'smoke' | 'flash' | 'molotov' | 'he';

export interface Coords {
  x: number;
  y: number;
}

export interface UtilityEntry {
  id: string;
  name: string;
  type: UtilityType;
  side: Side;
  description: string;
  from: string;
  to: string;
  videoUrl: string;
  fromCoords?: Coords;
  toCoords?: Coords;
}

export interface MapMeta {
  id: string;
  name: string;
  thumbnail: string;
  accentColor: string;
  available: boolean;
  overviewImage?: string;
}

export interface MapData extends MapMeta {
  utility: UtilityEntry[];
}
