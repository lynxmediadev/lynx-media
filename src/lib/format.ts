/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/lib/format.ts                                                  │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                    │
 * │ - Ofrece helpers de formato reutilizables (bytes legibles, fecha, etc.).   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                            │
 * │ - `formatBytes` convierte 1280640 → "1.22 MB".                              │
 * │ - `formatIso` para mostrar un ISO en forma compacta (por si lo necesitas). │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

export function formatBytes(bytes?: number | null, decimals = 2): string {
  if (bytes == null || !isFinite(bytes) || bytes < 0) return "N/A";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = Math.max(0, decimals);
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const v = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${v} ${sizes[i]}`;
}

export function formatIso(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(+d)) return iso;
    return d.toISOString().replace("T", " ").replace("Z", "Z");
  } catch {
    return iso;
  }
}
