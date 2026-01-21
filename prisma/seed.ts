// ================================================
// File: prisma/seed.ts
// Título: Seed de Tracks (idempotente con upsert)
// Descripción: Inserta 5 pistas de ejemplo para pruebas del catálogo.
// Qué hace: Carga datos coherentes y repetibles en la tabla `Track`.
// Peras y manzanas: “Dejo cinco fichas listas en la libreta; si ya existen,
//                    las actualizo, si faltan, las creo.”
// ================================================
import { PrismaClient } from "@prisma/client";
const db = new PrismaClient();

async function main() {
  // Puedes ajustar audioUrl a una URL pública si prefieres.
  const AUDIO = "/audio/demo.mp3";
  const COVER = "/images/hero/hero-bg-1.png";

  const seedTracks = [
    {
      id: "seed-001",
      title: "Golden Horizon (Seed Demo)",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["Epic", "Emotional", "Elegant"],
      uses: ["TV", "Cine", "Publicidad"],
      // Identificadores / derechos mínimos opcionales
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: ["Sin campañas políticas"],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      // Asset (modo URL directa)
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      // Técnicos (se poblarán en Fase C)
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-002",
      title: "Golden Horizon (Edit 60s)",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["Epic"],
      uses: ["Trailers"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: [],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-003",
      title: "Golden Horizon (Edit 30s)",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["Elegant"],
      uses: ["Publicidad", "Videojuegos"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: [],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-004",
      title: "Nocturne in Blue",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["Atmospheric", "Dark"],
      uses: ["Cine", "Series"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: [],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
    {
      id: "seed-005",
      title: "Sunlit Trails",
      artist: "Lynx Music Collective",
      audioUrl: AUDIO,
      coverUrl: COVER,
      moods: ["Uplifting", "Warm"],
      uses: ["Publicidad", "TV"],
      isrc: null,
      iswc: null,
      upc: null,
      master: "Lynx Media (One-Stop)",
      publishingSplit: "100% Lynx Music Collective",
      licenseType: "NON_EXCLUSIVE",
      exclusiveTerritories: ["WORLDWIDE"],
      exclusiveTermMonths: null,
      mediaBuy: null,
      mfn: null,
      restrictions: [],
      contentIdEnrolled: null,
      contentIdAdmin: null,
      contentIdWhitelist: null,
      assetKey: "external:///audio/demo.mp3",
      assetMime: "audio/mpeg",
      assetSize: 0,
      durationSec: null,
      loudnessLufs: null,
    },
  ];

  // Idempotente: upsert por id (si está, actualiza; si falta, crea)
  for (const t of seedTracks) {
    await db.track.upsert({
      where: { id: t.id },
      update: {
        title: t.title,
        artist: t.artist,
        audioUrl: t.audioUrl,
        coverUrl: t.coverUrl,
        moods: t.moods,
        uses: t.uses,
        isrc: t.isrc,
        iswc: t.iswc,
        upc: t.upc,
        master: t.master,
        publishingSplit: t.publishingSplit,
        licenseType: t.licenseType,
        exclusiveTerritories: t.exclusiveTerritories,
        exclusiveTermMonths: t.exclusiveTermMonths,
        mediaBuy: t.mediaBuy,
        mfn: t.mfn,
        restrictions: t.restrictions,
        contentIdEnrolled: t.contentIdEnrolled,
        contentIdAdmin: t.contentIdAdmin,
        contentIdWhitelist: t.contentIdWhitelist,
        assetKey: t.assetKey,
        assetMime: t.assetMime,
        assetSize: t.assetSize,
        durationSec: t.durationSec,
        loudnessLufs: t.loudnessLufs,
      },
      create: t,
    });
  }
}

main()
  .then(async () => {
    console.log("✅ Seed completado.");
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed error:", e);
    await db.$disconnect();
    process.exit(1);
  });
