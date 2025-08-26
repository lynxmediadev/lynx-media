// ================================================
// File: src/components/ui/AudioPlayerDemo.tsx
// Thin demo wrapper (no necesitas definir 'demo' por página)
// ================================================
"use client";

import * as React from "react";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import type { PlayerTrack } from "@/domain/track";
import { makeDemoTrack } from "@/data/demo-track";

export type AudioPlayerDemoProps = {
  id?: string;
  overrides?: Partial<PlayerTrack>;
  className?: string;
};

export function AudioPlayerDemo({ id = "demo-001", overrides, className }: AudioPlayerDemoProps) {
  const track = React.useMemo(() => makeDemoTrack(id, overrides), [id, overrides]);
  return <AudioPlayer track={track} className={className} />;
}
