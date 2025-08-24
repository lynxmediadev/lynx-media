// src/app/catalog/page.tsx
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { WhitelistDialog } from "@/components/whitelist-dialog";

// ---------------------------
// Metadata
// ---------------------------
export const metadata: Metadata = {
  title: "Catálogo | Lynx Media",
  description:
    "Detalle de pista para sincronización audiovisual: ficha rápida, metadatos y licencias.",
};

// ---------------------------
// Tipado del modelo extendido
// ---------------------------

type Code = string;

type Identifiers = {
  isrc: Code;
  iswc: Code;
  upc?: Code;
  catalogId?: string; // interno
  cueSheetTitle?: string;
};

interface Creative {
  title: string;
  subtitle?: string;
  description: string;
  genres: string[];
  subgenres?: string[];
  mood: string[];
  instruments: string[];
  vocals: { present: boolean; type?: string; language?: string; cleanVersion?: boolean };
  riyl?: string[]; // similar a
  usageTags?: string[]; // Film, Ads, Games, Trailers, etc.
}

interface Music {
  duration: string; // mm:ss o mm:ss.SSS
  bpm: number; // puede admitir decimal si hay mapa
  timeSignature: string; // "4/4"
  key: string; // "D minor"
  mode?: string; // Minor/Major/Dorian...
  tempoFeel?: string; // rápido/lento
  tempoMap?: Array<{ at: string; bpm: number }>;
  camelot?: string; // 7A, etc.
}

interface DeliverableVersion {
  name: string;
  duration: string; // "01:00", "Multi" para stems
  notes?: string;
}

interface Deliverables {
  formats: string[]; // WAV 48/24, MP3 320, etc.
  loudnessRef?: string; // -14 LUFS (ref)
  loopable?: boolean;
  versions: DeliverableVersion[];
  stems?: string[]; // familias de stems
  naming?: string; // convención de nombres
  qcChecklist?: string[]; // lista QC
}

export const LICENSE_TYPES = ["Exclusiva", "No exclusiva"] as const;
export type LicenseType = (typeof LICENSE_TYPES)[number];


interface Rights {
  master: string; // titular master
  publishingSplit: string; // 100% LMC
  licenseType: LicenseType;
  territories: string; // Worldwide
  term?: string; // 1 año, perpetuity
  scope?: string[]; // medios/alcances
  mediaBuy?: string; // rango gasto campaña
  mfn?: boolean; // Most Favored Nation
  restrictions?: string[];
  syncFriendly?: boolean;
  samples?: string; // aclaración de samples
  contentID: { enrolled: boolean; admin?: string; whitelist?: string };
}

interface AudioTech {
  primaryFormat: string; // WAV 48kHz/24bit
  loudness?: string; // integrado
  truePeak?: string;
  lra?: string;
  preRoll?: string; // 250 ms
  tail?: string; // 2 s
  loopPoints?: string; // 0:02 → 2:34
}

interface PersonPRO {
  name: string;
  pro?: string; // SCD, ASCAP, etc.
  ipiCae?: string; // IPI/CAE
  role?: string; // Composer, Mixer...
}

interface Credits {
  composers: PersonPRO[];
  publishers: PersonPRO[];
  performers?: PersonPRO[];
  production?: PersonPRO[]; // Producer
  engineering?: PersonPRO[]; // Mixing/Mastering
  recording?: { studio?: string; city?: string; dates?: string[] };
  contacts?: { clearance?: string; ops?: string };
}

interface Business {
  currency?: string; // CLP, USD
  rateCard?: string; // referencia
  billing?: { taxId?: string; notes?: string };
  payments?: string[]; // medios de pago
  sla?: string; // tiempos
  rushPolicy?: string; // +30%
}

interface SEO {
  keywords?: string[];
  placements?: string[]; // créditos/colocaciones previas
  crossLinks?: string[]; // piezas similares
}

interface Analytics {
  plays?: number;
  downloads?: number;
  holds?: number;
  lastUpdate?: string; // ISO o legible
}

interface Compliance {
  chainOfTitles?: string[]; // docs
  warranties?: string[]; // declaraciones
  jurisdiction?: string; // CL / US‑NY
}

interface Track {
  identifiers: Identifiers;
  creative: Creative;
  music: Music;
  deliverables: Deliverables;
  rights: Rights;
  audioTech: AudioTech;
  credits: Credits;
  business?: Business;
  seo?: SEO;
  analytics?: Analytics;
  compliance?: Compliance;
}

// ---------------------------
// Datos de muestra (alineados a blueprint)
// ---------------------------

const track: Track = {
  identifiers: {
    isrc: "CL-XYZ-25-00001",
    iswc: "T-123.456.789-0",
    upc: "123456789012",
    catalogId: "LYNX-CAT-000123",
    cueSheetTitle: "GOLDEN HORIZON",
  },
  creative: {
    title: "Golden Horizon",
    subtitle: "Cinematic Orchestral Theme",
    description:
      "Tema orquestal épico, elegante y emocional con cuerdas en legato. Ideal para trailers, TV spots y piezas corporativas premium.",
    genres: ["Orchestral", "Cinematic"],
    subgenres: ["Trailer", "Hybrid"],
    mood: ["Epic", "Emotional", "Elegant"],
    instruments: ["Cuerdas", "Brass", "Percusión épica", "Coro"],
    vocals: { present: false, language: "N/A", cleanVersion: true },
    riyl: ["Zimmer", "Audiomachine"],
    usageTags: ["Film", "Ads", "Trailers", "Video Games"],
  },
  music: {
    duration: "02:37.120",
    bpm: 120,
    timeSignature: "4/4",
    key: "D minor",
    mode: "Minor",
    tempoFeel: "Medio-rápido",
    tempoMap: [
      { at: "0:00", bpm: 120 },
      { at: "1:10", bpm: 124 },
    ],
    camelot: "7A",
  },
  deliverables: {
    formats: ["WAV 48kHz/24bit", "WAV 44.1kHz/24bit", "MP3 320 kbps"],
    loudnessRef: "-14 LUFS (ref)",
    loopable: true,
    versions: [
      { name: "Full Mix", duration: "02:37" },
      { name: "Instrumental", duration: "02:37" },
      { name: "TV Mix", duration: "02:37" },
      { name: "Underscore", duration: "02:37" },
      { name: "60s Cut", duration: "01:00" },
      { name: "30s Cut", duration: "00:30" },
      { name: "15s Cut", duration: "00:15" },
      { name: "Stems", duration: "Multi", notes: "DRMS, PERC, BASS, ORCH, CHOIR, FX" },
    ],
    stems: ["DRMS", "PERC", "BASS", "ORCH", "CHOIR", "FX"],
    naming: "LYNX_GOLDEN-HORIZON_{VERSION}.wav",
    qcChecklist: [
      "Sin DC offset",
      "Fase correcta",
      "Sin clicks/clips",
      "Preroll 250ms / Tail 2s",
      "Loudness y True Peak en rango",
    ],
  },
  rights: {
    master: "Lynx Media (One-Stop)",
    publishingSplit: "100% Lynx Music Collective",
    licenseType: "No exclusiva",
    territories: "Worldwide",
    term: "Perpetuity",
    scope: ["TV", "Web", "Theatrical", "Streaming", "Social"],
    mediaBuy: "Hasta USD 50k (orientativo)",
    mfn: true,
    restrictions: ["Sin campañas políticas"],
    syncFriendly: true,
    samples: "Sin samples de terceros",
    contentID: { enrolled: true, admin: "Identifyy", whitelist: "licensing@lynxmedia.cl" },
  },
  audioTech: {
    primaryFormat: "WAV 48kHz/24bit",
    loudness: "-14.0 LUFS integrado",
    truePeak: "-1.0 dBTP",
    lra: "6.5 LU",
    preRoll: "250 ms",
    tail: "2 s",
    loopPoints: "0:02 → 2:34",
  },
  credits: {
    composers: [
      { name: "Lynx Music Collective", pro: "SCD", ipiCae: "123456789", role: "Composer" },
    ],
    publishers: [
      { name: "Lynx Media", pro: "SCD", ipiCae: "987654321", role: "Publisher" },
    ],
    performers: [
      { name: "Session Strings", role: "Strings" },
      { name: "Session Brass", role: "Brass" },
    ],
    production: [{ name: "A. Producer", role: "Producer" }],
    engineering: [
      { name: "Mix Engineer", role: "Mix" },
      { name: "Mastering Engineer", role: "Master" },
    ],
    recording: { studio: "Lynx Studio", city: "Santiago, CL", dates: ["2025-07-01"] },
    contacts: { clearance: "licensing@lynxmedia.cl", ops: "ops@lynxmedia.cl" },
  },
  business: {
    currency: "CLP",
    rateCard: "Tarifas orientativas por medio y duración",
    billing: { taxId: "76.123.456-7" },
    payments: ["Transferencia", "Stripe"],
    sla: "Entrega habitual 24–48 h",
    rushPolicy: "+30% urgencias <24 h",
  },
  seo: {
    keywords: ["epic", "orchestral", "cinematic", "elegant"],
    placements: ["TVC Brand X (Chile)", "Trailer Indie Y"],
    crossLinks: ["/catalog/epic-strings", "/catalog/corporate-elegant"],
  },
  analytics: { plays: 153, downloads: 12, holds: 2, lastUpdate: "2025-08-21" },
  compliance: {
    chainOfTitles: ["LOA firmada", "Contrato autor", "Contrato editorial"],
    warranties: ["Sin samples no autorizados", "Originalidad garantizada"],
    jurisdiction: "CL",
  },
};

// ---------------------------
// Helpers UI
// ---------------------------

function versionType(name: string) {
  const n = name.toLowerCase();
  if (n.includes("stems")) return "Stems";
  if (n.includes("underscore")) return "Underscore";
  if (n.includes("tv")) return "TV";
  if (n.includes("instrumental")) return "Instrumental";
  if (n.includes("cut")) return "Cut";
  return "Mix";
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <p className="text-[13px] text-muted-foreground">{label}</p>
      <p className="text-[15px] md:text-[15.5px] font-semibold break-words">{value ?? "—"}</p>
    </div>
  );
}

// ---------------------------
// Página
// ---------------------------
export default function CatalogPage() {
  const { creative, identifiers, music, deliverables, rights, audioTech, credits } = track;

  return (
    <main className="bg-background text-foreground overflow-x-hidden">
      <section className="mx-auto w-full px-4 sm:px-6 lg:px-10 xl:px-14 2xl:px-20 py-4 min-h-[100dvh]">
        <div className="grid gap-3">
          {/* ===================== HEADER ===================== */}
          <header className="rounded-lg border border-border p-3 shadow-sm min-w-0">
            <div className="grid grid-cols-12 gap-3">
              {/* Izquierda */}
              <div className="col-span-12 lg:col-span-8 xl:col-span-9 min-w-0 flex flex-col justify-evenly min-h-[11.5rem] md:min-h-[13rem]">
                {/* Título / subtítulo */}
                <div>
                  <h1 className="text-[21px] md:text-[23px] font-bold leading-tight tracking-tight">
                    {creative.title}
                  </h1>
                  <p className="text-muted-foreground mt-0.5 text-[15px]">{creative.subtitle}</p>
                </div>
                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {creative.mood.map((m) => (
                    <Badge key={m} variant="secondary" className="rounded-full text-[12px]">
                      {m}
                    </Badge>
                  ))}
                  {creative.genres.map((g) => (
                    <Badge key={g} className="rounded-full text-[12px]">
                      {g}
                    </Badge>
                  ))}
                </div>
                {/* Compositor / Editorial / Instrumentación */}
                <dl className="text-muted-foreground grid grid-cols-2 gap-x-6 gap-y-1 text-[13.5px] md:grid-cols-3">
                  <div>
                    <dt className="text-[13px]">Compositor(es)</dt>
                    <dd className="text-foreground text-[15px] md:text-[15.5px] font-medium">
                      {credits.composers.map((c) => c.name).join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px]">Editorial</dt>
                    <dd className="text-foreground text-[15px] md:text-[15.5px] font-medium">
                      {credits.publishers.map((p) => p.name).join(", ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[13px]">Instrumentación</dt>
                    <dd className="text-foreground text-[15px] md:text-[15.5px] font-medium">
                      {creative.instruments.join(", ")}
                    </dd>
                  </div>
                </dl>
              </div>
              {/* Derecha: IDs + Métricas */}
              <div className="col-span-12 lg:col-span-4 xl:col-span-3 space-y-2 min-w-0">
                <div className="rounded-md border border-border p-2.5">
                  <p className="text-muted-foreground mb-1 text-[12px] uppercase tracking-wide">Identificadores</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    <Field label="ISRC" value={identifiers.isrc} />
                    <Field label="ISWC" value={identifiers.iswc} />
                    <Field label="UPC" value={identifiers.upc} />
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    <Field label="ID Cat." value={identifiers.catalogId} />
                    <Field label="Cue Sheet" value={identifiers.cueSheetTitle} />
                  </div>
                </div>
                <div className="rounded-md border border-border p-2.5">
                  <p className="text-muted-foreground mb-1 text-[12px] uppercase tracking-wide">Métricas</p>
                  <div className="grid grid-cols-4 gap-2.5">
                    <Field label="Duración" value={music.duration} />
                    <Field label="BPM" value={music.bpm} />
                    <Field label="Tonalidad" value={music.key} />
                    <Field label="Compás" value={music.timeSignature} />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ===================== FILA EJECUTIVA ===================== */}
          <section className="grid grid-cols-12 gap-3">
            {/* Preview */}
            <div className="col-span-12 xl:col-span-4 rounded-lg border border-border flex flex-col overflow-hidden min-w-0">
              <div className="w-full overflow-hidden rounded-t-lg h-[clamp(14rem,30vh,22rem)] xl:h-[clamp(16rem,36vh,24rem)]">
                <div className="flex h-full items-center justify-center text-[13.5px] text-muted-foreground">
                  Vista previa (audio/video)
                </div>
              </div>
              <div className="p-2.5">
                <p className="text-[13.5px] text-muted-foreground">
                  Reproductor embebido (stream seguro). Descarga bajo permisos.
                </p>
              </div>
            </div>
            {/* Ficha técnica */}
            <div className="col-span-12 xl:col-span-8 rounded-lg border border-border p-3 min-w-0 flex h-full flex-col">
              <h3 className="mb-2 text-[17px] md:text-[18px] font-bold leading-none">Ficha técnica</h3>
              <div className="flex-1 flex items-center">
                <div className="grid grid-cols-6 gap-2.5 w-full">
                  <div className="col-span-2">
                    <Field label="Formato" value={audioTech.primaryFormat} />
                  </div>
                  <Field label="Loudness" value={audioTech.loudness ?? deliverables.loudnessRef} />
                  <Field label="True Peak" value={audioTech.truePeak} />
                  <Field label="Loopable" value={deliverables.loopable ? "Sí" : "No"} />
                  <div className="col-span-2">
                    <Field label="Master" value={rights.master} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Publishing" value={rights.publishingSplit} />
                  </div>
                  <div className="col-span-2">
                    <Field label="Licencia" value={rights.licenseType} />
                  </div>
                  <Field label="Sync‑friendly" value={rights.syncFriendly ? "Sí" : "No"} />
                  <Field
                    label="CID"
                    value={rights.contentID.enrolled ? `Activo (${rights.contentID.admin})` : "Inactivo"}
                  />
                </div>
              </div>
              <div className="mt-3 md:mt-4 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/30">
                <div className="space-x-1">
                  <Badge variant="outline" className="rounded-full text-[12px]">One-Stop</Badge>
                  <Badge variant="secondary" className="rounded-full text-[12px]">Pre-cleared</Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">Ver licencia</Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-lg">
                      <DialogHeader>
                        <DialogTitle>Términos de licencia — {creative.title}</DialogTitle>
                        <DialogDescription>Resumen útil para supervisores. Pide términos completos si lo necesitas.</DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 gap-3 text-[14.5px]">
                        <Field label="Master" value={rights.master} />
                        <Field label="Publishing" value={rights.publishingSplit} />
                        <Field label="Tipo de licencia" value={rights.licenseType} />
                        <Field label="Territorios" value={rights.territories} />
                        <div className="col-span-2">
                          <Field
                            label="Restricciones"
                            value={rights.restrictions?.length ? rights.restrictions.join(", ") : "Ninguna"}
                          />
                        </div>
                        <Field
                          label="Content ID"
                          value={rights.contentID.enrolled ? `Enrolado (${rights.contentID.admin})` : "No enrolado"}
                        />
                      </div>
                      <div className="mt-2 text-[13.5px] text-muted-foreground">
                        ¿Necesitas términos completos (medios, periodo, exclusividad, media buy, campaña)? Escríbenos a{" "}
                        <Link href={`mailto:${rights.contentID.whitelist}`} className="text-primary underline-offset-2 hover:underline">
                          {rights.contentID.whitelist}
                        </Link>.
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button asChild variant="secondary" size="sm">
                    <Link href="#solicitar-cotizacion">Solicitar cotización</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href="#licencia-rapida">Licencia rápida</Link>
                  </Button>
                  <WhitelistDialog
                    track={{
                      title: creative.title,
                      isrc: identifiers.isrc,
                      iswc: identifiers.iswc,
                      upc: identifiers.upc ?? "",
                      admin: rights.contentID.admin ?? "",
                      mailto: rights.contentID.whitelist ?? "",
                    }}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ===================== INFORMACIÓN (TABS) ===================== */}
          <section className="rounded-lg border border-border p-2">
            <Tabs defaultValue="summary" className="flex flex-col">
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <h3 className="text-[17px] md:text-[18px] font-bold leading-none">Información</h3>
                <TabsList className="h-8 flex-wrap">
                  <TabsTrigger value="summary" className="text-[13.5px] px-3">Resumen</TabsTrigger>
                  <TabsTrigger value="versions" className="text-[13.5px] px-3">Versiones</TabsTrigger>
                  <TabsTrigger value="credits" className="text-[13.5px] px-3">Créditos</TabsTrigger>
                  <TabsTrigger value="audio" className="text-[13.5px] px-3">Audio/QC</TabsTrigger>
                  <TabsTrigger value="legal" className="text-[13.5px] px-3">Legal/Licencia</TabsTrigger>
                  <TabsTrigger value="deliver" className="text-[13.5px] px-3">Entrega</TabsTrigger>
                  <TabsTrigger value="discovery" className="text-[13.5px] px-3">Discovery/SEO</TabsTrigger>
                  <TabsTrigger value="business" className="text-[13.5px] px-3">Comercial</TabsTrigger>
                  <TabsTrigger value="analytics" className="text-[13.5px] px-3">Analytics</TabsTrigger>
                  <TabsTrigger value="compliance" className="text-[13.5px] px-3">Compliance</TabsTrigger>
                </TabsList>
              </div>

              {/* RESUMEN */}
              <TabsContent value="summary" className="m-0">
                <div className="grid grid-cols-12 gap-2.5">
                  <div className="col-span-12 lg:col-span-3 rounded-md border border-border p-2">
                    <p className="mb-1 text-[13.5px] font-semibold">Descripción</p>
                    <p className="text-[15px] md:text-[15.5px] break-words">{creative.description}</p>
                    <Separator className="my-2" />
                    <p className="text-[13px] text-muted-foreground">Usos recomendados</p>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {(creative.usageTags ?? []).map((t) => (
                        <Badge key={t} variant="secondary" className="rounded-full text-[12px]">{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <div className="col-span-12 lg:col-span-9 rounded-md border border-border p-2">
                    <p className="mb-1 text-[13.5px] font-semibold">Derechos (clave)</p>
                    <dl className="grid grid-cols-4 gap-x-5 gap-y-1.5 text-[15px] md:text-[15.5px]">
                      <Field label="Master" value={rights.master} />
                      <Field label="Publishing" value={rights.publishingSplit} />
                      <Field label="Licencia" value={rights.licenseType} />
                      <Field label="Territorios" value={rights.territories} />
                      <div className="col-span-2">
                        <Field
                          label="Restricciones"
                          value={rights.restrictions?.length ? rights.restrictions.join(", ") : "Ninguna"}
                        />
                      </div>
                    </dl>
                    <div className="mt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">Ver licencia completa</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                          <DialogHeader>
                            <DialogTitle>Términos de licencia — {creative.title}</DialogTitle>
                            <DialogDescription>Información extendida y consideraciones.</DialogDescription>
                          </DialogHeader>
                          <div className="grid grid-cols-2 gap-3 text-[14.5px]">
                            <Field label="Master" value={rights.master} />
                            <Field label="Publishing" value={rights.publishingSplit} />
                            <Field label="Tipo de licencia" value={rights.licenseType} />
                            <Field label="Territorios" value={rights.territories} />
                            <div className="col-span-2">
                              <Field
                                label="Restricciones"
                                value={rights.restrictions?.length ? rights.restrictions.join(", ") : "Ninguna"}
                              />
                            </div>
                            <Field
                              label="Content ID"
                              value={rights.contentID.enrolled ? `Enrolado (${rights.contentID.admin})` : "No enrolado"}
                            />
                          </div>
                          <div className="mt-2 text-[13.5px] text-muted-foreground">
                            ¿Necesitas términos completos (medios, periodo, exclusividad, media buy, campaña)? Escríbenos a{" "}
                            <Link href={`mailto:${rights.contentID.whitelist}`} className="text-primary underline-offset-2 hover:underline">
                              {rights.contentID.whitelist}
                            </Link>.
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* VERSIONES */}
              <TabsContent value="versions" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <p className="mb-1.5 text-[13.5px] font-semibold">
                    Versiones y entregables <span className="text-muted-foreground">({deliverables.versions.length})</span>
                  </p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[14px] md:text-[14.5px] leading-tight">
                      <thead className="text-muted-foreground border-b border-border/50">
                        <tr>
                          <th className="py-2 pr-3 font-semibold">Versión</th>
                          <th className="py-2 pr-3 font-semibold">Duración</th>
                          <th className="py-2 pr-3 font-semibold">Tipo</th>
                          <th className="py-2 pr-3 font-semibold">Notas</th>
                        </tr>
                      </thead>
                      <tbody>
                        {deliverables.versions.map((v) => (
                          <tr key={v.name} className="border-b border-border/30">
                            <td className="py-[10px] pr-3">{v.name}</td>
                            <td className="py-[10px] pr-3">{v.duration}</td>
                            <td className="py-[10px] pr-3">{versionType(v.name)}</td>
                            <td className="py-[10px] pr-3">{v.notes ?? "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Stems</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(deliverables.stems ?? []).map((s) => (
                          <Badge key={s} variant="outline" className="rounded-full text-[12px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Formatos</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {deliverables.formats.map((f) => (
                          <Badge key={f} className="rounded-full text-[12px]">{f}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12">
                      <p className="text-[13px] text-muted-foreground">Convención de nombres</p>
                      <p className="text-[14.5px] font-medium">{deliverables.naming}</p>
                    </div>
                  </div>

                  <p className="mt-1.5 text-[13.5px] text-muted-foreground">
                    Otras versiones bajo solicitud: No Drums, Clean, Instrument Feature.
                  </p>
                </div>
              </TabsContent>

              {/* CRÉDITOS */}
              <TabsContent value="credits" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <Accordion type="multiple" className="w-full">
                    <AccordionItem value="authors">
                      <AccordionTrigger>Autores / Editorial</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <p className="text-[13px] text-muted-foreground">Compositores</p>
                            <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                              {credits.composers.map((c) => (
                                <li key={c.name}>
                                  <span className="font-medium">{c.name}</span>
                                  {c.pro ? ` — ${c.pro}` : ""}
                                  {c.ipiCae ? ` / IPI ${c.ipiCae}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[13px] text-muted-foreground">Editorial(es)</p>
                            <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                              {credits.publishers.map((p) => (
                                <li key={p.name}>
                                  <span className="font-medium">{p.name}</span>
                                  {p.pro ? ` — ${p.pro}` : ""}
                                  {p.ipiCae ? ` / IPI ${p.ipiCae}` : ""}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="performers">
                      <AccordionTrigger>Intérpretes & Producción</AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div>
                            <p className="text-[13px] text-muted-foreground">Intérpretes</p>
                            <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                              {(credits.performers ?? []).map((p) => (
                                <li key={`${p.name}-${p.role}`}>{p.name} — {p.role}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <p className="text-[13px] text-muted-foreground">Producción / Ingeniería</p>
                            <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                              {(credits.production ?? []).map((p) => (
                                <li key={`${p.name}-${p.role}`}>{p.name} — {p.role}</li>
                              ))}
                              {(credits.engineering ?? []).map((e) => (
                                <li key={`${e.name}-${e.role}`}>{e.name} — {e.role}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        <Separator className="my-2" />
                        <div className="grid grid-cols-3 gap-2.5">
                          <Field label="Estudio" value={credits.recording?.studio} />
                          <Field label="Ciudad" value={credits.recording?.city} />
                          <Field label="Fechas" value={(credits.recording?.dates ?? []).join(", ")} />
                        </div>
                        <div className="mt-2 text-[13.5px] text-muted-foreground">
                          Contacto clearance: {credits.contacts?.clearance} • Operaciones: {credits.contacts?.ops}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </TabsContent>

              {/* AUDIO / QC */}
              <TabsContent value="audio" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Audio técnico</p>
                      <div className="mt-1 grid grid-cols-2 gap-2.5">
                        <Field label="Formato" value={audioTech.primaryFormat} />
                        <Field label="Loudness" value={audioTech.loudness} />
                        <Field label="True Peak" value={audioTech.truePeak} />
                        <Field label="LRA" value={audioTech.lra} />
                        <Field label="Preroll" value={audioTech.preRoll} />
                        <Field label="Tail" value={audioTech.tail} />
                        <div className="col-span-2">
                          <Field label="Loop points" value={audioTech.loopPoints} />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">QC / Reglas</p>
                      <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                        {(deliverables.qcChecklist ?? []).map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* LEGAL / LICENCIA */}
              <TabsContent value="legal" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Matriz de licencia</p>
                      <ul className="mt-1 text-[14.5px] space-y-1">
                        <li><span className="font-medium">Tipo:</span> {rights.licenseType}</li>
                        <li><span className="font-medium">Territorios:</span> {rights.territories}</li>
                        <li><span className="font-medium">Plazo:</span> {rights.term}</li>
                        <li><span className="font-medium">Scope:</span> {(rights.scope ?? []).join(", ")}</li>
                        <li><span className="font-medium">Media buy:</span> {rights.mediaBuy}</li>
                        <li><span className="font-medium">MFN:</span> {rights.mfn ? "Sí" : "No"}</li>
                      </ul>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Restricciones / Content ID</p>
                      <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                        {(rights.restrictions ?? []).length ? (
                          rights.restrictions!.map((r) => <li key={r}>{r}</li>)
                        ) : (
                          <li>Ninguna</li>
                        )}
                      </ul>
                      <div className="mt-2 text-[14.5px]">
                        <span className="font-medium">Content ID:</span>{" "}
                        {rights.contentID.enrolled ? `Enrolado (${rights.contentID.admin})` : "No enrolado"}
                      </div>
                      <div className="mt-1 text-[13.5px] text-muted-foreground">
                        Whitelist / contacto: {rights.contentID.whitelist}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ENTREGA */}
              <TabsContent value="deliver" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Paquetes / Formatos</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {deliverables.formats.map((f) => (
                          <Badge key={f} className="rounded-full text-[12px]">{f}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Convención de nombres</p>
                      <p className="mt-1 text-[14.5px] font-medium">{deliverables.naming}</p>
                    </div>
                    <div className="col-span-12">
                      <p className="text-[13px] text-muted-foreground">Checklist QC</p>
                      <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                        {(deliverables.qcChecklist ?? []).map((q) => (
                          <li key={q}>{q}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* DISCOVERY / SEO */}
              <TabsContent value="discovery" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 md:col-span-4">
                      <p className="text-[13px] text-muted-foreground">Subgéneros</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(creative.subgenres ?? []).map((s) => (
                          <Badge key={s} variant="outline" className="rounded-full text-[12px]">{s}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <p className="text-[13px] text-muted-foreground">RIYL / Influencias</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(creative.riyl ?? []).map((r) => (
                          <Badge key={r} className="rounded-full text-[12px]">{r}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                      <p className="text-[13px] text-muted-foreground">Keywords</p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {(track.seo?.keywords ?? []).map((k) => (
                          <Badge key={k} variant="secondary" className="rounded-full text-[12px]">{k}</Badge>
                        ))}
                      </div>
                    </div>
                    <div className="col-span-12">
                      <Separator className="my-2" />
                      <div className="grid grid-cols-2 gap-2.5">
                        <Field label="Placements" value={(track.seo?.placements ?? []).join(", ")} />
                        <Field label="Cross‑links" value={(track.seo?.crossLinks ?? []).join(", ")} />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* COMERCIAL */}
              <TabsContent value="business" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Condiciones comerciales</p>
                      <ul className="mt-1 text-[14.5px] space-y-1">
                        <li><span className="font-medium">Moneda:</span> {track.business?.currency}</li>
                        <li><span className="font-medium">Rate card:</span> {track.business?.rateCard}</li>
                        <li><span className="font-medium">SLA:</span> {track.business?.sla}</li>
                        <li><span className="font-medium">Rush:</span> {track.business?.rushPolicy}</li>
                      </ul>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Facturación / Pagos</p>
                      <ul className="mt-1 text-[14.5px] space-y-1">
                        <li><span className="font-medium">RUT / Tax ID:</span> {track.business?.billing?.taxId}</li>
                        <li><span className="font-medium">Pagos:</span> {(track.business?.payments ?? []).join(", ")}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ANALYTICS */}
              <TabsContent value="analytics" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <div className="grid grid-cols-4 gap-2.5">
                    <Field label="Reproducciones" value={track.analytics?.plays} />
                    <Field label="Descargas" value={track.analytics?.downloads} />
                    <Field label="Holds" value={track.analytics?.holds} />
                    <Field label="Últ. actualización" value={track.analytics?.lastUpdate} />
                  </div>
                </div>
              </TabsContent>

              {/* COMPLIANCE */}
              <TabsContent value="compliance" className="m-0">
                <div className="rounded-md border border-border p-2">
                  <div className="grid grid-cols-12 gap-2.5">
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Cadena de títulos</p>
                      <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                        {(track.compliance?.chainOfTitles ?? []).map((d) => (
                          <li key={d}>{d}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                      <p className="text-[13px] text-muted-foreground">Warranties / Jurisdicción</p>
                      <ul className="mt-1 list-disc pl-5 text-[14.5px]">
                        {(track.compliance?.warranties ?? []).map((w) => (
                          <li key={w}>{w}</li>
                        ))}
                        <li><span className="font-medium">Jurisdicción:</span> {track.compliance?.jurisdiction}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </section>
        </div>
      </section>
    </main>
  );
}
