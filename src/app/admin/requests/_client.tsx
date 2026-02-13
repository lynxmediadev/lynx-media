"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RefreshCw, Trash2 } from "lucide-react";

type Row = {
  id: string;
  name: string;
  email: string;
  serviceType: string;
  status: string;
  urgency: number;
  details: string | null;
  pageUrl: string | null;
  createdAt: number | null;
  updatedAt: number | null;
  deadlineAt: number | null;
  rawPayload: any;
};

function StatusPill({ value }: { value: string }) {
  return (
    <Badge variant="secondary" className="uppercase tracking-wide text-xs">
      {value.replaceAll("_", " ")}
    </Badge>
  );
}

function fmtDate(ts: number | null) {
  if (!ts) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    timeZone: "America/Santiago",
    year: "2-digit",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(ts));
}

function UrgencyPill({ value }: { value: number }) {
  const label = Number.isFinite(value) ? `U${value}` : "—";
  return (
    <Badge variant="outline" className="text-xs font-semibold">
      {label}
    </Badge>
  );
}

function shortUrl(url?: string | null) {
  if (!url) return "—";
  try {
    const u = new URL(url);
    return u.host || url;
  } catch {
    return url.slice(0, 80);
  }
}

function CopyEmail({ email }: { email: string }) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const ta = document.createElement("textarea");
        ta.value = email;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Tooltip open={copied}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={copy}
          className="text-xs text-muted-foreground break-all"
          aria-live="polite"
        >
          {email}
        </button>
      </TooltipTrigger>
      <TooltipContent className="px-2 py-1 text-xs leading-none">Copiado</TooltipContent>
    </Tooltip>
  );
}

function buildMixMeta(row: Row) {
  const payload = row.rawPayload as any;
  if (!payload) return null;
  const projectType = payload.projectType === "album" ? "Álbum" : "Single";
  let tracksCount: string | null = null;
  const parts: string[] = [];
  if (payload.projectType === "single" && payload.single) {
    if (typeof payload.single.tracks === "number") {
      tracksCount = String(payload.single.tracks);
    }
    if (payload.single.drumQuantize) parts.push("Bat");
    if (typeof payload.single.vocalTracks === "number" && payload.single.vocalTracks > 0) {
      parts.push(`V${payload.single.vocalTracks}`);
    }
    const addons = payload.single.addons || {};
    if (addons.acapella) parts.push("Acapella");
    if (addons.instrumental) parts.push("Instrumental");
    if (addons.liveBacking) parts.push("Live");
    if (addons.rush) parts.push("Rush");
    if (addons.unlimitedRevs) parts.push("Revs");
  }
  if (payload.projectType === "album" && payload.album) {
    if (typeof payload.album.songs === "number") {
      tracksCount = String(payload.album.songs);
    }
    if (payload.album.timeline) parts.push(payload.album.timeline);
  }
  return { projectType, meta: parts, tracksCount };
}

function formatPrice(row: Row) {
  const payload = row.rawPayload as any;
  if (!payload || !payload.single || payload.projectType !== "single") return "—";
  const totalClp = payload.single.pricingClp;
  if (typeof totalClp !== "number") return "—";
  const currency = payload.currency || "CLP";
  const formatter = new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
  return formatter.format(totalClp);
}

export default function RequestsAdminClient(props: {
  rows: Row[];
  total: number;
  statusOptions: string[];
  serviceOptions: string[];
  initialQS: {
    q: string;
    status: string;
    serviceType: string;
    projectType: string;
    page: number;
    per: number;
  };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const [q, setQ] = React.useState(props.initialQS.q ?? "");
  const [status, setStatus] = React.useState(props.initialQS.status ?? "");
  const [serviceType, setServiceType] = React.useState(props.initialQS.serviceType ?? "");
  const [projectType, setProjectType] = React.useState(props.initialQS.projectType ?? "");
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [isCreatingDummy, setIsCreatingDummy] = React.useState(false);

  function applyFilters(nextPage = 1) {
    const params = new URLSearchParams(sp?.toString() ?? "");
    q ? params.set("q", q) : params.delete("q");
    status ? params.set("status", status) : params.delete("status");
    serviceType ? params.set("serviceType", serviceType) : params.delete("serviceType");
    projectType ? params.set("projectType", projectType) : params.delete("projectType");
    params.set("page", String(nextPage));
    params.set("per", String(props.initialQS.per || 20));
    router.push(`${pathname}?${params.toString()}`);
  }

  function resetFilters() {
    setQ("");
    setStatus("");
    setServiceType("");
    setProjectType("");
    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("per", String(props.initialQS.per || 20));
    router.push(`${pathname}?${params.toString()}`);
  }

  const page = props.initialQS.page || 1;
  const per = props.initialQS.per || 20;
  const canPrev = page > 1;
  const canNext = props.total > page * per;
  const rowHover = "transition-colors hover:bg-border/10";
  const selectedCount = selectedIds.size;

  function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function randInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomName() {
    const first = ["Sofía", "Mateo", "Valentina", "Lucas", "Camila", "José", "Ana", "Sebastián", "Valeria", "Juan"];
    const last = ["Pérez", "González", "Rojas", "Silva", "Vega", "Díaz", "Soto", "Mora", "Castro", "Herrera"];
    const long = Math.random() < 0.2;
    const base = `${pick(first)} ${pick(last)}`;
    return long ? `${base} ${pick(last)} ${pick(last)}` : base;
  }

  function randomEmail(name: string) {
    const domains = ["lynxmedia.cl", "example.com", "correo.cl", "studio.com", "agency.io"];
    const slug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "");
    return `${slug}${randInt(1, 99)}@${pick(domains)}`;
  }

  function buildSinglePayload() {
    const tracks = randInt(12, 32);
    const drumQuantize = Math.random() < 0.4;
    const vocalTracks = randInt(0, 5);
    const addons = {
      acapella: Math.random() < 0.3,
      instrumental: Math.random() < 0.3,
      liveBacking: Math.random() < 0.2,
      rush: Math.random() < 0.15,
      unlimitedRevs: Math.random() < 0.2,
    };
    const pricing =
      30000 +
      (tracks - 12) * 1200 +
      (drumQuantize ? 20000 : 0) +
      vocalTracks * 20000 +
      (addons.acapella ? 10000 : 0) +
      (addons.instrumental ? 15000 : 0) +
      (addons.liveBacking ? 20000 : 0) +
      (addons.rush ? 35000 : 0) +
      (addons.unlimitedRevs ? 40000 : 0);

    const name = randomName();
    return {
      projectType: "single",
      currency: "CLP",
      contact: {
        name,
        email: randomEmail(name),
        company: Math.random() < 0.4 ? "Agencia Lynx" : undefined,
        notes: Math.random() < 0.3 ? "Proyecto con referencia cine." : undefined,
        phone: Math.random() < 0.2 ? "+56 9 1234 5678" : undefined,
      },
      single: {
        tracks,
        overMax: false,
        drumQuantize,
        vocalTracks,
        addons,
        pricingClp: Math.round(pricing),
        breakdown: [
          { label: "Base", amount: 30000 },
          { label: "Tracks extra", amount: (tracks - 12) * 1200 },
        ],
      },
      pageUrl: typeof window !== "undefined" ? `${window.location.origin}/servicios/mix` : undefined,
    };
  }

  function buildAlbumPayload() {
    const name = randomName();
    const timelines = ["1-2 meses", "2-3 meses", "3-4 meses"];
    return {
      projectType: "album",
      currency: "CLP",
      contact: {
        name,
        email: randomEmail(name),
        company: Math.random() < 0.4 ? "Productora Sur" : undefined,
        notes: Math.random() < 0.3 ? "EP conceptual, referencias synth." : undefined,
        phone: Math.random() < 0.2 ? "+56 9 9876 5432" : undefined,
      },
      album: {
        songs: randInt(3, 12),
        timeline: pick(timelines),
        style: Math.random() < 0.6 ? "Synth / Cinematic" : "Indie / Alt",
        notes: Math.random() < 0.4 ? "Necesita cohesión entre tracks." : "",
      },
      pageUrl: typeof window !== "undefined" ? `${window.location.origin}/servicios/mix` : undefined,
    };
  }

  async function createDummy(kind: "single" | "album") {
    try {
      setIsCreatingDummy(true);
      const payload = kind === "single" ? buildSinglePayload() : buildAlbumPayload();
      const res = await fetch("/api/services/mix", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed");
      router.refresh();
    } catch {
      alert("No se pudo crear la solicitud dummy.");
    } finally {
      setIsCreatingDummy(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Solicitudes</h1>
          <p className="text-sm text-muted-foreground">
            Bandeja única (serviceType) · Total {props.total}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/requests/mix"
            className="rounded-[2px] border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-border/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Ver solo Mix/Master
          </Link>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCreatingDummy}
            className="h-8 rounded-[2px] text-xs full-sm"
            onClick={() => createDummy("single")}
          >
            Dummy Single
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isCreatingDummy}
            className="h-8 rounded-[2px] text-xs full-sm"
            onClick={() => createDummy("album")}
          >
            Dummy Álbum
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            disabled={selectedCount === 0 || isDeleting}
            onClick={() => setConfirmOpen(true)}
            className="h-8 rounded-[2px] text-xs"
            aria-label="Eliminar seleccionados"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Eliminar
          </Button>
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[2px] border border-border bg-card text-foreground transition hover:bg-border/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-label="Refrescar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <section className="rounded-[2px] border border-border bg-card/80 p-4 backdrop-blur">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-6">
          <input
            className="col-span-2 rounded-[2px] border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Buscar nombre/email/detalle"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="rounded-[2px] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
          >
            <option value="">Tipo (todos)</option>
            <option value="single">Single</option>
            <option value="album">Álbum / EP</option>
          </select>
          <select
            className="rounded-[2px] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          >
            <option value="">Servicio (todos)</option>
            {props.serviceOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className="rounded-[2px] border border-border bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">Status (todos)</option>
            {props.statusOptions.map((s) => (
              <option key={s} value={s}>
                {s.replaceAll("_", " ")}
              </option>
            ))}
          </select>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => applyFilters(1)}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-[2px] border border-border bg-foreground px-3 py-2 text-sm font-semibold text-background transition hover:bg-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Aplicar
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-[2px] border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground transition hover:bg-border/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Limpiar
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[2px] border border-border bg-card/80">
        <TooltipProvider delayDuration={200}>
          {props.rows.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm text-muted-foreground">
              Sin resultados para los filtros actuales.
            </div>
          ) : (
            <>
              <div className="space-y-3 p-3 md:hidden">
                {props.rows.map((row) => {
                  const mix = buildMixMeta(row);
                  const typeLabel = mix?.projectType ?? "—";
                  const metaLines = mix?.meta ?? [];
                  const totalLabel = formatPrice(row);

                  return (
                    <Card
                      key={row.id}
                      className={`border-border/60 bg-card/60 shadow-none ${
                        selectedIds.has(row.id) ? "border-foreground/40" : ""
                      }`}
                    >
                      <CardContent className="space-y-3 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-foreground">
                              {row.name}
                            </p>
                            <CopyEmail email={row.email} />
                          </div>
                          <Checkbox
                            aria-label="Seleccionar solicitud"
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={(checked) => {
                              setSelectedIds((prev) => {
                                const next = new Set(prev);
                                if (checked) next.add(row.id);
                                else next.delete(row.id);
                                return next;
                              });
                            }}
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <StatusPill value={row.status} />
                          <UrgencyPill value={row.urgency} />
                        </div>

                        <div className="space-y-1 text-xs text-muted-foreground">
                          <p>
                            Proyecto:{" "}
                            <span className="text-foreground">
                              {typeLabel}
                              {mix?.tracksCount ? ` · ${mix.tracksCount}` : ""}
                            </span>
                          </p>
                          <p>
                            Metadata:{" "}
                            <span className="text-foreground">
                              {metaLines.length ? metaLines.join(" · ") : "—"}
                            </span>
                          </p>
                          <p>
                            Total:{" "}
                            <span className="text-foreground">{totalLabel}</span>
                          </p>
                          <p>
                            URL:{" "}
                            <span className="text-foreground">{shortUrl(row.pageUrl)}</span>
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-2 border-t border-border/50 pt-2 text-xs text-muted-foreground">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide">Creado</p>
                            <p className="tabular-nums">{fmtDate(row.createdAt)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide">Deadline</p>
                            <p className="tabular-nums">{fmtDate(row.deadlineAt)}</p>
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="h-8 w-full rounded-[2px] border-border text-xs"
                        >
                          <Link href={`/admin/requests/${row.id}`}>Ver detalle</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <div className="min-w-[1080px]">
                  <div className="grid grid-cols-[1.4fr_140px_1.4fr_140px_160px_120px_120px_120px_36px] items-stretch gap-0 divide-x divide-border/30 px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground text-center">
                    <span className="px-2 flex h-full items-center justify-center">Cliente</span>
                    <span className="px-2 flex h-full items-center justify-center">Proyecto</span>
                    <span className="px-2 flex h-full items-center justify-center">Metadata</span>
                    <span className="px-2 flex h-full items-center justify-center">Total</span>
                    <span className="px-2 flex h-full items-center justify-center">Estado</span>
                    <span className="px-2 flex h-full items-center justify-center">Creado</span>
                    <span className="px-2 flex h-full items-center justify-center">Deadline</span>
                    <span className="px-2 flex h-full items-center justify-center">Acciones</span>
                    <span className="flex h-full items-center justify-center" />
                  </div>
                  <Separator className="bg-border" />
                  <div className="divide-y divide-border">
                    {props.rows.map((row) => (
                      (() => {
                        const mix = buildMixMeta(row);
                        const typeLabel = mix?.projectType ?? "—";
                        const metaLines = mix?.meta ?? [];
                        const totalLabel = formatPrice(row);
                        return (
                          <Card key={row.id} className="border-0 bg-transparent shadow-none">
                            <CardContent className="p-0">
                              <div
                                className={`grid grid-cols-[1.4fr_140px_1.4fr_140px_160px_120px_120px_120px_36px] items-stretch gap-0 divide-x divide-border/20 text-center ${rowHover} px-2 py-2 ${
                                  selectedIds.has(row.id) ? "bg-border/20" : ""
                                }`}
                              >
                                <div className="flex h-full min-w-0 flex-col justify-center gap-1 px-2 text-left">
                                  <span className="text-xs font-semibold text-foreground truncate text-center">
                                    {row.name}
                                  </span>
                                  <CopyEmail email={row.email} />
                                </div>

                                <div className="px-2 text-xs font-semibold flex h-full items-center justify-center">
                                  <span className="text-foreground">
                                    {typeLabel}
                                  </span>
                                  <span className="text-muted-foreground">
                                    &nbsp;·&nbsp;{mix?.tracksCount ?? "—"}
                                  </span>
                                </div>
                                <div className="px-2 text-xs text-foreground flex h-full items-center justify-center">
                                  {metaLines.length ? metaLines.join(" · ") : "—"}
                                </div>
                                <div className="px-2 text-xs font-semibold flex h-full items-center justify-center">{totalLabel}</div>
                                <div className="flex h-full items-center justify-center gap-2 px-2">
                                  <StatusPill value={row.status} />
                                  <UrgencyPill value={row.urgency} />
                                </div>

                                <div className="flex h-full items-center justify-center px-2 text-[10px] text-muted-foreground tabular-nums">
                                  {fmtDate(row.createdAt)}
                                </div>
                                <div className="flex h-full items-center justify-center px-2 text-xs text-muted-foreground tabular-nums">
                                  {fmtDate(row.deadlineAt)}
                                </div>
                                <div className="flex h-full items-center justify-center px-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="h-8 rounded-[2px] border-border text-xs"
                                  >
                                    <Link href={`/admin/requests/${row.id}`}>Ver detalle</Link>
                                  </Button>
                                </div>

                                <div className="flex h-full items-center justify-center">
                                  <Checkbox
                                    aria-label="Seleccionar solicitud"
                                    checked={selectedIds.has(row.id)}
                                    onCheckedChange={(checked) => {
                                      setSelectedIds((prev) => {
                                        const next = new Set(prev);
                                        if (checked) next.add(row.id);
                                        else next.delete(row.id);
                                        return next;
                                      });
                                    }}
                                  />
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })()
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </TooltipProvider>
      </section>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="border-border bg-card text-foreground">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar solicitudes</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Vas a eliminar {selectedCount} solicitud(es). Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 rounded-[2px] text-xs"
              onClick={() => setConfirmOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              className="h-8 rounded-[2px] text-xs"
              onClick={async () => {
                if (selectedCount === 0) return;
                try {
                  setIsDeleting(true);
                  const res = await fetch("/api/admin/requests/bulk-delete", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ ids: Array.from(selectedIds) }),
                  });
                  if (!res.ok) throw new Error("Failed");
                  setSelectedIds(new Set());
                  setConfirmOpen(false);
                  router.refresh();
                } catch {
                  alert("No se pudieron eliminar las solicitudes.");
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          Página {page} · {props.rows.length} de {props.total}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!canPrev}
            onClick={() => applyFilters(page - 1)}
            className="inline-flex items-center justify-center rounded-[2px] border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-border/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            type="button"
            disabled={!canNext}
            onClick={() => applyFilters(page + 1)}
            className="inline-flex items-center justify-center rounded-[2px] border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground transition hover:bg-border/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </footer>
    </div>
  );
}
