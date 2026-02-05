# 019 · Modules Fix (Moods base → Usos/Categorías)

## Contexto y rumbo
- Moods funciona bien. Usos funciona “casi”, Categorías ha sido inestable (no persistía asignados). La idea: limpiar Usos/Categorías y reconstruirlos replicando exactamente el patrón de Moods.
- “Módulo” = sección completa (título, chips, inputs, botones). El Módulo de Moods será el modelo a replicar.
- Queremos componentes realmente reutilizables para futuros campos (ej. “TAGS de TIPO DE LICENCIA”), reutilizando lógica y UI de chips/asignados/sugeridos/creación/borrado.
- Evitar guardado automático/onBlur: preferimos un botón explícito “Guardar Moods/Usos/Categorías” (mismo tamaño/estilo que el botón “+ Moods” y situado encima de él).
- Mantener colores/estética/UX actual de Moods; no cambiar visuales salvo necesidad funcional.
- Categorías arrastra código antiguo (pre-Moods). Se requiere limpieza profunda de archivos/bloques obsoletos para evitar lógicas cruzadas.

## Plan paso a paso (checklist)

### Bloque A · Auditoría y limpieza previa
- [x] A1. Inventario de Usos/Categorías con posible lógica antigua y qué hacer con cada uno:
  - `src/components/admin/track/CatalogTagsForm.tsx` → flujo legacy de categorías (formularios manuales). **Acción:** retirar del render/uso y desactivar al reconstruir módulo Categorías.
  - `src/app/admin/track/actions/update-catalog-tags.ts` → acción server usada por `CatalogTagsForm`. **Acción:** deprecada; eliminar o aislar.
  - `src/app/api/categories/route.ts` → API actual; mantener, pero revisar al replicar patrón Moods.
  - `src/app/api/tracks/[id]/categories/route.ts` → API inline actual; se mantendrá pero se alinea al nuevo módulo.
  - `src/components/admin/track/CategoryChips.tsx` → wrapper actual; se reconstruirá copiando patrón Moods.
  - `src/components/admin/track/UseChips.tsx` + `src/app/api/uses/route.ts` + `/api/tracks/[id]/uses/route.ts` → flujos actuales de Usos; se reconstruirán con patrón Moods y botón Guardar.
  - `src/components/ui/TagChips.tsx` + `src/hooks/useTagCatalog.ts` → base de chips/catalog; se reutilizarán y ajustar props según patrón Moods.
  - Formularios/acciones de “Guardar todo”: `update-all.ts` usa `catalogTags`; mantener, pero asegurarse de que no interfiera con guardado explícito de los módulos.
  - Seeds/TagType: `prisma/schema.prisma` (TagType CATALOG/GENERIC) + seeds en `/api/uses` y `/api/categories`; revisar si se requieren tras limpieza.
- [x] A2. Revisar BD: tipos TagType (GENERIC/CATALOG), pivotes TrackTag, seeds previas. Decidir si se hace truncate/selectiva (solo si necesario) para limpiar datos mal formateados. (Resultado: CATALOG=15, GENERIC=2, TrackTag=3, sin duplicados).
- [x] A3. Documentar en `docs/debug/terminal.md` cualquier reset/seed/alter que se ejecute. (No hubo resets/seed; sólo lectura.)

### Bloque B · Fortalecer Módulo base (Moods)
- [x] B1. Confirmar que Moods funciona 100%: asignar/desasignar/crear/borrar, persistir tras recarga, sin parpadeo.
- [x] B2. Quitar guardado automático/onBlur: controlar cambios en estado local y añadir botón “Guardar Moods” encima de “+ Moods” (misma anchura/estilo). Este botón disparará el POST inline.
- [x] B3. Extraer componentes reutilizables desde Moods: 
  - [x] Chips UI/base (`TagChips` ya existe, validar props necesarias). Se añadió `renderAboveAssigned`/`renderAboveToggle` para colocar botones (ej. Guardar) sin duplicar layout.
  - [x] Wrapper de módulo (contenedor con heading, listado asignados, sugeridos, input, botones). → `TagModule` creado.
  - [x] Hook de catálogo (`useTagCatalog`) afinado para el flujo con botón de guardar (opción `onSaved` para hidratar estado inmediato).
- [x] B4. QA Moods: abrir `/admin/track/[id]/edit` → Moods → crear mood nuevo, asignar, desasignar, borrar sugerido, recargar y confirmar persiste sin parpadeo.

### Bloque C · Reconstruir Usos sobre patrón Moods
- [x] C1. Eliminar/aislar lógica vieja de Usos (endpoints, acciones, componentes legacy si aplica). (Se migró UseChips al nuevo módulo; quedan APIs vigentes, no legacy visible).
- [x] C2. Reimplementar UseChips usando el patrón de Moods + botón “Guardar Usos”. (UseChips ahora usa TagModule, guardado explícito y hook unificado.)
- [x] C3. Paridad total con Moods: normalización en MAYÚSCULAS (label/value/meta.slug), sin fetch extra; usar payload de POST como rehidratación.
- [x] C4. Smoke Usos: crear uso, asignar, desasignar, borrar de sugeridos, recargar; confirmar mayúsculas y persistencia inmediata.

### Bloque D · Reconstruir Categorías sobre patrón Moods
- [x] D1. Limpieza profunda: retirar formularios/acciones legacy (ej. `CatalogTagsForm`, `update-catalog-tags` si queda en uso) y dejar un solo flujo basado en Moods. (Archivo `update-catalog-tags.ts` eliminado; `CatalogTagsForm` marcado deprecated y no usado en el flujo nuevo.)
- [x] D2. Reimplementar CategoryChips con el mismo patrón (botón “Guardar Categorías”), normalización slugify a CATALOG, misma UI.
- [x] D3. Paridad total con Moods/Usos: normalización en MAYÚSCULAS + slugify, rehidratación inmediata con payload de POST; skip fetch inicial si hay datos SSR para evitar parpadeo.
- [x] D4. Verificar endpoints `/api/categories` y `/api/tracks/[id]/categories` sigan contrato `{ items }`, con upsert/promote a CATALOG (normalizando NAME en MAYÚSCULAS).
- [x] D5. Smoke Categorías: crear/assign categoría, desasignar, borrar de sugeridos, recargar; confirmar aparece en asignados sin delay apreciable y se mantiene en sugeridos.

### Bloque E · Reutilización futura
- [ ] E1. Documentar en `AI_CONTEXT.md` el contrato de módulo reusable: props, hooks, endpoints esperados, botón Guardar.
- [ ] E2. Esbozar cómo instanciar el módulo para un nuevo campo (ej. “Tipos de licencia”): qué endpoints, normalizadores y textos cambiar.

### Paso 8 — QA (checklist)
- [ ] Moods: crear, asignar, borrar, recargar (con botón Guardar).
- [ ] Usos: crear, asignar, borrar, recargar (con botón Guardar).
- [ ] Categorías: crear, asignar, borrar, recargar (con botón Guardar).
- [ ] Conflictos: crear nombre similar → 409; borrar sugerido con popup; maxItems respetado.
- [ ] Registrar resultados/errores en `docs/debug/terminal.md`.

## Notas operativas
- Mantener UI/colores de Moods; no tocar salvo pedido explícito.
- Botón “Guardar …” encima de “+ …”, mismo tamaño/estilo.
- Evitar onBlur/autosave; usar guardado explícito.
- Cada bloque se marca con [x] al completar; documentar hallazgos/reset en `docs/debug/terminal.md`.

## Preguntas del usuario
1) ¿Cambiar de chat para que el plan sea la única fuente de verdad? No es necesario; podemos seguir aquí usando este plan como referencia.  
2) ¿Seleccionar un modo especial para el nuevo rumbo? No hace falta; seguiremos con el modo actual.
