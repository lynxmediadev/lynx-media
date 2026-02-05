# 017 · Unificar sistema de tags (moods/uses/categorías)
Objetivo: que Moods, Usos y Categorías compartan la misma lógica/UX de chips (como Moods, que hoy funciona), con persistencia inmediata, sin parpadeos y con código reutilizable.

## Pasos (marca `[ ]` → `[x]` al completar)

**Paso 1 — Auditoría rápida**
- [x] Comparar `MoodChips`, `UseChips`, `CategoryChips`, `TagChips`, `useTagCatalog`, y endpoints `/api/moods`, `/api/uses`, `/api/categories`, `/api/tracks/[id]/categories|uses|moods` (si existen).
- [x] Listar diferencias: normalización (slug/uppercase), guardado inline, fetch inicial/SSR, filtros de catálogo, manejo de “promote” GENERIC→CATALOG, y UX (parpadeos).
  - Normalización: Moods usa `label/value` en MAYÚSCULAS sin slug; Uses usa Title Case por palabra corta; Categorías usa Title Case + `meta.slug` slugificado (casing distinto).
  - Persistencia inline: Moods/Uses hacen POST directo a `/api/tracks/:id/moods|uses`; Categorías usa `saveSelection` (slugs) y depende de `meta.slug`.
  - SSR/fetch inicial: Moods/Uses sólo usan SSR (sin fetch); Categorías tenía fetch de sincronización extra (quitado), pero depende de `initialCategories` con slugs.
  - Catálogo/filtrado: Categorías filtra por `TagType.CATALOG`; Moods/Uses no usan `type`; slugify/promote sólo en categorías (moods/uses no upsert type).
  - UX/parpadeo: sólo categorías mostraba retardo al recargar (debido a fetch/hidratación y slug/meta).

**Paso 2 — Contrato unificado de datos**
- [x] Definir contrato único `TagItem` `{ id, name, slug, type }` y normalizadores (`normalizeLabel`, `slugify`, `toUpperSafe`, `titleCaseSafe`).
- [x] Documentar en `TagChips`/`useTagCatalog` el contrato esperado (entrada/salida) y defaults.
  - TagItem propuesto: `{ id?: string; name: string; slug: string; type?: "MOOD"|"USE"|"CATALOG"|string }`.
  - Normalizadores base: 
    - `slugify`: minúsculas, ASCII, guiones, trim, 60 chars.
    - `toUpperSafe`: `str.trim().toUpperCase()`.
    - `titleCaseSafe`: primera mayúscula, resto minúscula, palabras cortas se mantienen si <4 chars.
  - Contrato TagChips / useTagCatalog:
    - `mapItem` debe devolver `TagChip` con `{ label, value, meta:{ slug } }`.
    - `create` debe aceptar `label` libre y devolver `TagChip` normalizado.
    - `saveSelection(trackId, slugs[])` opera SIEMPRE con slugs ya normalizados.
    - Responses de catálogo ideales: `{ items: TagItem[] }` (fallback: array plano).

**Paso 3 — Hook compartido**
- [x] Extender `useTagCatalog` para aceptar: `normalizeLabel`, `normalizeSlug`, flags `promoteType`, y retornar `{ items, fetchAll, fetchSuggestions, create, saveSelection, remove }` con shape homogéneo.
- [x] Asegurar que `saveSelection` use `skipDuplicates` y `upsert` para promover a `CATALOG` cuando aplique.

**Paso 4 — APIs unificadas**
- [x] Homologar `/api/categories` a la lógica de `/api/moods` (validación, 409 similares, seeds opcionales) y viceversa: misma respuesta `{ items }` y casing consistente. (Moods/Uses/Categories ahora responden `{ items: [...] }` con id/name/slug/type.)
- [x] Homologar endpoints de guardado inline por track: `/api/tracks/[id]/moods`, `/api/tracks/[id]/uses`, `/api/tracks/[id]/categories` con: `slugify + upsert + deleteMany + createMany(skipDuplicates) + GET de estado`.
- [x] Asegurar que páginas SSR incluyan los pivotes correctos en el `select` (tags/type) para prehidratar chips sin fetch extra. (En `admin/track/[id]/edit` ya se incluyen `tags -> tag {id, slug, name, type}` y arrays `moods/uses`.)
- [ ] Asegurar que páginas SSR incluyan los pivotes correctos en el `select` (tags/type) para prehidratar chips sin fetch extra.

**Paso 5 — TagChips base**
- [x] Revisar props para que Moods/Usos/Categorías usen el mismo set (placeholders, headings, allowCreate, allowDeleteCatalog, maxItems, toggleLabel).
- [x] Evitar fetch inicial si ya hay datos SSR; mantener clear btn y hover rojo matte. (TagChips ahora usa `initialCatalogItems` y sólo hace fetch si el catálogo está vacío.)
- [x] Añadir prop opcional `initialItems` (server) para evitar parpadeo, y usarla en los wrappers. (Prop `initialCatalogItems` en TagChips, consumida en CategoryChips con datos SSR.)

**Paso 6 — Wrappers por dominio**
- [x] `MoodChips`: usar `useTagCatalog` con upper-case, maxItems=10, allowDeleteCatalog=false, save inline + GET estado.
- [x] `UseChips`: misma lógica que moods (casing decidido, p.ej. Title Case), max configurable, endpoints `/api/uses`, track-save `/api/tracks/[id]/uses`.
- [x] `CategoryChips`: misma lógica que moods pero `type=CATALOG`; pasar `initialItems` desde SSR para eliminar retraso.

**Paso 7 — Persistencia y SSR**
- [x] En `TrackEditForm` y páginas admin, pasar `initialItems` a cada wrapper (moods/uses/categories) con los datos ya cargados desde Prisma. (Categorías recibe catálogo SSR; moods/uses ya hidratan asignados desde SSR sin fetch extra.)
- [x] Asegurar que `updateTrackAll` valida y upsertea tags/uses/moods con el mismo pipeline (slugify, promote type, dedupe). (Moods upsert + trackMood; Uses ahora slugify+upsert Tag GENERIC + dedupe; Categorías ya promueven a CATALOG.)

**Paso 8 — QA**
- [ ] Smoke en `/admin/track/[id]/edit`: asignar/desasignar/crear/borrar en los tres dominios; recargar y verificar persistencia sin parpadeo.
- [ ] Probar conflicto: crear nombre similar → 409 sugerencias; borrar sugerido con popup; maxItems respetado.
- [ ] Registrar resultados/errores en `docs/debug/terminal.md`.
  - **Nota**: Pendiente ejecución manual en navegador (no automatizable aquí).

**Paso 9 — Limpieza y docs**
- [ ] Eliminar código duplicado/obsoleto (sync fetch eliminado, normalizadores duplicados).
- [ ] Documentar uso de `TagChips` y wrappers en `docs/AI_CONTEXT.md` o sección apropiada.
- [ ] Considerar seeds mínimas para uses/categories (opcional) y anotarlo en `DEPENDENCIAS.md`.
