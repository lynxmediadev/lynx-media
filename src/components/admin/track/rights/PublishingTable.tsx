import * as React from "react";
import { ArrowDown, ArrowUp, SquareX } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { Share } from "./types";

type Role = "WRITER" | "PUBLISHER";
type LongPressState =
  | { type: "share" | "master"; index: number; direction: "up" | "down" }
  | null;

type Props = {
  role: Role;
  roleShares: Share[];
  total: number;
  roleMsg?: string;
  missing: boolean;
  shareBusy: boolean;
  pendingShares: boolean;
  longPress: LongPressState;
  onLongPressStart: (
    type: "share",
    index: number,
    direction: "up" | "down",
    e: React.PointerEvent,
  ) => void;
  onLongPressCancel: () => void;
  moveShare: (idx: number, delta: number) => void;
  moveShareTo: (idx: number, target: number) => void;
  moveShareTop: (idx: number) => void;
  moveShareBottom: (idx: number) => void;
  onChange: (idx: number, field: keyof Share, value: string) => void;
  onDelete: (idx: number) => void;
};

export function PublishingTable({
  role,
  roleShares,
  total,
  roleMsg,
  missing,
  shareBusy,
  pendingShares,
  longPress,
  onLongPressStart,
  onLongPressCancel,
  moveShare,
  moveShareTo,
  moveShareTop,
  moveShareBottom,
  onChange,
  onDelete,
}: Props) {
  const isWriter = role === "WRITER";
  const [posValues, setPosValues] = React.useState<Record<string, string>>({});
  const positionSignature = React.useMemo(
    () => roleShares.map((s, i) => `${s.id ?? `${role}-${i}`}-${s.sortOrder ?? i}`).join("|"),
    [role, roleShares],
  );

  React.useEffect(() => {
    // Reset inputs when el orden cambia; mantiene lo escrito mientras se edita.
    setPosValues({});
  }, [positionSignature]);

  return (
    <div className="space-y-2 w-full min-w-0">
      <div className="w-full overflow-x-auto rounded-md bg-transparent p-1.5">
        <div className="flex items-center justify-between rounded-md border border-border/50 bg-muted/60 px-3 py-2 text-[11px] uppercase tracking-[0.08em] font-semibold text-foreground">
          <span className="flex items-center gap-2">
            <span>{role} · Total: {total}%</span>
            {roleMsg ? (
              <>
                <span>·</span>
                <span className="text-destructive">{roleMsg}</span>
              </>
            ) : missing ? (
              <span className="text-amber-400">incompleto</span>
            ) : (
              <span className="text-emerald-500">OK</span>
            )}
          </span>
          {shareBusy && <span className="text-[11px] text-muted-foreground">Moviendo…</span>}
        </div>
        <div className="hidden table-scroll md:block">
          <table className="min-w-full w-full text-xs">
            <thead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
              <tr>
                <th className="w-10 px-2 py-2 text-center"> </th>
                <th className="px-2 py-2 text-left">Nombre</th>
                <th className="w-16 px-1 py-2 text-center">Pos.</th>
                <th className="w-16 px-1 py-2 text-center">Mover</th>
                <th className="w-20 px-2 py-2 text-left">%/</th>
                <th className="px-2 py-2 text-left">IPI</th>
                <th className="px-2 py-2 text-left">PRO</th>
                <th className="px-2 py-2 text-left">CAE</th>
                <th className="px-2 py-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {roleShares.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-2 py-3 text-center text-muted-foreground">
                    Sin {isWriter ? "writers" : "publishers"}.
                  </td>
                </tr>
              ) : (
                roleShares.map((share, roleIdx) => (
                  <tr
                    key={`${share.id ?? `${role}-${roleIdx}`}-${share.sortOrder ?? roleIdx}`}
                    className="border-t border-border/60"
                  >
                    <td className="w-10 px-2 py-2 text-center text-muted-foreground">:::</td>
                    <td className="px-2 py-2">
                      <Input
                        value={share.name}
                        onChange={(e) => onChange(roleIdx, "name", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="w-16 px-1 py-2 text-center">
                      <Input
                        key={`pos-${share.id ?? `${role}-${roleIdx}`}-${share.sortOrder ?? roleIdx}`}
                        type="number"
                        min={1}
                        max={roleShares.length}
                        value={posValues[`${share.id ?? `${role}-${roleIdx}`}-${share.sortOrder ?? roleIdx}`] ?? String(roleIdx + 1)}
                        onChange={(e) =>
                          setPosValues((prev) => ({
                            ...prev,
                            [`${share.id ?? `${role}-${roleIdx}`}-${share.sortOrder ?? roleIdx}`]:
                              e.target.value,
                          }))
                        }
                        disabled={shareBusy}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!Number.isInteger(val) || val < 1 || val > roleShares.length) {
                            e.target.classList.add("border-destructive");
                            return;
                          }
                          e.target.classList.remove("border-destructive");
                          moveShareTo(roleIdx, val - 1);
                          setPosValues({});
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const val = Number((e.target as HTMLInputElement).value);
                            if (!Number.isInteger(val) || val < 1 || val > roleShares.length) {
                              (e.target as HTMLInputElement).classList.add("border-destructive");
                              return;
                            }
                            (e.target as HTMLInputElement).classList.remove("border-destructive");
                            moveShareTo(roleIdx, val - 1);
                            setPosValues({});
                          }
                          if (e.shiftKey && e.key === "ArrowUp") {
                            e.preventDefault();
                            moveShare(roleIdx, -3);
                          }
                          if (e.shiftKey && e.key === "ArrowDown") {
                            e.preventDefault();
                            moveShare(roleIdx, 3);
                          }
                        }}
                        className="h-8 text-center text-xs"
                      />
                    </td>
                    <td className="w-16 px-1 py-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          aria-label="Subir"
                          disabled={shareBusy}
                          onPointerDown={(e) => onLongPressStart("share", roleIdx, "up", e)}
                          onPointerUp={onLongPressCancel}
                          onPointerCancel={onLongPressCancel}
                          onClick={(e) => moveShare(roleIdx, e.shiftKey ? -3 : -1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card hover:bg-border/20"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          type="button"
                          aria-label="Bajar"
                          disabled={shareBusy}
                          onPointerDown={(e) => onLongPressStart("share", roleIdx, "down", e)}
                          onPointerUp={onLongPressCancel}
                          onPointerCancel={onLongPressCancel}
                          onClick={(e) => moveShare(roleIdx, e.shiftKey ? 3 : 1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded border border-border bg-card hover:bg-border/20"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                      </div>
                      {longPress?.type === "share" &&
                        longPress.index === roleIdx &&
                        longPress.direction === "up" && (
                          <div className="mt-1 flex flex-col gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={shareBusy}
                              onClick={() => {
                                moveShareTop(roleIdx);
                                onLongPressCancel();
                              }}
                              className="h-7 text-[11px]"
                            >
                              Ir al inicio
                            </Button>
                          </div>
                        )}
                      {longPress?.type === "share" &&
                        longPress.index === roleIdx &&
                        longPress.direction === "down" && (
                          <div className="mt-1 flex flex-col gap-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={shareBusy}
                              onClick={() => {
                                moveShareBottom(roleIdx);
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
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        value={share.sharePct ?? ""}
                        onChange={(e) => onChange(roleIdx, "sharePct", e.target.value)}
                        className="h-8 text-xs text-right"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={share.ipiNumber ?? ""}
                        onChange={(e) => onChange(roleIdx, "ipiNumber", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={share.pro ?? ""}
                        onChange={(e) => onChange(roleIdx, "pro", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <Input
                        value={share.caeNumber ?? ""}
                        onChange={(e) => onChange(roleIdx, "caeNumber", e.target.value)}
                        className="h-8 text-xs"
                      />
                    </td>
                    <td className="px-2 py-2 text-right">
                      <button
                        type="button"
                        onClick={() => onDelete(roleIdx)}
                        className="inline-flex w-full items-center justify-center text-destructive hover:text-destructive/80"
                        aria-label="Eliminar share"
                        disabled={pendingShares || shareBusy}
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
    </div>
  );
}
