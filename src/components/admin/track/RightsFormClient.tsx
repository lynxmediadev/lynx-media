// src/components/admin/track/RightsFormClient.tsx
"use client";

import * as React from "react";
import FormField from "../ui/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { SquareX, GripHorizontal } from "lucide-react";
import { updatePublishingShares } from "@/app/admin/track/actions/update-publishing-shares";
import { updateMasterShares } from "@/app/admin/track/actions/update-master-shares";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Share = {
  id?: string;
  role: "WRITER" | "PUBLISHER";
  name: string;
  sharePct: number | null;
  ipiNumber?: string | null;
  pro?: string | null;
  caeNumber?: string | null;
  sortOrder?: number | null;
};

type MasterShare = {
  id?: string;
  name: string;
  sharePct: number | null;
  contact?: string | null;
  notes?: string | null;
  sortOrder?: number | null;
};

type RightsTrackFormProps = {
  trackId: string;
  track: {
    mfn: boolean;
    contentIdEnrolled: boolean;
    contentIdAdmin: string;
    contentIdWhitelist: string;
    master: string;
    oneStop: boolean;
    clearedForSync: boolean;
    publishingShares: Share[];
    masterShares: MasterShare[];
  };
  fieldErrors?: Record<string, string[]>;
};
type FieldErrors = Record<string, string[]>;

function firstError(fieldErrors: FieldErrors | undefined, key: string) {
  if (!fieldErrors) return null;
  const arr = fieldErrors[key];
  return arr && arr.length > 0 ? arr[0] : null;
}

const sortByOrder = <T extends { sortOrder?: number | null; name?: string }>(
  a: T,
  b: T,
) => {
  const ao =
    typeof a.sortOrder === "number" ? a.sortOrder : Number.MAX_SAFE_INTEGER;
  const bo =
    typeof b.sortOrder === "number" ? b.sortOrder : Number.MAX_SAFE_INTEGER;
  if (ao !== bo) return ao - bo;
  return (a.name ?? "").localeCompare(b.name ?? "");
};

function SortableRow({
  id,
  children,
  describedBy,
}: {
  id: string;
  children: React.ReactNode;
  describedBy?: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  const attrs = { ...attributes } as React.HTMLAttributes<HTMLTableRowElement>;
  if (describedBy) {
    attrs["aria-describedby"] = describedBy;
  } else {
    delete (attrs as any)["aria-describedby"];
  }
  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attrs}
      {...listeners}
      className="border-t border-border/60"
    >
      {children}
    </tr>
  );
}

export default function RightsFormClient({
  trackId,
  track,
  fieldErrors,
}: RightsTrackFormProps) {
  const serverErrors: FieldErrors = fieldErrors ?? {};
  const dndDescIdShares = "dnd-pub-desc";
  const dndDescIdMaster = "dnd-master-desc";
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );
  const [mfnChecked, setMfnChecked] = React.useState(track.mfn);
  const [oneStopChecked, setOneStopChecked] = React.useState(track.oneStop);
  const [clearedChecked, setClearedChecked] = React.useState(
    track.clearedForSync,
  );
  const [contentIdChecked, setContentIdChecked] = React.useState(
    track.contentIdEnrolled,
  );

  const [shares, setShares] = React.useState<Share[]>(
    (track.publishingShares ?? []).slice().sort(sortByOrder),
  );
  const [pendingShares, startTransition] = React.useTransition();
  const [shareStatus, setShareStatus] = React.useState<string | null>(null);
  const [shareError, setShareError] = React.useState<string | null>(null);
  const [newShare, setNewShare] = React.useState<Share & { ipiNumber: string; pro: string; caeNumber: string }>({
    role: "WRITER",
    name: "",
    sharePct: 50,
    ipiNumber: "",
    pro: "",
    caeNumber: "",
  });

  React.useEffect(() => {
    setShares((track.publishingShares ?? []).slice().sort(sortByOrder));
  }, [track.publishingShares]);

  const [masterShares, setMasterShares] = React.useState<MasterShare[]>(
    (track.masterShares ?? []).slice().sort(sortByOrder),
  );
  const [pendingMaster, startTransitionMaster] = React.useTransition();
  const [masterStatus, setMasterStatus] = React.useState<string | null>(null);
  const [masterError, setMasterError] = React.useState<string | null>(null);
  const [newMaster, setNewMaster] = React.useState({
    name: "",
    sharePct: 100,
    contact: "",
    notes: "",
  });
  const hiddenJson = JSON.stringify(shares);
  const hiddenMasterJson = JSON.stringify(masterShares);

  React.useEffect(() => {
    setMasterShares((track.masterShares ?? []).slice().sort(sortByOrder));
  }, [track.masterShares]);

  const applyRoleSortOrders = (list: Share[]) => {
    let w = 0;
    let p = 0;
    return list.map((s) => ({
      ...s,
      sortOrder: s.role === "WRITER" ? w++ : p++,
    }));
  };

  const shareDomId = (share: Share, idx: number) =>
    `${share.role}-${share.id ?? "row"}-${idx}`;

  const handleShareDragEnd = (event: { active: any; over: any }) => {
    const { active, over } = event;
    if (!over) return;
    const activeIdx = shares.findIndex(
      (_, i) => shareDomId(shares[i], i) === active.id,
    );
    const overIdx = shares.findIndex(
      (_, i) => shareDomId(shares[i], i) === over.id,
    );
    if (activeIdx === -1 || overIdx === -1) return;
    if (shares[activeIdx].role !== shares[overIdx].role) return;
    const role = shares[activeIdx].role;
    const roleIndices = shares
      .map((s, i) => (s.role === role ? i : -1))
      .filter((i) => i >= 0);
    const from = roleIndices.indexOf(activeIdx);
    const to = roleIndices.indexOf(overIdx);
    if (from === -1 || to === -1 || from === to) return;
    const roleList = roleIndices.map((i) => shares[i]);
    const reordered = arrayMove(roleList, from, to);
    const next = [...shares];
    roleIndices.forEach((pos, idx) => {
      next[pos] = reordered[idx];
    });
    saveShares(next);
  };

  const handleMasterDragEnd = (event: { active: any; over: any }) => {
    const { active, over } = event;
    if (!over) return;
    const activeIdx = masterShares.findIndex(
      (_, i) => (masterShares[i].id ?? `ms-${i}`) === active.id,
    );
    const overIdx = masterShares.findIndex(
      (_, i) => (masterShares[i].id ?? `ms-${i}`) === over.id,
    );
    if (activeIdx === -1 || overIdx === -1 || activeIdx === overIdx) return;
    const reordered = arrayMove(masterShares, activeIdx, overIdx);
    saveMasterShares(reordered);
  };

  const saveShares = (next: Share[]) => {
    const ordered = applyRoleSortOrders(next);
    const totalW = sumByRole("WRITER", next);
    const totalP = sumByRole("PUBLISHER", next);
    if (totalW > 100 || totalP > 100) {
      setShareError("Algún rol supera 100%. Ajusta porcentajes.");
      setShareStatus(null);
      return;
    }
    if (oneStopChecked && (totalW !== 100 || totalP !== 100)) {
      setShareError("One-Stop activo: Writer y Publisher deben sumar 100% cada uno.");
      setShareStatus(null);
      return;
    } else {
      setShareError(null);
    }
    setShareStatus("Guardando…");
    startTransition(async () => {
      const result = await updatePublishingShares({
        trackId,
        oneStop: oneStopChecked,
        shares: ordered.map((s) => ({
          ...s,
          sharePct:
            s.sharePct === null || Number.isNaN(Number(s.sharePct))
              ? null
              : Number(s.sharePct),
        })),
      });
      if (!result.ok) {
        setShareError(result.message);
        setShareStatus(null);
      } else {
        setShareStatus("Guardado");
        setShares(ordered);
      }
    });
  };

  const handleShareChange = (
    idx: number,
    field: keyof Share,
    value: string,
  ) => {
    const next = shares.map((s, i) =>
      i === idx
        ? {
            ...s,
            [field]:
              field === "sharePct"
                ? value === ""
                  ? null
                  : Number(value)
                : value,
          }
        : s,
    );
    setShares(next);
  };

  const handleDeleteShare = (idx: number) => {
    const next = shares.filter((_, i) => i !== idx);
    setShares(next);
    saveShares(next);
  };

  const handleAddShare = () => {
    if (!newShare.name.trim()) {
      setShareError("Ingresa un nombre para el share.");
      setShareStatus(null);
      return;
    }
    const next = [
      ...shares,
      {
        role: newShare.role,
        name: newShare.name.trim(),
        sharePct:
          newShare.sharePct === null || Number.isNaN(newShare.sharePct)
            ? null
            : Number(newShare.sharePct),
        ipiNumber: newShare.ipiNumber.trim() || "",
        pro: newShare.pro.trim() || "",
        caeNumber: newShare.caeNumber.trim() || "",
      },
    ];
    setShares(next);
    setNewShare((prev) => ({ ...prev, name: "", ipiNumber: "", pro: "", caeNumber: "" }));
    saveShares(next);
  };

  const sumByRole = (role: "WRITER" | "PUBLISHER", list = shares) =>
    list
      .filter((s) => s.role === role && typeof s.sharePct === "number")
      .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);

  const sumMaster = () =>
    masterShares
      .filter((s) => typeof s.sharePct === "number")
      .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);

  const applyMasterOrders = (list: MasterShare[]) =>
    list.map((s, idx) => ({ ...s, sortOrder: idx }));

  const saveMasterShares = (next: MasterShare[]) => {
    const ordered = applyMasterOrders(next);
    setMasterStatus("Guardando…");
    setMasterError(null);
    startTransitionMaster(async () => {
      const result = await updateMasterShares({
        trackId,
        shares: ordered.map((s) => ({
          name: s.name,
          sharePct:
            s.sharePct === null || Number.isNaN(Number(s.sharePct))
              ? null
              : Number(s.sharePct),
          contact: s.contact ?? null,
          notes: s.notes ?? null,
        })),
      });
      if (!result.ok) {
        setMasterError(result.message);
        setMasterStatus(null);
      } else {
        setMasterStatus("Guardado");
        setMasterShares(ordered);
      }
    });
  };

  const handleMasterChange = (
    idx: number,
    field: keyof typeof newMaster,
    value: string,
  ) => {
    const next = masterShares.map((s, i) =>
      i === idx
        ? {
            ...s,
            [field]:
              field === "sharePct"
                ? value === ""
                  ? null
                  : Number(value)
                : value,
          }
        : s,
    );
    setMasterShares(next);
  };

  const handleDeleteMaster = (idx: number) => {
    const next = masterShares.filter((_, i) => i !== idx);
    setMasterShares(next);
    saveMasterShares(next);
  };

  const handleMasterBlur = (
    idx: number,
    field: keyof MasterShare,
    value: string,
  ) => {
    const next = masterShares.map((s, i) =>
      i === idx
        ? {
            ...s,
            [field]:
              field === "sharePct"
                ? value === ""
                  ? null
                  : Number(value)
                : value,
          }
        : s,
    );
    setMasterShares(next);
    saveMasterShares(next);
  };

  const handleAddMaster = () => {
    if (!newMaster.name.trim()) {
      setMasterError("Ingresa un nombre para el titular del master.");
      setMasterStatus(null);
      return;
    }
    const tempId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `tmp-${Date.now()}-${Math.random()}`;
    const next = [
      ...masterShares,
      {
        id: tempId,
        name: newMaster.name.trim(),
        sharePct:
          newMaster.sharePct === null || Number.isNaN(newMaster.sharePct)
            ? null
            : Number(newMaster.sharePct),
        contact: newMaster.contact.trim() || "",
        notes: newMaster.notes.trim() || "",
        sortOrder: masterShares.length,
      },
    ];
    setMasterShares(next);
    setNewMaster((prev) => ({ ...prev, name: "", contact: "", notes: "" }));
    saveMasterShares(next);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Derechos &amp; explotación
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Control de master, publishing y administración de Content ID.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-3 rounded-lg border border-border bg-card/80 p-3">
          <h3 className="text-sm font-semibold text-foreground">
            Master &amp; publishing
          </h3>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Los titulares de master se administran en la tabla inferior. Puedes ingresar múltiples dueños y porcentajes.
          </p>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="text-xs font-semibold text-foreground">
                Publishing shares (Writer 100% / Publisher 100%)
              </h4>
              {shareStatus ? (
                <span className="text-[11px] text-muted-foreground">{shareStatus}</span>
              ) : null}
              {shareError ? (
                <span className="text-[11px] text-destructive">{shareError}</span>
              ) : null}
            </div>
            <p id={dndDescIdShares} className="sr-only">
              Usa arrastrar y soltar para reordenar writers o publishers.
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleShareDragEnd}
              accessibility={{ describedById: dndDescIdShares }}
            >
              <div className="grid gap-3">
                {(["WRITER", "PUBLISHER"] as const).map((role) => {
                  const roleShares = shares
                    .filter((s) => s.role === role)
                    .map((s) => s)
                    .sort(sortByOrder);
                  const total = sumByRole(role);
                  const over = total > 100;
                  const missing = total < 100;
                  const ids = roleShares.map((share, idx) =>
                    shareDomId(share, shares.findIndex((s) => s === share)),
                  );
                  return (
                    <div key={role} className="overflow-x-auto rounded-md border border-border">
                      <div className="flex items-center justify-between px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground bg-card/70">
                        <span>
                          {role} · Total: {total}%
                        </span>
                        {over ? (
                          <span className="text-destructive">&gt;100%</span>
                        ) : missing ? (
                          <span className="text-amber-400">incompleto</span>
                        ) : (
                          <span className="text-emerald-400">OK</span>
                        )}
                      </div>
                      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                        <table className="min-w-full text-xs">
                          <thead className="text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                            <tr>
                              <th className="px-2 py-2 text-center w-10"> </th>
                              <th className="px-2 py-2 text-left">Nombre</th>
                              <th className="px-2 py-2 text-left w-20">%</th>
                              <th className="px-2 py-2 text-left">IPI</th>
                              <th className="px-2 py-2 text-left">PRO</th>
                              <th className="px-2 py-2 text-left">CAE</th>
                              <th className="px-2 py-2 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody>
                            {roleShares.length === 0 ? (
                              <tr>
                                <td colSpan={7} className="px-2 py-3 text-center text-muted-foreground">
                                  Sin {role === "WRITER" ? "writers" : "publishers"}.
                                </td>
                              </tr>
                            ) : (
                              roleShares.map((share) => {
                                const globalIdx = shares.findIndex((s) => s === share);
                                const rowId = shareDomId(share, globalIdx);
                                return (
                                  <SortableRow
                                    key={rowId}
                                    id={rowId}
                                    describedBy={dndDescIdShares}
                                  >
                                    <td className="px-2 py-2 text-center w-10">
                                      <GripHorizontal className="mx-auto h-4 w-4 text-muted-foreground" />
                                    </td>
                                    <td className="px-2 py-2">
                                      <Input
                                        value={share.name}
                                        onChange={(e) => handleShareChange(globalIdx, "name", e.target.value)}
                                        onBlur={() => saveShares(shares)}
                                        className="h-8 text-xs"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <Input
                                        type="number"
                                        min={0}
                                        max={100}
                                        value={share.sharePct ?? ""}
                                        onChange={(e) => handleShareChange(globalIdx, "sharePct", e.target.value)}
                                        onBlur={() => saveShares(shares)}
                                        className="h-8 text-xs text-right"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <Input
                                        value={share.ipiNumber ?? ""}
                                        onChange={(e) => handleShareChange(globalIdx, "ipiNumber", e.target.value)}
                                        onBlur={() => saveShares(shares)}
                                        className="h-8 text-xs"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <Input
                                        value={share.pro ?? ""}
                                        onChange={(e) => handleShareChange(globalIdx, "pro", e.target.value)}
                                        onBlur={() => saveShares(shares)}
                                        className="h-8 text-xs"
                                      />
                                    </td>
                                    <td className="px-2 py-2">
                                      <Input
                                        value={share.caeNumber ?? ""}
                                        onChange={(e) => handleShareChange(globalIdx, "caeNumber", e.target.value)}
                                        onBlur={() => saveShares(shares)}
                                        className="h-8 text-xs"
                                      />
                                    </td>
                                    <td className="px-2 py-2 text-right">
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteShare(globalIdx)}
                                        className="inline-flex w-full items-center justify-center text-destructive hover:text-destructive/80"
                                        aria-label="Eliminar share"
                                        disabled={pendingShares}
                                      >
                                        <SquareX className="h-4 w-4" />
                                      </button>
                                    </td>
                                  </SortableRow>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>
            </DndContext>

            <div className="rounded-md border border-border/70 bg-card/60 p-3">
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">Rol</Label>
                  <select
                    value={newShare.role}
                    onChange={(e) =>
                      setNewShare((prev) => ({
                        ...prev,
                        role: e.target.value as "WRITER" | "PUBLISHER",
                      }))
                    }
                    className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
                  >
                    <option value="WRITER">WRITER</option>
                    <option value="PUBLISHER">PUBLISHER</option>
                  </select>
                </div>
                <div className="flex min-w-[140px] flex-1 flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">Nombre</Label>
                  <Input
                    value={newShare.name}
                    onChange={(e) => setNewShare((prev) => ({ ...prev, name: e.target.value }))}
                    className="h-8 text-xs"
                    placeholder="Entidad / persona"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddShare();
                      }
                    }}
                  />
                </div>
                <div className="flex w-20 flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">% </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={newShare.sharePct ?? ""}
                    onChange={(e) =>
                      setNewShare((prev) => ({
                        ...prev,
                        sharePct: e.target.value === "" ? null : Number(e.target.value),
                      }))
                    }
                    className="h-8 text-xs text-right"
                  />
                </div>
                <div className="flex w-28 flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">IPI</Label>
                  <Input
                    value={newShare.ipiNumber ?? ""}
                    onChange={(e) => setNewShare((prev) => ({ ...prev, ipiNumber: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex w-24 flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">PRO</Label>
                  <Input
                    value={newShare.pro ?? ""}
                    onChange={(e) => setNewShare((prev) => ({ ...prev, pro: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex w-24 flex-col gap-1">
                  <Label className="text-[11px] text-muted-foreground">CAE</Label>
                  <Input
                    value={newShare.caeNumber ?? ""}
                    onChange={(e) => setNewShare((prev) => ({ ...prev, caeNumber: e.target.value }))}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="flex flex-1 items-center justify-end gap-3">
                  <div className="text-[11px] text-muted-foreground">
                    WRITER: {sumByRole("WRITER")}% · PUBLISHER: {sumByRole("PUBLISHER")}%
                  </div>
                  <button
                    type="button"
                    onClick={handleAddShare}
                    disabled={pendingShares}
                    className="inline-flex h-8 items-center justify-center rounded border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-foreground/70"
                  >
                    Añadir share
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card/80 p-3">
          <h3 className="text-sm font-semibold text-foreground">
            Titulares de master (múltiples)
          </h3>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Lista de titulares del master y porcentajes. Si no se indica %, se considera parcial/pendiente.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-[11px] text-muted-foreground">
              Total master: {sumMaster()}%
            </div>
            {masterStatus ? (
              <span className="text-[11px] text-muted-foreground">{masterStatus}</span>
            ) : null}
            {masterError ? (
              <span className="text-[11px] text-destructive">{masterError}</span>
            ) : null}
          </div>
          <p id={dndDescIdMaster} className="sr-only">
            Arrastra los titulares de master para ajustar el orden.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleMasterDragEnd}
            accessibility={{ describedById: dndDescIdMaster }}
          >
            <div className="overflow-x-auto rounded-md border border-border">
              <SortableContext
                items={masterShares.map((ms, idx) => ms.id ?? `ms-${idx}`)}
                strategy={verticalListSortingStrategy}
              >
                <table className="min-w-full text-xs">
                  <thead className="bg-card/70 text-[11px] uppercase tracking-[0.08em] text-muted-foreground">
                    <tr>
                      <th className="px-2 py-2 text-center w-10"> </th>
                      <th className="px-2 py-2 text-left">Nombre</th>
                      <th className="px-2 py-2 text-left w-20">%</th>
                      <th className="px-2 py-2 text-left">Contacto</th>
                      <th className="px-2 py-2 text-left">Notas</th>
                      <th className="px-2 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {masterShares.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-2 py-3 text-center text-muted-foreground">
                          Sin titulares registrados.
                        </td>
                      </tr>
                    ) : (
                      masterShares.map((ms, idx) => {
                        const rowId = ms.id ?? `ms-${idx}`;
                        return (
                          <SortableRow
                            key={rowId}
                            id={rowId}
                            describedBy={dndDescIdMaster}
                          >
                            <td className="px-2 py-2 text-center w-10">
                              <GripHorizontal className="mx-auto h-4 w-4 text-muted-foreground" />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                value={ms.name}
                                onChange={(e) => handleMasterChange(idx, "name", e.target.value)}
                                onBlur={(e) => handleMasterBlur(idx, "name", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                type="number"
                                min={0}
                                max={100}
                                value={ms.sharePct ?? ""}
                                onChange={(e) => handleMasterChange(idx, "sharePct", e.target.value)}
                                onBlur={(e) => handleMasterBlur(idx, "sharePct", e.target.value)}
                                className="h-8 text-xs text-right"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                value={ms.contact ?? ""}
                                onChange={(e) => handleMasterChange(idx, "contact", e.target.value)}
                                onBlur={(e) => handleMasterBlur(idx, "contact", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="px-2 py-2">
                              <Input
                                value={ms.notes ?? ""}
                                onChange={(e) => handleMasterChange(idx, "notes", e.target.value)}
                                onBlur={(e) => handleMasterBlur(idx, "notes", e.target.value)}
                                className="h-8 text-xs"
                              />
                            </td>
                            <td className="px-2 py-2 text-right">
                              <button
                                type="button"
                                onClick={() => handleDeleteMaster(idx)}
                                className="inline-flex w-full items-center justify-center text-destructive hover:text-destructive/80"
                                aria-label="Eliminar titular master"
                                disabled={pendingMaster}
                              >
                                <SquareX className="h-4 w-4" />
                              </button>
                            </td>
                          </SortableRow>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </SortableContext>
            </div>
          </DndContext>

          <div className="rounded-md border border-border/70 bg-card/60 p-3">
            <div className="flex flex-wrap items-end gap-2">
              <div className="flex min-w-[160px] flex-1 flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground">Nombre</Label>
                <Input
                  value={newMaster.name}
                  onChange={(e) => setNewMaster((prev) => ({ ...prev, name: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="Titular master"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddMaster();
                    }
                  }}
                />
              </div>
              <div className="flex w-20 flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground">% </Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={newMaster.sharePct ?? ""}
                  onChange={(e) =>
                    setNewMaster((prev) => ({
                      ...prev,
                      sharePct: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  className="h-8 text-xs text-right"
                />
              </div>
              <div className="flex min-w-[160px] flex-1 flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground">Contacto</Label>
                <Input
                  value={newMaster.contact}
                  onChange={(e) => setNewMaster((prev) => ({ ...prev, contact: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="Email / teléfono"
                />
              </div>
              <div className="flex min-w-[160px] flex-1 flex-col gap-1">
                <Label className="text-[11px] text-muted-foreground">Notas</Label>
                <Input
                  value={newMaster.notes}
                  onChange={(e) => setNewMaster((prev) => ({ ...prev, notes: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="Observaciones"
                />
              </div>
              <button
                type="button"
                onClick={handleAddMaster}
                disabled={pendingMaster}
                className="ml-auto inline-flex h-8 items-center justify-center rounded border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-foreground/70"
              >
                Añadir master
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <div className="rounded-md border border-border bg-card/70 p-2">
            <div className="flex items-center gap-2">
              <input
                type="hidden"
                name="mfn"
                value={mfnChecked ? "true" : "false"}
              />
              <Checkbox
                id="mfn"
                checked={mfnChecked}
                onCheckedChange={(checked) => setMfnChecked(checked === true)}
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor="mfn"
                  className="text-xs font-medium text-foreground"
                >
                  MFN (Most Favoured Nations)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Marca esto si las condiciones de este master deben ser al
                  menos tan favorables como las de otros proveedores en el
                  mismo proyecto/campaña.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card/70 p-2">
            <div className="flex flex-col gap-2">
              <p className="text-xs font-medium text-foreground">
                One-stop / Cleared
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <input
                    type="hidden"
                    name="oneStop"
                    value={oneStopChecked ? "true" : "false"}
                  />
                  <Checkbox
                    id="oneStop"
                    checked={oneStopChecked}
                    onCheckedChange={(checked) =>
                      setOneStopChecked(checked === true)
                    }
                  />
                  <Label
                    htmlFor="oneStop"
                    className="text-[11px] text-muted-foreground"
                  >
                    One-stop (master + publishing)
                  </Label>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <input
                    type="hidden"
                    name="clearedForSync"
                    value={clearedChecked ? "true" : "false"}
                  />
                  <Checkbox
                    id="clearedForSync"
                    checked={clearedChecked}
                    onCheckedChange={(checked) =>
                      setClearedChecked(checked === true)
                    }
                  />
                  <Label
                    htmlFor="clearedForSync"
                    className="text-[11px] text-muted-foreground"
                  >
                    Cleared para sync
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-md border border-border bg-card/70 p-2">
            <div className="flex items-center gap-2">
              <input
                type="hidden"
                name="contentIdEnrolled"
                value={contentIdChecked ? "true" : "false"}
              />
              <Checkbox
                id="contentIdEnrolled"
                checked={contentIdChecked}
                onCheckedChange={(checked) =>
                  setContentIdChecked(checked === true)
                }
              />
              <div className="space-y-0.5">
                <Label
                  htmlFor="contentIdEnrolled"
                  className="text-xs font-medium text-foreground"
                >
                  Enrolado en Content ID (YouTube)
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Márcalo si este master está (o estará) registrado en un
                  sistema de Content ID (YouTube, Facebook, etc.).
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-1 rounded-lg border border-border bg-card/80 p-3">
          <h3 className="text-sm font-semibold text-foreground">
            Content ID &amp; administración
          </h3>
          <p className="mb-3 text-[11px] text-muted-foreground">
            Define quién administra Content ID y qué canales deben estar
            exentos de reclamaciones (whitelist).
          </p>

          <FormField
            htmlFor="contentIdAdmin"
            error={firstError(serverErrors, "contentIdAdmin")}
            label="Admin Content ID"
            descriptionPosition="above"
            className="mb-5"
            description={
              <>
                Quién administra Content ID. Ej:{" "}
                <span className="font-mono">Identifyy</span>,{" "}
                <span className="font-mono">HAWWK</span>,{" "}
                <span className="font-mono">Propietario directo</span>.
              </>
            }
          >
            <Input
              id="contentIdAdmin"
              name="contentIdAdmin"
              type="text"
              defaultValue={track.contentIdAdmin}
              className="mt-0.5 w-full text-xs"
              placeholder="Ej: Identifyy como administrador de Content ID"
            />
          </FormField>

          <FormField
            htmlFor="contentIdWhitelist"
            error={firstError(serverErrors, "contentIdWhitelist")}
            label="Whitelist Content ID"
            descriptionPosition="above"
            description={
              <>
                Canales o cuentas excluidas de reclamaciones. Una por línea o
                separadas por comas. Ej: nombres de canales de clientes, tu
                propio canal, etc.
              </>
            }
          >
            <Textarea
              id="contentIdWhitelist"
              name="contentIdWhitelist"
              defaultValue={track.contentIdWhitelist}
              rows={4}
              className="mt-0.5 w-full resize-y text-xs"
              placeholder={`Ej: lynxmediaofficial
cliente_marca_tv
cliente_youtube_channel`}
            />
          </FormField>
        </div>
      </div>

      {/* Hidden para que el submit global conozca los shares actuales */}
      <input type="hidden" name="publishingShares" value={hiddenJson} />
      <input type="hidden" name="master" value={track.master ?? ""} />
      <input type="hidden" name="masterShares" value={hiddenMasterJson} />
    </div>
  );
}
