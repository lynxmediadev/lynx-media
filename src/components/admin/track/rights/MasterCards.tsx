import * as React from "react";
import { ArrowDown, ArrowUp, Eye, SquareX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MasterShare } from "./types";

type LongPressState =
  | { type: "share" | "master"; index: number; direction: "up" | "down" }
  | null;

type Props = {
  masterShares: MasterShare[];
  masterBusy: boolean;
  pendingMaster: boolean;
  longPress: LongPressState;
  onLongPressStart: (
    type: "master",
    index: number,
    direction: "up" | "down",
    e: React.PointerEvent,
  ) => void;
  onLongPressCancel: () => void;
  moveMaster: (idx: number, delta: number) => void;
  moveMasterTo: (idx: number, target: number) => void;
  onChange: (
    idx: number,
    field: "name" | "sharePct" | "contact" | "notes",
    value: string,
  ) => void;
  onDelete: (idx: number) => void;
};

export function MasterCards({
  masterShares,
  masterBusy,
  pendingMaster,
  longPress,
  onLongPressStart,
  onLongPressCancel,
  moveMaster,
  moveMasterTo,
  onChange,
  onDelete,
}: Props) {
  const [expanded, setExpanded] = React.useState<Record<string, boolean>>({});
  const [posValues, setPosValues] = React.useState<Record<string, string>>({});
  const positionSignature = React.useMemo(
    () => masterShares.map((s, i) => `${s.id ?? `ms-${i}`}-${s.sortOrder ?? i}`).join("|"),
    [masterShares],
  );

  React.useEffect(() => {
    setPosValues({});
  }, [positionSignature]);

  if (masterShares.length === 0) {
    return (
      <div className="rounded-lg border border-border/70 bg-card/60 p-3 text-xs text-muted-foreground">
        Sin titulares registrados.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {masterShares.map((ms, idx) => {
        const rowId = `${ms.id ?? `ms-${idx}`}-${ms.sortOrder ?? idx}`;
        const isOpen = expanded[rowId];
        return (
          <div key={rowId} className="rounded-lg border border-border bg-card/80 p-3 shadow-sm">
            <div className="space-y-2">
              {/* Fila 1: título en wrap + porcentaje debajo ocupando todo el ancho */}
              <div className="space-y-1">
                <div className="min-w-0 break-words whitespace-normal text-sm font-semibold">
                  {ms.name || "Sin nombre"}
                </div>
                <div className="w-full rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground text-center">
                  {ms.sharePct ?? "—"}%
                </div>
              </div>

              {/* Fila 2: ver ocupa todo; pos/flechas alineadas a la derecha */}
              <div className="grid grid-cols-[1fr_auto] items-stretch gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setExpanded((prev) => ({
                      ...prev,
                      [rowId]: !isOpen,
                    }))
                  }
                  className="inline-flex h-full min-h-[48px] w-full items-center justify-center rounded-md border border-border/70 bg-card text-muted-foreground"
                  aria-label="Abrir titular"
                >
                  <Eye className="h-4 w-4" />
                </button>

                <div className="flex flex-col gap-1 items-end">
                  <div className="flex items-center gap-2">
                    <Label className="text-[11px] text-muted-foreground">Pos.</Label>
                    <Input
                      key={`pos-${rowId}`}
                      type="number"
                      min={1}
                      max={masterShares.length}
                      value={posValues[rowId] ?? String(idx + 1)}
                      onChange={(e) =>
                        setPosValues((prev) => ({
                          ...prev,
                          [rowId]: e.target.value,
                        }))
                      }
                      disabled={masterBusy}
                      onBlur={(e) => {
                        const val = Number(e.target.value);
                        if (!Number.isInteger(val) || val < 1 || val > masterShares.length) {
                          e.target.classList.add("border-destructive");
                          return;
                        }
                        e.target.classList.remove("border-destructive");
                        moveMasterTo(idx, val - 1);
                        setPosValues({});
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = Number((e.target as HTMLInputElement).value);
                          if (!Number.isInteger(val) || val < 1 || val > masterShares.length) {
                            (e.target as HTMLInputElement).classList.add("border-destructive");
                            return;
                          }
                          (e.target as HTMLInputElement).classList.remove("border-destructive");
                          moveMasterTo(idx, val - 1);
                          setPosValues({});
                        }
                      }}
                      className="h-9 w-14 text-center text-xs"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onPointerDown={(e) => onLongPressStart("master", idx, "up", e)}
                      onPointerUp={onLongPressCancel}
                      onPointerCancel={onLongPressCancel}
                      onClick={(e) => moveMaster(idx, e.shiftKey ? -3 : -1)}
                      className="inline-flex h-10 w-14 items-center justify-center rounded-md border border-border bg-card"
                      disabled={masterBusy}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => onLongPressStart("master", idx, "down", e)}
                      onPointerUp={onLongPressCancel}
                      onPointerCancel={onLongPressCancel}
                      onClick={(e) => moveMaster(idx, e.shiftKey ? 3 : 1)}
                      className="inline-flex h-10 w-14 items-center justify-center rounded-md border border-border bg-card"
                      disabled={masterBusy}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {isOpen && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Nombre</Label>
                    <Input
                      value={ms.name}
                      onChange={(e) => onChange(idx, "name", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">% </Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={ms.sharePct ?? ""}
                      onChange={(e) => onChange(idx, "sharePct", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Contacto</Label>
                    <Input
                      value={ms.contact ?? ""}
                      onChange={(e) => onChange(idx, "contact", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Notas</Label>
                    <Input
                      value={ms.notes ?? ""}
                      onChange={(e) => onChange(idx, "notes", e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => onDelete(idx)}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-destructive/60 bg-card text-destructive hover:border-destructive"
                      aria-label="Eliminar titular master"
                      disabled={pendingMaster || masterBusy}
                    >
                      <span className="text-xs font-medium">Eliminar</span>
                      <SquareX className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
