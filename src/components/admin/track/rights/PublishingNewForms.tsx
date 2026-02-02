import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Share } from "./types";

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
};

export function PublishingNewForms({
  newWriter,
  newPublisher,
  setNewWriter,
  setNewPublisher,
  savingWriter,
  savingPublisher,
  addShare,
}: Props) {
  return (
    <div className="rounded-md border border-border/70 bg-card/60 p-3">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Writer */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">Añadir writer</h4>
            {savingWriter && (
              <span className="text-[11px] text-muted-foreground">Guardando…</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Nombre</Label>
              <Input
                value={newWriter.name}
                onChange={(e) => setNewWriter((prev) => ({ ...prev, name: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addShare("WRITER");
                  }
                }}
                className="h-8 text-xs"
                placeholder="Writer"
                disabled={savingWriter}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">% </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newWriter.sharePct ?? ""}
                  onChange={(e) =>
                    setNewWriter((prev) => ({
                      ...prev,
                      sharePct: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addShare("WRITER");
                    }
                  }}
                  className="h-8 text-xs text-right"
                  disabled={savingWriter}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">IPI</Label>
                <Input
                  value={newWriter.ipiNumber}
                  onChange={(e) => setNewWriter((prev) => ({ ...prev, ipiNumber: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addShare("WRITER");
                    }
                  }}
                  className="h-8 text-xs"
                  disabled={savingWriter}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">PRO</Label>
                <Input
                  value={newWriter.pro}
                  onChange={(e) => setNewWriter((prev) => ({ ...prev, pro: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addShare("WRITER");
                    }
                  }}
                  className="h-8 text-xs"
                  disabled={savingWriter}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">CAE</Label>
              <Input
                value={newWriter.caeNumber}
                onChange={(e) =>
                  setNewWriter((prev) => ({ ...prev, caeNumber: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addShare("WRITER");
                  }
                }}
                className="h-8 text-xs"
                disabled={savingWriter}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => addShare("WRITER")}
                disabled={savingWriter}
                className="inline-flex h-8 items-center justify-center rounded border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-foreground/70 disabled:opacity-60"
              >
                Añadir writer
              </button>
            </div>
          </div>
        </div>

        {/* Publisher */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground">Añadir publisher</h4>
            {savingPublisher && (
              <span className="text-[11px] text-muted-foreground">Guardando…</span>
            )}
          </div>
          <div className="space-y-2">
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">Nombre</Label>
              <Input
                value={newPublisher.name}
                onChange={(e) =>
                  setNewPublisher((prev) => ({ ...prev, name: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addShare("PUBLISHER");
                  }
                }}
                className="h-8 text-xs"
                placeholder="Publisher"
                disabled={savingPublisher}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">% </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newPublisher.sharePct ?? ""}
                  onChange={(e) =>
                    setNewPublisher((prev) => ({
                      ...prev,
                      sharePct: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addShare("PUBLISHER");
                    }
                  }}
                  className="h-8 text-xs text-right"
                  disabled={savingPublisher}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">IPI</Label>
                <Input
                  value={newPublisher.ipiNumber}
                  onChange={(e) =>
                    setNewPublisher((prev) => ({ ...prev, ipiNumber: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addShare("PUBLISHER");
                    }
                  }}
                  className="h-8 text-xs"
                  disabled={savingPublisher}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-muted-foreground">PRO</Label>
                <Input
                  value={newPublisher.pro}
                  onChange={(e) =>
                    setNewPublisher((prev) => ({ ...prev, pro: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addShare("PUBLISHER");
                    }
                  }}
                  className="h-8 text-xs"
                  disabled={savingPublisher}
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-[11px] text-muted-foreground">CAE</Label>
              <Input
                value={newPublisher.caeNumber}
                onChange={(e) =>
                  setNewPublisher((prev) => ({ ...prev, caeNumber: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addShare("PUBLISHER");
                  }
                }}
                className="h-8 text-xs"
                disabled={savingPublisher}
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => addShare("PUBLISHER")}
                disabled={savingPublisher}
                className="inline-flex h-8 items-center justify-center rounded border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-foreground/70 disabled:opacity-60"
              >
                Añadir publisher
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
