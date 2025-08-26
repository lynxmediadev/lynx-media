// ================================================
// File: src/lib/audio-engine.ts
// Singleton AudioContext (SSR-safe, lint-safe)
// ================================================
export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  type LynxWindow = Window & typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
    __lynx_audio_ctx?: AudioContext;
  };
  const w = window as LynxWindow;
  const AC: typeof AudioContext | undefined = w.AudioContext ?? w.webkitAudioContext;
  if (!AC) return null;
  w.__lynx_audio_ctx ??= new AC();
  const ctx = w.__lynx_audio_ctx;
  if (ctx.state === "suspended") {
    void ctx.resume();
  }
  return ctx;
}
