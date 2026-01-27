import { Metadata } from "next";
import Link from "next/link";
import { AudioLines, Film, Headphones, Radio, Volume2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Diseño Sonoro para audiovisual",
  description: "Sound design, foley, mezcla y master para cine, publicidad y contenidos digitales.",
};

const modules = [
  { icon: Film, title: "Narrativa sonora", desc: "Concepto auditivo, atmósferas y leitmotifs para personajes o marcas." },
  { icon: Headphones, title: "Foley & FX", desc: "Creación y edición de efectos sync, texturas y transiciones." },
  { icon: AudioLines, title: "Mezcla + Master", desc: "Loudness compliant (EBU R128/ATSC A/85), stems y versiones web/broadcast." },
  { icon: Waves, title: "Restauración", desc: "De-noise, de-click, de-reverb y cleanup quirúrgico en diálogos." },
  { icon: Radio, title: "Locución & VO", desc: "Casting, grabación y edición de voces en cabina tratada." },
  { icon: Volume2, title: "Entrega técnica", desc: "Specs por plataforma: OTT, TV, YT, IG, TikTok; masters estéreo/5.1 opcional." },
];

const workflow = [
  "Brief técnico + spotting session (online).",
  "Propuesta de paleta sonora y referencias.",
  "Primer delivery (design + mix draft) con 1 ronda rápida.",
  "Versión final y masters (stems + loudness report).",
];

export default function SoundDesignPage() {
  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 md:px-6">
      <section className="rounded-[2px] border border-border bg-card/70 p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Servicios</p>
            <h1 className="text-3xl font-semibold text-foreground">Diseño Sonoro</h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              Foley, FX, mezcla y master listos para distribución digital o broadcast. Entregamos stems organizados,
              loudness report y versiones cortas para redes.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="default" className="rounded-[2px]">
              <Link href="/servicios/mix">Agendar llamada</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-[2px]">
              <Link href="/contact">Solicitar brief</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {modules.map((m) => (
          <Card key={m.title} className="h-full border-border bg-card/70">
            <CardHeader className="flex flex-row items-center gap-3">
              <m.icon className="h-5 w-5 text-primary" />
              <CardTitle className="text-base font-semibold">{m.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="rounded-[2px] border border-border bg-card/70 p-6 md:p-8">
        <div className="flex items-center gap-2">
          <Waves className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Flujo</h2>
        </div>
        <Separator className="my-4 bg-border/60" />
        <div className="grid gap-3 md:grid-cols-2">
          {workflow.map((w, idx) => (
            <div key={w} className="flex gap-3 rounded-[2px] border border-border/60 bg-card/60 p-3 text-sm text-foreground">
              <span className="mt-0.5 h-6 w-6 rounded-full bg-primary/10 text-center text-xs font-semibold text-primary">{idx + 1}</span>
              <p className="leading-snug text-muted-foreground">{w}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Entregables</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>• Stems organizados (DX, FX, MX, VO) + mezcla final.</div>
            <div>• Loudness report (EBU R128 / ATSC A/85) y versiones web.</div>
            <div>• Librería de FX custom usados en el proyecto (opcional).</div>
          </CardContent>
        </Card>
        <Card className="border-border bg-card/80">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Opcionales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <div>• 5.1 / Ambisonics básico.</div>
            <div>• Música original + licenciamiento (integrado con nuestro catálogo).</div>
            <div>• Versiones cortas para teaser / trailers / social.</div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
