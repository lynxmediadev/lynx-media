import { Construction } from "lucide-react";

export function PlaceholderPage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h1 className="text-foreground text-2xl font-semibold">{title}</h1>
        <p className="text-muted-foreground text-sm">{description}</p>
      </header>

      <div className="border-border bg-card/40 rounded-xl border border-dashed p-8">
        <div className="border-border bg-background mx-auto flex max-w-xl items-center gap-3 rounded-md border px-4 py-3">
          <Construction
            className="text-muted-foreground h-4 w-4"
            aria-hidden="true"
          />
          <p className="text-muted-foreground text-sm">
            Seccion en construccion. Navegacion disponible para iterar sin
            romper rutas.
          </p>
        </div>
      </div>
    </section>
  );
}
