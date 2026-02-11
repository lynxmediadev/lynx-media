import Link from "next/link";

import { Button } from "@/components/ui/button";

const QUICK_LINKS = [
  {
    title: "Tracks",
    description: "Catalogo principal, edicion y flujo tecnico de tracks.",
    href: "/admin/tracks",
    cta: "Abrir tracks",
  },
  {
    title: "Licensing Requests",
    description: "Bandeja comercial de solicitudes y seguimiento operativo.",
    href: "/admin/licensing",
    cta: "Abrir licensing",
  },
  {
    title: "Uploads",
    description: "Ingreso rapido de assets de audio al sistema de catalogo.",
    href: "/admin/uploads",
    cta: "Abrir uploads",
  },
  {
    title: "Contact Inbox",
    description: "Solicitudes generales recibidas desde formularios del sitio.",
    href: "/admin/requests",
    cta: "Abrir inbox",
  },
];

export default function AdminOverviewPage() {
  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">Overview</h1>
        <p className="text-muted-foreground text-sm">
          Punto de entrada del dashboard admin. Accesos directos a las areas
          operativas.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {QUICK_LINKS.map((link) => (
          <article
            key={link.href}
            className="border-border bg-card rounded-lg border p-4"
          >
            <h2 className="text-foreground text-base font-semibold">
              {link.title}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {link.description}
            </p>
            <div className="mt-3">
              <Button asChild variant="outline" size="sm">
                <Link href={link.href}>{link.cta}</Link>
              </Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
