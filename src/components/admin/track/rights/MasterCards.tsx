import * as React from "react";
import { ArrowDown, ArrowUp, Eye, SquareX } from "lucide-react";
import { Label } from "@/components/ui/label";
import EditableIconInput from "@/components/admin/ui/EditableIconInput";
import NumericSelectInput from "@/components/admin/ui/NumericSelectInput";
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
  onCommitChange: (
    idx: number,
    field: "name" | "sharePct" | "contact" | "notes",
    value: string,
  ) => void | Promise<void>;
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
  onCommitChange,
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
    <div className="space-y-2">
      {masterShares.map((ms, idx) => {
        const rowId = `${ms.id ?? `ms-${idx}`}-${ms.sortOrder ?? idx}`;
        const isOpen = expanded[rowId];
        const pctLabel = typeof ms.sharePct === "number" ? `${ms.sharePct}%` : "—%";
        return (
          <div key={rowId} className="rounded-md border border-border/60 bg-card/40">
            <button
              type="button"
              onClick={() =>
                setExpanded((prev) => ({
                  ...prev,
                  [rowId]: !isOpen,
                }))
              }
              className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 p-2 text-left"
              aria-expanded={isOpen}
              aria-label="Ver detalles del titular master"
            >
              <span className="text-sm font-semibold break-words whitespace-normal leading-tight">
                {ms.name || "Sin nombre"}
              </span>
              <span className="rounded-md border border-border px-2 py-1 text-[11px] font-medium text-foreground">
                {pctLabel}
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-muted-foreground">
                <Eye className="h-4 w-4" />
              </span>
            </button>

            {isOpen && (
              <div className="space-y-3 border-t border-border/60 p-3">
                <div className="grid grid-cols-[1fr_auto] items-end gap-2">
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Posición</Label>
                    <NumericSelectInput
                      key={`pos-${rowId}`}
                      min={1}
                      max={masterShares.length}
                      value={posValues[rowId] ?? String(idx + 1)}
                      onChange={(value) =>
                        setPosValues((prev) => ({
                          ...prev,
                          [rowId]: value,
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
                        if (e.key !== "Enter") return;
                        e.preventDefault();
                        const val = Number((e.target as HTMLInputElement).value);
                        if (!Number.isInteger(val) || val < 1 || val > masterShares.length) {
                          (e.target as HTMLInputElement).classList.add("border-destructive");
                          return;
                        }
                        (e.target as HTMLInputElement).classList.remove("border-destructive");
                        moveMasterTo(idx, val - 1);
                        setPosValues({});
                      }}
                      className="h-8 w-20 text-center text-[11px]"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onPointerDown={(e) => onLongPressStart("master", idx, "up", e)}
                      onPointerUp={onLongPressCancel}
                      onPointerCancel={onLongPressCancel}
                      onClick={(e) => moveMaster(idx, e.shiftKey ? -3 : -1)}
                      className="inline-flex h-8 w-10 items-center justify-center rounded-md border border-border bg-card"
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
                      className="inline-flex h-8 w-10 items-center justify-center rounded-md border border-border bg-card"
                      disabled={masterBusy}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Nombre</Label>
                  <EditableIconInput
                    value={ms.name}
                    onChange={(value) => onChange(idx, "name", value)}
                    onCommit={(value) => onCommitChange(idx, "name", value)}
                    disabled={masterBusy}
                    placeholder="-"
                    iconAriaLabel="Editar nombre"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">% </Label>
                  <NumericSelectInput
                    min={0}
                    max={100}
                    value={ms.sharePct ?? ""}
                    onChange={(value) => onChange(idx, "sharePct", value)}
                    onCommit={(value) => onCommitChange(idx, "sharePct", value)}
                    disabled={masterBusy}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Contacto</Label>
                  <EditableIconInput
                    value={ms.contact ?? ""}
                    onChange={(value) => onChange(idx, "contact", value)}
                    onCommit={(value) => onCommitChange(idx, "contact", value)}
                    disabled={masterBusy}
                    placeholder="-"
                    iconAriaLabel="Editar contacto"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Notas</Label>
                  <EditableIconInput
                    value={ms.notes ?? ""}
                    onChange={(value) => onChange(idx, "notes", value)}
                    onCommit={(value) => onCommitChange(idx, "notes", value)}
                    disabled={masterBusy}
                    placeholder="-"
                    iconAriaLabel="Editar notas"
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
        );
      })}
    </div>
  );
}
