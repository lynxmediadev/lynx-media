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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { updatePublishingShares } from "@/app/admin/track/actions/update-publishing-shares";
import { updateMasterShares } from "@/app/admin/track/actions/update-master-shares";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
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
  const [pendingShares] = React.useTransition();
  const [shareError, setShareError] = React.useState<string | null>(null);
  const [shareRoleErrors, setShareRoleErrors] = React.useState<{
    WRITER?: string;
    PUBLISHER?: string;
  }>({});
  const [newWriter, setNewWriter] = React.useState<Share & { ipiNumber: string; pro: string; caeNumber: string }>({
    role: "WRITER",
    name: "",
    sharePct: 50,
    ipiNumber: "",
    pro: "",
    caeNumber: "",
  });
  const [newPublisher, setNewPublisher] = React.useState<Share & { ipiNumber: string; pro: string; caeNumber: string }>({
    role: "PUBLISHER",
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
  const [pendingMaster] = React.useTransition();
  const [masterError, setMasterError] = React.useState<string | null>(null);
  const [newMaster, setNewMaster] = React.useState({
    name: "",
    sharePct: 100,
    contact: "",
    notes: "",
  });
  const [savingShare, setSavingShare] = React.useState(false);
  const [savingWriter, setSavingWriter] = React.useState(false);
  const [savingPublisher, setSavingPublisher] = React.useState(false);
  const [savingMaster, setSavingMaster] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<
    | { type: "share"; index: number }
    | { type: "master"; index: number }
    | null
  >(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);
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
    setShares(applyRoleSortOrders(next));
    validateShares(next);
  };

  const handleDeleteShare = (idx: number) => {
    setDeleteTarget({ type: "share", index: idx });
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

  const validateShares = (list: Share[]) => {
    const totalW = sumByRole("WRITER", list);
    const totalP = sumByRole("PUBLISHER", list);
    const roleErrors: { WRITER?: string; PUBLISHER?: string } = {};

    if (totalW > 100) {
      roleErrors.WRITER = "WRITER supera 100%. Ajusta porcentajes.";
    } else if (oneStopChecked && totalW !== 100) {
      roleErrors.WRITER = "WRITER debe sumar 100% para One-Stop.";
    }

    if (totalP > 100) {
      roleErrors.PUBLISHER = "PUBLISHER supera 100%. Ajusta porcentajes.";
    } else if (oneStopChecked && totalP !== 100) {
      roleErrors.PUBLISHER = "PUBLISHER debe sumar 100% para One-Stop.";
    }

    setShareRoleErrors(roleErrors);
    setShareError(
      roleErrors.WRITER ?? roleErrors.PUBLISHER ?? null,
    );
  };

  const updateSharesState = (next: Share[]) => {
    const ordered = applyRoleSortOrders(next);
    setShares(ordered);
    validateShares(ordered);
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
    updateSharesState(next);
  };

  const handleAddShare = (roleForAdd: "WRITER" | "PUBLISHER") => {
    const formState = roleForAdd === "WRITER" ? newWriter : newPublisher;
    if (!formState.name.trim()) {
      setShareError("Ingresa un nombre para el share.");
      return;
    }
    const next = [
      ...shares,
      {
        role: roleForAdd,
        name: formState.name.trim(),
        sharePct:
          formState.sharePct === null || Number.isNaN(Number(formState.sharePct))
            ? null
            : Number(formState.sharePct),
        ipiNumber: formState.ipiNumber.trim() || "",
        pro: formState.pro.trim() || "",
        caeNumber: formState.caeNumber.trim() || "",
      },
    ];
    const ordered = applyRoleSortOrders(next);
    // Validación local rápida
    const totalW = sumByRole("WRITER", ordered);
    const totalP = sumByRole("PUBLISHER", ordered);
    const roleLabel = roleForAdd === "WRITER" ? "Writers" : "Publishers";
    const setRoleError = (msg: string) => {
      setShareRoleErrors((prev) => ({ ...prev, [roleForAdd]: msg }));
      setShareError(msg);
    };

    if (roleForAdd === "WRITER" && totalW > 100) {
      setRoleError("AJUSTAR PORCENTAJES (%). WRITER NO PUEDE SUPERAR EL 100%");
      return;
    }
    if (roleForAdd === "PUBLISHER" && totalP > 100) {
      setRoleError("AJUSTAR PORCENTAJES (%). PUBLISHER NO PUEDE SUPERAR EL 100%");
      return;
    }
    if (oneStopChecked) {
      if (totalW !== 100) {
        setRoleError("Writers deben sumar 100% para One-Stop.");
        return;
      }
      if (totalP !== 100) {
        setRoleError("Publishers deben sumar 100% para One-Stop.");
        return;
      }
    }
    setShareRoleErrors((prev) => ({ ...prev, [roleForAdd]: undefined }));
    setShareError(null);
    setSavingShare(true);
    const setter = roleForAdd === "WRITER" ? setNewWriter : setNewPublisher;
    const savingSetter = roleForAdd === "WRITER" ? setSavingWriter : setSavingPublisher;
    savingSetter(true);
    updatePublishingShares({
      trackId,
      oneStop: oneStopChecked,
      shares: ordered.map((s) => ({
        ...s,
        sharePct:
          s.sharePct === null || Number.isNaN(Number(s.sharePct))
            ? null
            : Number(s.sharePct),
      })),
    })
      .then((res) => {
        if (!res.ok) {
          setShareError(res.message ?? "Error al guardar share.");
        } else {
          setShareError(null);
          setShares(ordered);
          setter((prev) => ({ ...prev, name: "", ipiNumber: "", pro: "", caeNumber: "" }));
        }
      })
      .finally(() => savingSetter(false));
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
    setMasterShares(ordered);
    // Validación ligera local (opcional)
  };

  const validateMasterTotal = (list: MasterShare[]) => {
    const total = list
      .filter((s) => typeof s.sharePct === "number")
      .reduce((acc, s) => acc + (s.sharePct ?? 0), 0);
    if (total > 100) {
      setMasterError("AJUSTAR PORCENTAJES (%). MASTER NO PUEDE SUPERAR EL 100%");
      return false;
    }
    setMasterError(null);
    return true;
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
    const ordered = applyMasterOrders(next);
    setMasterShares(ordered);
    validateMasterTotal(ordered);
  };

  const handleDeleteMaster = (idx: number) => {
    setDeleteTarget({ type: "master", index: idx });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "share") {
        const next = shares.filter((_, i) => i !== deleteTarget.index);
        const ordered = applyRoleSortOrders(next);
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
          setShareError(result.message ?? "Error al eliminar share.");
        } else {
          setShareError(null);
          setShares(ordered);
        }
      } else {
        const next = masterShares.filter((_, i) => i !== deleteTarget.index);
        const ordered = applyMasterOrders(next);
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
            sortOrder: s.sortOrder ?? null,
          })),
        });
        if (!result.ok) {
          setMasterError(result.message ?? "Error al eliminar titular de master.");
        } else {
          setMasterError(null);
          setMasterShares(ordered);
        }
      }
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleAddMaster = () => {
    if (!newMaster.name.trim()) {
      setMasterError("Ingresa un nombre para el titular del master.");
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
    const ordered = applyMasterOrders(next);
    if (!validateMasterTotal(ordered)) return;
    setSavingMaster(true);
    updateMasterShares({
      trackId,
      shares: ordered.map((s) => ({
        name: s.name,
        sharePct:
          s.sharePct === null || Number.isNaN(Number(s.sharePct))
            ? null
            : Number(s.sharePct),
        contact: s.contact ?? null,
        notes: s.notes ?? null,
        sortOrder: s.sortOrder ?? null,
      })),
    })
      .then((res) => {
        if (!res.ok) {
          setMasterError(res.message ?? "Error al guardar titular de master.");
        } else {
          setMasterError(null);
          setMasterShares(ordered);
          setNewMaster((prev) => ({ ...prev, name: "", contact: "", notes: "" }));
        }
      })
      .finally(() => setSavingMaster(false));
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
            </div>
            <p id={dndDescIdShares} className="sr-only">
              Usa arrastrar y soltar para reordenar writers o publishers.
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleShareDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
              accessibility={{ describedById: dndDescIdShares }}
            >
              <div className="space-y-6">
                {(["WRITER", "PUBLISHER"] as const).map((role) => {
                  const roleShares = shares
                    .filter((s) => s.role === role)
                    .map((s) => s)
                    .sort(sortByOrder);
                  const total = sumByRole(role);
                  const over = total > 100;
                  const missing = total < 100;
                  const roleMsg = shareRoleErrors[role];
                  const ids = roleShares.map((share, idx) =>
                    shareDomId(share, shares.findIndex((s) => s === share)),
                  );
                  const isWriter = role === "WRITER";
                  return (
                    <div key={role} className="space-y-2">
                      <div className="overflow-x-auto rounded-md border border-border">
                        <div className="flex items-center justify-between px-2 py-2 text-[11px] uppercase tracking-[0.08em] text-muted-foreground bg-card/70">
                          <span className="flex items-center gap-2">
                            <span>
                              {role} · Total: {total}%
                            </span>
                            {roleMsg ? (
                              <>
                                <span>·</span>
                                <span className="text-destructive">{roleMsg}</span>
                              </>
                            ) : missing ? (
                              <span className="text-amber-400">incompleto</span>
                            ) : (
                              <span className="text-emerald-400">OK</span>
                            )}
                          </span>
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
                                <th className="px-2 py-2 text-center">Acciones</th>
                              </tr>
                            </thead>
                            <tbody>
                              {roleShares.length === 0 ? (
                                <tr>
                                  <td colSpan={7} className="px-2 py-3 text-center text-muted-foreground">
                                    Sin {isWriter ? "writers" : "publishers"}.
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
                                          className="h-8 text-xs text-right"
                                        />
                                      </td>
                                      <td className="px-2 py-2">
                                        <Input
                                          value={share.ipiNumber ?? ""}
                                          onChange={(e) => handleShareChange(globalIdx, "ipiNumber", e.target.value)}
                                          className="h-8 text-xs"
                                        />
                                      </td>
                                      <td className="px-2 py-2">
                                        <Input
                                          value={share.pro ?? ""}
                                          onChange={(e) => handleShareChange(globalIdx, "pro", e.target.value)}
                                          className="h-8 text-xs"
                                        />
                                      </td>
                                      <td className="px-2 py-2">
                                        <Input
                                          value={share.caeNumber ?? ""}
                                          onChange={(e) => handleShareChange(globalIdx, "caeNumber", e.target.value)}
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

                      {/* Form de alta separado por rol */}
                      <div className="rounded-md border border-border/70 bg-card/60 p-3">
                        <div className="flex flex-wrap items-end gap-2">
                          <div className="flex min-w-[200px] flex-1 flex-col gap-1">
                            <Label className="text-[11px] text-muted-foreground">
                              Añadir {isWriter ? "Writer/Composer" : "Publisher"}
                            </Label>
                            <Input
                              value={isWriter ? newWriter.name : newPublisher.name}
                              onChange={(e) =>
                                isWriter
                                  ? setNewWriter((prev) => ({ ...prev, name: e.target.value }))
                                  : setNewPublisher((prev) => ({ ...prev, name: e.target.value }))
                              }
                              className="h-8 text-xs"
                              placeholder={isWriter ? "Writer / Composer" : "Publisher"}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handleAddShare(role);
                                }
                              }}
                            />
                          </div>
                          <div className="flex w-24 flex-col gap-1">
                            <Label className="text-[11px] text-muted-foreground">% </Label>
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              value={isWriter ? newWriter.sharePct ?? "" : newPublisher.sharePct ?? ""}
                              onChange={(e) =>
                                isWriter
                                  ? setNewWriter((prev) => ({
                                      ...prev,
                                      sharePct: e.target.value === "" ? null : Number(e.target.value),
                                    }))
                                  : setNewPublisher((prev) => ({
                                      ...prev,
                                      sharePct: e.target.value === "" ? null : Number(e.target.value),
                                    }))
                              }
                              className="h-8 text-xs text-right"
                            />
                          </div>
                          <div className="flex min-w-[180px] flex-col gap-1">
                            <Label className="text-[11px] text-muted-foreground">IPI</Label>
                            <Input
                              value={isWriter ? newWriter.ipiNumber ?? "" : newPublisher.ipiNumber ?? ""}
                              onChange={(e) =>
                                isWriter
                                  ? setNewWriter((prev) => ({ ...prev, ipiNumber: e.target.value }))
                                  : setNewPublisher((prev) => ({ ...prev, ipiNumber: e.target.value }))
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="flex min-w-[140px] flex-col gap-1">
                            <Label className="text-[11px] text-muted-foreground">PRO</Label>
                            <Input
                              value={isWriter ? newWriter.pro ?? "" : newPublisher.pro ?? ""}
                              onChange={(e) =>
                                isWriter
                                  ? setNewWriter((prev) => ({ ...prev, pro: e.target.value }))
                                  : setNewPublisher((prev) => ({ ...prev, pro: e.target.value }))
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="flex min-w-[140px] flex-col gap-1">
                            <Label className="text-[11px] text-muted-foreground">CAE</Label>
                            <Input
                              value={isWriter ? newWriter.caeNumber ?? "" : newPublisher.caeNumber ?? ""}
                              onChange={(e) =>
                                isWriter
                                  ? setNewWriter((prev) => ({ ...prev, caeNumber: e.target.value }))
                                  : setNewPublisher((prev) => ({ ...prev, caeNumber: e.target.value }))
                              }
                              className="h-8 text-xs"
                            />
                          </div>
                          <div className="flex items-center justify-end">
                            <button
                              type="button"
                              onClick={() => handleAddShare(role)}
                              disabled={pendingShares || (isWriter ? savingWriter : savingPublisher)}
                              className="inline-flex h-8 items-center justify-center rounded border border-border bg-card px-3 text-xs font-semibold text-foreground hover:border-foreground/70"
                            >
                              {isWriter
                                ? savingWriter
                                  ? "Guardando…"
                                  : "Añadir Writer"
                                : savingPublisher
                                  ? "Guardando…"
                                  : "Añadir Publisher"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </DndContext>
          </div>
        </div>

        <div className="space-y-3 rounded-lg border border-border bg-card/80 p-3">
          <h3 className="text-sm font-semibold text-foreground">
            Titulares de master (múltiples)
          </h3>
          <p className="mb-2 text-[11px] text-muted-foreground">
            Lista de titulares del master y porcentajes. Si no se indica %, se considera parcial/pendiente.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-2">
              <span>MASTER · TOTAL: {sumMaster()}%</span>
              {masterError ? (
                <>
                  <span>·</span>
                  <span className="text-destructive">{masterError}</span>
                </>
              ) : sumMaster() < 100 ? (
                <span className="text-amber-400">INCOMPLETO</span>
              ) : (
                <span className="text-emerald-400">OK</span>
              )}
            </span>
          </div>
          <p id={dndDescIdMaster} className="sr-only">
            Arrastra los titulares de master para ajustar el orden.
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleMasterDragEnd}
            modifiers={[restrictToVerticalAxis, restrictToParentElement]}
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
                                <th className="px-2 py-2 text-center">Acciones</th>
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

      {/* Confirmación de borrado */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !deleteLoading && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>
              Esta acción eliminará {deleteTarget?.type === "share" ? "el share" : "el titular de master"} de la lista.
              En cuanto confirmes, se guardará de inmediato.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-row justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={confirmDelete} disabled={deleteLoading}>
              {deleteLoading ? "Eliminando..." : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
