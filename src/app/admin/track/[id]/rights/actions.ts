"use server";

import { db } from "@/server/db";

/* ----------------------- Helpers ----------------------- */
function str(v: FormDataEntryValue | null, fallback = ""): string {
  if (v == null) return fallback;
  const s = String(v).trim();
  return s.length ? s : fallback;
}
function bool(v: FormDataEntryValue | null): boolean {
  if (v == null) return false;
  const s = String(v).toLowerCase();
  return s === "on" || s === "true" || s === "1";
}
function nullable<T>(v: T, emptyAsNull = true): T | null {
  if (v == null) return null;
  if (emptyAsNull && typeof v === "string" && v.trim() === "") return null;
  return v;
}
/** Convierte textarea a string[]:
 * - Si empieza con '[' intenta parsear JSON.
 * - Si no, divide por líneas o comas.
 */
function toStringArray(raw: string | null): string[] | null {
  const s = (raw ?? "").trim();
  if (!s) return null;

  if (s.startsWith("[")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr) && arr.every((x) => typeof x === "string")) {
        return arr as string[];
      }
    } catch {
      // cae a split normal
    }
  }
  return s
    .split(/\r?\n|,/g)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

/* ----------------------- Action ----------------------- */
export async function updateRights(formData: FormData) {
  const id = str(formData.get("id"));
  if (!id) return { ok: false, error: "MISSING_ID" };

  const licenseType = nullable(str(formData.get("licenseType")));
  const territories = nullable(str(formData.get("territories")));
  const term = nullable(str(formData.get("term")));
  const mediaBuy = nullable(str(formData.get("mediaBuy")));
  const mfn = bool(formData.get("mfn"));

  const contentIdEnrolled = bool(formData.get("contentIdEnrolled"));
  const contentIdAdmin = nullable(str(formData.get("contentIdAdmin")));
  const contentIdWhitelist = nullable(str(formData.get("contentIdWhitelist")));

  const master = nullable(str(formData.get("master")));

  // restrictions: text[] en DB → transformamos textarea a string[]
  const restrictionsRaw = str(formData.get("restrictions"), "");
  const restrictionsArr = toStringArray(restrictionsRaw); // puede ser null (no actualizar) o []

  // ------------------- Opción A (guardar como STRING) -------------------
  // publishingSplit se guarda como TEXTO (string) en DB, pero validamos que el texto sea JSON válido
  // con forma: [{ "party": string, "share": number }, ...]
  const publishingSplitRaw = formData.get("publishingSplit");
  const publishingSplitStr = publishingSplitRaw ? String(publishingSplitRaw).trim() : "";

  let publishingSplitToSave: string | null = null;
  if (publishingSplitStr.length > 0) {
    try {
      const arr = JSON.parse(publishingSplitStr);
      const valid =
        Array.isArray(arr) &&
        arr.every(
          (x) =>
            x &&
            typeof x === "object" &&
            typeof (x as any).party === "string" &&
            typeof (x as any).share === "number",
        );
      if (!valid) {
        return { ok: false, error: "PUBLISHING_SPLIT_INVALID_FORMAT" };
      }
      // ✅ válido → guardamos el STRING (no el objeto)
      publishingSplitToSave = publishingSplitStr;
    } catch {
      return { ok: false, error: "PUBLISHING_SPLIT_INVALID_JSON" };
    }
  } else {
    // vacío → guardamos NULL
    publishingSplitToSave = null;
  }
  // ---------------------------------------------------------------------

  try {
    await db.track.update({
      where: { id },
      data: {
        licenseType,
        territories,
        term,
        mediaBuy,
        mfn,
        contentIdEnrolled,
        contentIdAdmin,
        contentIdWhitelist,
        master,
        ...(restrictionsArr !== null && { restrictions: { set: restrictionsArr } }),
        // ← Guardamos como STRING (o NULL) tal cual (Opción A)
        publishingSplit: publishingSplitToSave,
        updatedAt: new Date(),
      },
    });

    return { ok: true };
  } catch (err) {
    console.error("[rights:update] fatal:", err);
    return { ok: false, error: "UPDATE_FAILED" };
  }
}
