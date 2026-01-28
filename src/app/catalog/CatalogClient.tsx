"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  Clapperboard,
  Download,
  Eye,
  FileText,
  Layers,
  Link as LinkIcon,
  MoreVertical,
  Pause,
  Play,
  X,
} from "lucide-react";
import Sparkline from "@/components/audio/Sparkline";
import WaveformScrubber from "@/components/public/WaveformScrubber";
import type { Track } from "@/lib/catalog/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CopyIconButton } from "@/components/ui/CopyIconButton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ProgressMap = Record<string, number>;

const STEMS_MOCK = ["Drums", "Bass", "Keys", "Guitars", "Percussion", "Vocals"];

type CatalogTrack = Track & {
  waveformB64?: string | null;
  durationSec?: number | null;
};

type Props = {
  tracks: CatalogTrack[];
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  compact?: boolean;
  catalogSlug?: string;
};

/**
 * Catálogo público – tabla compacta inspirada en TableView original:
 * - Columnas: arte/play + título/subtítulo, waveform técnico, duración/BPM, acciones.
 * - Acciones: licencia (card), stems (card), probar video (placeholder), copiar enlace, menú.
 * - Waveform reutiliza Sparkline (mismo estilo que ficha técnica).
 */
export default function CatalogClient({
  tracks,
  title = "Catálogo",
  subtitle = "Lista compacta con reproductor y acciones rápidas.",
  eyebrow = "Catálogo",
  hideHeader = false,
  compact = false,
  catalogSlug,
}: Props & { hideHeader?: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const router = useRouter();

  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressMap, setProgressMap] = useState<ProgressMap>({});
  const [licenseTrack, setLicenseTrack] = useState<CatalogTrack | null>(null);
  const [stemsTrack, setStemsTrack] = useState<CatalogTrack | null>(null);
  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);

  // Prepara waveform base64 por track (usa real si existe, fallback si no)
  const waveformMap = useMemo(() => {
    const map: Record<string, string> = {};
    for (const track of tracks) {
      if (track.waveformB64) {
        map[track.id] = track.waveformB64;
        continue;
      }
      map[track.id] = makeBase64Wave(track.id, 256);
    }
    return map;
  }, [tracks]);

  const currentTrack = useMemo(
    () => tracks.find((t) => t.id === currentTrackId) ?? null,
    [currentTrackId, tracks],
  );

  useEffect(() => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    const onTime = () => {
      if (!currentTrackId) return;
      const duration =
        audioEl.duration && !Number.isNaN(audioEl.duration)
          ? audioEl.duration
          : currentTrack?.durationSec ?? parseDurationSeconds(currentTrack?.duration);
      if (!duration || Number.isNaN(duration)) return;

      setProgressMap((prev) => ({
        ...prev,
        [currentTrackId]: Math.min(1, audioEl.currentTime / duration),
      }));
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (currentTrackId) {
        setProgressMap((prev) => ({ ...prev, [currentTrackId]: 0 }));
      }
    };

    const onLoaded = () => {
      if (
        pendingSeekRef.current !== null &&
        audioEl.duration &&
        !Number.isNaN(audioEl.duration)
      ) {
        audioEl.currentTime = audioEl.duration * pendingSeekRef.current;
        pendingSeekRef.current = null;
      }
    };

    audioEl.addEventListener("timeupdate", onTime);
    audioEl.addEventListener("ended", onEnded);
    audioEl.addEventListener("loadedmetadata", onLoaded);
    return () => {
      audioEl.removeEventListener("timeupdate", onTime);
      audioEl.removeEventListener("ended", onEnded);
      audioEl.removeEventListener("loadedmetadata", onLoaded);
    };
  }, [currentTrackId, currentTrack]);

  const handlePlayPause = (track: CatalogTrack) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (currentTrackId === track.id) {
      if (isPlaying) {
        audioEl.pause();
        setIsPlaying(false);
      } else {
        audioEl
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      return;
    }

    setCurrentTrackId(track.id);
    pendingSeekRef.current = null;
    setProgressMap((prev) => ({ ...prev, [track.id]: 0 }));
    audioEl.src = track.audioUrl;
    audioEl.currentTime = 0;
    audioEl
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const handleSeek = (track: CatalogTrack, ratio: number) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const clamped = Math.max(0, Math.min(1, ratio));

    if (currentTrackId === track.id && audioEl.duration && !Number.isNaN(audioEl.duration)) {
      audioEl.currentTime = audioEl.duration * clamped;
      setProgressMap((prev) => ({ ...prev, [track.id]: clamped }));
      if (!isPlaying) {
        audioEl
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
      return;
    }

    pendingSeekRef.current = clamped;
    setCurrentTrackId(track.id);
    setProgressMap((prev) => ({ ...prev, [track.id]: clamped }));
    audioEl.src = track.audioUrl;
    audioEl
      .play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  };

  const buildTrackHref = (trackId: string) =>
    catalogSlug ? `/${catalogSlug}/track/${trackId}` : `/track/${trackId}`;

  const buildTrackUrl = (trackId: string) => {
    const href = buildTrackHref(trackId);
    if (typeof window !== "undefined") {
      return `${window.location.origin}${href}`;
    }
    return href;
  };

  const handleCopyLink = (track: CatalogTrack) => {
    const url = buildTrackUrl(track.id);
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
  };

  return (
    <div className="bg-background text-foreground pb-0 flex flex-col min-h-0">
      <div
        className={cn(
          "mx-auto flex w-full max-w-7xl flex-col flex-1",
          compact ? "gap-2 px-0 py-0" : "gap-4 px-4 py-8 sm:px-6 lg:px-8",
        )}
      >
        {!hideHeader && (
          <header className="flex flex-col gap-2">
            <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </p>
            <h1 className="text-2xl font-semibold">{title}</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">{subtitle}</p>
          </header>
        )}

        <section className="relative overflow-visible rounded-[2px] border border-border/70 bg-transparent shadow-sm">
          <table className="min-w-full table-auto">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[48%]" />
              <col className="w-[10%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-transparent text-left text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground border-b border-border/60">
              <tr>
                <th className="relative px-4 py-2 after:absolute after:right-0 after:top-[25%] after:bottom-[25%] after:w-px after:bg-border/70 last:after:hidden">
                  Title
                </th>
                <th className="relative px-4 py-2 after:absolute after:right-0 after:top-[25%] after:bottom-[25%] after:w-px after:bg-border/70 last:after:hidden">
                  Waveform
                </th>
                <th className="relative px-4 py-2 text-center after:absolute after:right-0 after:top-[25%] after:bottom-[25%] after:w-px after:bg-border/70 last:after:hidden">
                  Length
                </th>
                <th className="px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, index) => (
                <TrackRow
                  key={track.id}
                  track={track}
                  isActive={currentTrackId === track.id}
                  isPlaying={isPlaying}
                  rowClass=""
                  progress={progressMap[track.id] ?? 0}
                  waveformB64={waveformMap[track.id]}
          durationSec={
            track.durationSec ?? parseDurationSeconds(track.duration) ?? null
          }
          onPlayPause={() => handlePlayPause(track)}
          onSeek={(r) => handleSeek(track, r)}
                  onOpenLicense={() => setLicenseTrack(track)}
                  onOpenStems={() => setStemsTrack(track)}
                  onCopy={() => handleCopyLink(track)}
                  onView={(href) => router.push(href)}
                  menuOpen={menuTrackId === track.id}
                  onToggleMenu={() =>
                    setMenuTrackId((prev) => (prev === track.id ? null : track.id))
                  }
                  closeMenu={() => setMenuTrackId(null)}
                  buildTrackUrl={buildTrackUrl}
                  buildTrackHref={buildTrackHref}
                  catalogSlug={catalogSlug}
                />
              ))}
            </tbody>
          </table>
        </section>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-1 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-border bg-card text-[11px] text-muted-foreground">
              {currentTrack ? "Now" : "Idle"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold">
                {currentTrack ? currentTrack.title : "Ningún track seleccionado"}
              </span>
              {currentTrack?.artist ? (
                <Link
                  href={buildCatalogHref("artist", currentTrack.artist)}
                  className="text-xs text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  {currentTrack.artist}
                </Link>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {currentTrack ? "Artista desconocido" : "Elige play en la tabla"}
                </span>
              )}
            </div>
          </div>

          {currentTrack ? (
            <button
              type="button"
              onClick={() => handlePlayPause(currentTrack)}
              className="hidden h-11 w-11 items-center justify-center rounded-[2px] border border-border text-foreground transition hover:border-border/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:inline-flex"
              aria-label={isPlaying ? "Pausar track" : "Reproducir track"}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          ) : null}

          <div className="min-w-[260px] flex-1 sm:min-w-[320px]">
            <audio
              ref={audioRef}
              className="w-full"
              preload="none"
              controls
              aria-label="Reproductor del catálogo"
            />
          </div>
        </div>
      </footer>

      <ModalCard track={licenseTrack} title="Licencia" onClose={() => setLicenseTrack(null)}>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus. Suspendisse
          lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor. Cras elementum
          ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <button className="rounded-[2px] border border-border/80 px-3 py-1">
            Descargar PDF
          </button>
          <button className="rounded-[2px] border border-border/80 px-3 py-1">
            Solicitar ajustes
          </button>
        </div>
      </ModalCard>

      <ModalCard track={stemsTrack} title="Stems" onClose={() => setStemsTrack(null)}>
        <div className="space-y-2">
          {STEMS_MOCK.map((stem) => (
            <div
              key={`${stemsTrack?.id ?? "stem"}-${stem}`}
              className="flex items-center gap-3 rounded-[2px] border border-border/70 bg-card/80 px-3 py-2"
            >
              <span className="w-32 truncate text-sm font-medium">{stem}</span>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[2px] border border-border/80 text-foreground transition hover:border-border/60"
                aria-label={`Reproducir stem ${stem}`}
              >
                <Play className="h-4 w-4" />
              </button>
              <div className="flex min-w-0 flex-1 items-center">
        <WaveformScrubber
          waveformB64={makeBase64Wave(stem, 96)}
          height={26}
          durationSec={stemsTrack?.durationSec ?? undefined}
          progress={0}
          className="w-full bg-transparent ring-0 border-0 text-foreground"
          frameClassName="relative select-none rounded-[2px] bg-transparent ring-0 border-0 text-foreground"
                  smooth
                  smoothWindow={5}
                />
              </div>
              <div className="flex items-center gap-2 text-xs">
                <button className="rounded-[2px] border border-border/80 px-2 py-1">
                  S
                </button>
                <button className="rounded-[2px] border border-border/80 px-2 py-1">
                  M
                </button>
                <button
                  type="button"
                  className="rounded-[2px] border border-border/80 p-2"
                  aria-label="Descargar stem"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ModalCard>
    </div>
  );
}

interface TrackRowProps {
  track: CatalogTrack;
  isActive: boolean;
  isPlaying: boolean;
  progress: number;
  durationSec: number | null;
  rowClass: string;
  waveformB64: string;
  onPlayPause: () => void;
  onSeek: (ratio: number) => void;
  onOpenLicense: () => void;
  onOpenStems: () => void;
  onCopy: () => void;
  onView: (href: string) => void;
  menuOpen: boolean;
  onToggleMenu: () => void;
  closeMenu: () => void;
  buildTrackUrl: (id: string) => string;
  buildTrackHref: (id: string) => string;
}

function TrackRow({
  track,
  isActive,
  isPlaying,
  progress,
  durationSec,
  rowClass,
  waveformB64,
  onPlayPause,
  onSeek,
  onOpenLicense,
  onOpenStems,
  onCopy,
  onView,
  menuOpen,
  onToggleMenu,
  closeMenu,
  buildTrackUrl,
  buildTrackHref,
  catalogSlug,
}: TrackRowProps & { catalogSlug?: string }) {
  const menuAreaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuAreaRef.current && !menuAreaRef.current.contains(target)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeMenu();
        const active = document.activeElement as HTMLElement | null;
        if (active && menuAreaRef.current?.contains(active)) {
          active.blur();
        }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [menuOpen, closeMenu]);

  return (
    <tr
      className={`align-middle text-sm transition duration-150 hover:bg-border/20 hover:ring-1 hover:ring-border/70 border-b border-border/60 last:border-b-0 ${rowClass}`}
    >
      <td className="px-3 py-2">
        <div className="flex flex-col gap-0.5">
          <Link
            href={buildTrackHref(track.id)}
            className="text-[14px] font-semibold leading-tight hover:underline underline-offset-4"
          >
            {track.title}
          </Link>
          {track.artist ? (
            <Link
              href={buildCatalogHref("artist", track.artist)}
              className="text-[11px] text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {track.artist}
            </Link>
          ) : (
            <span className="text-[11px] text-muted-foreground">Artista desconocido</span>
          )}
        </div>
      </td>

      <td className="px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPlayPause}
            className="relative h-8 w-8 overflow-hidden rounded-[2px] border border-border/80 bg-card/80"
            aria-label={isActive && isPlaying ? "Pausar track" : "Reproducir track"}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(20,20,20,0.08),transparent_38%),radial-gradient(circle_at_80%_0%,rgba(20,20,20,0.04),transparent_42%)]" />
            <div className="absolute inset-0 flex items-center justify-center">
              {isActive && isPlaying ? (
                <Pause className="h-5 w-5 text-foreground" />
              ) : (
                <Play className="h-5 w-5 text-foreground" />
              )}
            </div>
          </button>
          <WaveCell
            waveformB64={waveformB64}
            filledRatio={progress}
            durationSec={durationSec}
            onSeek={onSeek}
          />
        </div>
      </td>

      <td className="px-3 py-2 text-center text-xs text-muted-foreground">
        <div className="text-sm font-medium text-foreground">{track.duration}</div>
        {track.bpm ? <div>{track.bpm} BPM</div> : null}
      </td>

      <td className="relative px-3 py-2">
        <div
          ref={menuAreaRef}
          className="flex flex-nowrap items-center justify-center gap-2 text-muted-foreground"
        >
          <IconButton
            label="Ver track"
            icon={<Eye className="h-4 w-4" />}
            tooltip="Ver track"
            onClick={() => onView(buildTrackHref(track.id))}
          />
          <IconButton label="Ver licencia" icon={<FileText className="h-4 w-4" />} onClick={onOpenLicense} tooltip="Ver licencia" />
          <IconButton label="Stems" icon={<Layers className="h-4 w-4" />} onClick={onOpenStems} tooltip="Ver stems" />
          <IconButton label="Probar con video" icon={<Clapperboard className="h-4 w-4" />} tooltip="Probar video" />
          <CopyIconButton
            label="Copiar enlace"
            icon={<LinkIcon className="h-4 w-4" />}
            text={buildTrackUrl(track.id)}
            tooltipLabel="Copiar link"
          />
          <IconButton label="Más acciones" icon={<MoreVertical className="h-4 w-4" />} onClick={onToggleMenu} tooltip="Más" />
        </div>

        {menuOpen ? (
          <div
            className="absolute right-4 top-12 z-50 w-44 rounded-[2px] border border-border/80 bg-card shadow-md"
          >
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-border/20"
              onClick={closeMenu}
            >
              Guardar en playlist
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-border/20"
              onClick={closeMenu}
            >
              Descargar demo
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-border/20"
              onClick={closeMenu}
            >
              Compartir
            </button>
          </div>
        ) : null}
      </td>
    </tr>
  );
}

function IconButton({
  label,
  icon,
  onClick,
  tooltip,
}: {
  label: string;
  icon: ReactNode;
  onClick?: () => void;
  tooltip?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          className="rounded-full border border-transparent p-2 transition hover:border-border/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={label}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        align="center"
        sideOffset={4}
        className="rounded-[2px] bg-card text-foreground border border-border shadow-sm"
      >
        {tooltip ?? label}
      </TooltipContent>
    </Tooltip>
  );
}

function WaveCell({
  waveformB64,
  filledRatio,
  durationSec,
  onSeek,
}: {
  waveformB64: string;
  filledRatio: number;
  durationSec: number | null;
  onSeek: (ratio: number) => void;
}) {
  const handleSeekTime = (seconds: number) => {
    if (!durationSec || durationSec <= 0 || Number.isNaN(durationSec)) return;
    const ratio = Math.max(0, Math.min(1, seconds / durationSec));
    onSeek(ratio);
  };

  return (
    <div className="flex min-w-0 flex-1 items-center rounded-[2px] bg-transparent px-1 py-0.5 text-foreground">
      <WaveformScrubber
        waveformB64={waveformB64}
        height={28}
        durationSec={durationSec ?? undefined}
        progress={filledRatio}
        onSeek={durationSec ? handleSeekTime : undefined}
        className="w-full bg-transparent ring-0 border-0 text-foreground"
        frameClassName="relative select-none rounded-[2px] bg-transparent ring-0 border-0 text-foreground"
        smooth
        smoothWindow={5}
      />
    </div>
  );
}

function ModalCard({
  track,
  title,
  children,
  onClose,
}: {
  track: CatalogTrack | null;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!track) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(0,0,0,0.55)] px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-[2px] border border-border bg-card p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              {title}
            </p>
            <h3 className="text-lg font-semibold text-foreground">{track.title}</h3>
            {track.artist ? (
              <Link
                href={buildCatalogHref("artist", track.artist)}
                className="text-sm text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {track.artist}
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground">Artista desconocido</p>
            )}
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

        <div className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">{children}</div>
      </div>
    </div>
  );
}

function makeBase64Wave(seed: string, pts: number): string {
  const rand = seededRandom(seed);
  const arr = new Float32Array(pts);
  for (let i = 0; i < pts; i++) {
    const base = 0.15 + rand() * 0.85;
    arr[i] = Math.min(1, Math.max(0, base));
  }
  return float32ToBase64(arr);
}

function float32ToBase64(arr: Float32Array): string {
  if (typeof window === "undefined") {
    // @ts-expect-error Buffer en SSR
    return Buffer.from(arr.buffer).toString("base64");
  }
  let binary = "";
  const bytes = new Uint8Array(arr.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function seededRandom(seed: string) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h += h << 13;
    h ^= h >>> 7;
    h += h << 3;
    h ^= h >>> 17;
    h += h << 5;
    return ((h >>> 0) % 1000) / 1000;
  };
}

function parseDurationSeconds(duration?: string): number | null {
  if (!duration) return null;
  const parts = duration.split(":").map((p) => Number.parseInt(p, 10));
  if (parts.some((n) => Number.isNaN(n))) return null;
  if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  }
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  }
  return null;
}

function buildCatalogHref(param: "artist", value: string) {
  const qs = new URLSearchParams({ [param]: value });
  return `/catalog?${qs.toString()}`;
}
