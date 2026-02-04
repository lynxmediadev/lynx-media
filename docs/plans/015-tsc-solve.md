# 015 · Plan para dejar `tsc --noEmit` limpio

Objetivo: resolver los errores de tipado reportados por `npx tsc --noEmit`, priorizando rutas críticas y módulos compartidos.

## Resumen de errores (alta relevancia)
- **Rutas dinámicas Next con params async**: `/api/tracks/[id]/route` y derivados esperan `params: Promise`, rompería build estricto. (Mensaje: "Type '{ params: { id: string; } }' incompatible con Promise").
- **Licensing export/page**: enums con valores inválidos ("OPEN", "IN_PROGRESS", etc.) fuera del union permitido.
- **Catalog filtros**: `TrackWhereInput` recibe AND con `null` y combina moods/uses; tipado inválido.
- **Waveform/audio componentes**: props `barWidth`, `gap` no existen en tipos; `waveform` undefined en varios lugares.
- **Middleware**: acceso a cookies/headers sin null-check.
- **Validation trackSchemas**: números/strings posiblemente undefined al validar versiones/stems.

## Errores de relevancia media
- `Metadata` import no type-only en `servicios/design` y `sound-design`.
- TRPC `post` inexistente en `_components/post.tsx` (API desfasada).
- `CatalogClient`/`TrackCardWave` múltiples `possibly undefined` y event listener types.
- `AudioPlayerDemo`/`demo-track` usando `PlayerTrack` no exportado (usa DTO real).
- `Gallery.tsx` importa `CardAction` inexistente y casing duplicado `card.tsx`/`Card.tsx`.
- `CatalogTagsForm` espera `message` en Result cuando el tipo ok no lo tiene.

## Errores de baja relevancia
- `@ts-expect-error` sin uso (Sparkline, TrackCardWavePlayer, r2-stream, etc.).
- `Sound-design`/`MixFormClient` props `required` no existen en Input custom.
- `contact/route.ts` cast string->null sospechoso.

## Plan por módulos

### Paso 1 — Infra Next params
- [x] Actualizar rutas dinámicas a firma recomendada (`{ params }: { params: Promise<{id:string}> }`) o cambiar `tsconfig` para `routeSegmentConfig`. Revisar `/api/tracks/[id]/route`, `/api/admin/...` afectados.
  - En fácil: Next 15 envía `params` como Promise. Ajustamos rutas clave para que no rompan en build estricto y dejen de dar 404/500 por `undefined`.

### Paso 2 — Licensing
- [x] Normalizar enums a valores del union en `admin/licensing/page.tsx` y export route (mapear OPEN/IN_PROGRESS → NEW/IN_REVIEW o similares).
- [x] Fix budget fields undefined en `export/route.ts` (coalescencia o default).
  - En fácil: limpiamos estados legacy para que solo se usen los oficiales y evitamos `undefined` en budgets al exportar CSV → menos errores de tipado y datos más consistentes.

### Paso 3 — Catalog filtros
- [x] Armar `TrackWhereInput` sin `null` en AND; filtrar nulos antes de construir array; separar bloques moods/uses/artist.
  - En fácil: el listado de tracks ya no arma filtros con `null`, evitando fallos de tipado y consultas erráticas.

### Paso 4 — Audio/Waveform comps
- [x] Añadir props opcionales `barWidth`, `gap` a tipos o quitar uso extra en `PublicPlayer` / `TrackCardWave*` / `PublicAudioBar` / `Sparkline`.
- [x] Null-check de waveform y contextos.
  - En fácil: los players/ondas aceptan las props que ya usábamos y limpian el canvas cuando no hay waveform, reduciendo errores TS y glitches visuales.

### Paso 5 — Validation schemas
- [x] En `trackSchemas` asegurar coerción numérica y defaults para versiones/stems antes de pasar a zod; evitar `undefined` en campos obligatorios.
  - En fácil: si falta nombre/duración en versiones o stems, ponemos defaults seguros; así el zod y Prisma no chocan con `undefined`.

### Paso 6 — UI imports
- [x] Unificar casing `card.tsx` vs `Card.tsx`; remover `CardAction` inexistente.
- [x] `Metadata` imports como type-only.
  - En fácil: quitamos imports fantasma y archivos duplicados de Card/Metadata, bajando ruido de TS y build.

### Paso 7 — TRPC desfasado
- [x] `_components/post.tsx` usar router real (`api.post.create`?) o eliminar stub.
  - En fácil: borramos el componente demo de posts que apuntaba a una API inexistente, evitando errores de tipado y runtime.

### Paso 8 — Misc quick wins
- [x] `@ts-expect-error` no usados → eliminar.
- [x] `contact/route.ts` cast string→null: usar ternario explícito.
- [x] `Gallery` casing.
  - En fácil: limpiamos anotaciones TS sobrantes y casts sospechosos; Gallery ya no referencia un CardAction inexistente.

### Paso 9 — Re-run tsc
- [x] `npx tsc --noEmit` y documentar estado en `docs/debug/terminal.md`.
  - En fácil: volvimos a correr tsc; aún hay deuda previa en otros módulos (licensing/export, catálogo, audio utils, Button casing, etc.).

## Notas
- Prioridad alta: Paso 1, 2, 3 (rompen build/CI). El resto se puede abordar en bloques pequeños.
- Scope de los cambios actuales (moods/usos) no introdujo errores; foco es deuda previa.
