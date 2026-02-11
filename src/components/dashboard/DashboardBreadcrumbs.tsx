"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type DashboardCrumb = {
  label: string;
  href?: string;
};

function isLikelyTrackId(segment: string): boolean {
  return /^[a-z0-9]{10,}$/i.test(segment);
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback below
  }

  try {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(el);
    return ok;
  } catch {
    return false;
  }
}

export function DashboardBreadcrumbs({
  items,
  className,
}: {
  items: DashboardCrumb[];
  className?: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const resetTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (resetTimer.current) {
        window.clearTimeout(resetTimer.current);
      }
    };
  }, []);

  const handleCopyPublicTrackUrl = useCallback(async (trackId: string) => {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}/track/${trackId}`;
    const ok = await copyText(url);
    if (!ok) return;

    setCopiedId(trackId);
    if (resetTimer.current) {
      window.clearTimeout(resetTimer.current);
    }
    resetTimer.current = window.setTimeout(() => {
      setCopiedId(null);
    }, 1200);
  }, []);

  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn("flex items-center gap-1 text-xs", className)}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span
            key={`${item.label}-${index}`}
            className="flex items-center gap-1"
          >
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : isLikelyTrackId(item.label) ? (
              <button
                type="button"
                onClick={() => {
                  void handleCopyPublicTrackUrl(item.label);
                }}
                className="text-muted-foreground hover:text-foreground relative cursor-copy rounded-sm underline underline-offset-1 transition-colors"
                title="Copiar URL pública del track"
                aria-label={`Copiar URL pública del track ${item.label}`}
              >
                {item.label}
                {copiedId === item.label ? (
                  <span className="bg-foreground text-background pointer-events-none absolute top-[-1.20rem] left-1/2 z-10 -translate-x-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap">
                    Copiado
                  </span>
                ) : null}
              </button>
            ) : (
              <span
                className={isLast ? "text-foreground" : "text-muted-foreground"}
              >
                {item.label}
              </span>
            )}
            {!isLast ? (
              <span className="text-muted-foreground/60">/</span>
            ) : null}
          </span>
        );
      })}
    </nav>
  );
}
