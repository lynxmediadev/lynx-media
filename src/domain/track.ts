// ================================================
// File: src/domain/track.ts
// Single source of truth for track types (shared UI/API/DB)
// ================================================
export type PlayerRights = {
  master?: string;
  publishingSplit?: string;
  licenseType?: string;
  territories?: string;
  term?: string;
  scope?: string[];
  mediaBuy?: string;
  mfn?: boolean;
  restrictions?: string[];
  contentID?: { enrolled?: boolean; admin?: string; whitelist?: string };
};

export type PlayerIdentifiers = {
  isrc?: string;
  iswc?: string;
  upc?: string;
};

export type PlayerTrack = {
  id: string;
  title: string;
  artist: string;
  audioUrl: string;
  coverUrl?: string;
  moods?: string[];
  uses?: string[];
  shareUrl?: string;
  artistUrl?: string;
  rights?: PlayerRights;
  identifiers?: PlayerIdentifiers;
};
