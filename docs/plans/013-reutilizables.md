# 013 · Sistema reutilizable de chips (TagChips) para múltiples dominios

Objetivo: consolidar un componente base (`TagChips`) y un flujo de datos reusable (hooks/servicios) para aplicarlo en Moods y extrapolarlo fácilmente a Usos y Categorías.

## Pasos de implementación (marca `[ ]` → `[x]`)

**Paso 1 — Auditoría rápida**
- [x] Revisar `TagChips.tsx` y `MoodChips.tsx` para listar props y variantes ya soportadas.
- [x] Anotar gaps de accesibilidad, manejo de loading/errores y estilos compartidos.

**Paso 2 — API y contratos comunes**
- [x] Definir contrato de ítem `{ id, label, value }` y funciones: `fetchAll()`, `fetchSuggestions(q)`, `onCreate(label)`, `normalize(raw)`.
- [x] Documentar en `TagChips` los requisitos mínimos (sin acoplar a moods).
- [x] Asegurar que el catálogo se filtre por `selected` y `query` (ya presente) y que acepte `maxItems`.

**Paso 3 — Hook de catálogo reusable**
- [x] Crear `useTagCatalog.ts` (en `src/hooks/` o `src/components/ui/`) que reciba endpoints y normalizador.
- [x] Retornar: `items`, `loading`, `suggestions`, `fetchAll`, `fetchSuggestions`, `create`. *(loading para create; fetch* devuelven chips; sugerencias/ítems se obtienen vía funciones.)*
- [x] Reutilizar debounce existente o añadirlo aquí para centralizar. *(Mantuvimos debounce en TagChips; hook provee funciones puras, listas para ser envueltas por el debounce actual o moverlo después.)*

**Paso 4 — Ajustes en TagChips (base)**
- [x] Pulir props opcionales (placeholders, textos, límites, toggles).
- [x] Unificar estilos para light/dark sin inline colors, usando tokens.
- [x] Confirmar comportamiento mobile: sin overflow, input clear, panel inline.
- [x] QA visual hover (rojo matte), X solo en hover sobre la X.

**Paso 5 — Wrappers por dominio**
- [x] `MoodChips`: usar `useTagCatalog` con endpoints `/api/moods`, normalizar a mayúsculas, `maxItems=10`.
- [x] `UseChips`: crear wrapper para “Usos” (normalizar a Title Case o minúsculas), endpoints a definir (`/api/uses`), límite configurable.
- [x] `CategoryChips`: wrapper para categorías (normalizar slug/name), endpoints `/api/categories` (o ruta real).
- [x] Cada wrapper expone `name`, `initialItems`, `error`, y serializa hidden input como lista (como en moods).

**Paso 6 — Backend/endpoints (si faltan)**
- [x] Añadir endpoints REST para usos y categorías: GET con búsqueda, POST con creación protegida contra duplicados.
- [x] Validar unicidad case-insensitive; devolver 409 con sugerencias cuando corresponda.
- [x] Añadir seeds mínimos para pruebas (usos y categorías base).

**Paso 7 — Integración en formularios**
- [x] Reemplazar textareas/inputs actuales por `UseChips` y `CategoryChips` donde apliquen. *(Usos ahora usa UseChips; categorías ya se manejan por CatalogTagsForm, se mantiene por ahora.)*
- [x] Mantener “Moods” tal como está, pero consumiendo el hook compartido.
- [x] Verificar maquetado en `CreativeForm` (o formularios que correspondan) en desktop/mobile. *(Creativo sigue 2 cols en desktop y stack en mobile; panel de chips sin overflow.)*

**Paso 8 — QA y DX**
- [ ] Tests manuales: añadir/eliminar chips, crear nuevo, filtrado por texto, límite `maxItems`, hover rojo, mobile sin overflow.
- [ ] Confirmar persistencia en BD y recarga muestra chips correctos.
- [ ] Documentar en `docs/debug/terminal.md` si hubo errores y cómo se resolvieron.

## Guía para extrapolar a otros campos

- Crear un wrapper `XChips` que:
  1. Defina `normalize` (cómo se capitaliza o slugifica).
  2. Configure endpoints `fetchAll`, `fetchSuggestions`, `onCreate`.
  3. Ajuste `maxItems`, labels y placeholders.
  4. Serialice el valor para el formulario (hidden input o estado controlado).
- Reutilizar el mismo `TagChips` sin modificar estilos ni lógica: solo props.
- Si un dominio no admite creación libre, pasar `allowCreate={false}` y omitir `onCreate`.
- Para catálogos muy grandes, hacer `fetchAll` paginado y mostrar solo `fetchSuggestions`.

## QA rápido sugerido
- [ ] Desktop y Mobile: abrir panel, escribir, filtrar, crear, eliminar.
- [ ] Verificar que ítems seleccionados desaparezcan de sugerencias/lista.
- [ ] Límite `maxItems` muestra aviso y bloquea añadir.
- [ ] Dark/light: contraste de chips y botón Moods (gris en hover).
- [ ] Formularios: valores se serializan correctamente al enviar.
