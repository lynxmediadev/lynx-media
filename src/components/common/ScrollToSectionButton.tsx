"use client";

import type { ReactNode } from "react";

type ScrollToSectionButtonProps = {
  targetId: string;
  className?: string;
  children: ReactNode;
};

export default function ScrollToSectionButton({
  targetId,
  className,
  children,
}: ScrollToSectionButtonProps) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }}
    >
      {children}
    </button>
  );
}
