import type { UserRole, UserStatus } from "@prisma/client";
import { requireRole } from "@/lib/account-auth/guards";
import { prisma } from "@/lib/prisma";
import { UsersTableClient } from "@/components/admin/users/UsersTableClient";

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
  const currentUser = await requireRole(["ADMIN"], { redirectTo: "/admin/login?err=forbidden" });
  if (!currentUser) return null;

  const params = (await searchParams) ?? {};
  const q = firstValue(params.q).trim();
  const roleParam = firstValue(params.role).trim().toUpperCase();
  const statusParam = firstValue(params.status).trim().toUpperCase();
  const ok = firstValue(params.ok).trim();
  const err = firstValue(params.err).trim();
  const inviteEmail = firstValue(params.email).trim();
  const inviteLink = firstValue(params.link).trim();

  const role = parseRole(roleParam) ?? "";
  const status = parseStatus(statusParam) ?? "";
  const returnTo = buildReturnTo(q, role, status);

  const [users, pendingInvites] = await Promise.all([
    prisma.user.findMany({
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
  const showUserDeleted = ok === "user_deleted";
  const showBulkUpdated = ok === "bulk_updated";
  const successMessages = [
    showInviteInfo ? `Invitación creada para ${inviteEmail || "-"}` : "",
    showInviteRevoked ? "Invitación revocada" : "",
    showUserUpdated ? "Usuario actualizado" : "",
    showUserDeleted ? "Usuario eliminado" : "",
    showBulkUpdated ? "Acción masiva aplicada" : "",
  ].filter(Boolean);

  const errorMessage =
    err === "last_admin_protected"
      ? "No puedes dejar el sistema sin un admin activo."
      : err === "self_delete_blocked" || err === "self_action_blocked"
        ? "No puedes eliminar o modificar tu propia cuenta desde acciones masivas."
        : err === "bulk_empty_selection"
          ? "Selecciona al menos un usuario para acción bulk."
          : err === "bulk_invalid_action"
            ? "Acción bulk inválida."
            : err === "invalid_role"
              ? "Rol inválido."
              : err === "invalid_status"
                ? "Estado inválido."
                : err
                  ? `Error: ${err}`
                  : "";

  return (
    <section className="space-y-2">
      <UsersTableClient
        returnTo={returnTo}
        filters={{
          q,
          roleParam: role,
          statusParam: status,
          activeCount: [q, role, status].filter(Boolean).length,
        }}
        alerts={{
          successMessages,
          inviteLink,
          showInviteInfo,
          errorMessage,
        }}
        users={users.map((user) => ({
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
          createdAtIso: user.createdAt.toISOString(),
          lastLoginAtIso: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
          isCurrent: user.id === currentUser.id,
        }))}
      />

      <details className="group overflow-hidden rounded-lg border border-border bg-background">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3">
          <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Invitaciones activas ({pendingInvites.length})
          </span>
          <span className="text-xs text-muted-foreground group-open:hidden">Mostrar</span>
          <span className="hidden text-xs text-muted-foreground group-open:inline">Ocultar</span>
        </summary>
        <div className="overflow-x-auto border-t border-border">
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
                      <button className="rounded-md border border-border px-2 py-1 text-xs transition-colors hover:bg-muted/45">
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
      </details>
    </section>
  );
}
