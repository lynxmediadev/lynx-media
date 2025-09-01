"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/CatalogFilterBar.tsx                         │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo                                                                    │
 * │ - Form GET para filtrar el catálogo: texto, moods/uses (CSV), rango dur.,   │
 * │   orden y reseteo rápido.                                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - Es Client Component porque usamos inputs controlados con defaultValue.    │
 * │ - Envío por GET → la URL lleva los filtros; compartir es trivial.           │
 * │ - Mantenemos estilos sobrios (cine minimal).                                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";

export default function CatalogFilterBar({
  initial,
  total,
  pageSize,
}: {
  initial: {
    q: string;
    moodsCsv: string;
    usesCsv: string;
    minSec: number | "" ;
    maxSec: number | "" ;
    sort: string;
    page: number;
  };
  total: number;
  pageSize: number;
}) {
  const { q, moodsCsv, usesCsv, minSec, maxSec, sort } = initial;
  const from = (initial.page - 1) * pageSize + 1;
  const to = Math.min(initial.page * pageSize, total);

  return (
    <form method="GET" className="grid grid-cols-1 gap-3 rounded-md border border-zinc-800 p-3 md:grid-cols-12">
      {/* Buscar */}
      <div className="md:col-span-3">
        <label className="mb-1 block text-xs text-zinc-400">Buscar</label>
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Título, artista o ID exacto"
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
        />
      </div>

      {/* Moods CSV */}
      <div className="md:col-span-3">
        <label className="mb-1 block text-xs text-zinc-400">
          Moods (CSV)
        </label>
        <input
          type="text"
          name="moods"
          defaultValue={moodsCsv}
          placeholder="cinematic, tension, uplifting…"
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
        />
      </div>

      {/* Uses CSV */}
      <div className="md:col-span-3">
        <label className="mb-1 block text-xs text-zinc-400">
          Usos (CSV)
        </label>
        <input
          type="text"
          name="uses"
          defaultValue={usesCsv}
          placeholder="film, ads, trailer…"
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
        />
      </div>

      {/* Rango duración */}
      <div className="md:col-span-1">
        <label className="mb-1 block text-xs text-zinc-400">Min (s)</label>
        <input
          type="number"
          name="min"
          min={0}
          defaultValue={minSec}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
        />
      </div>
      <div className="md:col-span-1">
        <label className="mb-1 block text-xs text-zinc-400">Max (s)</label>
        <input
          type="number"
          name="max"
          min={0}
          defaultValue={maxSec}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
        />
      </div>

      {/* Orden */}
      <div className="md:col-span-1">
        <label className="mb-1 block text-xs text-zinc-400">Orden</label>
        <select
          name="sort"
          defaultValue={sort}
          className="w-full rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-100"
        >
          <option value="newest">Más nuevos</option>
          <option value="oldest">Más antiguos</option>
          <option value="title_asc">Título A–Z</option>
          <option value="title_desc">Título Z–A</option>
          <option value="dur_asc">Duración ↑</option>
          <option value="dur_desc">Duración ↓</option>
          <option value="lufs_asc">LUFS ↑</option>
          <option value="lufs_desc">LUFS ↓</option>
        </select>
      </div>

      {/* Controles */}
      <div className="flex items-end justify-between md:col-span-12">
        <div className="text-xs text-zinc-400">
          {total === 0 ? "0 resultados" : `${from}–${to} de ${total}`}
        </div>
        <div className="flex gap-2">
          <a
            href="/catalog"
            className="rounded border border-zinc-700 bg-zinc-950 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-900"
          >
            Limpiar
          </a>
          <input type="hidden" name="page" value="1" />
          <button
            type="submit"
            className="rounded border border-zinc-700 bg-white/5 px-3 py-1.5 text-sm text-zinc-100 hover:bg-white/10"
            title="Aplicar filtros"
          >
            Aplicar
          </button>
        </div>
      </div>
    </form>
  );
}
