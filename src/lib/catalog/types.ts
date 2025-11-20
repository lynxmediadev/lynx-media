// src/lib/catalog/types.ts
export interface Track {
  id: string;
  title: string;
  artist: string;
  moods: string[];
  uses: string[];
  bpm?: number;
  duration: string;
  key?: string;
  audioUrl: string;
}
