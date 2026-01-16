"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Play, Pause } from "lucide-react";
import PublicAudioBar from "@/components/public/PublicAudioBar";
import CopyLinkButton from "@/components/public/CopyLinkButton";
import LicensingDialog from "@/components/public/LicensingDialog";

type Props = {
  track: {
    id: string;
    title: string | null;
    artist: string | null;
    durationSec: number | null;
    moods: string[] | null;
    uses: string[] | null;
    restrictions: string[] | null;
  };
  coverUrl?: string | null;
  audioSrc: string | null;
  waveformB64: string | null;
};

export default function TrackHero({ track, coverUrl, audioSrc, waveformB64 }: Props) {
  const controlsRef = useRef<{ toggle: () => void } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const cover = coverUrl || "/images/covers/hero-bg-2.png";
  const coverIsDummy = !coverUrl;

  const handlePlay = () => {
    controlsRef.current?.toggle();
  };

  return (
    <section className="relative overflow-hidden rounded-[2px] border border-border bg-background/90 shadow-sm">
      <div
        className="absolute inset-0 bg-cover bg-center blur-3xl opacity-40"
        style={{ backgroundImage: `url(${cover})` }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/85 via-background/70 to-background/90" />

      <div className="relative z-10 flex flex-col gap-6 px-5 py-6">
        {/* Fila superior: cover a la izquierda, título a la derecha + acciones arriba */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          <div className="flex w-full max-w-[280px] flex-col items-start gap-3 lg:w-[32%]">
            <div className="relative aspect-square w-full max-w-[260px] overflow-hidden rounded-[2px] border border-border bg-card">
              <Image
                src={cover}
                alt={coverIsDummy ? "Portada (d)" : `Portada de ${track.title ?? "track"}`}
                fill
                sizes="260px"
                className="object-cover"
                priority
              />
              <button
                type="button"
                onClick={handlePlay}
                className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/80 text-foreground shadow-lg transition hover:scale-[1.03] hover:bg-border/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                aria-label={isPlaying ? "Pausar" : "Reproducir"}
              >
                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6" />}
              </button>
              {coverIsDummy ? (
                <span className="absolute left-2 top-2 rounded-[2px] bg-background/80 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                  Portada (d)
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1 space-y-1">
                <p className="sr-only">Track público</p>
                <h1 className="text-3xl font-semibold leading-tight line-clamp-2 break-words">
                  {track.title ?? "Sin título"}
                </h1>
                <p className="text-sm text-muted-foreground line-clamp-2 break-words">
                  {track.artist ?? "Artista desconocido"}
                </p>
                <p className="text-xs text-muted-foreground">{fmtDuration(track.durationSec)}</p>
              </div>
              <div className="flex shrink-0 flex-nowrap items-start justify-end gap-2">
                <CopyLinkButton />
                <LicensingDialog
                  className="rounded-[2px]"
                  track={{
                    id: track.id,
                    title: track.title,
                    artist: track.artist,
                    durationSec: track.durationSec,
                    moods: track.moods,
                    uses: track.uses,
                    restrictions: track.restrictions,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Fila inferior: waveform ocupa todo el ancho disponible */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-1 items-center">
            <PublicAudioBar
              src={audioSrc}
              durationSec={track.durationSec ?? 0}
              waveformB64={waveformB64}
              interactive
              className="w-full border border-border bg-card/60 px-3 py-2 rounded-[2px]"
              frameClassName="relative select-none rounded-[2px] bg-transparent"
              onPlaybackChange={setIsPlaying}
              onReady={(controls) => {
                controlsRef.current = { toggle: controls.toggle };
              }}
              layout="inline"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function fmtDuration(sec: number | null) {
  if (sec == null || !Number.isFinite(sec)) return "—";
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
