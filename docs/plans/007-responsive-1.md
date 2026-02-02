# 07 · Responsive universal (desktop → mobile) — plan guiado paso a paso

Objetivo: Adaptar **todo el proyecto** a mobile (>=320px) sin romper desktop. Cada paso puede ejecutarse y validarse de forma incremental. Usa este archivo como checklist.

## Paso 0 · Lineamientos y helpers globales
- [x] Revisar/ajustar breakpoints de referencia: `sm=640`, `md=768`, `lg=1024`, `xl=1280`.
- [x] Mantener radio global (`--lm-radius`) y aplicar a rounded util en `globals.css`.
- [x] Añadir helpers CSS reutilizables:
  - `.stack-sm` (convierte a columna en `md`↓).
  - `.table-scroll` (wrapper con `overflow-x-auto`, `min-w`).
  - `.touch-gap` (padding/gap ampliado para touch en `sm`).
- [ ] Verificar header/footer/player: altura mínima, z-index, padding inferior en páginas largas.

## Paso 1 · Base/layout
- [x] Layout raíz y contenedores `max-w`/padding responsivo (público + admin).
- [x] Tipografía y tamaños: asegurar `text-sm` default, reducir a `text-xs` sólo en tablas densas; incrementar `line-height` en mobile si es necesario.
- [x] Botones: permitir `w-full` en `sm` para CTAs principales; hit-area ≥40px.

## Paso 2 · Público: catálogo
- [x] `/catalog` (y alias): tabla -> `table-scroll`; asegurar columnas críticas visibles (Título/Artista, Waveform compacto, Dur/BPM, Acciones).
- [x] Controles de filtro/búsqueda: stack en `sm`, espaciado vertical; chips/badges con touch-friendly padding.
- [x] Tooltips en iconos: fallback `aria-label` para touch.
- [x] Waveform: ancho 100%, altura reducida en `sm`, padding lateral mínimo.

## Paso 3 · Público: track detail `/track/[id]`
- [x] Hero: cover + waveform apilados en `sm`; botones (copiar/licenciar) en fila/stack según ancho.
- [x] Metadata / ficha técnica / usos: tarjetas apiladas, `grid md:grid-cols-2` en desktop.
- [x] Piezas similares: reutilizar layout del catálogo con `table-scroll`; márgenes compactos en `sm`.

## Paso 4 · Servicios (mix/master, design, sound design)
- [x] Steps/CTA hero: stack en `sm`.
- [x] Formularios: inputs full-width; dividir en 1 columna `sm`, 2 columnas `md+`.
- [x] Breakdown/total: card con sticky sólo en `md+`; en `sm` colocarlo debajo del formulario.
- [x] Tooltips/modal info: asegurar tap objetivo y cierre fácil en mobile.

## Paso 5 · Admin: requests (lista)
- [x] Tabla/lista shadcn tasks: `table-scroll`, columnas compactas; acciones accesibles (botones con padding).
- [x] Filtros y bulk actions: stack en `sm`; botones icónicos con labels sr-only si es necesario.
- [x] Hover/row states: mantener, pero no depender de hover para descubrir acciones.

## Paso 6 · Admin: requests (detalle `/admin/requests/[id]`)
- [x] Secciones en columnas → stack en `sm`.
- [x] Payload colapsable usable en mobile (tap target grande).
- [x] Tipos y etiquetas alineados; `table-scroll` si hay tablas.

## Paso 7 · Admin: tracks list (si aplica)
- [x] Tabla scrollable; columnas críticas visibles; acciones en botón icónico con tooltip/label.

## Paso 8 · Admin: track edit
- [x] Secciones largas (`TrackEditForm`): usar `grid md:grid-cols-2` → `grid-cols-1` en `sm`; reducir gaps.
- [x] Tablas de shares/master (`RightsFormClient`): 
  - `table-scroll` en `sm`.
  - Celdas compactas, inputs 100% ancho; DnD handle-only ya aplicado.
  - Botón “Guardar todo” visible y usable en mobile (considerar `w-full sm:w-auto`).
- [x] Otros bloques (stems/versions/restricciones): stack y scroll-x donde aplique.

## Paso 9 · Componentes transversales
- [x] Buttons/inputs/selects/tooltips/modals: revisar tamaños en mobile; padding/hit-area.
- [x] Audio components (WaveformScrubber/PublicAudioBar): alturas y paddings responsivos; evitar overflow.

## Paso 10 · QA
- [x] Breakpoints: 320, 375, 414, 768, 1024, 1280.
- [x] Flujos: catálogo → track → acciones; servicios formulario envío; admin requests CRUD; admin track edit (shares/master con DnD).
- [x] Validar scroll-x en tablas y que no aparezcan scrollbars innecesarios.
- [x] Probar DnD en mobile (writer/publisher/master) y que el handle-only siga permitiendo selección de texto en inputs.

## Paso 11 · Documentación
- [x] Actualizar `RESUMEN.md` y `AI_CONTEXT.md` con cobertura responsive.
- [x] Si hubo cambios de helpers, documentarlos en `docs/debug/debug.md` o `RESUMEN.md`.
- [ ] Confirmar push final a `codex1`.
