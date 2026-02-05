# 018 · Auditoría y fix de Categorías (track edit)
Objetivo: que las categorías asignadas en `/admin/track/[id]/edit` persistan igual que Moods/Usos, sin parpadeo ni pérdida tras recargar.

## Pasos (marca `[ ]` → `[x]` al completar)

**Paso 0 — Reproducción base**
- [ ] Con `trackId` de prueba (`cmkx1ed3f000duq9glemziy2b`), asignar categoría existente y crear otra nueva; recargar y anotar qué se pierde.
- [ ] Registrar en `docs/debug/terminal.md` la hora y el trackId usado.

**Paso 1 — Flujo de datos front**
- [ ] Revisar `CategoryChips` → props `initialCategories`/`initialCatalog` → `TagChips` → `useTagCatalog.saveSelection`.
- [ ] Confirmar qué slugs/nombres se envían en `onChange` y que `meta.slug` siempre existe.
- [ ] Verificar hidden input `catalogTags` (form submit) para no interferir con guardado inline.

**Paso 2 — Endpoints y contratos**
- [ ] Revisar `/api/tracks/[id]/categories` (POST/GET): slugify, upsert type CATALOG, deleteMany/createMany con `skipDuplicates`.
- [ ] Revisar `/api/categories` (GET/POST/DELETE): respuestas `{ items }`, slugify, type CATALOG.
- [ ] Confirmar que `GET /api/tracks/[id]/categories` devuelve las asignadas tras POST.

**Paso 3 — SSR y carga inicial**
- [ ] Ver en `admin/track/[id]/edit/page.tsx` el `select` de Prisma y asegurar que incluye `tags -> tag {id, slug, name, type}`.
- [ ] Confirmar que `TrackEditForm` pasa `initialCategories` y `initialCatalog` correctos al render.

**Paso 4 — BD / esquema**
- [ ] Verificar `Tag` con type CATALOG y pivote `TrackTag` (`trackId`, `tagId`). Chequear si hay tags CATALOG duplicados o GENERIC con mismos slugs.
- [ ] Revisar `update-all` action: que al hacer “Guardar todo” no borre tags de catálogo (slugify/dedupe).

**Paso 5 — Instrumentación y logs**
- [ ] Añadir logs temporales (console) en `CategoryChips` change/save y en `/api/tracks/[id]/categories` para ver slugs recibidos/guardados.
- [ ] Repetir reproducción; verificar que lo que se guarda = lo que se lee.

**Paso 6 — Fixes**
- [ ] Ajustar front (slugs/nombres, guardado inline) según hallazgos.
- [ ] Ajustar API (upsert/promote, deleteMany scope) si aplica.
- [ ] Limpiar seeds/duplicados de Tag si interfieren (script puntual).

**Paso 7 — QA final**
- [ ] Smoke: asignar, desasignar, crear, borrar categoría; recargar; verificar persistencia y no parpadeo.
- [ ] Confirmar Moods y Usos siguen bien.
- [ ] Documentar resultado en `docs/debug/terminal.md`.
