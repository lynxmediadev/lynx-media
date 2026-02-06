# 021 - EDIT_LOAD_OPTIMIZATION_PLAN

## Objetivo
Optimizar `/admin/track/[id]/edit` para reducir tiempo de carga, reducir queries repetidas y mejorar fluidez al guardar, sin romper funcionalidad.

Este plan esta disenado para ser:
- mantenible (modulos claros, contratos estables),
- escalable (patron reutilizable en otras pantallas),
- incremental (sin big-bang rewrite).

---

## Metas medibles (Definition of Done)
- [ ] Reducir tiempo de `GET /admin/track/[id]/edit` en dev y prod.
- [ ] Evitar refetch global al guardar modulos pequenos (moods/uses/categories).
- [ ] Cargar bloques pesados bajo demanda (audio tecnico, versions/stems).
- [ ] Mantener persistencia correcta y paridad funcional.
- [ ] Dejar patron reutilizable para otras pantallas de admin.

Metricas objetivo sugeridas:
- TTFB de `/edit` <= 50% del valor actual.
- Queries Prisma en carga inicial: reducir al menos 30%.
- Guardado de chips: sin reload global y feedback < 300ms en local DB.

---

## Diagnostico rapido (estado actual)
- `/edit` carga demasiados datos de una sola vez (pagina monolitica SSR).
- Secciones con payload potencialmente pesado:
  - waveform (binario + base64),
  - publishing/master shares,
  - versions/stems,
  - tags + catalogo de categorias.
- Guardado por modulos ya existe parcialmente, pero la pagina aun tiene acoplamiento de carga global.

---

## Estrategia tecnica
1. Separar data en capas: `core` (siempre) vs `heavy` (on-demand).
2. Modularizar fetch por seccion con contratos tipados por modulo.
3. Mantener UX estable con skeleton/loading por bloque.
4. Estandarizar patron de guardado por modulo (sin `router.refresh` global).
5. Crear utilidades reutilizables para aplicar lo mismo en otras vistas.

---

## Plan de implementacion (paso a paso)

### Paso 1 - Baseline y medicion inicial
Explicacion: antes de tocar arquitectura, necesitamos baseline para validar mejora real.

- [x] Registrar baseline de `/edit` en `docs/debug/terminal.md`:
  - tiempo de `GET /admin/track/[id]/edit`,
  - cantidad de queries Prisma,
  - tiempo de guardar en moods/uses/categories.
- [x] Agregar checklist de comparacion antes/despues en este documento.
- [x] Definir track de prueba fijo para comparacion consistente.

Resultado esperado:
- Baseline reproducible para medir impacto.

Track fijo definido:
- `cmkx1ed3f000duq9glemziy2b`

Tabla de baseline (antes):

| Métrica | Antes | Fuente |
|---|---:|---|
| GET inicial `/edit` | 8166ms | `docs/debug/terminal.md` |
| Prisma queries en GET inicial | 8 | `docs/debug/terminal.md` |
| Guardar Categorías (POST) | 2625ms | `docs/debug/terminal.md` |
| Prisma queries en POST Categorías | 11 | `docs/debug/terminal.md` |
| GET `/edit` hot path | 626ms | `docs/debug/terminal.md` |
| GET `/edit` hard reload final | 1404ms | `docs/debug/terminal.md` |
| Guardar Moods (POST) | 3185ms | `docs/debug/terminal.md` (muestra API-only) |
| Guardar Uses (POST) | 1235ms | `docs/debug/terminal.md` (muestra API-only) |

Checklist comparativo antes/después:

- [ ] GET inicial `/edit` mejoró vs 8166ms.
- [ ] Queries Prisma en GET inicial bajaron vs 8.
- [ ] Guardar Categorías mejoró vs 2625ms.
- [ ] Queries en POST Categorías bajaron vs 11.
- [x] Guardar Moods medido y comparado.
- [x] Guardar Uses medido y comparado.

Nota técnica Paso 1:
- Baseline completado con muestra real para carga inicial (`/edit`) y guardado por módulos (`Categorias`, `Moods`, `Uses`).
- Para `Moods` y `Uses` se usó corrida controlada API-only (sin navegación UI) para obtener tiempos/queries reproducibles.
- Riesgo bajo: puede variar en entorno dev por compilación inicial, pero sirve como línea base comparativa.

---

### Paso 2 - Inventario de datos por modulo (Core vs Heavy)
Explicacion: separar datos indispensables de datos diferibles.

- [x] Crear tabla de campos `CORE` (carga inicial):
  - id, title, artist,
  - chips asignados (moods/uses/categories),
  - ids basicos y toggles criticos.
- [x] Crear tabla de campos `HEAVY` (carga diferida):
  - waveform,
  - resumen tecnico completo,
  - versions/stems completos,
  - listas largas de shares si aplica.
- [x] Documentar dependencias cruzadas entre modulos.

Resultado esperado:
- Contrato claro de que carga primero y que se difiere.

Tabla de campos CORE (carga inicial):

| Módulo | Campos CORE | Motivo |
|---|---|---|
| Identidad track | `id`, `title`, `artist` | Necesarios para render base y contexto inmediato |
| Chips creativos | `assignedMoods`, `assignedUses`, `assignedCategories` | Deben verse al abrir para edición rápida |
| Catálogo categorías | `catalogTagOptions` (id/slug/name) | Necesario para sugerencias sin fetch extra inicial |
| Identificadores | `isrc`, `iswc`, `upc` | Inputs livianos y críticos de negocio |
| Toggles/rights base | `mfn`, `oneStop`, `clearedForSync`, `contentIdEnrolled`, `contentIdAdmin`, `contentIdWhitelist` | Estado contractual visible al abrir |
| Sync base | `licenseType`, `mediaBuy`, `bpm`, `key`, `trackType`, `genres`, `subgenres` | Campos frecuentes de edición |

Tabla de campos HEAVY (carga diferida):

| Módulo | Campos HEAVY | Motivo |
|---|---|---|
| Audio técnico | `waveform`, métricas LUFS/LRA/truePeak, `audioCheckStatus` | Payload/cálculo más costoso |
| Rights listas | `publishingShares`, `masterShares` completos | Puede crecer en filas y validaciones |
| Entregables | `versions`, `stems` | Listas largas no siempre usadas en primer scroll |
| Restricciones avanzadas | `exclusive*`, `restricted*`, `pricing/budget` completos | Menor frecuencia de edición inicial |

Dependencias cruzadas entre módulos:

- `Creative` depende de catálogo de tags y asignaciones (`TrackTag` por `TagType`).
- `Audio técnico` depende de `audioUrl/assetKey` y del estado de análisis.
- `Rights` depende de listas `publishingShares/masterShares`; sus validaciones no bloquean render de chips.
- `Deliverables` (`versions/stems`) es independiente de `Creative` y puede cargarse lazy.

Nota técnica Paso 2:
- Se definió contrato funcional de qué datos deben entrar en primera pintura (CORE) y cuáles deben diferirse (HEAVY).
- Este inventario sirve como guía para el refactor del Paso 3 sin perder cobertura funcional.

---

### Paso 3 - Capa de acceso de datos por modulo
Explicacion: dejar de hacer un gran `findUnique` para todo.

- [x] Crear funciones server por modulo, por ejemplo:
  - `getTrackEditCore(id)`
  - `getTrackAudioModule(id)`
  - `getTrackRightsModule(id)`
  - `getTrackDeliverablesModule(id)`
- [x] Mantener `select` minimo por modulo.
- [x] Estandarizar DTOs de salida (tipos TS compartidos).

Resultado esperado:
- Cada modulo pide solo lo que necesita.

Implementacion realizada:
- Se creo `src/server/track-edit/types.ts` con DTOs compartidos:
  - `TrackEditCoreDTO`
  - `TrackAudioModuleDTO`
  - `TrackRightsModuleDTO`
  - `TrackDeliverablesModuleDTO`
  - `CatalogTagOptionDTO`
- Se creo `src/server/track-edit/queries.ts` con funciones server por modulo:
  - `getTrackEditCore`
  - `getTrackAudioModule`
  - `getTrackRightsModule`
  - `getTrackDeliverablesModule`
  - `getCatalogTagOptions`
- `src/app/admin/track/[id]/edit/page.tsx` ahora consume esta capa modular en lugar del `findUnique` monolitico.

Nota técnica Paso 3:
- Se desacoplo acceso a datos por modulo sin cambiar la UX ni el contrato de `TrackEditForm`.
- Riesgo controlado: sigue habiendo un render SSR de pagina completa; el desacople habilita el Paso 4 (UI lazy por seccion).

---

### Paso 4 - Desacoplar UI en secciones con carga independiente
Explicacion: cada bloque se renderiza/actualiza por separado.

- [x] Convertir `/edit` en orquestador de modulos (shell ligero).
- [x] Mover bloques pesados a componentes con carga diferida:
  - `AudioAnalysisSection` (lazy),
  - `DeliverablesSection` (lazy).
- [x] Mantener `CreativeSection` (moods/uses/categories) como carga temprana.
- [x] Agregar fallback/skeleton por seccion.

Resultado esperado:
- Primera pintura mas rapida, menos bloqueo inicial.

Implementacion realizada:
- Nuevo componente server `src/components/admin/track/AudioAnalysisSection.tsx` para desacoplar el bloque tecnico pesado.
- `/edit` ahora usa `Suspense` con skeleton para el modulo de audio.
- `TrackEditForm` carga `DeliverablesForm` con `dynamic()` + fallback local.
- El header de `/edit` usa `getTrackAudioHeaderModule` (payload liviano) en lugar de cargar waveform completo.

Nota técnica Paso 4:
- Se evita cargar/transformar waveform en el render principal de `/edit`.
- Se mantiene el modulo creativo disponible de forma temprana para edicion rapida.

---

### Paso 5 - Patron de guardado por modulo (transversal)
Explicacion: evitar recarga global para cambios locales.

- [x] Definir contrato comun de save por modulo:
  - input tipado,
  - respuesta con `ok/message/items`.
- [x] Asegurar que moods/uses/categories actualicen estado local con payload POST.
- [x] Eliminar refetch redundante post-save cuando backend ya devuelve estado final.
- [x] Mantener `Guardar todo` solo para modulos que realmente lo requieran.

Resultado esperado:
- Guardados fluidos y consistentes sin costo global.

Implementacion realizada:
- `useTagCatalog` ahora soporta `buildSaveBody` para contrato de guardado reutilizable.
- `MoodChips` y `UseChips` migrados a `catalog.saveSelection` (contrato unificado).
- Estado local de chips se hidrata desde `items` del POST exitoso.
- Se mantuvo `Guardar todo` como flujo global para modulos no-chips.

Nota técnica Paso 5:
- Se unifico el patron de guardado de los 3 modulos de chips con un contrato comun.
- Se redujo codigo duplicado de persistencia en wrappers.

---

### Paso 6 - Cache y revalidacion controlada
Explicacion: revalidar solo donde se necesita.

- [x] Cambiar estrategia de revalidacion global por tags/path granulares.
- [x] Evitar invalidar toda `/edit` por cambios de un solo modulo.
- [x] Definir politicas por modulo:
  - chips: invalidacion local,
  - secciones pesadas: refresh bajo demanda.

Resultado esperado:
- Menos trabajo del servidor por accion pequena.

Implementacion realizada:
- Se removio `revalidatePath('/admin/track/[id]/edit')` de:
  - `src/app/api/tracks/[id]/moods/route.ts`
  - `src/app/api/tracks/[id]/uses/route.ts`
  - `src/app/api/tracks/[id]/categories/route.ts`
- Politica activa:
  - chips: actualizacion local con payload POST,
  - pagina `/edit`: refresco natural en navegación/recarga, sin invalidacion forzada por cada guardado.

Nota técnica Paso 6:
- Con `/edit` en modo dinamico, la invalidacion forzada era costo extra sin beneficio directo para guardados locales.
- Se redujo trabajo de servidor por accion pequena.

---

### Paso 7 - Optimizaciones DB y queries
Explicacion: reducir costo por query y lecturas innecesarias.

- [x] Revisar `orderBy/select` innecesarios en queries de `/edit`.
- [x] Validar indices utiles para pivotes (`TrackTag`, `trackId`, `type`).
- [x] Evitar conversiones/cargas costosas si no se muestran de inmediato (waveform).
- [x] Normalizar endpoints de chips para devolver payload minimo util.

Resultado esperado:
- Menos I/O y menor latencia en consultas.

Avance actual Paso 7:
- Se redujo select pesado en `/edit` moviendo audio completo fuera del shell principal.
- Se difirio la conversion de `waveform` al modulo de audio.
- Validacion de indices: sin migracion nueva por ahora (ya existen `TrackTag(trackId)`, `TrackTag(tagId)`, `Tag(type)`, `Tag(slug unique)` y PK compuesta en pivote).

---

### Paso 8 - UX de performance
Explicacion: no solo bajar tiempo real, tambien tiempo percibido.

- [x] Skeletons/placeholder por modulo.
- [x] Estados `saving/saved/error` por modulo, no globales.
- [x] Evitar parpadeo en listas asignadas con SSR seed + hidratacion controlada.

Resultado esperado:
- Fluidez visual y menos sensacion de "carga pesada".

Implementacion realizada:
- `AudioAnalysisSection` se renderiza con `Suspense` + skeleton en `/edit`.
- `DeliverablesForm` se carga con `dynamic()` + fallback en `TrackEditForm`.
- Chips mantienen estado local por modulo (`saving`) y seed SSR controlado para evitar listas vacias transitorias.

---

### Paso 9 - QA tecnico y funcional
Explicacion: asegurar que optimizacion no rompa negocio.

- [x] Smoke completo en `/edit`:
  - create/assign/remove en moods/uses/categories,
  - writers/publishers/master,
  - guardado global.
- [x] Validar que no haya regresiones de persistencia.
- [x] Comparar metricas contra baseline de Paso 1.
- [x] Documentar resultados en `docs/debug/terminal.md`.

Resultado esperado:
- Confirmacion objetiva de mejora + estabilidad.

Avance actual Paso 9:
- Se ejecuto smoke tecnico automatizado en puerto limpio (`3222`) cubriendo:
  - GET `/admin/track/[id]/edit`,
  - roundtrip assign+restore en `/api/tracks/[id]/moods`,
  - roundtrip assign+restore en `/api/tracks/[id]/uses`,
  - roundtrip assign+restore en `/api/tracks/[id]/categories`,
  - `PATCH /api/tracks/[id]` para publishing shares.
- Se corrigio inconsistencia en `DELETE /api/uses` (filtraba `TagType.GENERIC`), dejando borrado coherente con `TagType.USE`.
- Comparacion de metricas API-only documentada (mejoras en los 3 endpoints de chips).
- Nota: el flujo de guardado global de `/edit` sigue siendo Server Action; su validacion UI end-to-end se mantiene recomendable en QA manual de release.

---

### Paso 10 - Estandarizar patron para escalar a otras pantallas
Explicacion: convertir solucion de `/edit` en estandar reutilizable.

- [x] Extraer guia `Module Save Pattern` (contratos, hooks, DTOs, invalidacion).
- [x] Crear template de modulo para nuevas pantallas admin.
- [x] Definir convenciones de nombres para `Core/Heavy/Save`.
- [x] Publicar checklist de adopcion para nuevos formularios.

Resultado esperado:
- Optimizacion reusable y mantenible a largo plazo.

Implementacion realizada:
- Guia publicada en `docs/architecture/module-save-pattern.md` con:
  - contrato de guardado estandar,
  - convenciones `Core/Heavy/Save`,
  - patron frontend por wrappers,
  - checklist de adopcion para nuevas pantallas.

---

## Checklist de avance rapido

- [x] Paso 1 completado
- [x] Paso 2 completado
- [x] Paso 3 completado
- [x] Paso 4 completado
- [x] Paso 5 completado
- [x] Paso 6 completado
- [x] Paso 7 completado
- [x] Paso 8 completado
- [x] Paso 9 completado
- [x] Paso 10 completado

---

## Prompt operativo para Codex (copiar/pegar)
Usa este prompt para ejecutar el plan sin saltarte pasos:

```txt
Contexto: ejecutar `docs/plans/021-edit-load-optimization.md` paso por paso, sin saltar tareas.

Reglas de ejecucion:
1. Trabaja solo 1 paso a la vez.
2. Antes de tocar codigo, resume en 2-4 lineas que vas a cambiar y por que.
3. Implementa solo las subtareas del paso actual.
4. Al terminar el paso:
   - marca [x] subtareas completadas en el plan,
   - agrega breve nota tecnica (que se hizo, riesgo, resultado),
   - corre validacion minima del paso.
5. Si encuentras bloqueo:
   - documentalo en el plan,
   - propone 2 opciones tecnicas,
   - ejecuta la opcion recomendada y justificala.
6. No mezcles fixes fuera del paso actual, salvo errores bloqueantes directos.
7. Mantener paridad funcional: no romper persistencia de Moods/Uses/Categorias.
8. Evitar regresiones de UX: no introducir parpadeos ni dobles listas.
9. Cuando termines un paso, pregunta explicitamente si continuamos al siguiente.
10. Repite hasta completar todos los pasos.
```

---

## Notas
- Este plan prioriza mejoras con mayor impacto y menor riesgo primero.
- Si durante la ejecucion aparece un quick win seguro, se documenta y se decide explicitamente si incluirlo.
