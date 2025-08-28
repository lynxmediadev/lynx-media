// ================================================
// File: src/app/admin/tracks/new/page.tsx
// Título: Formulario Admin (crear track + subir audio)
// Descripción: (1) Firma y sube el archivo al bucket; (2) envía metadata + claves a /api/tracks (POST).
// Qué hace: Permite crear nuevos tracks sin tocar código.
// Peras y manzanas: “Consigo un link para subir la canción → la subo → guardo su ficha en la base.”
// ================================================
"use client";

import * as React from "react";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createTrackInput } from "@/schema/track-input";

const signSchema = z.object({
  key: z.string(),
  uploadUrl: z.string().url(),
  publicUrl: z.string().url(),
});
type Signed = z.infer<typeof signSchema>;

export default function NewTrackPage() {
  const router = useRouter();
  const [busy, setBusy] = React.useState(false);
  const [audioSigned, setAudioSigned] = React.useState<Signed | null>(null);
  const [audioFile, setAudioFile] = React.useState<File | null>(null);
  const [coverUrl, setCoverUrl] = React.useState<string>("");

  async function signAndUpload(file: File, prefix = "tracks"): Promise<Signed> {
    // 1) pedir URL firmada
    const res = await fetch("/api/uploads/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName: file.name, contentType: file.type, prefix }),
    });
    if (!res.ok) throw new Error("No se pudo firmar la subida");
    const signed = signSchema.parse(await res.json());

    // 2) subir directo al bucket (PUT)
    const put = await fetch(signed.uploadUrl, { method: "PUT", body: file });
    if (!put.ok) throw new Error("Fallo la subida al bucket");

    return signed;
  }

  async function onAudioSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setAudioFile(f);
    if (!f) return;
    setBusy(true);
    try {
      const signed = await signAndUpload(f, "tracks");
      setAudioSigned(signed);
    } catch (err) {
      console.error(err);
      alert("Error subiendo el audio");
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!audioFile || !audioSigned) {
      alert("Primero sube el audio");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const moods = (fd.get("moods")?.toString() || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const uses = (fd.get("uses")?.toString() || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      title: fd.get("title")?.toString() || "",
      artist: fd.get("artist")?.toString() || "",
      audio: {
        key: audioSigned.key,
        url: audioSigned.publicUrl,
        size: audioFile.size,
        mime: audioFile.type,
      },
      coverUrl: coverUrl || undefined,
      moods,
      uses,
      // derechos básicos opcionales:
      rights: {
        licenseType: fd.get("licenseType")?.toString() || undefined,
        territories: fd.get("territories")?.toString() || undefined,
      },
      isrc: fd.get("isrc")?.toString() || undefined,
    };

    const parsed = createTrackInput.safeParse(payload);
    if (!parsed.success) {
      console.error(parsed.error.format());
      alert("Revisa los campos obligatorios");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/tracks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error("No se pudo crear el track");
      // Si quieres, puedes leer el id: const { id } = await res.json();
      router.push(`/player/api-demo`); // o a una página de detalle
    } catch (err) {
      console.error(err);
      alert("Error guardando el track");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-6 lg:px-10 xl:px-14">
      <h1 className="mb-4 text-[20px] font-bold tracking-tight md:text-[22px]">Nuevo Track</h1>

      <form className="grid gap-4" onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Label htmlFor="title">Título *</Label>
          <Input id="title" name="title" required placeholder="Golden Horizon (Demo)" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="artist">Artista *</Label>
          <Input id="artist" name="artist" required placeholder="Lynx Music Collective" />
        </div>

        <Separator />

        <div className="grid gap-2">
          <Label>Archivo de audio *</Label>
          <Input type="file" accept="audio/*" onChange={onAudioSelect} disabled={busy} />
          {audioSigned ? (
            <p className="text-[13px] text-green-600">Audio subido ✔ ({audioSigned.publicUrl})</p>
          ) : (
            <p className="text-[13px] text-muted-foreground">Aún no subido</p>
          )}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="coverUrl">Cover (URL pública)</Label>
          <Input
            id="coverUrl"
            name="coverUrl"
            placeholder="https://cdn.tu-cdn.com/covers/hero-bg-01.jpg"
            value={coverUrl}
            onChange={(e) => setCoverUrl(e.target.value)}
          />
        </div>

        <div className="grid gap-2">
          <Label htmlFor="moods">Moods (separados por coma)</Label>
          <Input id="moods" name="moods" placeholder="Epic, Emotional, Elegant" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="uses">Usos (separados por coma)</Label>
          <Input id="uses" name="uses" placeholder="TV, Cine, Publicidad" />
        </div>

        <Separator />

        <div className="grid gap-2">
          <Label htmlFor="licenseType">Tipo de licencia (opcional)</Label>
          <Input id="licenseType" name="licenseType" placeholder="No exclusiva / Exclusiva / One-stop" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="territories">Territorios (opcional)</Label>
          <Input id="territories" name="territories" placeholder="Worldwide" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="isrc">ISRC (opcional)</Label>
          <Input id="isrc" name="isrc" placeholder="CL-XYZ-25-00001" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="submit" disabled={busy}>Crear</Button>
        </div>
      </form>
    </main>
  );
}
