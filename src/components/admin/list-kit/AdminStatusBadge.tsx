import type { ReactNode } from "react";
import { ShieldCheck, UserRound, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

export type AdminBadgeTone = "neutral" | "success" | "warning" | "danger";

type AdminStatusBadgeProps = {
  children: ReactNode;
  tone?: AdminBadgeTone;
  className?: string;
};

function toneClass(tone: AdminBadgeTone) {
  if (tone === "success") return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  if (tone === "warning") return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  if (tone === "danger") return "border-destructive/40 bg-destructive/10 text-destructive";
  return "border-border bg-background text-muted-foreground";
}

function iconToneClass(tone: AdminBadgeTone) {
  if (tone === "success") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (tone === "warning") return "border-amber-500/40 bg-amber-500/10 text-amber-300";
  if (tone === "danger") return "border-destructive/40 bg-destructive/10 text-destructive";
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
        "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] leading-none [&_svg]:block [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:shrink-0",
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
  role: "ADMIN" | "STAFF" | "CREATOR";
  label?: ReactNode;
  className?: string;
};

function roleToneClass(role: "ADMIN" | "STAFF" | "CREATOR") {
  if (role === "ADMIN") return "border-emerald-500/40 bg-emerald-500/10 text-emerald-300";
  if (role === "STAFF") return "border-sky-500/40 bg-sky-500/10 text-sky-300";
  return "border-zinc-500/40 bg-zinc-500/10 text-zinc-300";
}

function roleIcon(role: "ADMIN" | "STAFF" | "CREATOR") {
  if (role === "ADMIN") return <ShieldCheck aria-hidden="true" />;
  if (role === "STAFF") return <Wrench aria-hidden="true" />;
  return <UserRound aria-hidden="true" />;
}

export function AdminRoleBadge({ role, label, className }: AdminRoleBadgeProps) {
  return <AdminIconBadge icon={roleIcon(role)} label={label ?? role} className={cn(roleToneClass(role), className)} />;
}
