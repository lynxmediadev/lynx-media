"use client";

import { useEffect, useState } from "react";
import { RefreshCcw, Trash2 } from "lucide-react";
import { AdminListButton, AdminStatusBadge } from "@/components/admin/list-kit";

type ShareItem = {
  userId: string;
  canEdit: boolean;
  createdAt: string;
  user: {
    email: string;
    role: string;
    name: string | null;
  };
};

export function PlaylistShareManager({
  playlistId,
  canManage,
}: {
  playlistId: string;
  canManage: boolean;
}) {
  const [items, setItems] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [canEdit, setCanEdit] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadShares() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/playlists/${playlistId}/share`, {
        method: "GET",
      });
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; items?: ShareItem[]; error?: string }
        | null;
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "No se pudo cargar compartidos.");
      }
      setItems(payload.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadShares();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistId]);

  async function addShare() {
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/playlists/${playlistId}/share`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), canEdit }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "No se pudo compartir playlist.");
      }
      setEmail("");
      setCanEdit(false);
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  async function removeShare(userId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/playlists/${playlistId}/share`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok || !payload?.ok) {
        throw new Error(payload?.error || "No se pudo quitar acceso.");
      }
      await loadShares();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-lg border border-border bg-background/50 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Compartir playlist</h2>
        <AdminStatusBadge>{items.length} usuarios</AdminStatusBadge>
      </div>

      {canManage ? (
        <div className="mb-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@dominio.com"
            className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm"
          />
          <label className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-background px-3 text-xs">
            <input
              type="checkbox"
              checked={canEdit}
              onChange={(event) => setCanEdit(event.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Puede editar
          </label>
          <AdminListButton
            type="button"
            onClick={() => {
              void addShare();
            }}
            disabled={busy || !email.trim()}
            size="row"
          >
            Compartir
          </AdminListButton>
        </div>
      ) : null}

      <div className="space-y-1">
        {items.map((item) => (
          <div
            key={item.userId}
            className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">
                {item.user.name || "(sin nombre)"} · {item.user.email}
              </p>
              <p className="text-muted-foreground text-xs">
                {item.user.role} · {item.canEdit ? "Editor" : "Solo lectura"}
              </p>
            </div>
            {canManage ? (
              <AdminListButton
                type="button"
                tone="danger"
                size="rowIcon"
                title="Quitar acceso"
                onClick={() => {
                  void removeShare(item.userId);
                }}
                disabled={busy}
              >
                <Trash2 className="h-4 w-4" />
              </AdminListButton>
            ) : null}
          </div>
        ))}
        {items.length === 0 ? (
          <p className="text-muted-foreground rounded-md border border-border px-3 py-6 text-center text-xs">
            No hay usuarios compartidos.
          </p>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">
          <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
          Cargando...
        </p>
      ) : null}
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
    </section>
  );
}
