/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Archivo: src/components/public/TrackMetadataTable.tsx                       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace (peras y manzanas)                                                 │
 * │ - Muestra una tabla clara, por secciones: Creativo, Técnico y Derechos.     │
 * │ - Lectura inmediata para clientes de sync; sin JS, sin dependencias.        │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Cómo usar                                                                    │
 * │ - <TrackMetadataTable track={track}/> en la ficha pública (/track/[id]).    │
 * │ - Acepta directamente el objeto devuelto por Prisma `track`.                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";

type Nullable<T> = T | null | undefined;

type Props = {
  track: {
    title: Nullable<string>;
    artist: Nullable<string>;
    durationSec: Nullable<number>;
    moods: Nullable<string[]>;
    uses: Nullable<string[]>;
    restrictions: Nullable<string[]>;
    // Identificadores
    isrc: Nullable<string>;
    iswc: Nullable<string>;
    upc: Nullable<string>;
    // Técnico
    loudnessLufs: Nullable<number>;
    loudnessRangeLu: Nullable<number>;
    truePeakDbfs: Nullable<number>;
    sampleRateHz: Nullable<number>;
    channels: Nullable<number>;
    bitrateKbps: Nullable<number>;
    // Derechos
    licenseType: Nullable<string>;
    territories: Nullable<string>;
    term: Nullable<string>;
    contentIdEnrolled: Nullable<boolean>;
    contentIdWhitelist: Nullable<string>;
    contentIdAdmin: Nullable<string>;
    master: Nullable<string>;
    mfn: Nullable<boolean>;
    publishingSplit: Nullable<string>;
  };
  className?: string;
};

export default function TrackMetadataTable({ track, className = "" }: Props) {
  const D = (v: React.ReactNode) => (
    <span className="text-foreground">{isNil(v) ? "—" : v}</span>
  );

  return (
    <section
      className={`rounded-[2px] border border-border bg-card p-4 shadow-sm ${className}`}
      aria-label="Ficha técnica"
    >
      {/* Cabecera compacta */}
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold leading-tight">Ficha técnica avanzada</h2>
        {/* Lugares típicos para acciones: copiar link, etc. */}
        <p className="text-xs text-muted-foreground">Datos listos para sync/licensing</p>
      </header>

      {/* GRID por secciones */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* CREATIVO */}
        <div>
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Creativo
          </h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Artista">{D(track.artist)}</Row>
            <Row label="Título">{D(track.title)}</Row>
            <Row label="Duración">{D(formatDuration(track.durationSec))}</Row>
            <Row label="Moods">{D(joinArr(track.moods))}</Row>
            <Row label="Usos">{D(joinArr(track.uses))}</Row>
            {Array.isArray(track.restrictions) && track.restrictions.length > 0 && (
              <Row label="Restricciones">
                <span className="text-amber-300">{track.restrictions!.join(", ")}</span>
              </Row>
            )}
          </dl>
        </div>

        {/* TÉCNICO */}
        <div>
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Técnico
          </h3>
          <dl className="space-y-1.5 text-sm">
            <Row label={<abbr title="Integrated Loudness (EBU R128)">Loudness LUFS</abbr>}>
              {D(formatNum(track.loudnessLufs, 1, " LUFS"))}
            </Row>
            <Row label={<abbr title="Loudness Range (EBU R128)">LRA</abbr>}>
              {D(formatNum(track.loudnessRangeLu, 1, " LU"))}
            </Row>
            <Row label="True Peak">{D(formatNum(track.truePeakDbfs, 2, " dBFS"))}</Row>
            <Row label="Sample Rate">{D(formatInt(track.sampleRateHz, " Hz"))}</Row>
            <Row label="Canales">{D(formatInt(track.channels))}</Row>
            <Row label="Bitrate">{D(formatInt(track.bitrateKbps, " kbps"))}</Row>
          </dl>
        </div>

        {/* DERECHOS */}
        <div>
          <h3 className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
            Derechos
          </h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="License Type">{D(track.licenseType)}</Row>
            <Row label="Territorios">{D(track.territories)}</Row>
            <Row label="Term">{D(track.term)}</Row>
            <Row label="MFN">{D(booleanTag(track.mfn))}</Row>
            <Row label="Master">{D(track.master)}</Row>
            <Row label="Content ID">
              {D(ciSummary(track.contentIdEnrolled, track.contentIdWhitelist, track.contentIdAdmin))}
            </Row>
            <Row label="Split Pub.">{D(track.publishingSplit)}</Row>
            <Row label="ISRC">{D(track.isrc)}</Row>
            <Row label="ISWC">{D(track.iswc)}</Row>
            <Row label="UPC">{D(track.upc)}</Row>
          </dl>
        </div>
      </div>
    </section>
  );
}

/** Ítem visual (dt/dd) con estilo consistente */
function Row({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem,1fr] items-start gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

// ── Helpers de formato (claros, sin sorpresas) ────────────────────────────────
function isNil(v: any) {
  return v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
}
function joinArr(a?: Nullable<string[]>): string | null {
  return Array.isArray(a) && a.length ? a.join(", ") : null;
}
function formatDuration(sec?: Nullable<number>) {
  if (!sec || !Number.isFinite(sec)) return null;
  const s = Math.round(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}
function formatNum(n?: Nullable<number>, digits = 1, suffix = "") {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return `${n.toFixed(digits)}${suffix}`;
}
function formatInt(n?: Nullable<number>, suffix = "") {
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  return `${Math.round(n)}${suffix}`;
}
function booleanTag(b?: Nullable<boolean>) {
  if (b == null) return null;
  return b ? "Sí" : "No";
}
function ciSummary(
  enrolled?: Nullable<boolean>,
  whitelist?: Nullable<string>,
  admin?: Nullable<string>,
) {
  const items: string[] = [];
  if (enrolled != null) items.push(`Enrolled: ${enrolled ? "Sí" : "No"}`);
  if (whitelist) items.push(`Whitelist: ${whitelist}`);
  if (admin) items.push(`Admin: ${admin}`);
  return items.length ? items.join(" · ") : null;
}
