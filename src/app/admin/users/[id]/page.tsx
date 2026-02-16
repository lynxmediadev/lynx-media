import type { UserRole, UserStatus } from "@prisma/client";
import { Ban, Clock3, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { AdminIconBadge, AdminRoleBadge } from "@/components/admin/list-kit";
import { requireRole } from "@/lib/account-auth/guards";
import { prisma } from "@/lib/prisma";

type UserDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return value.toLocaleString("es-CL");
}

function toRoleLabel(role: UserRole) {
  if (role === "ADMIN") return "Admin";
  if (role === "STAFF") return "Staff";
  if (role === "CLIENT") return "Client";
  return "Creator";
}

function toStatusLabel(status: UserStatus) {
  if (status === "ACTIVE") return "Activo";
  if (status === "INVITED") return "Invitado";
  return "Suspendido";
}

function statusTone(status: UserStatus): "success" | "warning" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "INVITED") return "warning";
  return "danger";
}

function errorMessage(err: string) {
  if (err === "invalid_role") return "Rol inválido.";
  if (err === "invalid_status") return "Estado inválido.";
  if (err === "last_admin_protected") return "No puedes dejar el sistema sin un admin activo.";
  if (err === "self_delete_blocked") return "No puedes eliminar tu propia cuenta.";
  if (err === "user_not_found") return "Usuario no encontrado.";
  return err ? `Error: ${err}` : "";
}

export default async function UserDetailPage({ params, searchParams }: UserDetailPageProps) {
  const currentUser = await requireRole(["ADMIN"], { redirectTo: "/admin/login?err=forbidden" });
  if (!currentUser) return null;

  const { id } = await params;
  const query = (await searchParams) ?? {};
  const ok = firstValue(query.ok).trim();
  const err = firstValue(query.err).trim();

  const [user, recentTracks, recentRequests] = await Promise.all([
    prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        emailVerifiedAt: true,
        _count: {
          select: {
            ownedTracks: true,
            ownedLicensing: true,
            sessions: true,
            inviteTokens: true,
          },
        },
      },
    }),
    prisma.track.findMany({
      where: { ownerUserId: id },
      select: {
        id: true,
        title: true,
        artist: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.licensingRequest.findMany({
      where: { ownerUserId: id },
      select: {
        id: true,
        projectType: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ]);

  if (!user) notFound();

  const returnTo = `/admin/users/${user.id}`;
  const errMsg = errorMessage(err);

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Usuario</h1>
        <p className="text-sm text-muted-foreground">
          Vista detallada de cuenta, ownership y acciones de administración.
        </p>
        <div className="pt-1">
          <span className="text-xs text-muted-foreground">
            ID: <span className="font-mono">{user.id}</span>
          </span>
        </div>
      </header>

      {ok === "user_updated" ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Usuario actualizado correctamente.
        </p>
      ) : null}
      {ok === "user_deleted" ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Usuario eliminado.
        </p>
      ) : null}
      {errMsg ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errMsg}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs uppercase text-muted-foreground">Rol</p>
          <div className="mt-2">
            <AdminRoleBadge role={user.role} label={toRoleLabel(user.role)} className="px-3 py-1 text-sm [&_svg]:h-4 [&_svg]:w-4" />
          </div>
        </article>
        <article className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs uppercase text-muted-foreground">Estado</p>
          <div className="mt-2">
            <AdminIconBadge
              tone={statusTone(user.status)}
              icon={
                user.status === "ACTIVE" ? (
                  <ShieldCheck aria-hidden="true" />
                ) : user.status === "INVITED" ? (
                  <Clock3 aria-hidden="true" />
                ) : (
                  <Ban aria-hidden="true" />
                )
              }
              label={toStatusLabel(user.status)}
              className="px-3 py-1 text-sm [&_svg]:h-4 [&_svg]:w-4"
            />
          </div>
        </article>
        <article className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs uppercase text-muted-foreground">Tracks propios</p>
          <p className="mt-1 text-lg font-semibold">{user._count.ownedTracks}</p>
        </article>
        <article className="rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-xs uppercase text-muted-foreground">Requests propias</p>
          <p className="mt-1 text-lg font-semibold">{user._count.ownedLicensing}</p>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-border p-4 xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Perfil y seguridad
          </h2>
          <dl className="grid gap-2 text-sm md:grid-cols-2">
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Email</dt>
              <dd>{user.email}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Nombre</dt>
              <dd>{user.name || "-"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Creado</dt>
              <dd>{formatDate(user.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Último login</dt>
              <dd>{formatDate(user.lastLoginAt)}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Email verificado</dt>
              <dd>{user.emailVerifiedAt ? formatDate(user.emailVerifiedAt) : "Pendiente"}</dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-muted-foreground">Sesiones activas</dt>
              <dd>{user._count.sessions}</dd>
            </div>
          </dl>
        </article>

        <article className="rounded-xl border border-border p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Acciones
          </h2>
          <div className="space-y-3">
            <form method="POST" action={`/admin/users/${user.id}/profile`} className="space-y-2">
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="block text-xs uppercase text-muted-foreground">Nombre</label>
              <input
                type="text"
                name="name"
                defaultValue={user.name ?? ""}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button className="w-full rounded-md border border-border px-3 py-2 text-xs transition-colors hover:bg-muted/45">
                Guardar perfil
              </button>
            </form>

            <form method="POST" action={`/admin/users/${user.id}/role`} className="space-y-2">
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="block text-xs uppercase text-muted-foreground">Rol</label>
              <select
                name="role"
                defaultValue={user.role}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="STAFF">STAFF</option>
                <option value="CREATOR">CREATOR</option>
                <option value="CLIENT">CLIENT</option>
              </select>
              <button className="w-full rounded-md border border-border px-3 py-2 text-xs transition-colors hover:bg-muted/45">
                Guardar rol
              </button>
            </form>

            <form method="POST" action={`/admin/users/${user.id}/status`} className="space-y-2">
              <input type="hidden" name="returnTo" value={returnTo} />
              <label className="block text-xs uppercase text-muted-foreground">Estado</label>
              <select
                name="status"
                defaultValue={user.status}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INVITED">INVITED</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
              <button className="w-full rounded-md border border-border px-3 py-2 text-xs transition-colors hover:bg-muted/45">
                Guardar estado
              </button>
            </form>

            {user.id !== currentUser.id ? (
              <form method="POST" action={`/admin/users/${user.id}/delete`}>
                <input type="hidden" name="returnTo" value="/admin/users" />
                <button className="w-full rounded-md border border-destructive/60 bg-destructive/10 px-3 py-2 text-xs text-destructive hover:bg-destructive/20">
                  Eliminar usuario
                </button>
              </form>
            ) : null}
          </div>
        </article>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <article className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Tracks recientes
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {recentTracks.map((track) => (
              <li key={track.id} className="px-4 py-3">
                <a href={`/admin/tracks/${track.id}/edit`} className="text-sm font-medium hover:underline">
                  {track.title} — {track.artist}
                </a>
                <p className="text-xs text-muted-foreground">Actualizado: {formatDate(track.updatedAt)}</p>
              </li>
            ))}
            {recentTracks.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">Sin tracks asociados.</li>
            ) : null}
          </ul>
        </article>

        <article className="overflow-hidden rounded-xl border border-border">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Requests recientes
            </h2>
          </div>
          <ul className="divide-y divide-border">
            {recentRequests.map((request) => (
              <li key={request.id} className="px-4 py-3">
                <p className="text-sm font-medium">{request.projectType}</p>
                <p className="text-xs text-muted-foreground">
                  {request.status} · {formatDate(request.createdAt)}
                </p>
              </li>
            ))}
            {recentRequests.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">Sin requests asociadas.</li>
            ) : null}
          </ul>
        </article>
      </div>
    </section>
  );
}
