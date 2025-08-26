
// ================================================
// File: src/lib/audio-bus.ts
// Global singleton: garantiza reproducción única + soporta fades
// ================================================
export type AudioEntry = {
  el: HTMLAudioElement;
  fadeOut?: (ms?: number) => Promise<void>;
};

const registry = new Map<string, AudioEntry>();

export const audioBus = {
  register(id: string, el: HTMLAudioElement, fadeOut?: (ms?: number) => Promise<void>): () => void {
    registry.set(id, { el, fadeOut });
    return () => {
      const cur = registry.get(id);
      if (cur && cur.el === el) registry.delete(id);
    };
  },
  pauseOthers(exceptId: string, fadeOutMs = 80): void {
    for (const [id, entry] of registry.entries()) {
      if (id !== exceptId) {
        const fn = entry.fadeOut;
        if (typeof fn === "function") {
          void fn(fadeOutMs);
        } else {
          try { entry.el.pause(); } catch { /* noop */ }
        }
      }
    }
  },
  getCurrentMap(): Map<string, AudioEntry> { return registry; },
};
