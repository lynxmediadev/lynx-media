"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Ban,
  Check,
  Clock3,
  Eye,
  Filter,
  RefreshCcw,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Users as UsersIcon,
  Wrench,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UsersInviteDialog } from "@/components/admin/users/UsersInviteDialog";
import { LabeledSelect } from "@/components/admin/ui/LabeledSelect";
import {
  allSelected as computeAllSelected,
  AdminBulkPanel,
  AdminControlsRow,
  AdminDataTable,
  AdminFilterPanel,
  AdminIconBadge,
  AdminListEmptyState,
  AdminListHeader,
  AdminListShell,
  AdminRoleBadge,
  AdminStatusBadge,
  countActiveFilters,
  selectAllOrNone,
  toggleSelection,
  type AdminColumnDef,
} from "@/components/admin/list-kit";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "STAFF" | "CREATOR";
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
  createdAtIso: string;
  lastLoginAtIso: string | null;
  isCurrent: boolean;
};

type BulkActionType = "set_role" | "set_status" | "delete";

type UsersTableClientProps = {
  users: UserRow[];
  returnTo: string;
  filters: {
    q: string;
    roleParam: string;
    statusParam: string;
    activeCount: number;
  };
  alerts: {
    successMessages: string[];
    inviteLink: string;
    showInviteInfo: boolean;
    errorMessage: string;
  };
};

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-CL");
}

function roleIconClass(role: UserRow["role"]) {
  if (role === "ADMIN") return "text-emerald-300";
  if (role === "STAFF") return "text-sky-300";
  return "text-zinc-300";
}

function RoleIcon({ role, size = "h-4 w-4" }: { role: UserRow["role"]; size?: string }) {
  if (role === "ADMIN") {
    return <ShieldCheck className={`${size} ${roleIconClass(role)}`} aria-hidden="true" />;
  }
  if (role === "STAFF") {
    return <Wrench className={`${size} ${roleIconClass(role)}`} aria-hidden="true" />;
  }
  return <UserRound className={`${size} ${roleIconClass(role)}`} aria-hidden="true" />;
}

function roleLabel(role: UserRow["role"]) {
  if (role === "ADMIN") return "Admin";
  if (role === "STAFF") return "Staff";
  return "Creator";
}

function userStatusTone(status: UserRow["status"]): "success" | "warning" | "danger" {
  if (status === "ACTIVE") return "success";
  if (status === "INVITED") return "warning";
  return "danger";
}

export function UsersTableClient({ users, returnTo, filters, alerts }: UsersTableClientProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionType, setActionType] = useState<BulkActionType>("set_status");
  const [role, setRole] = useState<UserRow["role"]>("CREATOR");
  const [status, setStatus] = useState<UserRow["status"]>("ACTIVE");
  const [localQuery, setLocalQuery] = useState(filters.q);
  const [localRoleFilter, setLocalRoleFilter] = useState(filters.roleParam);
  const [localStatusFilter, setLocalStatusFilter] = useState(filters.statusParam);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const [inviteCopyState, setInviteCopyState] = useState<"idle" | "copied" | "error">("idle");
  const copyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inviteCopyResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const selectableIds = useMemo(
    () => users.filter((user) => !user.isCurrent).map((user) => user.id),
    [users],
  );
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = computeAllSelected(selectedIds, selectableIds);
  const normalizedQuery = localQuery.trim().toLowerCase();
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        user.email.toLowerCase().includes(normalizedQuery) ||
        (user.name ?? "").toLowerCase().includes(normalizedQuery);
      const matchesRole = localRoleFilter.length === 0 || user.role === localRoleFilter;
      const matchesStatus = localStatusFilter.length === 0 || user.status === localStatusFilter;
      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [users, normalizedQuery, localRoleFilter, localStatusFilter]);
  const localActiveCount = countActiveFilters([normalizedQuery, localRoleFilter, localStatusFilter]);
  const filterStateLabel =
    localActiveCount === 0
      ? "Sin filtros"
      : `${localActiveCount} ${localActiveCount === 1 ? "filtro activo" : "filtros activos"}`;
  const selectionStateLabel =
    selectedIds.length > 0
      ? `${selectedIds.length} ${selectedIds.length === 1 ? "seleccionado" : "seleccionados"}`
      : "Sin selección";
  const bulkAppliedMessage = alerts.successMessages.find((message) =>
    message.startsWith("Acción masiva aplicada"),
  );
  const stackedSuccessMessages = alerts.successMessages.filter(
    (message) => !message.startsWith("Acción masiva aplicada"),
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (localQuery.trim()) params.set("q", localQuery.trim());
      if (localRoleFilter) params.set("role", localRoleFilter);
      if (localStatusFilter) params.set("status", localStatusFilter);
      const query = params.toString();
      const nextPath = query ? `${window.location.pathname}?${query}` : window.location.pathname;
      const currentPath = `${window.location.pathname}${window.location.search}`;
      if (nextPath !== currentPath) {
        window.history.replaceState(null, "", nextPath);
      }
    }, 120);

    return () => window.clearTimeout(timeoutId);
  }, [localQuery, localRoleFilter, localStatusFilter]);

  useEffect(() => {
    return () => {
      if (copyResetRef.current) {
        clearTimeout(copyResetRef.current);
      }
      if (inviteCopyResetRef.current) {
        clearTimeout(inviteCopyResetRef.current);
      }
    };
  }, []);

  async function handleCopyFilter() {
    const params = new URLSearchParams();
    if (localQuery.trim()) params.set("q", localQuery.trim());
    if (localRoleFilter) params.set("role", localRoleFilter);
    if (localStatusFilter) params.set("status", localStatusFilter);
    const query = params.toString();
    const url = `${window.location.origin}${window.location.pathname}${query ? `?${query}` : ""}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
    if (copyResetRef.current) {
      clearTimeout(copyResetRef.current);
    }
    copyResetRef.current = setTimeout(() => setCopyState("idle"), 1600);
  }

  async function handleCopyInviteLink() {
    if (!alerts.inviteLink) return;
    try {
      await navigator.clipboard.writeText(alerts.inviteLink);
      setInviteCopyState("copied");
    } catch {
      setInviteCopyState("error");
    }
    if (inviteCopyResetRef.current) {
      clearTimeout(inviteCopyResetRef.current);
    }
    inviteCopyResetRef.current = setTimeout(() => setInviteCopyState("idle"), 1600);
  }

  function toggleRow(id: string) {
    setSelectedIds((current) => toggleSelection(current, id));
  }

  function toggleAll(checked: boolean) {
    setSelectedIds(selectAllOrNone(selectableIds, checked));
  }

  function handleBulkSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (selectedIds.length === 0) {
      event.preventDefault();
      return;
    }
    if (actionType === "delete") {
      const ok = window.confirm(`¿Eliminar ${selectedIds.length} usuario(s)? Esta acción no se puede deshacer.`);
      if (!ok) event.preventDefault();
    }
  }

  function handleDeleteSubmit(event: React.FormEvent<HTMLFormElement>) {
    const ok = window.confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.");
    if (!ok) event.preventDefault();
  }

  const desktopColumns: AdminColumnDef<UserRow>[] = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allSelected}
          onChange={(event) => toggleAll(event.target.checked)}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label="Seleccionar todos los usuarios"
        />
      ),
      widthClassName: "w-12",
      render: (user) => (
        <input
          type="checkbox"
          checked={selectedSet.has(user.id)}
          disabled={user.isCurrent}
          onChange={() => toggleRow(user.id)}
          className="h-4 w-4 rounded border-border bg-background"
          aria-label={`Seleccionar usuario ${user.email}`}
        />
      ),
    },
    {
      key: "user",
      label: "Usuario",
      render: (user) => (
        <div>
          <Link href={`/admin/users/${user.id}`} className="group inline-flex items-center gap-2">
            <RoleIcon role={user.role} />
            <span className="font-medium group-hover:underline">{user.name?.trim() || "Sin nombre"}</span>
          </Link>
          <p className="text-xs text-muted-foreground">{user.email}</p>
          <p className="text-[11px] text-muted-foreground">Creado: {formatDate(user.createdAtIso)}</p>
        </div>
      ),
    },
    {
      key: "role",
      label: "Rol",
      render: (user) => <AdminRoleBadge role={user.role} label={roleLabel(user.role)} />,
    },
    {
      key: "status",
      label: "Estado",
      render: (user) => (
        <AdminIconBadge
          tone={userStatusTone(user.status)}
          icon={
            user.status === "ACTIVE" ? (
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ) : user.status === "INVITED" ? (
              <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Ban className="h-3.5 w-3.5" aria-hidden="true" />
            )
          }
          label={user.status}
        />
      ),
    },
    {
      key: "lastLogin",
      label: "Último login",
      render: (user) => <span className="text-xs text-muted-foreground">{formatDate(user.lastLoginAtIso)}</span>,
    },
    {
      key: "actions",
      label: "Acciones",
      align: "right",
      render: (user) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/users/${user.id}`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border transition-colors hover:bg-muted/45"
            title="Abrir usuario"
          >
            <Eye className="h-4 w-4" />
          </Link>
          {user.isCurrent ? (
            <span className="text-xs text-muted-foreground">Tu cuenta</span>
          ) : (
            <form method="POST" action={`/admin/users/${user.id}/delete`} onSubmit={handleDeleteSubmit}>
              <input type="hidden" name="returnTo" value={returnTo} />
              <button
                className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-destructive/60 bg-destructive/10 text-destructive hover:bg-destructive/20"
                title="Eliminar usuario"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      ),
    },
  ];

  return (
    <AdminListShell>
      <AdminListHeader
        icon={<UsersIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />}
        title="Usuarios"
        subtitle="Gestión de usuarios"
        count={<AdminStatusBadge>{filteredUsers.length}</AdminStatusBadge>}
        statusBadge={bulkAppliedMessage ? <AdminStatusBadge tone="success">{bulkAppliedMessage}</AdminStatusBadge> : null}
        actionSlot={<UsersInviteDialog returnTo={returnTo} />}
      />

      <div className="px-3 pb-2 sm:px-4">
        {stackedSuccessMessages.length > 0 ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-emerald-300">
            {stackedSuccessMessages.map((message) => (
              <AdminStatusBadge key={message} tone="success">
                {message}
              </AdminStatusBadge>
            ))}
            {alerts.inviteLink && alerts.showInviteInfo ? (
              <button
                type="button"
                onClick={() => {
                  void handleCopyInviteLink();
                }}
                className={cn(
                  "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5",
                  "transition-colors hover:bg-emerald-500/20 underline",
                  inviteCopyState === "copied" ? "border-emerald-400/60 text-emerald-200" : "",
                  inviteCopyState === "error" ? "border-destructive/60 text-destructive" : "",
                )}
                title="Copiar link de registro"
              >
                {inviteCopyState === "copied"
                  ? "Copiado"
                  : inviteCopyState === "error"
                    ? "Error"
                    : "Copiar / Link de registro"}
              </button>
            ) : null}
          </div>
        ) : null}

        {alerts.errorMessage ? (
          <p className="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
            {alerts.errorMessage}
          </p>
        ) : null}
      </div>

      <div className="border-b border-border px-3 py-2 sm:px-4">
        <div className="grid gap-2 xl:grid-cols-2">
          <form
            method="GET"
            action="/admin/users"
            autoComplete="off"
            onSubmit={(event) => event.preventDefault()}
            className="min-w-0"
          >
            <AdminFilterPanel
              title={
                <>
                  <Filter className="h-3.5 w-3.5" />
                  Filtros de lista
                </>
              }
              statusSlot={
                <>
                  <span className="text-[11px] text-muted-foreground">·</span>
                  <span className="rounded-full border border-border bg-background px-2 py-1 text-[11px] capitalize text-muted-foreground">
                    {filterStateLabel}
                  </span>
                  {localActiveCount > 0 ? (
                    <>
                      <span className="text-[11px] text-muted-foreground">·</span>
                      <span
                        className={cn(
                          "rounded-full border px-2 py-1 text-[11px]",
                          filteredUsers.length > 0
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                            : "border-amber-500/30 bg-amber-500/10 text-amber-300",
                        )}
                      >
                        {filteredUsers.length > 0 ? `${filteredUsers.length} resultados` : "0 resultados"}
                      </span>
                    </>
                  ) : null}
                </>
              }
              actionSlot={
                <>
                  <button
                    type="button"
                    onClick={handleCopyFilter}
                    className={cn(
                      "inline-flex items-center rounded-full border border-border bg-background px-2 py-1 text-[11px] capitalize",
                      "transition-colors hover:bg-muted/45",
                      copyState === "copied" ? "border-emerald-500/50 text-emerald-300" : "",
                      copyState === "error" ? "border-destructive/60 text-destructive" : "",
                    )}
                  >
                    {copyState === "copied" ? "Copiado" : copyState === "error" ? "Error" : "Copiar filtro"}
                  </button>
                </>
              }
            >

              <AdminControlsRow innerClassName="w-full xl:flex-nowrap">
                  <div className="grid min-w-0 flex-[1_1_220px] gap-1">
                    <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                      Campo
                    </span>
                    <div className="relative w-full">
                      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <label className="sr-only" htmlFor="filter-q">
                        Buscar
                      </label>
                      <input
                        id="filter-q"
                        type="text"
                        name="q"
                        value={localQuery}
                        onChange={(event) => setLocalQuery(event.target.value)}
                        autoComplete="off"
                        placeholder="Buscar usuarios por email o nombre"
                        className="h-9 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
                      />
                    </div>
                  </div>

                  <LabeledSelect
                    rootClassName="w-[124px]"
                    label="ROL"
                    labelPosition="top"
                    id="filter-role"
                    name="role"
                    value={localRoleFilter}
                    onChange={(event) => setLocalRoleFilter(event.target.value)}
                    className="h-9 w-full pr-8"
                    options={[
                      { value: "", label: "TODOS" },
                      { value: "ADMIN", label: "ADMIN" },
                      { value: "STAFF", label: "STAFF" },
                      { value: "CREATOR", label: "CREATOR" },
                    ]}
                  />

                  <LabeledSelect
                    rootClassName="w-[132px]"
                    label="ESTADO"
                    labelPosition="top"
                    id="filter-status"
                    name="status"
                    value={localStatusFilter}
                    onChange={(event) => setLocalStatusFilter(event.target.value)}
                    className="h-9 w-full pr-8"
                    options={[
                      { value: "", label: "TODOS" },
                      { value: "ACTIVE", label: "ACTIVE" },
                      { value: "INVITED", label: "INVITED" },
                      { value: "SUSPENDED", label: "SUSPENDED" },
                    ]}
                  />

                  <div className="grid w-[42px] gap-1">
                    <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                      Acción
                    </span>
                    <button
                      id="limpiar-filtros"
                      type="button"
                      title="Limpiar"
                      aria-label="Limpiar"
                      onClick={() => {
                        setLocalQuery("");
                        setLocalRoleFilter("");
                        setLocalStatusFilter("");
                      }}
                      className="inline-flex h-9 w-full items-center justify-center rounded-md border border-border text-sm transition-colors hover:bg-muted/45"
                    >
                      <RefreshCcw className="h-4 w-4" />
                    </button>
                  </div>
              </AdminControlsRow>
            </AdminFilterPanel>
          </form>

          <form
            method="POST"
            action="/admin/users/bulk"
            onSubmit={handleBulkSubmit}
            className="min-w-0"
          >
            <input type="hidden" name="returnTo" value={returnTo} />
            <AdminBulkPanel
              className="bg-background/30"
              title={
                <>
                  <Check className="h-3.5 w-3.5" />
                  Acciones masivas
                </>
              }
              statusSlot={
                <span className="rounded-full border border-border bg-background px-2 py-1 text-[11px] capitalize text-muted-foreground">
                  {selectionStateLabel}
                </span>
              }
            >

              <AdminControlsRow>
                  <div className="grid gap-1">
                    <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                      Campo
                    </span>
                    <label className="inline-flex h-8 items-center gap-2 rounded-md border border-border px-2 py-1 text-xs">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={(event) => toggleAll(event.target.checked)}
                        className="h-4 w-4 rounded border-border bg-background"
                      />
                      Todo
                    </label>
                  </div>

                  <LabeledSelect
                    rootClassName="w-[160px]"
                    label="ACCIÓN"
                    labelPosition="top"
                    name="actionType"
                    value={actionType}
                    onChange={(event) => setActionType(event.target.value as BulkActionType)}
                    className="h-8 w-full"
                    options={[
                      { value: "set_status", label: "Cambiar estado" },
                      { value: "set_role", label: "Cambiar rol" },
                      { value: "delete", label: "Eliminar" },
                    ]}
                  />

                  {actionType === "set_role" ? (
                    <LabeledSelect
                      rootClassName="w-[140px]"
                      label="ROL"
                      labelPosition="top"
                      name="role"
                      value={role}
                      onChange={(event) => setRole(event.target.value as UserRow["role"])}
                      className="h-8 w-full"
                      options={[
                        { value: "ADMIN", label: "ADMIN" },
                        { value: "STAFF", label: "STAFF" },
                        { value: "CREATOR", label: "CREATOR" },
                      ]}
                    />
                  ) : actionType === "set_status" ? (
                    <LabeledSelect
                      rootClassName="w-[160px]"
                      label="ESTADO"
                      labelPosition="top"
                      name="status"
                      value={status}
                      onChange={(event) => setStatus(event.target.value as UserRow["status"])}
                      className="h-8 w-full"
                      options={[
                        { value: "ACTIVE", label: "ACTIVE" },
                        { value: "INVITED", label: "INVITED" },
                        { value: "SUSPENDED", label: "SUSPENDED" },
                      ]}
                    />
                  ) : (
                    <div className="grid gap-1">
                      <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                        Campo
                      </span>
                      <p className="h-8 pt-2 text-xs text-destructive">Acción destructiva.</p>
                    </div>
                  )}

                  <div className="grid gap-1">
                    <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                      Campo
                    </span>
                    <button
                      disabled={selectedIds.length === 0}
                      className={cn(
                        "inline-flex h-8 items-center gap-1 rounded-md border border-border px-2.5 text-sm transition-colors",
                        "hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    >
                      <Check className="h-4 w-4" />
                      Aplicar
                    </button>
                  </div>

                  <div className="grid gap-1">
                    <span className="select-none text-[10px] font-semibold tracking-wide uppercase text-transparent">
                      Campo
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedIds([])}
                      disabled={selectedIds.length === 0}
                      className="inline-flex h-8 items-center rounded-md border border-border px-2 text-xs transition-colors hover:bg-muted/45 disabled:cursor-not-allowed disabled:opacity-50"
                      title="Limpiar selección"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
              </AdminControlsRow>
            </AdminBulkPanel>

            {selectedIds.map((id) => (
              <input key={id} type="hidden" name="userIds" value={id} />
            ))}
          </form>
        </div>
      </div>

      <div className="space-y-3 p-3 md:hidden">
        {filteredUsers.map((user) => (
          <article
            key={user.id}
            className={cn(
              "space-y-3 rounded-lg border border-border/70 bg-card p-3 transition-colors",
              selectedSet.has(user.id) ? "bg-accent/20" : "",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <a href={`/admin/users/${user.id}`} className="group inline-flex items-center gap-2">
                  <RoleIcon role={user.role} />
                  <span className="font-medium group-hover:underline">
                    {user.name?.trim() || "Sin nombre"}
                  </span>
                </a>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                <p className="text-[11px] text-muted-foreground">Creado: {formatDate(user.createdAtIso)}</p>
              </div>
              <input
                type="checkbox"
                checked={selectedSet.has(user.id)}
                disabled={user.isCurrent}
                onChange={() => toggleRow(user.id)}
                className="mt-0.5 h-4 w-4 rounded border-border bg-background"
                aria-label={`Seleccionar usuario ${user.email}`}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-2">
              <AdminRoleBadge role={user.role} label={roleLabel(user.role)} />
              <AdminIconBadge
                tone={userStatusTone(user.status)}
                icon={
                  user.status === "ACTIVE" ? (
                    <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : user.status === "INVITED" ? (
                    <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : (
                    <Ban className="h-3.5 w-3.5" aria-hidden="true" />
                  )
                }
                label={user.status}
              />
              <span className="text-xs text-muted-foreground">Último login: {formatDate(user.lastLoginAtIso)}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 border-t border-border/60 pt-2">
              <a
                href={`/admin/users/${user.id}`}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2.5 text-xs transition-colors hover:bg-muted/45"
              >
                Ver usuario
              </a>
              {user.isCurrent ? (
                <span className="inline-flex h-8 items-center justify-center rounded-md border border-border px-2 text-xs text-muted-foreground">
                  Tu cuenta
                </span>
              ) : (
                <form method="POST" action={`/admin/users/${user.id}/delete`} onSubmit={handleDeleteSubmit}>
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button
                    className="inline-flex h-8 w-full items-center justify-center gap-1 rounded-md border border-destructive/60 bg-destructive/10 px-2.5 text-xs text-destructive transition-colors hover:bg-destructive/20"
                    title="Eliminar usuario"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Eliminar
                  </button>
                </form>
              )}
            </div>
          </article>
        ))}
      </div>

      <div className="hidden overflow-hidden md:block">
        <AdminDataTable
          rows={filteredUsers}
          columns={desktopColumns}
          rowKey={(user) => user.id}
          rowClassName={(user) =>
            cn(
              "border-t border-border/70 hover:bg-muted/60",
              selectedSet.has(user.id) && "bg-accent/20 hover:bg-accent/25",
            )
          }
          tableClassName="w-full table-fixed"
          headerClassName="bg-muted/60"
          emptyState={<AdminListEmptyState message="No se encontraron usuarios con esos filtros." />}
        />
      </div>
    </AdminListShell>
  );
}
