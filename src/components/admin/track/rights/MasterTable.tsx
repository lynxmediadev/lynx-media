import * as React from "react";
import { ArrowDown, ArrowUp, SquareX } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditableIconInput from "@/components/admin/ui/EditableIconInput";
import NumericSelectInput from "@/components/admin/ui/NumericSelectInput";
import type { MasterShare } from "./types";

type LongPressState =
  | { type: "share" | "master"; index: number; direction: "up" | "down" }
  | null;

type Props = {
  masterShares: MasterShare[];
  masterError: string | null;
  sumMaster: () => number;
  masterBusy: boolean;
  saveFeedback: { status: "saving" | "ok" | "error"; code?: string } | null;
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
  moveMasterTop: (idx: number) => void;
  moveMasterBottom: (idx: number) => void;
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

export function MasterTable({
  masterShares,
  masterError,
  sumMaster,
  masterBusy,
  saveFeedback,
  pendingMaster,
  longPress,
  onLongPressStart,
  onLongPressCancel,
  moveMaster,
  moveMasterTo,
  moveMasterTop,
  moveMasterBottom,
  onChange,
  onCommitChange,
  onDelete,
}: Props) {
  const [posValues, setPosValues] = React.useState<Record<string, string>>({});
  const positionSignature = React.useMemo(
    () => masterShares.map((s, i) => `${s.id ?? `ms-${i}`}-${s.sortOrder ?? i}`).join("|"),
    [masterShares],
  );

  React.useEffect(() => {
    setPosValues({});
  }, [positionSignature]);

  return (
    <div className="space-y-3 rounded-lg bg-transparent p-2 w-full min-w-0">
      <h3 className="text-sm font-semibold text-foreground">Titulares de master (múltiples)</h3>
      <p className="mb-2 text-[11px] text-muted-foreground">
        Lista de titulares del master y porcentajes. Si no se indica %, se considera parcial/pendiente.
      </p>
      <div className="flex items-center justify-between gap-2 rounded-md border border-border/50 bg-muted/60 px-3 py-2 text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground">
        <span className="flex items-center gap-2">
          <span>MASTER · TOTAL: {sumMaster()}%</span>
          {masterError ? (
            <>
              <span>·</span>
              <span className="text-destructive" title={masterError}>
                ERROR
              </span>
            </>
          ) : sumMaster() < 100 ? (
            <>
              <span>·</span>
              <span className="text-amber-400">INCOMPLETO</span>
            </>
          ) : (
            <>
              <span>·</span>
              <span className="text-emerald-500">OK</span>
            </>
          )}
          {saveFeedback?.status === "saving" && (
            <>
              <span>·</span>
              <span className="text-amber-400">Saving...</span>
            </>
          )}
          {saveFeedback?.status === "ok" && (
            <>
              <span>·</span>
              <span className="text-emerald-500">DONE</span>
            </>
          )}
          {saveFeedback?.status === "error" && (
            <>
              <span>·</span>
              <span className="text-destructive">
                ERROR {saveFeedback.code ? `(${saveFeedback.code})` : ""}
              </span>
            </>
          )}
        </span>
      </div>

      <div className="hidden w-full overflow-x-auto rounded-md bg-transparent p-1.5 table-scroll md:block">
        <table className="min-w-full w-full text-xs">
          <thead className="bg-card/70 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="w-10 px-2 py-2 text-center"> </th>
              <th className="px-2 py-2 text-left">Nombre</th>
              <th className="w-16 px-1 py-2 text-center">Pos.</th>
              <th className="w-16 px-1 py-2 text-center">Mover</th>
              <th className="w-20 px-2 py-2 text-left">%</th>
              <th className="px-2 py-2 text-left">Contacto</th>
              <th className="px-2 py-2 text-left">Notas</th>
              <th className="px-2 py-2 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {masterShares.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-2 py-3 text-center text-muted-foreground">
                  Sin titulares registrados.
                </td>
              </tr>
              ) : (
              masterShares.map((ms, idx) => (
                <tr
                  key={`${ms.id ?? `ms-${idx}`}-${ms.sortOrder ?? idx}`}
                  className="border-t border-border/60"
                >
                  <td className="w-10 px-2 py-2 text-center text-muted-foreground">:::</td>
                  <td className="px-2 py-2">
                    <EditableIconInput
                      value={ms.name}
                      onChange={(value) => onChange(idx, "name", value)}
                      onCommit={(value) => onCommitChange(idx, "name", value)}
                      disabled={masterBusy}
                      placeholder="-"
                      iconAriaLabel="Editar nombre"
                    />
                  </td>
                  <td className="w-16 px-1 py-2 text-center">
                    <NumericSelectInput
                      key={`pos-${ms.id ?? `ms-${idx}`}-${ms.sortOrder ?? idx}`}
                      min={1}
                      max={masterShares.length}
                      value={posValues[`${ms.id ?? `ms-${idx}`}-${ms.sortOrder ?? idx}`] ?? String(idx + 1)}
                      onChange={(value) =>
                        setPosValues((prev) => ({
                          ...prev,
                          [`${ms.id ?? `ms-${idx}`}-${ms.sortOrder ?? idx}`]: value,
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
                        if (e.shiftKey && e.key === "ArrowUp") {
                          e.preventDefault();
                          moveMaster(idx, -3);
                        }
                        if (e.shiftKey && e.key === "ArrowDown") {
                          e.preventDefault();
                          moveMaster(idx, 3);
                        }
                      }}
                      className="h-8 text-center text-xs"
                    />
                  </td>
                  <td className="w-16 px-1 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onPointerDown={(e) => onLongPressStart("master", idx, "up", e)}
                        onPointerUp={onLongPressCancel}
                        onPointerCancel={onLongPressCancel}
                        onClick={(e) => moveMaster(idx, e.shiftKey ? -3 : -1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card hover:bg-border/20"
                        disabled={masterBusy}
                        aria-label="Subir"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onPointerDown={(e) => onLongPressStart("master", idx, "down", e)}
                        onPointerUp={onLongPressCancel}
                        onPointerCancel={onLongPressCancel}
                        onClick={(e) => moveMaster(idx, e.shiftKey ? 3 : 1)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card hover:bg-border/20"
                        disabled={masterBusy}
                        aria-label="Bajar"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </button>
                    </div>
                    {longPress?.type === "master" &&
                      longPress.index === idx &&
                      longPress.direction === "up" && (
                        <div className="mt-1 flex flex-col gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={masterBusy}
                            onClick={() => {
                              moveMasterTop(idx);
                              onLongPressCancel();
                            }}
                            className="h-7 text-[11px]"
                          >
                            Ir al inicio
                          </Button>
                        </div>
                      )}
                    {longPress?.type === "master" &&
                      longPress.index === idx &&
                      longPress.direction === "down" && (
                        <div className="mt-1 flex flex-col gap-1">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={masterBusy}
                            onClick={() => {
                              moveMasterBottom(idx);
                              onLongPressCancel();
                            }}
                            className="h-7 text-[11px]"
                          >
                            Ir al final
                          </Button>
                        </div>
                      )}
                  </td>
                  <td className="px-2 py-2">
                    <NumericSelectInput
                      min={0}
                      max={100}
                      value={ms.sharePct ?? ""}
                      onChange={(value) => onChange(idx, "sharePct", value)}
                      onCommit={(value) => onCommitChange(idx, "sharePct", value)}
                      disabled={masterBusy}
                      className="h-8 text-xs text-right"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <EditableIconInput
                      value={ms.contact ?? ""}
                      onChange={(value) => onChange(idx, "contact", value)}
                      onCommit={(value) => onCommitChange(idx, "contact", value)}
                      disabled={masterBusy}
                      placeholder="-"
                      iconAriaLabel="Editar contacto"
                    />
                  </td>
                  <td className="px-2 py-2">
                    <EditableIconInput
                      value={ms.notes ?? ""}
                      onChange={(value) => onChange(idx, "notes", value)}
                      onCommit={(value) => onCommitChange(idx, "notes", value)}
                      disabled={masterBusy}
                      placeholder="-"
                      iconAriaLabel="Editar notas"
                    />
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => onDelete(idx)}
                      className="inline-flex w-full items-center justify-center text-destructive hover:text-destructive/80"
                      aria-label="Eliminar titular master"
                      disabled={pendingMaster || masterBusy}
                    >
                      <SquareX className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
