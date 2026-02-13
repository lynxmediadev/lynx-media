# 025 - DB I/O audit y optimizacion

## Objetivo

Reducir round-trips y lectura innecesaria en rutas de tags/catalogo y preparar indices para crecimiento.

## Auditoria (foco)

- Endpoints de tags: `GET/POST/DELETE /api/moods|uses|categories`
- Asignacion de tags por track: `POST /api/tracks/[id]/moods|uses|categories`
- Query de catalogo: `src/lib/catalog/fetchCatalog.ts`
- Lecturas de `TrackTag` con orden por `assignedAt`

## Cambios aplicados

- [x] Nuevos indices en Prisma + migracion SQL:
  - [x] `Track(updatedAt, id)`
  - [x] `PublishingShare(trackId, role, sortOrder)`
  - [x] `MasterShare(trackId, sortOrder)`
  - [x] `Tag(type, name)`
  - [x] `TrackTag(trackId, assignedAt)`
  - [x] `TrackTag(tagId, assignedAt)`
- [x] Helper reusable para sincronizar tags por tipo y track:
  - [x] `src/server/tags/syncTrackTagsByType.ts`
  - [x] estrategia incremental (diff): insertar/eliminar solo cambios
  - [x] soporte `TransactionClient` para reutilizar en acciones server-side
- [x] Reemplazo de upserts N+1 en:
  - [x] `src/app/api/tracks/[id]/moods/route.ts`
  - [x] `src/app/api/tracks/[id]/uses/route.ts`
  - [x] `src/app/api/tracks/[id]/categories/route.ts`
- [x] `/edit/full` actualizado para usar sincronizacion incremental de categorias en `update-all`.
- [x] Menor payload en catalogo:
  - [x] `fetchCatalogTracks` tipado con `Prisma.TrackWhereInput` (sin `any`)
  - [x] `tags` filtrados en query solo a tipos `MOOD`/`USE`
- [x] Menor payload en GET de catalogos de tags (`moods/uses/categories`) usando `select` minimo.

## Resultado esperado

- Menos queries por guardado de tags (especialmente en POST de asignacion).
- Menos bytes transferidos en listados de catalogo/tags.
- Mejor escalabilidad a medida que crezcan `Tag`, `TrackTag`, `PublishingShare` y `MasterShare`.

## Smoke de rendimiento (2026-02-12, entorno local autenticado)

Track QA usado: `cmkx1ed3f000duq9glemziy2b`

- GET `/admin/tracks` -> warm avg `0.457s`
- GET `/admin/tracks/[id]/edit` -> warm avg `0.414s`
- GET `/admin/tracks/[id]/edit/creative` -> warm avg `0.353s`
- GET `/admin/tracks/[id]/edit/rights` -> warm avg `0.384s`
- GET `/admin/tracks/[id]/edit/metadata` -> warm avg `0.164s`
- GET `/admin/tracks/[id]/edit/deliverables` -> warm avg `0.275s`
- GET `/admin/tracks/[id]/edit/review` -> warm avg `0.471s`
- GET `/admin/tracks/[id]/edit/full` -> warm avg `0.764s`

API funcional de tags/catalogo (warm avg):

- POST `/api/tracks/[id]/moods` -> `0.495s`
- POST `/api/tracks/[id]/uses` -> `0.492s`
- POST `/api/tracks/[id]/categories` -> `0.561s`
- GET `/api/tracks/[id]/moods|uses|categories` -> `~0.155s`
- GET `/catalog?mood=...&use=...&cat=...` -> `0.344s`
- POST `/api/catalog/list` (`includeWaveform=false`) -> `0.227s`

## Benchmark dataset grande (2026-02-12, synthetic + cleanup)

Escenario synthetic generado y limpiado automaticamente:

- `500` tracks synthetic
- `900` tags synthetic (`300` MOOD, `300` USE, `300` CATALOG)
- `4000` relaciones `TrackTag`
- Prefijo aislado de datos: `__bench1770925662658__`
- Limpieza final validada: `leftTracks=0`, `leftTags=0`, `leftLinks=0`

Métricas (ms) en 60 iteraciones por query:

- `Q1` lista asignados MOOD por track: `avg=124.989`, `p50=124.876`, `p95=125.703`, `p99=126.159`
- `Q2` lista asignados USE por track: `avg=126.188`, `p50=125.053`, `p95=125.951`, `p99=187.227`
- `Q3` lista asignados CATALOG por track: `avg=125.162`, `p50=125.280`, `p95=126.064`, `p99=128.334`
- `Q4` filtro catalogo mood+use+cat: `avg=64.007`, `p50=62.884`, `p95=63.636`, `p99=124.026`
- `Q5` listado tags por tipo + orden: `avg=62.511`, `p50=62.500`, `p95=62.949`, `p99=63.686`
- `Q6` busqueda tags por `contains`: `avg=62.978`, `p50=63.006`, `p95=63.206`, `p99=63.925`
- `Q7` reemplazo de asignacion mood (`deleteMany + createMany`): `avg=253.611`, `p50=250.959`, `p95=259.006`, `p99=312.215`

Interpretacion:

- El costo dominante en este entorno es latencia total DB (round-trip), no CPU local.
- Los p95/p99 se mantienen estables salvo outliers puntuales de red/DB en `Q2` y `Q7`.
- `Q7` sigue siendo el caso mas costoso por ser escritura transaccional (esperable).

## Post-optimizacion incremental (validacion funcional)

- Persistencia validada para:
  - POST `/api/tracks/[id]/moods`
  - POST `/api/tracks/[id]/uses`
  - POST `/api/tracks/[id]/categories`
- Tiempos warm observados (3 corridas rapidas):
  - moods: `~0.45-0.50s`
  - uses: `~0.42-0.43s`
  - categories: `~0.47-0.51s`

## Pendientes v2 (opcionales, con riesgo controlado)

- [ ] Evaluar indices trigram (`pg_trgm`) para `ILIKE '%texto%'` en `Tag.name`, `Track.title`, `Track.artist`.
- [ ] Revisar paginacion/fields de `/admin/tracks` para reducir carga en tabla grande.
- [ ] Medir before/after con dataset grande (no solo entorno local pequeno).
