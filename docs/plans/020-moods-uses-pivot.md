# 020 · Pivot para Moods y Usos (homologar con Categorías y /catalog)

## Objetivo
Migrar Moods y Usos desde arrays en `Track` a relaciones pivote (`TrackMood` y `TrackUse` o reutilizar `TrackTag` con tipos específicos), para lograr:
- Filtros consistentes y performantes en `/catalog` con URLs compartibles.
- Catálogo centralizado (unicidad, casing, deduplicación).
- CRUD coherente en UI (mismo patrón que Categorías).

## Supuestos / decisiones
- `/catalog` será la ruta principal de catálogo y filtros compartibles via query params.
- **Modelo unificado (decisión):** usar `Tag` con `TagType` extendido (`CATALOG`, `MOOD`, `USE`) y un solo pivote `TrackTag`.
- Migrar datos existentes de `Mood` y arrays `Track.moods`/`Track.uses` a `Tag/TrackTag`.
- URLs de filtro usarán slugs upper-case normalizados.

## Plan paso a paso

### Paso 1 · Modelo y migración (Tag unificado)
- [x] Extender enum `TagType` con `MOOD` y `USE`.
- [x] Usar `TrackTag` como pivote único para `MOOD`/`USE`/`CATALOG`.
- [x] Migrar datos:
  - [x] Crear tags `Tag` para cada mood (upper + slug) con `type=MOOD`; poblar `TrackTag` desde `Track.moods`.
  - [x] Crear tags `Tag` para cada uso con `type=USE`; poblar `TrackTag` desde `Track.uses`.
- [ ] (Opcional) Dejar tabla `Mood` como legacy temporal o eliminar si no usada.
- [ ] Eliminar columnas `moods` y `uses` de `Track` tras migrar.

### Paso 2 · APIs
- [x] `/api/moods` y `/api/uses` → leer/escribir `Tag` filtrando por `type=MOOD/USE`.
- [x] `/api/tracks/[id]/moods` y `/api/tracks/[id]/uses` → leer/escribir `TrackTag` con tipo correspondiente.
- [x] Asegurar respuestas `{ items }` con `id,name,slug,type` y normalización a MAYÚSCULAS.

### Paso 3 · Frontend (TagChips)
- [x] `MoodChips`/`UseChips`: consumir nuevas APIs (Tag/TrackTag), sin arrays locales. Front usa `assignedMoods/assignedUses` desde pivote.
- [x] Mantener UX: botón Guardar + panel abierto; labels correctos.
- [x] Rehidratar con payload del POST/GET (fuente de verdad = pivote).

### Paso 4 · SSR y páginas
- [x] En `/admin/track/[id]/edit` seleccionar `TrackTag` filtrado por `type` (MOOD/USE/CATALOG) como `initial...`.
- [x] En `/catalog` adaptar filtros para usar `TrackTag -> Tag` (slugs en query).

### Paso 5 · Migración de datos y limpieza
- [x] Script de migración: por cada track, insertar moods/uses en catálogo y pivote; luego limpiar arrays.
- [x] Quitar referencias a `track.moods`/`track.uses` en forms, schemas y validaciones (legacy files removidos o anotados).

### Paso 6 · QA
- [ ] Smoke en admin (manual):
  - Crear mood/use nuevo y asignarlo; recargar => debe persistir en asignados y sugeridos.
  - Desasignar y borrar mood/use; recargar => no debe reaparecer.
  - Shift+click, guardado auto y botones Guardar siguen funcionando.
- [ ] `/catalog` filtros por pivote:
  - Probar `?mood=HAPPY&use=TV&cat=beats` devuelve resultados coherentes.
  - Compartir URL y abrir en pestaña nueva mantiene filtros.
- [ ] Seeds/normalización: verificar que tags se crean en MAYÚSCULAS y slugs en minúsculas; seed corre sin errores (✔ `npx prisma db seed`).

## Riesgos / notar
- Migración de datos requiere cuidado para no perder moods/uses actuales.
- Cambios en filtros de catálogo pueden requerir índices nuevos.
- Si se elige `Tag` como fuente única, hay que extender enum `TagType` y ajustar lógica de borrado para no mezclar tipos.
