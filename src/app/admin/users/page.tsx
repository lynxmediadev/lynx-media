import type { Prisma, UserRole, UserStatus } from "@prisma/client";
import { requireRole } from "@/lib/account-auth/guards";
import { prisma } from "@/lib/prisma";

type UsersAdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function parseRole(value: string): UserRole | undefined {
  if (value === "ADMIN" || value === "STAFF" || value === "CREATOR") return value;
  return undefined;
}

function parseStatus(value: string): UserStatus | undefined {
  if (value === "ACTIVE" || value === "INVITED" || value === "SUSPENDED") return value;
  return undefined;
}

function formatDate(value: Date | null | undefined) {
  if (!value) return "-";
  return value.toLocaleString("es-CL");
}

function buildReturnTo(q: string, role: string, status: string) {
  const url = new URL("http://localhost/admin/users");
  if (q) url.searchParams.set("q", q);
  if (role) url.searchParams.set("role", role);
  if (status) url.searchParams.set("status", status);
  return `${url.pathname}${url.search}`;
}

export default async function UsersAdminPage({ searchParams }: UsersAdminPageProps) {
  const currentUser = await requireRole(["ADMIN"], { redirectTo: "/admin/tracks" });
  if (!currentUser) return null;

  const params = (await searchParams) ?? {};
  const q = firstValue(params.q).trim();
  const roleParam = firstValue(params.role).trim().toUpperCase();
  const statusParam = firstValue(params.status).trim().toUpperCase();
  const ok = firstValue(params.ok).trim();
  const err = firstValue(params.err).trim();
  const inviteEmail = firstValue(params.email).trim();
  const inviteLink = firstValue(params.link).trim();

  const role = parseRole(roleParam);
  const status = parseStatus(statusParam);
  const returnTo = buildReturnTo(q, roleParam, statusParam);

  const where: Prisma.UserWhereInput = {};
  if (role) where.role = role;
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { email: { contains: q, mode: "insensitive" } },
      { name: { contains: q, mode: "insensitive" } },
    ];
  }

  const [users, pendingInvites] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: [{ role: "asc" }, { createdAt: "desc" }],
      take: 200,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    }),
    prisma.inviteToken.findMany({
      where: { usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        createdAt: true,
        expiresAt: true,
        user: {
          select: {
            id: true,
            role: true,
            status: true,
          },
        },
      },
    }),
  ]);

  const showInviteInfo = ok === "invite_created";
  const showInviteRevoked = ok === "invite_revoked";
  const showUserUpdated = ok === "user_updated";

  return (
    <section className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Gestión de usuarios</h1>
        <p className="text-sm text-muted-foreground">
          Administra cuentas, roles, estado y flujo de invitaciones.
        </p>
      </header>

      {showInviteInfo ? (
        <div className="space-y-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          <p>Invitación creada para: {inviteEmail || "-"}</p>
          {inviteLink ? (
            <p className="break-all">
              Link de registro: <a className="underline" href={inviteLink}>{inviteLink}</a>
            </p>
          ) : null}
        </div>
      ) : null}

      {showInviteRevoked ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Invitación revocada correctamente.
        </p>
      ) : null}

      {showUserUpdated ? (
        <p className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
          Usuario actualizado correctamente.
        </p>
      ) : null}

      {err ? (
        <p className="rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          Error: {err}
        </p>
      ) : null}

      <div className="rounded-xl border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Crear invitación
        </h2>
        <form method="POST" action="/admin/users/invite" className="grid gap-3 md:grid-cols-4">
          <input type="hidden" name="returnTo" value={returnTo} />
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Rol</label>
            <select
              name="role"
              defaultValue="CREATOR"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="CREATOR">CREATOR</option>
              <option value="STAFF">STAFF</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Días vigencia</label>
            <input
              type="number"
              name="expiresDays"
              min={1}
              max={30}
              defaultValue={7}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-4">
            <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
              Crear invitación
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-xl border border-border p-4">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Filtros
        </h2>
        <form method="GET" action="/admin/users" className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Buscar</label>
            <input
              type="text"
              name="q"
              defaultValue={q}
              placeholder="email o nombre"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Rol</label>
            <select
              name="role"
              defaultValue={roleParam || ""}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="ADMIN">ADMIN</option>
              <option value="STAFF">STAFF</option>
              <option value="CREATOR">CREATOR</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs uppercase text-muted-foreground">Estado</label>
            <select
              name="status"
              defaultValue={statusParam || ""}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Todos</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INVITED">INVITED</option>
              <option value="SUSPENDED">SUSPENDED</option>
            </select>
          </div>
          <div className="md:col-span-4 flex gap-2">
            <button className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
              Aplicar
            </button>
            <a href="/admin/users" className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent">
              Limpiar
            </a>
          </div>
        </form>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Usuarios ({users.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Perfil</th>
                <th className="px-3 py-2 font-medium">Rol</th>
                <th className="px-3 py-2 font-medium">Estado</th>
                <th className="px-3 py-2 font-medium">Fechas</th>
                <th className="px-3 py-2 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-border align-top">
                  <td className="px-3 py-2">
                    <form method="POST" action={`/admin/users/${user.id}/profile`} className="space-y-2">
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <label className="block text-[10px] uppercase text-muted-foreground">Nombre</label>
                      <input
                        type="text"
                        name="name"
                        defaultValue={user.name ?? ""}
                        className="w-56 rounded-md border border-border bg-background px-2 py-1 text-xs"
                      />
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <button className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">
                        Guardar perfil
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    <form method="POST" action={`/admin/users/${user.id}/role`} className="space-y-2">
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="ADMIN">ADMIN</option>
                        <option value="STAFF">STAFF</option>
                        <option value="CREATOR">CREATOR</option>
                      </select>
                      <button className="block rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">
                        Guardar rol
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2">
                    <form method="POST" action={`/admin/users/${user.id}/status`} className="space-y-2">
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <select
                        name="status"
                        defaultValue={user.status}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="INVITED">INVITED</option>
                        <option value="SUSPENDED">SUSPENDED</option>
                      </select>
                      <button className="block rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">
                        Guardar estado
                      </button>
                    </form>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    <p>Creado: {formatDate(user.createdAt)}</p>
                    <p>Último login: {formatDate(user.lastLoginAt)}</p>
                  </td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    {user.id === currentUser.id ? "Cuenta actual" : "Gestionable"}
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                    No se encontraron usuarios con esos filtros.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Invitaciones activas ({pendingInvites.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Rol destino</th>
                <th className="px-3 py-2 font-medium">Creada / Expira</th>
                <th className="px-3 py-2 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {pendingInvites.map((invite) => (
                <tr key={invite.id} className="border-t border-border">
                  <td className="px-3 py-2">{invite.email}</td>
                  <td className="px-3 py-2">{invite.user.role}</td>
                  <td className="px-3 py-2 text-xs text-muted-foreground">
                    <p>{formatDate(invite.createdAt)}</p>
                    <p>{formatDate(invite.expiresAt)}</p>
                  </td>
                  <td className="px-3 py-2">
                    <form method="POST" action={`/admin/users/invites/${invite.id}/revoke`}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent">
                        Revocar
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {pendingInvites.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">
                    No hay invitaciones activas.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

