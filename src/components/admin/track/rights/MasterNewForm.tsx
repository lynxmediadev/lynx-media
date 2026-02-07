import * as React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NumericSelectInput from "@/components/admin/ui/NumericSelectInput";

type Props = {
  newMaster: {
    name: string;
    sharePct: number | null;
    contact: string;
    notes: string;
  };
  setNewMaster: React.Dispatch<
    React.SetStateAction<{
      name: string;
      sharePct: number | null;
      contact: string;
      notes: string;
    }>
  >;
  savingMaster: boolean;
  addMaster: () => void;
  onEnter?: () => void;
};

export function MasterNewForm({ newMaster, setNewMaster, savingMaster, addMaster }: Props) {
  const canSubmit = newMaster.name.trim().length > 0;
  const handleEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!canSubmit) return;
      addMaster();
    }
  };

  return (
    <div className="rounded-md border border-border/70 bg-card/60 p-3">
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-end">
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Nombre</Label>
          <Input
            value={newMaster.name}
            onChange={(e) => setNewMaster((prev) => ({ ...prev, name: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Titular master"
            onKeyDown={handleEnter}
            disabled={savingMaster}
          />
        </div>
        <div className="flex w-full flex-col gap-1 md:w-20">
          <Label className="text-[11px] text-muted-foreground">% </Label>
          <NumericSelectInput
            min={0}
            max={100}
            value={newMaster.sharePct ?? ""}
            onChange={(value) =>
              setNewMaster((prev) => ({
                ...prev,
                sharePct: value === "" ? null : Number(value),
              }))
            }
            className="h-8 text-xs text-right"
            onKeyDown={handleEnter}
            disabled={savingMaster}
          />
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Contacto</Label>
          <Input
            value={newMaster.contact}
            onChange={(e) => setNewMaster((prev) => ({ ...prev, contact: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Email / teléfono"
            onKeyDown={handleEnter}
            disabled={savingMaster}
          />
        </div>
        <div className="flex min-w-[160px] flex-1 flex-col gap-1">
          <Label className="text-[11px] text-muted-foreground">Notas</Label>
          <Input
            value={newMaster.notes}
            onChange={(e) => setNewMaster((prev) => ({ ...prev, notes: e.target.value }))}
            className="h-8 text-xs"
            placeholder="Observaciones"
            onKeyDown={handleEnter}
            disabled={savingMaster}
          />
        </div>
        <div className="flex items-center justify-end md:justify-start">
          <button
            type="button"
            onClick={addMaster}
            disabled={savingMaster || !canSubmit}
            className="inline-flex h-8 items-center justify-center rounded border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-foreground/70 disabled:opacity-60"
          >
            Añadir master
          </button>
        </div>
      </div>
    </div>
  );
}
