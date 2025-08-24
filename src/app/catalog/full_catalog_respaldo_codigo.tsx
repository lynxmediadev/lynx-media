// src/app/catalog/page.tsx
import { type Metadata } from "next";
import Link from "next/link";

import { getCatalogue, listGenres, listMoods } from "@/lib/catalog";

// Si usas shadcn/ui con nombres en minúscula:
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

// Si tus componentes están en mayúsculas, ajusta los imports a:
// import { Input } from "@/components/ui/Input";
// import { Button } from "@/components/ui/Button";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
// etc.

export const metadata: Metadata = {
  title: "Catálogo | Lynx Music",
  description:
    "Explora el catálogo de música para sincronización: géneros, moods, BPM y más.",
};

type PageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function toNumber(v: string | string[] | undefined, fallback: number) {
  const s = Array.isArray(v) ? v[0] : v;
  const n = Number(s);
  return Number.isFinite(n) ? n : fallback;
}

export default async function CatalogPage({ searchParams }: PageProps) {
  const q = (Array.isArray(searchParams?.q) ? searchParams?.q[0] : searchParams?.q) ?? "";
  const genre = (Array.isArray(searchParams?.genre) ? searchParams?.genre[0] : searchParams?.genre) ?? "all";
  const mood = (Array.isArray(searchParams?.mood) ? searchParams?.mood[0] : searchParams?.mood) ?? "all";
  const bpmMin = toNumber(searchParams?.bpmMin, 0);
  const bpmMax = toNumber(searchParams?.bpmMax, 300);

  const tracks = getCatalogue({
    q,
    genre: genre as any,
    mood: mood as any,
    bpmMin,
    bpmMax,
  });

  const genres = listGenres();
  const moods = listMoods();

  // Helpers para ranges controlados por URL
  const currentMin = Math.min(bpmMin, bpmMax);
  const currentMax = Math.max(bpmMin, bpmMax);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Encabezado */}
      <header className="mb-8">
        <h1 className="text-3xl font-semibold tracking-tight">Catálogo</h1>
        <p className="text-sm text-muted-foreground">
          Busca por título/artista y filtra por género, mood y rango de BPM.
        </p>
      </header>

      {/* Filtros */}
      <form
        action="/catalog"
        method="GET"
        className="grid grid-cols-1 gap-4 rounded-2xl border bg-background/40 p-4 backdrop-blur md:grid-cols-5"
      >
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="q">Búsqueda</Label>
          <Input id="q" name="q" placeholder="Título o artista…" defaultValue={q} />
        </div>

        <div className="space-y-2">
          <Label>Género</Label>
          <Select name="genre" defaultValue={genre}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {genres.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Mood</Label>
          <Select name="mood" defaultValue={mood}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {moods.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>BPM</Label>
          <div className="rounded-xl border p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{currentMin} BPM</span>
              <span>{currentMax} BPM</span>
            </div>
            {/* Slider de shadcn es simple; para "range" real se suelen usar 2 sliders o una lib de range.
               Aquí controlamos con dos inputs escondidos para enviar por URL y mantenemos el display. */}
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="bpmMin" className="text-[11px]">Min</Label>
                <Input
                  id="bpmMin"
                  name="bpmMin"
                  type="number"
                  min={0}
                  max={300}
                  defaultValue={currentMin}
                />
              </div>
              <div>
                <Label htmlFor="bpmMax" className="text-[11px]">Max</Label>
                <Input
                  id="bpmMax"
                  name="bpmMax"
                  type="number"
                  min={0}
                  max={300}
                  defaultValue={currentMax}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-5 flex flex-wrap items-center gap-3 pt-2">
          <Button type="submit">Aplicar filtros</Button>
          <Link href="/catalog" className="text-sm text-muted-foreground underline underline-offset-4">
            Limpiar filtros
          </Link>

          {/* Chips de estado actual */}
          <div className="ml-auto flex flex-wrap gap-2">
            {q ? <Badge variant="secondary">q: {q}</Badge> : null}
            {genre !== "all" ? <Badge variant="secondary">genre: {genre}</Badge> : null}
            {mood !== "all" ? <Badge variant="secondary">mood: {mood}</Badge> : null}
            {(currentMin !== 0 || currentMax !== 300) ? (
              <Badge variant="secondary">bpm: {currentMin}–{currentMax}</Badge>
            ) : null}
          </div>
        </div>
      </form>

      {/* Resultados */}
      <section className="mt-8">
        <div className="mb-3 text-sm text-muted-foreground">
          {tracks.length} resultado{tracks.length === 1 ? "" : "s"}
        </div>

        {tracks.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-sm text-muted-foreground">
              No se encontraron resultados. Ajusta tus filtros.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tracks.map((t) => (
              <Card key={t.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{t.title}</CardTitle>
                  <CardDescription className="text-xs">{t.artist}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2 text-xs">
                    <Badge variant="outline">{t.genre}</Badge>
                    <Badge variant="outline">{t.mood}</Badge>
                    <Badge variant="outline">{t.bpm} BPM</Badge>
                    <Badge variant="outline">
                      {(t.durationSec / 60) | 0}:
                      {(t.durationSec % 60).toString().padStart(2, "0")}
                      {" min"}
                    </Badge>
                  </div>

                  {/* Arte y preview si están definidos */}
                  {t.artworkUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={t.artworkUrl}
                      alt={`${t.title} artwork`}
                      className="h-36 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-36 w-full rounded-xl border bg-muted/20" />
                  )}

                  {t.previewUrl ? (
                    <audio
                      controls
                      className="mt-2 w-full"
                      src={t.previewUrl}
                    />
                  ) : null}

                  <div className="pt-1">
                    <Button size="sm" variant="default">
                      Ver detalles
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
