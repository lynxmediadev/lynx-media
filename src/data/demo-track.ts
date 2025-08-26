// ================================================
// File: src/data/demo-track.ts
// Centralized demo track + factory
// ================================================
import type { PlayerTrack } from "@/domain/track";

export const DEMO_TRACK: PlayerTrack = {
  id: "demo-base",
  title: "Golden Horizon (Demo)",
  artist: "Lynx Music Collective",
  audioUrl: "/audio/demo.mp3",
  coverUrl: "/images/covers/hero-bg-01.jpg",
  moods: ["Epic", "Emotional", "Elegant"],
  uses: ["TV", "Cine", "Publicidad", "Trailers", "Videojuegos"],
  shareUrl: "https://lynx-media.local/player/demo-001",
  artistUrl: "/catalog?artist=Lynx%20Music%20Collective",
  identifiers: { isrc: "CL-XYZ-25-00001" },
  rights: {
    master: "Lynx Media (One-Stop)",
    publishingSplit: "100% Lynx Music Collective",
    licenseType: "No exclusiva",
    territories: "Worldwide",
    restrictions: ["Sin campañas políticas"],
    contentID: { enrolled: true, admin: "Identifyy", whitelist: "licensing@lynxmedia.cl" },
  },
};

export function makeDemoTrack(id: string, overrides: Partial<PlayerTrack> = {}): PlayerTrack {
  return { ...DEMO_TRACK, id, ...overrides };
}
