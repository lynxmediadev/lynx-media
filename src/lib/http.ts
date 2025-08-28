// ================================================
// File: src/lib/http.ts
// Título: Helper GET JSON
// Descripción: Envuelve fetch GET y reporta errores con status.
// Qué hace: Devuelve JSON tipado o lanza error claro.
// Peras y manzanas: “Si no me contestan bien, lo digo con número y mensaje.”
// ================================================
export async function getJSON<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    ...init,
    headers: { Accept: "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`[${res.status}] ${msg}`);
  }
  return res.json() as Promise<T>;
}
