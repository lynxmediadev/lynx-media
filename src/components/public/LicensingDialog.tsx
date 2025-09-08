"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/LicensingDialog.tsx                          │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace (peras y manzanas)                                                 │
 * │ - Dialog “Licenciar / Contacto” para iniciar una solicitud de licencia.     │
 * │ - Recolecta datos clave: tipo de proyecto, medio, territorios, term, MFN,   │
 * │   presupuesto, necesidades (whitelist), y mensaje.                           │
 * │ - Incluye contexto del track (id, título, artista, duración, moods/uses).   │
 * │ - Envía por POST a /api/contact (webhook opcional) y ofrece fallback a       │
 * │   correo “mailto” (NEXT_PUBLIC_CONTACT_EMAIL).                               │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Cómo usar                                                                    │
 * │ - <LicensingDialog track={track} /> cerca de las acciones de la ficha.       │
 * │ - Requiere tener shadcn/ui instalado (Dialog, Input, Select, etc.).          │
 * │ - Opcional: define LICENSING_WEBHOOK_URL en el .env para recibir JSON.       │
 * │ - Opcional: define NEXT_PUBLIC_CONTACT_EMAIL para el mailto fallback.        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Decisiones                                                                   │
 * │ - No se altera el schema ni Prisma. Se envía JSON a un endpoint genérico     │
 * │   y/o se abre un correo prellenado.                                          │
 * │ - Validación mínima en cliente; el backend revalida y no explota.            │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Nullable<T> = T | null | undefined;
type TrackLite = {
  id: string;
  title: Nullable<string>;
  artist: Nullable<string>;
  durationSec: Nullable<number>;
  moods: Nullable<string[]>;
  uses: Nullable<string[]>;
  restrictions: Nullable<string[]>;
};

export default function LicensingDialog({
  track,
  className = "",
}: { track: TrackLite; className?: string }) {
  const [open, setOpen] = React.useState(false);

  // Datos del solicitante / proyecto
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [projectType, setProjectType] = React.useState<string>("");
  const [media, setMedia] = React.useState<string>("");
  const [territories, setTerritories] = React.useState("");
  const [term, setTerm] = React.useState<string>("");
  const [budget, setBudget] = React.useState<string>("");
  const [currency, setCurrency] = React.useState<string>("CLP");
  const [needWhitelist, setNeedWhitelist] = React.useState(false);
  const [mfn, setMfn] = React.useState(false);
  const [notes, setNotes] = React.useState("");

  const isValid = React.useMemo(() => {
    // Validación mínima: nombre + email + tipo de proyecto
    const okEmail = /\S+@\S+\.\S+/.test(email);
    return name.trim().length > 1 && okEmail && projectType.length > 0;
  }, [name, email, projectType]);

  function formatDuration(sec?: Nullable<number>) {
    if (!sec || !Number.isFinite(sec)) return "—";
    const s = Math.round(sec);
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m}:${String(r).padStart(2, "0")}`;
  }

  function buildPayload() {
    return {
      type: "licensing_request",
      requestedAt: new Date().toISOString(),
      applicant: { name, email, company },
      project: {
        projectType,
        media,
        territories,
        term,
        budget: budget ? `${budget} ${currency}` : null,
        mfn,
        needWhitelist,
        notes,
      },
      track: {
        id: track.id,
        title: track.title ?? null,
        artist: track.artist ?? null,
        durationSec: track.durationSec ?? null,
        moods: track.moods ?? null,
        uses: track.uses ?? null,
        restrictions: track.restrictions ?? null,
      },
      pageUrl: typeof window !== "undefined" ? window.location.href : null,
    };
  }

  async function submitToApi() {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(buildPayload()),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return true;
    } catch {
      return false;
    }
  }

  const contactEmail =
    process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@lynxmedia.cl";

  function buildMailtoHref(): string {
    // Cuerpo de correo prellenado con info clave
    const subject = encodeURIComponent(
      `Licencia: ${track.title ?? "Track"} — ${projectType || "Proyecto"}`
    );
    const lines = [
      `Solicitud de licencia — ${new Date().toLocaleString()}`,
      "",
      `Track: ${track.title ?? "—"} (ID: ${track.id})`,
      `Artista: ${track.artist ?? "—"}`,
      `Duración: ${formatDuration(track.durationSec)}`,
      `Moods: ${Array.isArray(track.moods) ? track.moods.join(", ") : "—"}`,
      `Usos: ${Array.isArray(track.uses) ? track.uses.join(", ") : "—"}`,
      `Restricciones: ${
        Array.isArray(track.restrictions) && track.restrictions.length
          ? track.restrictions.join(", ")
          : "—"
      }`,
      "",
      `Solicitante: ${name} ${company ? `(${company})` : ""}`,
      `Email: ${email}`,
      "",
      `Tipo de proyecto: ${projectType || "—"}`,
      `Medio: ${media || "—"}`,
      `Territorios: ${territories || "—"}`,
      `Term: ${term || "—"}`,
      `Presupuesto: ${budget ? `${budget} ${currency}` : "—"}`,
      `MFN: ${mfn ? "Sí" : "No"}`,
      `Necesita whitelist (Content ID): ${needWhitelist ? "Sí" : "No"}`,
      "",
      `Notas:`,
      notes || "—",
    ];
    const body = encodeURIComponent(lines.join("\n"));
    return `mailto:${contactEmail}?subject=${subject}&body=${body}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;

    // Intento 1: API interna (/api/contact). Intento 2: abrir correo.
    const ok = await submitToApi();
    if (!ok) {
      // Fallback a correo
      window.location.href = buildMailtoHref();
    }
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={className} aria-label="Licenciar / Contacto">
          Licenciar / Contacto
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Licenciar este track</DialogTitle>
          <DialogDescription>
            Cuéntanos sobre tu proyecto. Te contactaremos a la brevedad con las
            condiciones y el presupuesto formal.
          </DialogDescription>
        </DialogHeader>

        {/* Contexto del track (lectura) */}
        <div className="rounded-md border p-3 text-sm">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <div>
              <span className="text-muted-foreground">Título</span>
              <div className="font-medium">{track.title ?? "—"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Artista</span>
              <div className="font-medium">{track.artist ?? "—"}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Duración</span>
              <div className="font-medium">{formatDuration(track.durationSec)}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Moods / Usos</span>
              <div className="font-medium">
                {Array.isArray(track.moods) ? track.moods.slice(0, 4).join(", ") : "—"}
                {Array.isArray(track.uses) && track.uses.length
                  ? ` · ${track.uses.slice(0, 4).join(", ")}`
                  : ""}
              </div>
            </div>
          </div>
        </div>

        {/* Formulario */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Nombre y apellido *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Empresa / Compañía</Label>
              <Input value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <Label>Tipo de proyecto *</Label>
              <Select value={projectType} onValueChange={setProjectType}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Publicidad">Publicidad</SelectItem>
                  <SelectItem value="TV">TV</SelectItem>
                  <SelectItem value="Cine">Cine</SelectItem>
                  <SelectItem value="Streaming">Streaming / Online</SelectItem>
                  <SelectItem value="Juego">Videojuego / App</SelectItem>
                  <SelectItem value="Evento">Evento / Feria</SelectItem>
                  <SelectItem value="Otro">Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Medio</Label>
              <Select value={media} onValueChange={setMedia}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Orgánico online">Orgánico online</SelectItem>
                  <SelectItem value="Paid media">Paid media (Meta/YouTube)</SelectItem>
                  <SelectItem value="TV">TV</SelectItem>
                  <SelectItem value="Cine">Cine</SelectItem>
                  <SelectItem value="Radio">Radio</SelectItem>
                  <SelectItem value="App/Juego">App/Juego</SelectItem>
                  <SelectItem value="Eventos">Eventos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Territorios</Label>
              <Input
                placeholder="Chile, LATAM, Global…"
                value={territories}
                onChange={(e) => setTerritories(e.target.value)}
              />
            </div>
            <div>
              <Label>Term (duración del permiso)</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3 meses">3 meses</SelectItem>
                  <SelectItem value="6 meses">6 meses</SelectItem>
                  <SelectItem value="1 año">1 año</SelectItem>
                  <SelectItem value="2 años">2 años</SelectItem>
                  <SelectItem value="Perpetuo">Perpetuo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Presupuesto (monto)</Label>
              <Input
                inputMode="numeric"
                placeholder="Ej: 700000"
                value={budget}
                onChange={(e) => setBudget(e.target.value.replace(/[^\d]/g, ""))}
              />
            </div>
            <div>
              <Label>Moneda</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue placeholder="CLP" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Flags rápidos */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2 rounded-md border p-3">
              <input
                type="checkbox"
                checked={mfn}
                onChange={(e) => setMfn(e.target.checked)}
              />
              <span className="text-sm">MFN (Most Favoured Nation)</span>
            </label>
            <label className="inline-flex items-center gap-2 rounded-md border p-3">
              <input
                type="checkbox"
                checked={needWhitelist}
                onChange={(e) => setNeedWhitelist(e.target.checked)}
              />
              <span className="text-sm">Necesito whitelist (Content ID)</span>
            </label>
          </div>

          <div>
            <Label>Notas / Descripción del uso</Label>
            <Textarea
              rows={5}
              placeholder="Cuéntanos el uso, duración de pieza, cortes, deadlines, etc."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <Button type="button" variant="secondary" asChild>
              <a href={buildMailtoHref()} onClick={() => setOpen(false)}>
                Abrir correo
              </a>
            </Button>
            <Button type="submit" disabled={!isValid} aria-disabled={!isValid}>
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
