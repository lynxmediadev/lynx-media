import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NumericSelectInput from "@/components/admin/ui/NumericSelectInput";
import type { Share } from "./types";

const PRO_OPTIONS = ["ASCAP", "BMI", "SCD"] as const;
const normalizeProValue = (value?: string | null) =>
  PRO_OPTIONS.includes((value ?? "").toUpperCase() as (typeof PRO_OPTIONS)[number])
    ? (value ?? "").toUpperCase()
    : "";

type Props = {
  newWriter: Share & { ipiNumber: string; pro: string; caeNumber: string };
  newPublisher: Share & { ipiNumber: string; pro: string; caeNumber: string };
  setNewWriter: React.Dispatch<
    React.SetStateAction<Share & { ipiNumber: string; pro: string; caeNumber: string }>
  >;
  setNewPublisher: React.Dispatch<
    React.SetStateAction<Share & { ipiNumber: string; pro: string; caeNumber: string }>
  >;
  savingWriter: boolean;
  savingPublisher: boolean;
  addShare: (role: "WRITER" | "PUBLISHER") => void;
  mode?: "WRITER" | "PUBLISHER" | "BOTH";
};

export function PublishingNewForms({
  newWriter,
  newPublisher,
  setNewWriter,
  setNewPublisher,
  savingWriter,
  savingPublisher,
  addShare,
  mode = "BOTH",
}: Props) {
  const renderForm = (role: "WRITER" | "PUBLISHER") => {
    const isWriter = role === "WRITER";
    const state = isWriter ? newWriter : newPublisher;
    const setState = isWriter ? setNewWriter : setNewPublisher;
    const saving = isWriter ? savingWriter : savingPublisher;
    const canSubmit = state.name.trim().length > 0;
    const label = isWriter ? "Añadir writer" : "Añadir publisher";

    const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (!canSubmit) return;
        addShare(role);
      }
    };

    return (
      <div className="space-y-2 w-full">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">{label}</h4>
            {saving && <span className="text-[11px] text-muted-foreground">Guardando…</span>}
          </div>
        <div className="flex flex-col gap-2 w-full md:grid md:grid-cols-[minmax(180px,1fr)_72px_170px_96px_170px_auto] md:items-end md:gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">Nombre</Label>
            <Input
              value={state.name}
              onChange={(e) => setState((prev) => ({ ...prev, name: e.target.value }))}
              onKeyDown={handleEnter}
              className="h-8 text-xs"
              placeholder={isWriter ? "Writer" : "Publisher"}
              disabled={saving}
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">% </Label>
            <NumericSelectInput
              min={0}
              max={100}
              value={state.sharePct ?? ""}
              onChange={(value) =>
                setState((prev) => ({
                  ...prev,
                  sharePct: value === "" ? null : Number(value),
                }))
              }
              onKeyDown={handleEnter}
              className="h-8 text-xs text-right"
              disabled={saving}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">IPI</Label>
            <Input
              value={state.ipiNumber}
              onChange={(e) => setState((prev) => ({ ...prev, ipiNumber: e.target.value }))}
              onKeyDown={handleEnter}
              className="h-8 text-xs"
              disabled={saving}
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">PRO</Label>
            <select
              value={normalizeProValue(state.pro)}
              onChange={(e) => setState((prev) => ({ ...prev, pro: e.target.value }))}
              className="h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
              disabled={saving}
            >
              <option value="">—</option>
              {PRO_OPTIONS.map((pro) => (
                <option key={pro} value={pro}>
                  {pro}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <Label className="text-[11px] text-muted-foreground">CAE</Label>
            <Input
              value={state.caeNumber}
              onChange={(e) => setState((prev) => ({ ...prev, caeNumber: e.target.value }))}
              onKeyDown={handleEnter}
              className="h-8 text-xs"
              disabled={saving}
            />
          </div>
          <div className="flex items-center justify-end md:justify-start md:flex-none">
            <button
              type="button"
              onClick={() => addShare(role)}
              disabled={saving || !canSubmit}
              className="inline-flex h-8 items-center justify-center rounded border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-foreground/70 disabled:opacity-60"
            >
              {label}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const containerClass =
    mode === "BOTH" ? "grid gap-4 md:grid-cols-2 w-full" : "w-full space-y-3";

  return (
    <div className="rounded-md border border-border/70 bg-card/60 p-3 w-full">
      <div className={containerClass}>
        {(mode === "BOTH" || mode === "WRITER") && renderForm("WRITER")}
        {(mode === "BOTH" || mode === "PUBLISHER") && renderForm("PUBLISHER")}
      </div>
    </div>
  );
}
