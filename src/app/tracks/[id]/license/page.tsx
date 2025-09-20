// src/app/tracks/[id]/license/page.tsx
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ /tracks/[id]/license — Página pública por track                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Carga datos del track.                                                    │
 * │ - Emite token CSRF (self-contained) y lo pasa al formulario.               │
 * │ - NO modifica cookies aquí (Next 15 lo prohíbe en Server Components).      │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { issueCsrfToken } from "@/lib/csrf";
import PublicLicenseForm from "@/components/public/PublicLicenseForm";

export const dynamic = "force-dynamic";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const track = await prisma.track.findUnique({
    where: { id },
    select: { id: true, title: true, artist: true, durationSec: true },
  });
  if (!track) return notFound();

  // Sólo generamos el token (self-contained). Nada de cookies aquí.
  const token = issueCsrfToken();
  const startedAt = Date.now();

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold leading-tight">Solicitud de licencia</h1>
        <p className="text-muted-foreground">Completa el formulario para que podamos cotizar y coordinar el uso del track.</p>
      </header>

      <PublicLicenseForm track={track} csrfToken={token} startedAt={startedAt} />
    </main>
  );
}
