"use client";

import type { UserRole } from "@prisma/client";

const roleOptions: Array<{ value: UserRole; label: string }> = [
  { value: "ADMIN", label: "Admin" },
  { value: "STAFF", label: "Staff" },
  { value: "CREATOR", label: "Creator" },
];

export function ViewAsControl({
  realRole,
  effectiveRole,
  compact = false,
}: {
  realRole: UserRole | null;
  effectiveRole: UserRole | null;
  compact?: boolean;
}) {
  if (realRole !== "ADMIN") return null;

  const currentRole = effectiveRole ?? "ADMIN";
  const formClassName = compact
    ? "space-y-2"
    : "hidden items-center gap-2 rounded-md border border-border/70 px-2 py-1 md:flex";

  const selectClassName = compact
    ? "h-9 w-full rounded-md border border-border bg-background px-2 text-xs uppercase tracking-wide"
    : "h-8 rounded-md border border-border bg-background px-2 text-[11px] uppercase tracking-wide";

  const buttonClassName = compact
    ? "h-9 w-full rounded-md border border-border px-3 text-xs hover:bg-accent"
    : "h-8 rounded-md border border-border px-2 text-[11px] hover:bg-accent";

  return (
    <form method="POST" action="/admin/view-as" className={formClassName}>
      <label className={compact ? "text-[10px] uppercase text-muted-foreground" : "text-[10px] uppercase text-muted-foreground"}>
        Ver como
      </label>
      <select name="role" defaultValue={currentRole} className={selectClassName}>
        {roleOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <button type="submit" className={buttonClassName}>
        Aplicar
      </button>
    </form>
  );
}
