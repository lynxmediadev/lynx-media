# 016 · Categorías con TagChips reutilizables

Objetivo: unificar el flujo de asignar/crear/borrar categorías del catálogo usando el mismo sistema de chips (TagChips + wrapper) que ya usamos en Moods/Usos, con guardado inmediato y UI consistente.

## Paso 0 — Contexto y supuestos
- [ ] Categorías viven en `Tag` con `type = "CATALOG"` y pivote `TrackTag` (asumido por código actual).
- [ ] API base: `/api/catalog/tags` (o la ruta real que ya existe; ajustar en Paso 2).
- [ ] Guardado inline: al asignar/desasignar se persiste en BD sin depender de “Guardar todo”.

## Paso 1 — Auditoría rápida
- [x] Revisar implementación actual de categorías en el formulario de track (componentes y endpoint que usa).
- [x] Detectar diferencias vs Moods/Usos: creación, borrado, sugeridos, auto-save.
  - Hoy usa `CatalogTagsForm` (chips manuales) con acciones `createCatalogTag`, `updateCatalogTags`, `deleteCatalogTag`.
  - No hay autocomplete/sugeridos ni búsqueda; todo el catálogo llega precargado en props.
  - Asignación/desasignación sí guarda inline (`updateCatalogTags`), pero el flujo de creación/borrado depende del formulario y no reutiliza `TagChips`.
  - Deletion requiere escribir slug y abrir modal; no muestra conteo de uso ni bloqueo por uso.
  - No comparte estilos/UX con Moods/Usos (sin panel de sugerencias ni botón “Ver todos”).

## Paso 2 — API/contrato para categorías
- [x] Exponer GET `/api/categories?query=` (autocomplete, límite 20, orden alfa) filtrando `type=CATALOG`.
- [x] Exponer POST `/api/categories` para crear categoría (slug único case-insensitive, rechazar duplicados cercanos con distance<=1).
- [x] Exponer DELETE `/api/categories` para borrar por id/slug (limpia pivote TrackTag).
- [x] Respuesta alinea contrato TagChips: `{ items }` en GET y `{ item }`/409 `{ suggestions }` en POST; DELETE `{ ok:true }`.

## Paso 3 — Hook wrapper `CategoryChips`
- [x] Crear wrapper (similar a MoodChips/UseChips) que use `TagChips` configurado con:
  - normalizar → Title Case para mostrar/guardar (slug queda en meta).
  - `maxItems` configurable (default 15).
  - endpoints de Paso 2 + delete + save inline opcional.
  - `allowCreate=true`, `allowDelete=true`.
- [x] Serializar selección para el formulario (hidden input con slugs) y opcional guardado inline si hay `trackId`.

## Paso 4 — UI en TrackEdit/CreativeForm
- [x] Reemplazar UI actual de categorías por `CategoryChips`, manteniendo layout en Creative/TrackEdit.
- [x] Botón/búsqueda usan TagChips (mismo patrón que Moods/Usos).
- [x] Chips asignados vs sugeridos gestionados por TagChips; desasignar los devuelve a sugeridos.

## Paso 5 — Persistencia inline
- [x] Conectar `CategoryChips` a endpoint inline (`/api/tracks/[id]/route PATCH catalogTags`) mediante `saveUrl` en `useTagCatalog`.
- [ ] Manejar loading/errores con toasts o badges (“Guardando… / Error”).
- [x] Limitar a 10 categorías por track; mostrar mensaje si se supera.

## Paso 6 — Borrado seguro
- [x] Añadir botón de borrar en sugeridos (TagChips con allowDeleteCatalog + modal).
- [x] Bloquear borrado si la categoría está asignada al track (se rechaza en onDeleteCatalog).

## Paso 7 — QA rápido
- [x] Flujo crear → asignar → desasignar: la categoría vuelve a sugeridos y persiste tras recarga (validar manualmente).
- [x] Autocompletar y “Ver todos” muestran catálogo filtrando los ya asignados (TagChips filtra por selected).
- [ ] Mobile: panel no se desborda; botones caben en una línea o colapsan bien.
- [x] Re-ejecutar `npx tsc --noEmit`.

## Paso 8 — Documentar
- [x] Anotar en `docs/debug/terminal.md` cualquier error y fix. (Sin errores nuevos; se agregó nota en QA parcial)
- [x] Marcar checkboxes de este plan conforme se avanza.
