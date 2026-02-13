/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/SimilarTracks.tsx                            │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Recomienda hasta 6 “similar tracks” a partir de moods/uses compartidos.   │
 * │ - Si no hay coincidencias, cae a “recientes”.                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Usa Prisma: `hasSome` para arrays (Postgres text[]).                      │
 * │ - Excluye el track actual.                                                  │
 * │ - UI minimal (cine): tarjetas con chips.                                    │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import { db } from "@/server/db";
import Link from "next/link";
import { TagType } from "@prisma/client";
import { slugify } from "@/lib/slugify";

function formatDuration(sec: number | null) {
  if (!sec && sec !== 0) return "—:—";
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function Chips({ items }: { items?: string[] | null }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {items.slice(0, 4).map((t, i) => (
        <span
          key={`${t}-${i}`}
          className="rounded-full bg-zinc-800 px-2 py-0.5 text-[11px] text-zinc-200 ring-1 ring-zinc-700"
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export default async function SimilarTracks({
  currentId,
  moods,
  uses,
}: {
  currentId: string;
  moods: string[] | null;
  uses: string[] | null;
}) {
  // 1) Intentamos por similitud (moods/uses)
  const or: any[] = [];
  if (moods && moods.length) {
    const moodSlugs = moods.map((m) => slugify(m)).filter(Boolean);
    if (moodSlugs.length) {
      or.push({
        tags: {
          some: {
            tag: {
              type: TagType.MOOD,
              slug: { in: moodSlugs },
            },
          },
        },
      });
    }
  }
  if (uses && uses.length) {
    const useSlugs = uses.map((u) => slugify(u)).filter(Boolean);
    if (useSlugs.length) {
      or.push({
        tags: {
          some: {
            tag: {
              type: TagType.USE,
              slug: { in: useSlugs },
            },
          },
        },
      });
    }
  }

  let items = await db.track.findMany({
    where: {
      id: { not: currentId },
      ...(or.length ? { OR: or } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
    select: {
      id: true,
      title: true,
      artist: true,
      durationSec: true,
      tags: {
        where: { tag: { type: { in: [TagType.MOOD, TagType.USE] } } },
        select: { tag: { select: { name: true, type: true } } },
      },
    },
  });

  // 2) Fallback: si no hay, mostramos recientes
  if (items.length === 0) {
    items = await db.track.findMany({
      where: { id: { not: currentId } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: {
        id: true,
        title: true,
        artist: true,
        durationSec: true,
        tags: {
          where: { tag: { type: { in: [TagType.MOOD, TagType.USE] } } },
          select: { tag: { select: { name: true, type: true } } },
        },
      },
    });
  }

  if (items.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="text-lg font-medium text-gray-100">Similar tracks</h2>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((t) => (
          <Link
            key={t.id}
            href={`/track/${t.id}`}
            className="group rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 ring-1 ring-transparent transition hover:ring-zinc-600"
          >
            <div className="text-sm text-zinc-400">{t.artist ?? "—"}</div>
            <div className="mt-0.5 text-base font-semibold text-zinc-100 group-hover:underline">
              {t.title ?? "Untitled"}
            </div>
            <div className="mt-1 text-xs text-zinc-500">
              {formatDuration(t.durationSec)}
            </div>
            <Chips
              items={[
                ...t.tags.filter((entry) => entry.tag.type === TagType.MOOD).map((entry) => entry.tag.name),
                ...t.tags.filter((entry) => entry.tag.type === TagType.USE).map((entry) => entry.tag.name),
              ]}
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
