import { getBaseUrl } from "@/lib/base-url";

function audioUnavailable(message: string) {
  const err = new Error(message) as Error & { code?: string };
  err.code = "AUDIO_UNAVAILABLE";
  return err;
}

export function resolveAudioUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  const base = getBaseUrl();
  if (url.startsWith("/")) return `${base}${url}`;
  return `${base}/${url}`;
}

export async function preflightAudioUrl(url: string) {
  const timeoutSignal = AbortSignal.timeout(5000);

  try {
    const head = await fetch(url, { method: "HEAD", cache: "no-store", signal: timeoutSignal });
    if (head.ok) return;
    if (head.status !== 405 && head.status !== 403) {
      throw audioUnavailable(`Audio URL no accesible (status ${head.status})`);
    }
  } catch (err: any) {
    if (err?.code === "AUDIO_UNAVAILABLE") throw err;
  }

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
      cache: "no-store",
      signal: timeoutSignal,
    });
    if (!res.ok && res.status !== 206) {
      throw audioUnavailable(`Audio URL no accesible (status ${res.status})`);
    }
  } catch (err: any) {
    if (err?.code === "AUDIO_UNAVAILABLE") throw err;
    throw audioUnavailable(`Audio URL no accesible (${err?.message ?? "network"})`);
  }
}
