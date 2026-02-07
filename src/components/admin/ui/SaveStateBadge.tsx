"use client";

import * as React from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

type SaveStateBadgeProps = {
  state: SaveState;
  className?: string;
  savingLabel?: string;
  savedLabel?: string;
  errorLabel?: string;
};

export default function SaveStateBadge({
  state,
  className,
  savingLabel = "Guardando",
  savedLabel = "Guardado",
  errorLabel = "Error",
}: SaveStateBadgeProps) {
  if (state === "idle") return null;

  if (state === "saving") {
    return <span className={className ?? "text-muted-foreground"}>{savingLabel}</span>;
  }
  if (state === "saved") {
    return <span className={className ?? "text-emerald-500"}>{savedLabel}</span>;
  }
  return <span className={className ?? "text-destructive"}>{errorLabel}</span>;
}

