"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, RefreshCcw, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { AdminListButton, AdminStatusBadge } from "@/components/admin/list-kit";

type TrackOption = {
  id: string;
  title: string;
  artist: string;
};

type AssignedTrack = TrackOption & {
  sortOrder: number;
};

export function PlaylistTrackManager({
  playlistId,
  canEdit,
  assignedTracks,
  availableTracks,
  isAutoAllTracks,
}: {
  playlistId: string;
  canEdit: boolean;
  assignedTracks: AssignedTrack[];
  availableTracks: TrackOption[];
  isAutoAllTracks: boolean;
}) {
  const router = useRouter();
  const [trackId, setTrackId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const assignedSet = useMemo(
    () => new Set(assignedTracks.map((item) => item.id)),
    [assignedTracks],
  );
  const orderedAssignedTracks = useMemo(
    () => [...assignedTracks].sort((a, b) => a.sortOrder - b.sortOrder),
    [assignedTracks],
  );
  const candidateTracks = useMemo(
    () => availableTracks.filter((item) => !assignedSet.has(item.id)),
    [availableTracks, assignedSet],
  );

  async function addTrack() {
    if (!trackId || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/playlists/${playlistId}/tracks`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trackId }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "No se pudo agregar track.");
      setTrackId("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  async function removeTrack(selectedTrackId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/playlists/${playlistId}/tracks`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ trackId: selectedTrackId }),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "No se pudo quitar track.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  async function moveTrack(trackIdToMove: string, direction: "up" | "down") {
    if (busy) return;
    const currentIndex = orderedAssignedTracks.findIndex((track) => track.id === trackIdToMove);
    if (currentIndex < 0) return;
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= orderedAssignedTracks.length) return;

    const currentTrack = orderedAssignedTracks[currentIndex];
    const targetTrack = orderedAssignedTracks[targetIndex];
    if (!currentTrack || !targetTrack) return;
    setBusy(true);
    setError(null);
    try {
      const swapRequests: [Promise<Response>, Promise<Response>] = [
        fetch(`/api/admin/playlists/${playlistId}/tracks`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ trackId: currentTrack.id, sortOrder: targetTrack.sortOrder }),
        }),
        fetch(`/api/admin/playlists/${playlistId}/tracks`, {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ trackId: targetTrack.id, sortOrder: currentTrack.sortOrder }),
        }),
      ];

      const [firstRes, secondRes] = await Promise.all(swapRequests);
      if (!firstRes.ok || !secondRes.ok) {
        const firstPayload = (await firstRes.json().catch(() => null)) as { error?: string } | null;
        const secondPayload = (await secondRes.json().catch(() => null)) as { error?: string } | null;
        throw new Error(firstPayload?.error || secondPayload?.error || "No se pudo reordenar.");
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-background/50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Tracks de la playlist</h2>
        <AdminStatusBadge>{assignedTracks.length} asignados</AdminStatusBadge>
      </div>

      {isAutoAllTracks ? (
        <p className="text-xs text-muted-foreground">
          Playlist automática `All Tracks`: incluye dinámicamente todos los tracks
          del owner. No requiere asignación manual.
        </p>
      ) : (
        <>
          {canEdit ? (
            <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto]">
              <select
                value={trackId}
                onChange={(event) => setTrackId(event.target.value)}
                className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                <option value="">Seleccionar track para agregar</option>
                {candidateTracks.map((track) => (
                  <option key={track.id} value={track.id}>
                    {track.title} — {track.artist}
                  </option>
                ))}
              </select>
              <AdminListButton
                type="button"
                onClick={() => {
                  void addTrack();
                }}
                disabled={!trackId || busy}
                size="row"
              >
                Agregar
              </AdminListButton>
            </div>
          ) : null}

          <div className="space-y-1">
            {orderedAssignedTracks.map((track, index) => (
              <div
                key={track.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{track.title}</p>
                  <p className="text-muted-foreground truncate text-xs">
                    {track.artist} · #{track.sortOrder}
                  </p>
                </div>
                {canEdit ? (
                  <div className="flex items-center gap-1.5">
                    <AdminListButton
                      type="button"
                      size="rowIcon"
                      title="Mover arriba"
                      disabled={busy || index === 0}
                      onClick={() => {
                        void moveTrack(track.id, "up");
                      }}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </AdminListButton>
                    <AdminListButton
                      type="button"
                      size="rowIcon"
                      title="Mover abajo"
                      disabled={busy || index === orderedAssignedTracks.length - 1}
                      onClick={() => {
                        void moveTrack(track.id, "down");
                      }}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </AdminListButton>
                    <AdminListButton
                      type="button"
                      tone="danger"
                      size="rowIcon"
                      title="Quitar"
                      onClick={() => {
                        void removeTrack(track.id);
                      }}
                      disabled={busy}
                    >
                      <Trash2 className="h-4 w-4" />
                    </AdminListButton>
                  </div>
                ) : null}
              </div>
            ))}
            {assignedTracks.length === 0 ? (
              <p className="text-muted-foreground rounded-md border border-border px-3 py-6 text-center text-xs">
                No hay tracks asociados.
              </p>
            ) : null}
          </div>
        </>
      )}

      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {busy ? (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
          Guardando cambios...
        </p>
      ) : null}
    </section>
  );
}
