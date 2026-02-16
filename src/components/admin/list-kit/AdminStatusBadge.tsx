import type { ReactNode } from "react";
import { ShieldCheck, UserRound, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminBadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info";

type AdminStatusBadgeProps = {
  children: ReactNode;
  tone?: AdminBadgeTone;
  className?: string;
};

function toneClass(tone: AdminBadgeTone) {
  if (tone === "success") return "admin-badge-success";
  if (tone === "warning") return "admin-badge-warning";
  if (tone === "danger") return "admin-badge-danger";
  if (tone === "info") return "admin-badge-info";
  return "border-border bg-background text-muted-foreground";
}

function iconToneClass(tone: AdminBadgeTone) {
  if (tone === "success") return "admin-badge-success";
  if (tone === "warning") return "admin-badge-warning";
  if (tone === "danger") return "admin-badge-danger";
  if (tone === "info") return "admin-badge-info";
  return "border-border bg-background text-muted-foreground";
}

export function AdminStatusBadge({ children, tone = "neutral", className }: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]",
        toneClass(tone),
        className,
      )}
    >
      {children}
    </span>
  );
}

type AdminIconBadgeProps = {
  label: ReactNode;
  icon: ReactNode;
  tone?: AdminBadgeTone;
  className?: string;
};

export function AdminIconBadge({ label, icon, tone = "neutral", className }: AdminIconBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] leading-none [&_svg]:block [&_svg]:h-3 [&_svg]:w-3 [&_svg]:shrink-0",
        iconToneClass(tone),
        className,
      )}
    >
      <span className="inline-flex items-center justify-center">{icon}</span>
      <span className="inline-flex items-center leading-none">{label}</span>
    </span>
  );
}

type AdminRoleBadgeProps = {
  role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT";
  label?: ReactNode;
  className?: string;
};

function roleToneClass(role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT") {
  if (role === "ADMIN") return "admin-badge-role-admin";
  if (role === "STAFF") return "admin-badge-role-staff";
  if (role === "CLIENT") return "border-border bg-muted/35 text-foreground";
  return "admin-badge-role-creator";
}

function roleIcon(role: "ADMIN" | "STAFF" | "CREATOR" | "CLIENT") {
  if (role === "ADMIN") return <ShieldCheck aria-hidden="true" />;
  if (role === "STAFF") return <Wrench aria-hidden="true" />;
  if (role === "CLIENT") return <UserRound aria-hidden="true" />;
  return <UserRound aria-hidden="true" />;
}

export function AdminRoleBadge({ role, label, className }: AdminRoleBadgeProps) {
  return <AdminIconBadge icon={roleIcon(role)} label={label ?? role} className={cn(roleToneClass(role), className)} />;
}
