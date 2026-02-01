# RESUMEN DE CAMBIOS (Sesión actual)

## Responsive (público + admin)
- **Base**: padding responsivo en shells, helpers globales (`.stack-sm`, `.table-scroll`, `.touch-gap`, `.full-sm`, `.btn-touch`), body `text-sm` y radius centralizado.
- **Catálogo público**: tabla con scroll-x, header responsivo, categorías en wrap, waveform más bajo (22px), tooltips accesibles.
- **Track público**: hero apilable en mobile (cover + waveform + botones), metadata compacta; “Piezas similares” reutiliza layout del catálogo con scroll-x.
- **Servicios**: formularios stack en mobile (inputs full-width, CTA adaptables), breakdown sticky solo en desktop.
- **Admin requests**: filtros en grid responsivo, lista con scroll-x; detalle con tablas en `table-scroll`.
- **Admin tracks list**: tabla con scroll-x y min-width.
- **Admin track edit**: botón “Guardar todo” adaptable; tablas de Writers/Publishers/Master con `table-scroll`.

## Nuevas páginas de servicios
- **/servicios/design**: página completa de Diseño Gráfico con hero, catálogo de servicios, proceso, paquetes y CTAs (shadcn cards, botones e íconos).
- **/servicios/sound-design**: página de Diseño Sonoro para audiovisual con módulos de servicio, flujo de trabajo, entregables y opcionales (shadcn cards, botones, íconos).

## Catálogo dividido por tags
- Rutas públicas: `/catalog` (canónica). Landings `/beats`, `/sync`, `/games` aplican filtro pero canonical → `/catalog`.
- Tracks: canónica fija `/track/[id]` (alias segmentadas apuntan/redirect a la base). Enlaces de “similares” y “copiar link” usan la URL limpia.
- Admin: en `/admin/track/[id]/edit` la gestión de tags de catálogo ahora es drag-less en 3 columnas (asignados/disponibles/agregar/eliminar) con guardado inmediato vía server action; tags se auto-upsert para que siempre aparezcan. ISRC/ISWC/UPC ahora opcionales.
- Nuevo API loader `/api/catalog/list` y helper `fetchCatalogTracks` para catálogos embebibles por filtros (tags/moods/artist/q).

## Admin Requests
- **Lista**: selección con checkbox al final, hover por fila, color de selección, creación de dummies (Single/Álbum) con datos aleatorios, botón de refresco, botón de eliminación masiva con confirmación en diálogo shadcn.
- **Detalle /admin/requests/[id]**: diseño tipo informe (cards de Cliente/Estado/Detalle), badges para status/urgencia, payload en acordeón colapsable por defecto.
- **API**: endpoint `POST /api/admin/requests/bulk-delete` para eliminar múltiples ContactRequest.

## UI / Tokens
- Color accent primario cambiado a **Indigo** (variables `--lm-accent`, hover y outline) en `globals.css`.
- Checkbox ahora usa tokens de `primary` (sin hardcode).
- Tooltip: flecha oculta globalmente; contenido sin animaciones que desplazaban la flecha.

## Documentación
- Archivo creado: `docs/RESUMEN.md` (este resumen).

## Tests / Auditoría rápida
- `npm test` (vitest) falla porque no hay server en http://localhost:3000 (errores de conexión). No se modificaron tests.

## Rutas para revisar
- Público: `/servicios/design`, `/servicios/sound-design`.
- Admin: `/admin/requests`, `/admin/requests/[id]`, bulk delete `POST /api/admin/requests/bulk-delete`.

## Notas
- Dummies de requests escriben en BD usando `/api/services/mix`. Eliminación masiva borra en BD.
- Color indigo aplica a componentes que consumen `--primary` (checkbox, botones primarios, etc.).

- Derechos & publishing: admin ahora soporta múltiples shares Writer/Publisher con guardado inmediato (PublishingShare), tabla editable y confirmación de cambios.
- Master: titulares múltiples (MasterShare) con tabla editable, suma de %, guardado inmediato; campo de texto legacy oculto.
