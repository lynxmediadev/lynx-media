"use client";

import FormField from "../ui/FormField";
import { Textarea } from "@/components/ui/textarea";

type FieldErrors = Record<string, string[]>;

type DeliverablesFormProps = {
  track: {
    versions: Array<{
      label: string;
      durationSec: number | null;
      kind: string | null;
      sortOrder: number | null;
    }>;
    stems: Array<{
      name: string;
      group: string | null;
      durationSec: number | null;
      sortOrder: number | null;
    }>;
  };
  fieldErrors?: FieldErrors;
};

function formatDuration(seconds?: number | null) {
  if (seconds == null || !Number.isFinite(seconds)) return null;
  const s = Math.max(0, Math.round(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function formatVersionLine(version: DeliverablesFormProps["track"]["versions"][number]) {
  const parts: string[] = [version.label];
  const duration = formatDuration(version.durationSec);
  if (duration) parts.push(duration);
  if (version.kind) parts.push(version.kind);
  return parts.join(" | ");
}

function formatStemLine(stem: DeliverablesFormProps["track"]["stems"][number]) {
  const parts: string[] = [stem.name];
  if (stem.group) parts.push(stem.group);
  return parts.join(" | ");
}

function firstError(fieldErrors: FieldErrors | undefined, key: string) {
  if (!fieldErrors) return null;
  const arr = fieldErrors[key];
  return arr && arr.length > 0 ? arr[0] : null;
}

export default function DeliverablesForm({
  track,
  fieldErrors,
}: DeliverablesFormProps) {
  const serverErrors: FieldErrors = fieldErrors ?? {};

  const versionsDefault = (track.versions ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((version) => formatVersionLine(version))
    .join("\n");

  const stemsDefault = (track.stems ?? [])
    .slice()
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((stem) => formatStemLine(stem))
    .join("\n");

  return (
    <div className="space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-base font-semibold text-foreground">Entregables</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Versiones y stems disponibles para este track.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <FormField
          htmlFor="versions"
          error={firstError(serverErrors, "versions")}
          label="Versiones"
          descriptionPosition="above"
          description="Formato: Label | 0:30 | CUTDOWN (una por línea)."
        >
          <Textarea
            id="versions"
            name="versions"
            defaultValue={versionsDefault}
            rows={8}
            className="w-full resize-y text-xs"
            placeholder={`Full Mix | 2:10 | FULL\n30s Cut | 0:30 | CUTDOWN\n15s Cut | 0:15 | CUTDOWN`}
          />
        </FormField>

        <FormField
          htmlFor="stems"
          error={firstError(serverErrors, "stems")}
          label="Stems / Trackouts"
          descriptionPosition="above"
          description="Formato: Nombre | GROUP (una por línea)."
        >
          <Textarea
            id="stems"
            name="stems"
            defaultValue={stemsDefault}
            rows={8}
            className="w-full resize-y text-xs"
            placeholder={`Drums | PERCUSSION\nBass | INSTRUMENT\nVocals | VOCAL`}
          />
        </FormField>
      </div>
    </div>
  );
}
