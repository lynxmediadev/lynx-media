import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";

import { SupportTicketDialog } from "@/components/support/SupportTicketDialog";

export default function NotFound() {
  return (
    <main className="bg-background text-foreground flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-2xl rounded-2xl border border-border/70 bg-muted/20 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)] sm:p-8">
        <p className="text-muted-foreground text-xs font-semibold tracking-[0.16em] uppercase">404</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">No encontramos esta pagina</h1>
        <p className="text-muted-foreground mt-3 text-sm sm:text-base">
          Puede que el enlace este desactualizado, tenga un typo o la pagina ya no exista.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            Ir al inicio
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm transition-colors hover:bg-muted/40"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Ir al panel
          </Link>
        </div>

        <div className="mt-5 border-t border-border/70 pt-4 text-sm">
          <p className="text-muted-foreground">
            Si esto parece un problema tecnico, puedes{" "}
            <SupportTicketDialog source="NOT_FOUND" triggerLabel="contactar soporte" />.
          </p>
        </div>
      </section>
    </main>
  );
}
