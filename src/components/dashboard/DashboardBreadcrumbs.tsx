"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type DashboardCrumb = {
  label: string;
  href?: string;
};

function isLikelyTrackId(segment: string): boolean {
  return /^[a-z0-9]{10,}$/i.test(segment);
}

function compactTrackId(trackId: string): string {
  if (trackId.length <= 14) return trackId;
  return `${trackId.slice(0, 6)}…${trackId.slice(-4)}`;
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
    <TooltipProvider delayDuration={120}>
      <nav
        aria-label="Breadcrumb"
        className={cn("flex min-w-0 flex-wrap items-center gap-1 text-xs", className)}
      >
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <span
              key={`${item.label}-${index}`}
              className="flex min-w-0 items-center gap-1"
            >
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground max-w-[44vw] truncate transition-colors md:max-w-none"
                >
                  {item.label}
                </Link>
              ) : isLikelyTrackId(item.label) ? (
                <Tooltip open={copiedId === item.label}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        void handleCopyPublicTrackUrl(item.label);
                      }}
                      className="text-muted-foreground hover:text-foreground inline-flex max-w-[52vw] cursor-copy rounded-sm underline underline-offset-1 transition-colors md:max-w-none"
                      title="Copiar URL pública del track"
                      aria-label={`Copiar URL pública del track ${item.label}`}
                    >
                      <span className="truncate md:hidden">{compactTrackId(item.label)}</span>
                      <span className="hidden md:inline">{item.label}</span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="text-[10px]">
                    Copied
                  </TooltipContent>
                </Tooltip>
              ) : (
                <span
                  className={cn(
                    isLast ? "text-foreground" : "text-muted-foreground",
                    "max-w-[44vw] truncate md:max-w-none",
                  )}
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
    </TooltipProvider>
  );
}
