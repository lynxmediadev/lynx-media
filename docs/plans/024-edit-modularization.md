# 024 - EDIT_MODULARIZATION_PLAN (Route split + Overview)

## Prompt de ejecucion (para Codex en futuras sesiones)

```txt
Implementa este plan en orden, sin saltar fases.
Reglas:
1) Una fase principal en progreso a la vez.
2) Marca [x] cada subtarea terminada.
3) Mantener compatibilidad: no romper /admin/tracks/[id]/edit durante migracion.
4) Si hay riesgo de regresion, activa fallback al flujo legacy y documenta.
5) Cada fase debe cerrar con criterio de exito verificable.
6) Si hay bloqueo, documenta causa + workaround + siguiente paso.
```

---

## Objetivo

Separar la pantalla de edicion de track en vistas modulares profesionales y escalables:

1. `Route-split` por modulo (arquitectura principal).
2. `Overview` como landing de edicion para control rapido de estado.

Todo con migracion por fases, sin romper lo actual.

---

## Alcance (v1 de modularizacion)

- Convertir `/admin/tracks/[id]/edit` en **overview**.
- Crear subrutas por modulo:
  - `/admin/tracks/[id]/edit/creative`
  - `/admin/tracks/[id]/edit/rights`
  - `/admin/tracks/[id]/edit/metadata`
  - `/admin/tracks/[id]/edit/deliverables`
  - `/admin/tracks/[id]/edit/review`
- Mantener una via de compatibilidad temporal para flujo actual completo.
- Mantener estado activo correcto en sidebar + breadcrumbs.

---

## Fuera de alcance (esta etapa)

- Rediseno profundo de cada modulo.
- Cambios de modelo de datos.
- Reescritura completa de Server Actions.
- Cambios de permisos/roles.

---

## Principios tecnicos

- Compatibilidad primero: dual-mode durante migracion.
- Sin big-bang: mover modulo por modulo.
- Un solo contrato de datos por modulo (DTO claro).
- UI consistente con dashboard actual.
- Rollback simple por feature flag/ruta fallback.

---

## Arquitectura objetivo

### Ruta principal
- `/admin/tracks/[id]/edit` -> Overview (estado general + accesos a modulos)

### Rutas modulares
- `creative` -> titulo, artista, musical, moods/uses/categories
- `rights` -> writers/publishers/master + toggles de derechos
- `metadata` -> IDs + metadata sync/negocio
- `deliverables` -> versions/stems + data de entrega
- `review` -> vista consolidada (read-only + accesos de accion)

### Compatibilidad temporal
- `/admin/tracks/[id]/edit/full` -> vista legacy completa (solo mientras migra)

---

## Plan de implementacion por fases

## Fase 0 - Baseline y no-regresion

- [x] Congelar baseline funcional de `/admin/tracks/[id]/edit` actual.
- [x] Registrar checklist de no-regresion (guardar todo, autosaves por modulo, chips, rights).
- [x] Definir track QA fijo para pruebas.
- [x] Registrar tiempos base (load y guardados clave) en `docs/debug/terminal.md`.

Criterio de exito:
- Baseline reproducible y lista de no-regresion validada.

Implementado:
- Track QA fijo: `cmkx1ed3f000duq9glemziy2b`.
- Baseline de performance reutilizado desde `docs/plans/021-edit-load-optimization.md` y verificado en `docs/debug/terminal.md`.
- No-regresion consolidada en este plan (matriz obligatoria al final).

---

## Fase 1 - Shell de edicion modular (sin mover logica aun)

- [x] Crear `EditShell` reusable para subrutas:
  - [x] header de track (titulo/artista/id)
  - [x] nav secundaria de modulos (tabs/segmented nav)
  - [x] slot de contenido por modulo
- [x] Integrar breadcrumbs coherentes para `edit` + subrutas.
- [x] Mantener `Tracks` activo en sidebar en todas las subrutas de edit.

Criterio de exito:
- Navegacion modular visible y estable, sin romper vista actual.

Implementado:
- Nuevo componente reusable: `src/components/admin/track/edit/TrackEditShell.tsx`.
- `src/app/admin/tracks/[id]/edit/page.tsx` ya usa el shell modular.
- Navegacion secundaria visible con modulos futuros deshabilitados (sin 404).
- Breadcrumbs mantiene `id` visible y coherente para rutas `edit`.

---

## Fase 2 - Overview como landing de `/edit`

- [x] Mover la vista completa actual a `/admin/tracks/[id]/edit/full` (fallback temporal).
- [x] Convertir `/admin/tracks/[id]/edit` en overview real.
- [x] Implementar cards de estado por modulo:
  - [x] Creative status
  - [x] Rights status
  - [x] Metadata status
  - [x] Deliverables status
  - [x] Review status
- [x] Cada card con CTA `Editar modulo` a su subruta.

Criterio de exito:
- `/edit` ya no es mega-form; funciona como panel de control y deriva a modulos.

Implementado:
- `/admin/tracks/[id]/edit/full` conserva la vista integral legacy (fallback operativo).
- `/admin/tracks/[id]/edit` ahora es overview con tarjetas de estado.
- Se habilitaron subrutas base para CTAs sin 404:
  - `/edit/creative`
  - `/edit/rights`
  - `/edit/metadata`
  - `/edit/deliverables`
  - `/edit/review`
- Se agrego navegacion modular centralizada en `module-nav.ts`.

---

## Fase 3 - Migracion modulo Creative

- [x] Crear ruta `/edit/creative` con `EditShell`.
- [x] Mover `CreativeForm` y dependencias necesarias.
- [x] Mantener comportamiento actual de guardado (sin cambiar UX).
- [x] Validar chips (moods/uses/categories) con persistencia completa.

Criterio de exito:
- Creative totalmente funcional en subruta sin depender de `/edit/full`.

Implementado:
- Ruta real: `src/app/admin/tracks/[id]/edit/creative/page.tsx`.
- Formulario del modulo creativo desacoplado en:
  - `src/components/admin/track/edit/CreativeModuleForm.tsx`.
- Server action dedicada:
  - `src/app/admin/track/actions/update-creative.ts`.
- Navegacion modular centralizada reutilizada via `module-nav.ts`.

---

## Fase 4 - Migracion modulo Rights

- [x] Crear ruta `/edit/rights`.
- [x] Mover `RightsFormClient` y subcomponentes asociados.
- [x] Confirmar estados de guardado (`SAVING/DONE/ERROR`) y validaciones 100%.
- [ ] Validar desktop/mobile.

Criterio de exito:
- Rights funcional en subruta, sin regresiones en writer/publisher/master.

Implementado:
- Ruta real: `src/app/admin/tracks/[id]/edit/rights/page.tsx`.
- Formulario del modulo derechos desacoplado en:
  - `src/components/admin/track/edit/RightsModuleForm.tsx`.
- Se reutiliza `updateRights` como guardado explicito del modulo.
- Autosave de shares/master se mantiene dentro de `RightsFormClient`.

---

## Fase 5 - Migracion modulo Metadata

- [x] Crear ruta `/edit/metadata`.
- [x] Mover `IdsForm` + `SyncMetaForm` (y campos musicales si aplica al modulo final).
- [x] Mantener comportamiento de `EditableIconInput` y `NumericSelectInput`.
- [ ] Validar guardado por Enter + onBlur donde corresponda.

Criterio de exito:
- Metadata funcional en subruta con UX consistente.

Implementado:
- Ruta real: `src/app/admin/tracks/[id]/edit/metadata/page.tsx`.
- Formulario del modulo metadata desacoplado en:
  - `src/components/admin/track/edit/MetadataModuleForm.tsx`.
- Nueva server action dedicada:
  - `src/app/admin/track/actions/metadata.ts` -> `updateMetadataModule`.
- `updateMetadataModule` guarda IDs + metadata sync comercial sin tocar campos musicales.

---

## Fase 6 - Migracion modulo Deliverables

- [x] Crear ruta `/edit/deliverables`.
- [x] Mover `DeliverablesForm`.
- [x] Validar arrays de versions/stems (altas, edicion, borrado).
- [x] Revisar revalidacion puntual sin recarga global innecesaria.

Criterio de exito:
- Deliverables aislado y estable.

Implementado:
- Ruta real: `src/app/admin/tracks/[id]/edit/deliverables/page.tsx`.
- Formulario del modulo entregables desacoplado en:
  - `src/components/admin/track/edit/DeliverablesModuleForm.tsx`.
- Revalidacion puntual agregada en server actions:
  - `/edit/deliverables` y `/edit/full`.

---

## Fase 7 - Review final y retiro de legacy

- [x] Crear ruta `/edit/review` consolidada (read-only + acciones clave).
- [ ] Ejecutar smoke completo de rutas modulares.
- [ ] Eliminar dependencia operativa de `/edit/full`.
- [ ] Opcional: dejar `/edit/full` oculto 1 sprint como emergencia y luego remover.

Criterio de exito:
- Flujo diario usa overview + modulos, legacy fuera del camino principal.

---

## Fase 8 - Revalidacion y performance transversal

- [x] Revisar `revalidatePath` para apuntar a rutas modulares y overview.
- [x] Evitar invalidaciones globales no necesarias.
- [ ] Confirmar que load inicial de `/edit` (overview) es mas liviano que antes.
- [ ] Registrar comparativa antes/despues en `docs/debug/terminal.md`.

Criterio de exito:
- Menor carga inicial y guardados mas focalizados.

---

## Fase 9 - Documentacion y cierre

- [ ] Actualizar inventario en `docs/PROJECT_GENERAL_CONTEXT.md`:
  - [ ] nueva estructura de rutas edit
  - [ ] componentes por modulo
  - [ ] reutilizables usados por modulo
- [ ] Documentar decision final de eliminar o mantener `/edit/full`.
- [ ] Cerrar checklist final y pendientes v2.

Criterio de exito:
- Estado arquitectonico documentado y mantenible para siguiente etapa.

---

## Matriz de no-regresion (obligatoria)

- [ ] Sidebar mantiene `Tracks` activo en:
  - [ ] `/admin/tracks`
  - [ ] `/admin/tracks/[id]/edit`
  - [ ] `/admin/tracks/[id]/edit/*`
- [ ] Guardados no pierden datos entre rutas.
- [ ] Chips persisten y cargan sin parpadeo anomalo.
- [ ] Rights mantiene validaciones y mensajes de estado.
- [ ] Mobile/desktop consistentes en cada subruta.

---

## Riesgos y mitigaciones

- Riesgo: romper flujo actual al mover demasiado en una fase.
  - Mitigacion: mantener `/edit/full` como fallback temporal.
- Riesgo: rutas activas/breadcrumb inconsistente.
  - Mitigacion: resolver nav activa por matcher unico.
- Riesgo: revalidaciones obsoletas por cambio de path.
  - Mitigacion: checklist dedicado en Fase 8.

---

## Estado

- [x] Plan creado.
- [x] Implementacion iniciada.
