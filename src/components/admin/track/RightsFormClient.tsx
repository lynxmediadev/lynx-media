// src/components/admin/track/RightsFormClient.tsx
"use client";

import * as React from "react";
import FormField from "../ui/FormField";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
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
import type { Share, MasterShare } from "./rights/types";
import { usePublishingShares } from "./rights/usePublishingShares";
import { useMasterShares } from "./rights/useMasterShares";
import { PublishingTable } from "./rights/PublishingTable";
import { PublishingCards } from "./rights/PublishingCards";
import { PublishingNewForms } from "./rights/PublishingNewForms";
import { MasterTable } from "./rights/MasterTable";
import { MasterCards } from "./rights/MasterCards";
import { MasterNewForm } from "./rights/MasterNewForm";
import { RightsToggles } from "./rights/RightsToggles";

// Tipado de props
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
    restrictions?: string[] | null;
  };
  fieldErrors?: Record<string, string[]>;
};

function firstError(fieldErrors: Record<string, string[]> | undefined, key: string) {
  if (!fieldErrors) return null;
  const arr = fieldErrors[key];
  return arr && arr.length > 0 ? arr[0] : null;
}

export default function RightsFormClient({ trackId, track, fieldErrors }: RightsTrackFormProps) {
  const serverErrors = fieldErrors ?? {};

  // Toggles
  const [mfnChecked, setMfnChecked] = React.useState(track.mfn);
  const [oneStopChecked, setOneStopChecked] = React.useState(track.oneStop);
  const [clearedChecked, setClearedChecked] = React.useState(track.clearedForSync);
  const [contentIdChecked, setContentIdChecked] = React.useState(track.contentIdEnrolled);

  // Long press (compartido)
  const longPressTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const [longPress, setLongPress] = React.useState<
    | { type: "share" | "master"; index: number; direction: "up" | "down" }
    | null
  >(null);
  const handleLongPress = (
    type: "share" | "master",
    index: number,
    direction: "up" | "down",
    e: React.PointerEvent,
  ) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = setTimeout(() => setLongPress({ type, index, direction }), 450);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    longPressTimer.current = null;
    setLongPress(null);
  };

  // Publishing hook
  const pub = usePublishingShares({ trackId, initialShares: track.publishingShares });

  // Master hook
  const mas = useMasterShares({ trackId, initialMasterShares: track.masterShares });

  // Confirm delete dialog
  const [deleteTarget, setDeleteTarget] = React.useState<
    | { type: "share"; globalIdx: number }
    | { type: "master"; idx: number }
    | null
  >(null);
  const [deleteLoading, setDeleteLoading] = React.useState(false);

  const shareBusy = pub.reorderSharePending || pub.savingWriter || pub.savingPublisher || deleteLoading;
  const masterBusy = mas.reorderMasterPending || mas.savingMaster || deleteLoading;

  // Map roleIdx -> globalIdx
  const roleIndexToGlobal = (role: "WRITER" | "PUBLISHER") => (roleIdx: number) => {
    let count = -1;
    for (let i = 0; i < pub.shares.length; i++) {
      const share = pub.shares[i];
      if (share?.role === role) {
        count += 1;
        if (count === roleIdx) return i;
      }
    }
    return -1;
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      if (deleteTarget.type === "share") {
        await pub.deleteShare(deleteTarget.globalIdx);
      } else {
        await mas.deleteMaster(deleteTarget.idx);
      }
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  // Enter control para evitar submits globales
  const allowEnterAttr = { "data-allow-enter": "true" } as const;

  return (
    <div
      className="space-y-4"
      onKeyDownCapture={(e) => {
        if (e.key !== "Enter") return;
        const target = e.target as HTMLElement;
        if (target instanceof HTMLTextAreaElement) return;
        if (target.getAttribute("data-allow-enter") === "true") return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <div className="flex flex-col gap-2 border-b border-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-foreground">Derechos &amp; explotación</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Control de master, publishing y administración de Content ID.
          </p>
        </div>
      </div>

      {/* Publishing */}
      <div className="space-y-3 rounded-lg border border-border bg-card/80 p-3">
        <h3 className="text-sm font-semibold text-foreground">Master &amp; publishing</h3>
        <p className="mb-2 text-[11px] text-muted-foreground">
          Los titulares de master se administran en la tabla inferior. Puedes ingresar múltiples dueños y porcentajes.
        </p>
        <div className="space-y-6">
          {(["WRITER", "PUBLISHER"] as const).map((role) => {
            const roleShares = pub.shares
              .filter((s) => s.role === role)
              .map((s) => s)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
            const total = pub.sumByRole(role);
            const missing = total < 100;
            const roleMsg = pub.shareRoleErrors[role];
            const toGlobal = roleIndexToGlobal(role);
            return (
              <div key={role} className="space-y-3">
                <PublishingTable
                  role={role}
                  roleShares={roleShares}
                  total={total}
                  roleMsg={roleMsg}
                  missing={missing}
                  shareBusy={shareBusy}
                  pendingShares={false}
                  longPress={longPress}
                  onLongPressStart={(type, idx, dir, e) =>
                    handleLongPress(type, toGlobal(idx), dir, e)
                  }
                  onLongPressCancel={cancelLongPress}
                  moveShare={(idx, delta) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.moveShare(g, delta);
                  }}
                  moveShareTo={(idx, target) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.moveShareTo(g, target);
                  }}
                  moveShareTop={(idx) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.moveShareTop(g);
                  }}
                  moveShareBottom={(idx) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.moveShareBottom(g);
                  }}
                  onChange={(idx, field, value) => {
                    const g = toGlobal(idx);
                    if (g >= 0) pub.handleShareChange(g, field, value);
                  }}
                  onDelete={(idx) => {
                    const g = toGlobal(idx);
                    if (g >= 0) setDeleteTarget({ type: "share", globalIdx: g });
                  }}
                />

                <div className="md:hidden">
                  <PublishingCards
                    role={role}
                    roleShares={roleShares}
                    shareBusy={shareBusy}
                    pendingShares={false}
                    longPress={longPress}
                    onLongPressStart={(type, idx, dir, e) =>
                      handleLongPress(type, toGlobal(idx), dir, e)
                    }
                    onLongPressCancel={cancelLongPress}
                    moveShare={(idx, delta) => {
                      const g = toGlobal(idx);
                      if (g >= 0) pub.moveShare(g, delta);
                    }}
                    moveShareTo={(idx, target) => {
                      const g = toGlobal(idx);
                      if (g >= 0) pub.moveShareTo(g, target);
                    }}
                    onChange={(idx, field, value) => {
                      const g = toGlobal(idx);
                      if (g >= 0) pub.handleShareChange(g, field, value);
                    }}
                    onDelete={(idx) => {
                      const g = toGlobal(idx);
                      if (g >= 0) setDeleteTarget({ type: "share", globalIdx: g });
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        <PublishingNewForms
          newWriter={pub.newWriter}
          newPublisher={pub.newPublisher}
          setNewWriter={pub.setNewWriter}
          setNewPublisher={pub.setNewPublisher}
          savingWriter={pub.savingWriter}
          savingPublisher={pub.savingPublisher}
          addShare={pub.addShare}
        />
      </div>

      {/* Master */}
      <MasterTable
        masterShares={mas.masterShares}
        masterError={mas.masterError}
        sumMaster={mas.sumMaster}
        masterBusy={masterBusy}
        pendingMaster={false}
        longPress={longPress}
        onLongPressStart={(type, idx, dir, e) => handleLongPress(type, idx, dir, e)}
        onLongPressCancel={cancelLongPress}
        moveMaster={mas.moveMaster}
        moveMasterTo={mas.moveMasterTo}
        moveMasterTop={mas.moveMasterTop}
        moveMasterBottom={mas.moveMasterBottom}
        onChange={mas.handleMasterChange}
        onDelete={(idx) => setDeleteTarget({ type: "master", idx })}
      />
      <div className="md:hidden">
        <MasterCards
          masterShares={mas.masterShares}
          masterBusy={masterBusy}
          pendingMaster={false}
          longPress={longPress}
          onLongPressStart={(type, idx, dir, e) => handleLongPress(type, idx, dir, e)}
          onLongPressCancel={cancelLongPress}
          moveMaster={mas.moveMaster}
          moveMasterTo={mas.moveMasterTo}
          onChange={mas.handleMasterChange}
          onDelete={(idx) => setDeleteTarget({ type: "master", idx })}
        />
      </div>
      <MasterNewForm
        newMaster={mas.newMaster}
        setNewMaster={mas.setNewMaster}
        savingMaster={mas.savingMaster}
        addMaster={mas.addMaster}
      />

      {/* Toggles y metadatos */}
      <RightsToggles
        mfnChecked={mfnChecked}
        setMfnChecked={setMfnChecked}
        oneStopChecked={oneStopChecked}
        setOneStopChecked={setOneStopChecked}
        clearedChecked={clearedChecked}
        setClearedChecked={setClearedChecked}
        contentIdChecked={contentIdChecked}
        setContentIdChecked={setContentIdChecked}
        track={track}
        serverErrors={serverErrors}
      />

      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar eliminación</DialogTitle>
            <DialogDescription>Esta acción eliminará el registro seleccionado.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              disabled={deleteLoading}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? "Eliminando…" : "Eliminar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
