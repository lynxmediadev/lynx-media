"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FileText,
  Pause,
  Play,
  Shield,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import PublicAudioBar from "@/components/public/PublicAudioBar";
import CopyLinkButton from "@/components/public/CopyLinkButton";
import LicensingDialog from "@/components/public/LicensingDialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TrackHeroData = {
  id: string;
  title: string | null;
  artist: string | null;
  durationSec: number | null;
  moods: string[] | null;
  uses: string[] | null;
  restrictions: string[] | null;
  bpm: number | null;
  key: string | null;
  versions: string[] | null;
};

export type TrackHeroDetailRow = {
  label: string;
  value: string | null;
};

export type TrackHeroDetailSection = {
  id: string;
  label: string;
  hint?: string;
  columns: TrackHeroDetailRow[][];
};

type Props = {
  track: TrackHeroData;
  coverUrl?: string | null;
  audioSrc: string | null;
  waveformB64: string | null;
  detailSections?: TrackHeroDetailSection[];
};

export default function TrackHero({
  track,
  coverUrl,
  audioSrc,
  waveformB64,
  detailSections = [],
}: Props) {
  const controlsRef = useRef<{ toggle: () => void } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeDetailId, setActiveDetailId] = useState<string | null>(null);

  const cover = coverUrl || "/images/covers/hero-bg-2.png";
  const coverIsDummy = !coverUrl;

  const handlePlay = () => {
    controlsRef.current?.toggle();
  };

  const metadataItems: Array<{ label: string; value: React.ReactNode }> = [
    { label: "BPM", value: formatBpm(track.bpm) },
    { label: "Tonalidad", value: formatText(track.key) },
    { label: "Versiones", value: formatList(track.versions) },
    { label: "Moods", value: renderTagLinks(track.moods, "mood") },
    { label: "Usos", value: renderTagLinks(track.uses, "use") },
  ];

  const activeDetail =
    detailSections.find((section) => section.id === activeDetailId) ?? null;

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
        <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-4">
          <div className="flex w-full max-w-[300px] flex-col items-start gap-3 lg:w-[32%]">
            <div className="relative aspect-square w-full max-w-[280px] overflow-hidden rounded-[2px] border border-border bg-card">
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

          <div className="flex min-w-0 flex-1">
            <div className="flex h-full min-h-[280px] w-full flex-col justify-between gap-3">
              <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="min-w-0 flex-1 space-y-1">
                  <p className="sr-only">Track público</p>
                  <h1 className="text-2xl font-semibold leading-tight line-clamp-2 break-words">
                    {track.title ?? "Sin título"}
                  </h1>
                  {track.artist ? (
                    <Link
                      href={buildCatalogHref("artist", track.artist)}
                      className="text-sm text-muted-foreground line-clamp-2 break-words underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      {track.artist}
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground line-clamp-2 break-words">
                      Artista desconocido
                    </span>
                  )}
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

              <div className="w-full rounded-[2px] border border-border bg-card/40 p-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
                    Metadata
                  </h2>
                  <span className="text-[11px] text-muted-foreground">Vista rapida</span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  {metadataItems.map((item) => (
                    <MetadataItem key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
              </div>

              {detailSections.length ? (
                <div className="flex w-full flex-row items-stretch gap-2">
                  {detailSections.map((section) => (
                    <ActionIconButton
                      key={section.id}
                      label={section.label}
                      icon={getDetailIcon(section.id)}
                      onClick={() => setActiveDetailId(section.id)}
                    />
                  ))}
                </div>
              ) : null}
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

      {activeDetail ? (
        <DetailModal
          section={activeDetail}
          onClose={() => setActiveDetailId(null)}
        />
      ) : null}
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

function MetadataItem({ label, value }: { label: string; value: React.ReactNode }) {
  const isEmpty = value === null || value === undefined || value === "";
  const content = isEmpty ? "—" : value;
  const isString = typeof content === "string";
  return (
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      {isString ? (
        <p
          className={`mt-1 text-sm font-medium leading-snug ${isEmpty ? "text-muted-foreground" : "text-foreground"} line-clamp-2 break-words`}
        >
          {content}
        </p>
      ) : (
        <div className={`mt-1 text-sm leading-snug ${isEmpty ? "text-muted-foreground" : "text-foreground"}`}>
          {content}
        </div>
      )}
    </div>
  );
}

function ActionIconButton({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 items-center justify-between rounded-[2px] border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-border/40 hover:border-border/90 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="inline-flex items-center gap-2">
        {icon}
        {label}
      </span>
    </button>
  );
}

function DetailModal({
  section,
  onClose,
}: {
  section: TrackHeroDetailSection;
  onClose: () => void;
}) {
  function handleOverlayClick(event: React.MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(0,0,0,0.55)] px-4"
      onClick={handleOverlayClick}
    >
      <div
        className="w-full max-w-2xl rounded-[2px] border border-border bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {section.label}
            </p>
            {section.hint ? (
              <p className="text-sm text-muted-foreground">{section.hint}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-border text-muted-foreground transition hover:border-border/80"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {section.columns.map((column, index) => (
            <dl key={`${section.id}-col-${index}`} className="space-y-2 text-sm">
              {column.map((row) => (
                <div
                  key={`${section.id}-${row.label}`}
                  className="grid grid-cols-[7rem,1fr] items-start gap-3"
                >
                  <dt className="text-muted-foreground">{row.label}</dt>
                  <dd className={row.value ? "text-foreground" : "text-muted-foreground"}>
                    {row.value ?? "—"}
                  </dd>
                </div>
              ))}
            </dl>
          ))}
        </div>
      </div>
    </div>
  );
}

function formatText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatList(values: string[] | null | undefined) {
  if (!Array.isArray(values) || values.length === 0) return null;
  return values.join(" / ");
}

function formatBpm(bpm: number | null | undefined) {
  if (typeof bpm !== "number" || !Number.isFinite(bpm)) return null;
  return String(Math.round(bpm));
}

function getDetailIcon(id: string) {
  switch (id) {
    case "sync":
      return <SlidersHorizontal className="h-4 w-4" />;
    case "restrictions":
      return <Shield className="h-4 w-4" />;
    case "rights":
      return <FileText className="h-4 w-4" />;
    default:
      return <Users className="h-4 w-4" />;
  }
}

function buildCatalogHref(param: "mood" | "use" | "artist", value: string) {
  const qs = new URLSearchParams({ [param]: value });
  return `/catalog?${qs.toString()}`;
}

function renderTagLinks(values: string[] | null | undefined, param: "mood" | "use") {
  if (!Array.isArray(values) || values.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {values.map((value, index) => (
        <Link
          key={`${param}-${value}-${index}`}
          href={buildCatalogHref(param, value)}
          className="inline-flex items-center rounded-[2px] border border-border bg-background/70 px-2 py-1 text-[11px] leading-tight text-foreground transition hover:bg-border/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {value}
        </Link>
      ))}
    </div>
  );
}
