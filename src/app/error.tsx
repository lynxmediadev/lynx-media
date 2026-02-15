"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SupportTicketDialog } from "@/components/support/SupportTicketDialog";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app:error]", error);
  }, [error]);

  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-border/70 bg-muted/20 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide uppercase text-amber-300">
          <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
          Error de aplicacion
        </div>

        <h1 className="mt-3 text-2xl font-semibold sm:text-3xl">Algo salio mal</h1>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          No pudimos completar esta accion. Reintenta y, si el error persiste, reportalo para revisarlo.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button type="button" onClick={reset} className="inline-flex items-center gap-2">
            <RefreshCcw className="h-4 w-4" aria-hidden="true" />
            Reintentar
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Ir al inicio</Link>
          </Button>
        </div>

        <div className="mt-5 border-t border-border/70 pt-4 text-sm">
          <p className="text-muted-foreground">
            Necesitas ayuda tecnica?{" "}
            <SupportTicketDialog
              source="ERROR_PAGE"
              triggerLabel="contactar soporte"
              errorDigest={error.digest ?? null}
            />
          </p>
        </div>
      </section>
    </main>
  );
}
