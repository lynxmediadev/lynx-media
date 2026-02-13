"use client";

import { Button } from "@/components/ui/button";

type ModuleSaveStatus = {
  ok: boolean;
  message: string;
};

export function ModuleSaveBar({
  status,
  hint,
  pending,
  submitLabel,
}: {
  status: ModuleSaveStatus | null;
  hint: string;
  pending: boolean;
  submitLabel: string;
}) {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 mt-auto -mx-4 w-auto border border-border/70 bg-black/70 px-4 py-3 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/80 md:-mx-12 md:px-12">
      <div className="flex flex-col items-center gap-2">
        <Button
          type="submit"
          variant="outline"
          size="default"
          className="order-1 w-auto justify-center border-border/100 bg-background/90 px-4 text-xs font-semibold capitalize text-foreground duration-200 hover:!border-border/20 hover:!bg-foreground/90 hover:!text-background"
          disabled={pending}
        >
          {pending ? "Guardando..." : submitLabel}
        </Button>

        <p className="order-2 w-full text-center text-xs text-muted-foreground">
          {status ? (
            <span className={status.ok ? "text-success" : "text-destructive"}>
              {status.message}
            </span>
          ) : (
            <span>{hint}</span>
          )}
        </p>
      </div>
    </div>
  );
}
