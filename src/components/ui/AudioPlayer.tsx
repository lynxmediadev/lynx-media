// ================================================
// File: src/components/ui/AudioPlayer.tsx
// Reusable player with fades + single-playback guard (lint-safe)
// ================================================
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

import { audioBus } from "@/lib/audio-bus";
import { fadeIn, fadeOutAndPause, primeFadeIn } from "@/lib/audio-fade";

import { PlayIcon, PauseIcon, Heart, UserRound, FileText, Share2, Plus, Info, DownloadCloud, Copy } from "lucide-react";
import type { PlayerTrack } from "@/domain/track";

export type AudioPlayerProps = {
  track: PlayerTrack;
  className?: string;
  onFavorite?: (track: PlayerTrack, liked: boolean) => void;
};

const FADE_IN_MS = 60; // sutil
const FADE_OUT_MS = 80; // sutil

function fmt(t: number): string {
  const m = Math.floor(t / 60);
  const s = Math.floor(t % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function AudioPlayer({ track, className, onFavorite }: AudioPlayerProps): React.JSX.Element {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const [playing, setPlaying] = React.useState(false);
  const [liked, setLiked] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const [duration, setDuration] = React.useState(0);
  const [current, setCurrent] = React.useState(0);
  const [seeking, setSeeking] = React.useState(false);
  const [seekValue, setSeekValue] = React.useState(0);

  // ensure metadata refresh on src change (and keep fade chain alive)
  React.useEffect(() => {
    audioRef.current?.load();
  }, [track.audioUrl]);

  // register into global bus (with fade-out impl)
  React.useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    return audioBus.register(track.id, el, (ms?: number) => fadeOutAndPause(el, ms ?? FADE_OUT_MS));
  }, [track.id]);

  function togglePlay(): void {
    const el = audioRef.current;
    if (!el) return;
    if (playing) {
      void fadeOutAndPause(el, FADE_OUT_MS).then(() => setPlaying(false));
    } else {
      audioBus.pauseOthers(track.id, FADE_OUT_MS);
      primeFadeIn(el, 0);
      el.play()
        .then(() => {
          setPlaying(true);
          void fadeIn(el, FADE_IN_MS);
        })
        .catch(() => { /* noop */ });
    }
  }

  function onSeekChange(vals: number[]): void {
    const v = vals[0] ?? 0;
    setSeekValue(v);
  }
  function onSeekStart(): void {
    setSeeking(true);
  }
  function onSeekCommit(vals: number[]): void {
    const v = vals[0] ?? 0;
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = v;
    setCurrent(v);
    setSeeking(false);
  }

  const progress = seeking ? seekValue : current;

  return (
    <TooltipProvider>
      <div
        className={cn(
          "w-full rounded-xl border border-border/80 bg-[color:var(--color-dark)] text-[color:var(--color-light)]/95 shadow-sm",
          "px-3 sm:px-4 py-2 sm:py-3",
          "grid gap-x-3 gap-y-2",
          "grid-cols-[auto_1fr_auto] grid-rows-[auto_auto]",
          className,
        )}
      >
        {/* Cover + Play */}
        <div className="row-span-2 col-start-1 col-end-2 flex items-center">
          <div className="relative h-14 w-14 sm:h-16 sm:w-16 overflow-hidden rounded-lg border border-border/70">
            {track.coverUrl ? (
              <Image src={track.coverUrl} alt={track.title} fill sizes="64px" className="object-cover" />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground/80">Cover</div>
            )}
            <Button
              size="icon"
              variant="secondary"
              aria-label={playing ? "Pausar" : "Reproducir"}
              className="absolute inset-0 m-auto h-12 w-12 rounded-full shadow-md flex items-center justify-center bg-background/70 hover:bg-background"
              onClick={togglePlay}
            >
              {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Title / Artist */}
        <div className="col-start-2 col-end-3 row-start-1 row-end-2 min-w-0 flex items-center">
          <div className="min-w-0">
            <div className="truncate text-[15px] sm:text-[15.5px] font-semibold leading-tight">{track.title}</div>
            <div className="mt-0.5 text-[13px] text-muted-foreground truncate">{track.artist}</div>
          </div>
        </div>

        {/* Actions (right, top) */}
        <div className="col-start-3 col-end-4 row-start-1 row-end-2 flex items-center gap-1.5 sm:gap-2 w-full justify-end justify-self-end ml-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label={liked ? "Quitar de favoritos" : "Agregar a favoritos"}
                className={cn("h-8 w-8 rounded-md", liked && "bg-primary/10")}
                onClick={() => {
                  const next = !liked;
                  setLiked(next);
                  onFavorite?.(track, next);
                }}
              >
                <Heart className={cn("h-4 w-4", liked ? "fill-current" : undefined)} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{liked ? "Quitar de favoritos" : "Agregar a favoritos"}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" aria-label="Más del artista" asChild>
                <Link href={track.artistUrl || "#"}>
                  <UserRound className="h-4 w-4" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Más del artista</TooltipContent>
          </Tooltip>

          {/* Licencias */}
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Licencias" className="h-8 w-8 rounded-md">
                    <FileText className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Licencias</TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Licencias — {track.title}</DialogTitle>
                <DialogDescription>Resumen para supervisores. Pide términos completos si lo requieres.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-3 text-[14.5px]">
                <div>
                  <p className="text-[12px] text-muted-foreground">Master</p>
                  <p className="font-medium">{track.rights?.master ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Publishing</p>
                  <p className="font-medium">{track.rights?.publishingSplit ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Tipo</p>
                  <p className="font-medium">{track.rights?.licenseType ?? "—"}</p>
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Territorios</p>
                  <p className="font-medium">{track.rights?.territories ?? "—"}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-[12px] text-muted-foreground">Restricciones</p>
                  <p className="font-medium">{(track.rights?.restrictions ?? []).join(", ") || "Ninguna"}</p>
                </div>
                <div>
                  <p className="text-[12px] text-muted-foreground">Content ID</p>
                  <p className="font-medium">
                    {track.rights?.contentID?.enrolled ? `Enrolado (${track.rights?.contentID?.admin ?? "—"})` : "No enrolado"}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-[13.5px] text-muted-foreground">
                ¿Necesitas medios/periodo/exclusividad/media buy? Escríbenos a {track.rights?.contentID?.whitelist ?? "licensing@lynxmedia.cl"}
              </div>
            </DialogContent>
          </Dialog>

          {/* Contacto */}
          <Dialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <DialogTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Contacto" className="h-8 w-8 rounded-md">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Contacto</TooltipContent>
            </Tooltip>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Contacto — {track.title}</DialogTitle>
                <DialogDescription>Cuéntanos del proyecto para cotizar/licenciar rápidamente.</DialogDescription>
              </DialogHeader>
              <form className="grid gap-3 text-[14.5px]" onSubmit={(e) => { e.preventDefault(); }}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="usage">Uso</Label>
                    <Select defaultValue="Publicidad">
                      <SelectTrigger id="usage" className="mt-1">
                        <SelectValue placeholder="Selecciona" />
                      </SelectTrigger>
                      <SelectContent>
                        {["TV","Cine","Publicidad","Documental","Trailers","Videojuegos","Redes sociales","YouTube/Twitch","App/UX"].map((u) => (
                          <SelectItem key={u} value={u}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="meeting">¿Reunión?</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <Checkbox id="meeting" />
                      <span className="text-[13.5px] text-muted-foreground">Solicitar reunión breve</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="name">Nombre</Label>
                    <Input id="name" className="mt-1" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" className="mt-1" required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="details">Detalles</Label>
                  <Textarea id="details" className="mt-1" placeholder="Duración del uso, territorio, presupuesto (opcional)" rows={4} />
                </div>
                <div className="flex justify-end">
                  <Button type="submit">Enviar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>

          {/* Compartir */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                aria-label="Compartir"
                className="h-8 w-8 rounded-md"
                onClick={() => {
                  const url = track.shareUrl || (typeof window !== "undefined" ? window.location.href : "");
                  if (url) {
                    void navigator.clipboard.writeText(url).catch(() => {});
                    setCopied(true);
                    window.setTimeout(() => setCopied(false), 1200);
                  }
                }}
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{copied ? "¡Copiado!" : "Copiar enlace"}</TooltipContent>
          </Tooltip>

          {/* Utilidades */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button size="icon" variant="ghost" aria-label="Utilidades" className="h-8 w-8 rounded-md">
                    <Plus className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="bottom">Más acciones</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end" className="min-w-52">
              <DropdownMenuItem asChild>
                <a href={track.audioUrl} download>
                  <DownloadCloud className="mr-2 h-4 w-4" /> Descargar preview
                </a>
              </DropdownMenuItem>
              {track.identifiers?.isrc ? (
                <DropdownMenuItem onClick={() => { void navigator.clipboard.writeText(track.identifiers?.isrc ?? ""); }}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar ISRC
                </DropdownMenuItem>
              ) : null}
              <DropdownMenuItem asChild>
                <Link href="/catalog">Abrir ficha técnica</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        <div className="col-start-2 col-end-3 row-start-2 row-end-3 flex flex-wrap items-center gap-1.5">
          {(track.moods ?? []).map((m) => (
            <Badge key={m} variant="secondary" className="rounded-full text-[11px]">{m}</Badge>
          ))}
          {(track.uses ?? []).map((u) => (
            <Badge key={u} className="rounded-full text-[11px]">{u}</Badge>
          ))}
        </div>

        {/* Progress */}
        <div className="col-start-3 col-end-4 row-start-2 row-end-3 flex items-center gap-2 min-w-[10rem]">
          <div className="text-[12px] tabular-nums text-muted-foreground w-[3.5rem] text-right">{fmt(progress)}</div>
          <Slider
            key={Math.max(1, Math.round(duration))}
            className="w-36 sm:w-56"
            min={0}
            max={Math.max(duration, 1)}
            value={[Math.min(progress, duration)]}
            onValueChange={onSeekChange}
            onValueCommit={onSeekCommit}
            onPointerDown={onSeekStart}
            step={0.1}
            aria-label="Progreso"
          />
          <div className="text-[12px] tabular-nums text-muted-foreground w-[3.5rem]">{duration > 0 ? fmt(duration) : "–:–"}</div>
        </div>

        {/* Hidden audio element */}
        <audio
          ref={audioRef}
          src={track.audioUrl}
          preload="metadata"
          onLoadedMetadata={() => {
            const d = audioRef.current?.duration ?? 0;
            setDuration(Number.isFinite(d) ? d : 0);
          }}
          onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
          onTimeUpdate={() => { if (!seeking) setCurrent(audioRef.current?.currentTime || 0); }}
          onEnded={() => { setPlaying(false); setCurrent(0); }}
          onPlay={() => { audioBus.pauseOthers(track.id, FADE_OUT_MS); setPlaying(true); }}
          onPause={() => setPlaying(false)}
        />
      </div>
    </TooltipProvider>
  );
}
