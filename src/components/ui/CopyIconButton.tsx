"use client";

import * as React from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  icon: React.ReactNode;
  label: string;
  className?: string;
  tooltipLabel?: string;
};

export function CopyIconButton({
  text,
  icon,
  label,
  className,
  tooltipLabel = "Copiar link",
}: Props) {
  const [copied, setCopied] = React.useState(false);

  async function copy() {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Tooltip open={copied || undefined}>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={copy}
          aria-label={label}
          className={cn(
            "rounded-full border border-transparent p-2 transition hover:border-border/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            className,
          )}
        >
          {icon}
        </button>
      </TooltipTrigger>
      <TooltipContent className="px-2 py-1 text-xs leading-none">
        {copied ? "Copiado" : tooltipLabel}
      </TooltipContent>
    </Tooltip>
  );
}
