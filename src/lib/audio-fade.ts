
// ================================================
// File: src/lib/audio-fade.ts
// Minimal pop‑free fades for <audio> using Web Audio API (lint-safe)
// ================================================
import { getAudioContext } from "@/lib/audio-engine";

const nodeMap = new WeakMap<HTMLAudioElement, {
  source: MediaElementAudioSourceNode;
  gain: GainNode;
}>();

function ensureChain(el: HTMLAudioElement): { ctx: AudioContext; gain: GainNode } | null {
  const ctx = getAudioContext();
  if (!ctx) return null;
  let entry = nodeMap.get(el);
  if (!entry) {
    const source = ctx.createMediaElementSource(el);
    const gain = ctx.createGain();
    gain.gain.value = 1;
    source.connect(gain).connect(ctx.destination);
    entry = { source, gain };
    nodeMap.set(el, entry);
    try {
      el.volume = 1; // control por GainNode, no por HTMLMediaElement
    } catch {
      // noop
    }
  }
  return { ctx, gain: entry.gain };
}

export function primeFadeIn(el: HTMLAudioElement, value = 0): void {
  const chain = ensureChain(el);
  if (!chain) return;
  const { ctx, gain } = chain;
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(value, t);
}

export async function fadeIn(el: HTMLAudioElement, ms = 60): Promise<void> {
  const chain = ensureChain(el);
  if (!chain) return;
  const { ctx, gain } = chain;
  const t = ctx.currentTime;
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(1, t + ms / 1000);
  await new Promise<void>((r) => setTimeout(r, ms));
}

export async function fadeOutAndPause(el: HTMLAudioElement, ms = 80): Promise<void> {
  const chain = ensureChain(el);
  if (!chain) {
    try { el.pause(); } catch { /* noop */ }
    return;
  }
  const { ctx, gain } = chain;
  const t = ctx.currentTime;
  const current = gain.gain.value;
  gain.gain.setValueAtTime(current, t);
  gain.gain.linearRampToValueAtTime(0, t + ms / 1000);
  await new Promise<void>((r) => setTimeout(r, ms));
  try { el.pause(); } catch { /* noop */ }
}
