# DEPENDENCIAS DEL PROYECTO

Guía rápida de todo lo necesario para que el proyecto funcione en un entorno nuevo (Codex o local). No incluye secretos; solo nombres de variables y herramientas.

## Runtime y herramientas base
- Node.js 20 LTS.
- npm (usa `npm ci`/`npm install` según convenga).
- Git (rama de trabajo: `codex1`).
- (Opcional) WSL2 en Windows; usa rutas Linux para FFmpeg/FFprobe.

## Framework y UI
- Next.js (App Router) + TypeScript.
- Tailwind CSS v4 (tokens definidos en `src/styles/globals.css`).
- shadcn/ui para componentes (Button, Dialog, Tooltip, etc.).
- Iconos: `lucide-react`.

## Backend / Datos
- Prisma como ORM (`prisma/schema.prisma`).
- Base: Postgres (Supabase). Variables requeridas:
  - `DATABASE_URL`
  - `DIRECT_URL` (para migraciones/Prisma)
- Se usa `npx prisma generate` si se modifica el schema.

## Storage y audio
- Cloudflare R2 para assets de audio y waveforms.
  - Acceso público vía `getS3PublicUrl` (usa claves/endpoint configurados en el backend; no exponer valores).
  - Variables típicas: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_ENDPOINT` (nombres de referencia, sin valores).
- FFmpeg/FFprobe recomendados (para ingestión/análisis). Variables:
  - `FFMPEG_PATH`
  - `FFPROBE_PATH`

## Waveform / Player (puntos críticos)
- Componentes: `PublicAudioBar` + `WaveformScrubber` (waveform “Artlist-style”).
  - Requiere `waveformB64`: Bytes (Float32) en base64 desde BD (`track.waveform`).
  - Requiere `src` de audio accesible (R2 o `audioUrl` pública).
  - Tokens de color vienen del theme (`--foreground`/`--background`); sin bordes por defecto, configurables.
- Player usa `<audio>` nativo; necesita CORS correcto en el asset público.

## Fuentes y estilo
- Fuentes gestionadas con `next/font` en `src/app/layout.tsx` (Hanken Grotesk, etc.).
- Tokens de color/tema definidos en `globals.css` (modo dark por defecto, `html.light` para light).

## Scripts y comandos típicos
- Desarrollo: `npm run dev`.
- Build: `npm run build`.
- Tests (si aplica): `npm run test`.
- Prisma: `npx prisma generate` (tras cambiar schema).

## Notas operativas
- Archivo de contexto: `docs/AI_CONTEXT.md` (estilo, estado UI actual, naming waveform).
- Prompt de trabajo: `docs/PROMPTS.md`.
- Archivo local no versionado: `PRE_PROD.md` (checklist antes de prod).

## Requisitos adicionales para Codex
- Abrir `docs/AI_CONTEXT.md` y `docs/PROMPTS.md` al arrancar en un entorno nuevo para respetar estética/reglas.
- Respetar los “bordes debug” actuales (hero `/track/[id]`) si están presentes; se pueden retirar cuando se indique.
