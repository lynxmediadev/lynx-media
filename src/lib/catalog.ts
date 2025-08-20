// src/lib/catalog.ts

export type Track = {
  id: string;
  title: string;
  artist: string;
  genre: "Orchestral" | "Electronic" | "Hip-Hop" | "Ambient" | "Rock";
  mood: "Epic" | "Dark" | "Uplifting" | "Dramatic" | "Chill";
  bpm: number;
  durationSec: number;
  // En un proyecto real: urls a audio preview, waveform, artwork, tags, keys, etc.
  previewUrl?: string;
  artworkUrl?: string;
};

const DATA: Track[] = [
  {
    id: "trk_001",
    title: "Golden Horizon",
    artist: "Lynx Music",
    genre: "Orchestral",
    mood: "Epic",
    bpm: 120,
    durationSec: 138,
    previewUrl: "/audio/previews/golden-horizon.mp3",
    artworkUrl: "/images/artwork/artwork-01.jpg",
  },
  {
    id: "trk_002",
    title: "Nocturnal Drive",
    artist: "Lynx Music",
    genre: "Electronic",
    mood: "Dark",
    bpm: 92,
    durationSec: 156,
    previewUrl: "/audio/previews/nocturnal-drive.mp3",
    artworkUrl: "/images/artwork/artwork-02.jpg",
  },
  {
    id: "trk_003",
    title: "Cathedral",
    artist: "Lynx Music",
    genre: "Ambient",
    mood: "Dramatic",
    bpm: 64,
    durationSec: 201,
  },
  {
    id: "trk_004",
    title: "Steel & Smoke",
    artist: "Lynx Music",
    genre: "Rock",
    mood: "Uplifting",
    bpm: 140,
    durationSec: 175,
  },
  {
    id: "trk_005",
    title: "Velvet Skyline",
    artist: "Lynx Music",
    genre: "Hip-Hop",
    mood: "Chill",
    bpm: 78,
    durationSec: 129,
  },
];

export type CatalogFilters = {
  q?: string;
  genre?: Track["genre"] | "all";
  mood?: Track["mood"] | "all";
  bpmMin?: number;
  bpmMax?: number;
};

export function listGenres(): Array<Track["genre"]> {
  return ["Orchestral", "Electronic", "Hip-Hop", "Ambient", "Rock"];
}

export function listMoods(): Array<Track["mood"]> {
  return ["Epic", "Dark", "Uplifting", "Dramatic", "Chill"];
}

export function getCatalogue(filters: CatalogFilters = {}): Track[] {
  const {
    q,
    genre = "all",
    mood = "all",
    bpmMin = 0,
    bpmMax = 300,
  } = filters;

  return DATA.filter((t) => {
    const matchQ =
      !q ||
      t.title.toLowerCase().includes(q.toLowerCase()) ||
      t.artist.toLowerCase().includes(q.toLowerCase());

    const matchGenre = genre === "all" || t.genre === genre;
    const matchMood = mood === "all" || t.mood === mood;
    const matchBpm = t.bpm >= bpmMin && t.bpm <= bpmMax;

    return matchQ && matchGenre && matchMood && matchBpm;
  });
}
