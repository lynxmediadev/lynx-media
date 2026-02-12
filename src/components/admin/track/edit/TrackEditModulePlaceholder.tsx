import Link from "next/link";

import { Button } from "@/components/ui/button";

export function TrackEditModulePlaceholder({
  title,
  description,
  trackId,
}: {
  title: string;
  description: string;
  trackId: string;
}) {
  return (
    <section className="rounded-lg border border-border bg-card/50 p-4">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/tracks/${trackId}/edit/full`}>
            Abrir vista completa temporal
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href={`/admin/tracks/${trackId}/edit`}>
            Volver al overview
          </Link>
        </Button>
      </div>
    </section>
  );
}
