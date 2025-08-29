// ================================================
// File: prisma/seed.bulk.ts
// Título: Seed Acumulativo (genera N pistas nuevas)
// Descripción: Inserta N pistas dummy para pruebas de volumen/paginación.
// Qué hace: Agrega registros sin borrar los existentes.
// Peras y manzanas: “Agrego muchas fichas nuevas para probar el catálogo grande.”
// ================================================
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const MOODS = ["Epic","Emotional","Elegant","Atmospheric","Dark","Uplifting","Warm","Minimal","Intense"];
const USES  = ["TV","Cine","Publicidad","Trailers","Series","Videojuegos","Documental","Streaming"];

function pickSome<T>(arr: T[], min = 1, max = 3): T[] {
  const n = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function titleFor(i: number): string {
  const adj = ["Aurora","Crimson","Veridian","Obsidian","Saffron","Azure","Amber","Ivory","Magenta","Cobalt"];
  const noun = ["Trail","Sky","Pulse","Horizon","Echo","River","Storm","Flare","Canvas","Voyage"];
  const a = adj[i % adj.length];
  const b = noun[(i * 7) % noun.length];
  return `${a} ${b} #${i.toString().padStart(3, "0")}`;
}

async function main() {
  // Lee el conteo: primero argv, luego env, default 25
  const argN = Number(process.argv[2]);
  const envN = Number(process.env.BULK_COUNT);
  const COUNT = Number.isFinite(argN) ? argN : Number.isFinite(envN) ? envN : 25;

  const AUDIO = "/audio/demo.mp3";
  const COVER = "/images/hero/hero-bg-1.png";

  console.log(`⏳ Generando ${COUNT} pistas dummy…`);

  for (let i = 1; i <= COUNT; i++) {
    const t = titleFor(i);
    const moods = pickSome(MOODS);
    const uses = pickSome(USES);

    // Nota: NO seteamos id -> Prisma generará cuid()
    await db.track.create({
      data: {
        title: t,
        artist: "Lynx Music Collective",
        audioUrl: AUDIO,
        coverUrl: COVER,
        moods,
        uses,
        master: "Lynx Media (One-Stop)",
        publishingSplit: "100% Lynx Music Collective",
        licenseType: "No exclusiva",
        territories: "Worldwide",
        restrictions: [],
        assetKey: "external:///audio/demo.mp3",
        assetMime: "audio/mpeg",
        assetSize: 0,
      },
    });
  }

  console.log(`✅ Bulk seed completado. Insertadas ${COUNT} pistas.`);
}

main()
  .catch(async (e) => {
    console.error("❌ Bulk seed error:", e);
    await db.$disconnect();
    process.exit(1);
  })
  .then(async () => {
    await db.$disconnect();
  });
