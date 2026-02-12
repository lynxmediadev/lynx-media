"use server";

import { revalidatePath } from "next/cache";
import { TrackType } from "@prisma/client";

import prisma from "@/lib/prisma";

type UpdateCreativeResult = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

function normalizeText(raw: FormDataEntryValue | null): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function normalizeOptionalText(raw: FormDataEntryValue | null): string | null {
  const value = normalizeText(raw);
  return value.length > 0 ? value : null;
}

function normalizeOptionalFloat(raw: FormDataEntryValue | null): number | null {
  if (typeof raw !== "string") return null;
  const value = raw.trim();
  if (!value) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeList(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") return [];
  return Array.from(
    new Set(
      raw
        .split(/[\n,]/g)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .map((s) => s.toUpperCase()),
    ),
  );
}

const ALLOWED_TRACK_TYPES = new Set<TrackType>([
  TrackType.INSTRUMENTAL,
  TrackType.VOCAL,
  TrackType.VOCAL_INSTRUMENTAL,
  TrackType.OTHER,
]);

export async function updateCreative(formData: FormData): Promise<UpdateCreativeResult> {
  const id = normalizeText(formData.get("id"));
  const title = normalizeText(formData.get("title"));
  const artist = normalizeText(formData.get("artist"));
  const bpm = normalizeOptionalFloat(formData.get("bpm"));
  const key = normalizeOptionalText(formData.get("key"));
  const rawTrackType = normalizeText(formData.get("trackType")).toUpperCase();
  const maybeTrackType = rawTrackType as TrackType;
  const trackType: TrackType | null = ALLOWED_TRACK_TYPES.has(maybeTrackType)
    ? maybeTrackType
    : null;
  const genres = normalizeList(formData.get("genres"));
  const subgenres = normalizeList(formData.get("subgenres"));

  const fieldErrors: Record<string, string[]> = {};
  if (!id) fieldErrors.id = ["Falta el ID del track."];
  if (!title) fieldErrors.title = ["El titulo es obligatorio."];
  if (!artist) fieldErrors.artist = ["El artista / proyecto es obligatorio."];
  if (
    typeof formData.get("bpm") === "string" &&
    String(formData.get("bpm") ?? "").trim().length > 0 &&
    bpm === null
  ) {
    fieldErrors.bpm = ["El BPM debe ser numerico."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      message: "Hay errores de validacion en el modulo creativo.",
      fieldErrors,
    };
  }

  try {
    await prisma.track.update({
      where: { id },
      data: {
        title,
        artist,
        bpm,
        key,
        trackType,
        genres,
        subgenres,
      },
      select: { id: true },
    });

    revalidatePath(`/admin/tracks/${id}/edit`);
    revalidatePath(`/admin/tracks/${id}/edit/creative`);
    revalidatePath(`/admin/tracks/${id}/edit/full`);
    revalidatePath("/admin/tracks");

    return { ok: true, message: "Creativo guardado." };
  } catch (error) {
    console.error("[track:edit:updateCreative] fatal:", error);
    return { ok: false, message: "Error al guardar modulo creativo." };
  }
}
