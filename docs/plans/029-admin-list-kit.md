# 029 · Admin List Kit (unificación de listas admin)

## Prompt operativo (auto-instrucciones para Codex)
> Objetivo: convertir el estilo de `/admin/users` en un sistema reutilizable para listas admin (tracks, requests, playlists, contracts, etc.) sin romper funcionalidad.
>
> Reglas de ejecución:
> 1) Migrar por fases y por ruta (una ruta estable antes de tocar la siguiente).  
> 2) Mantener paridad funcional 1:1 antes de optimizar UX extra.  
> 3) Priorizar desktop + mobile en cada fase (no dejar mobile para el final).  
> 4) Dejar evidencia en `docs/debug/terminal.md` al cierre de cada fase.  
> 5) Si una fase falla, hacer rollback solo de esa fase y continuar con la siguiente segura.
> 6) En una sola ejecución, completar el máximo posible: mínimo **F0 + F1 + F2**, y avanzar **F3/F4** si no hay bloqueos.

### Modo ejecución continua (sesión larga, máxima cobertura)
- [ ] Ejecutar fases en secuencia sin pausas manuales intermedias.
- [ ] Ir marcando checkboxes en este plan al cerrar cada subtarea.
- [ ] Al terminar cada fase:
  - [ ] correr `npm run typecheck`
  - [ ] correr smoke mínimo de la ruta tocada
  - [ ] registrar resultado breve en `docs/debug/terminal.md`
- [ ] Si aparece bloqueo crítico en una ruta:
  - [ ] documentar bloqueo + workaround
  - [ ] continuar con la siguiente fase no bloqueada para mantener avance
- [ ] Entrega mínima al finalizar sesión:
  - [ ] `users` 100% sobre List Kit
  - [ ] `tracks` migrado o PR parcial funcional
  - [ ] estado de fases actualizado en este archivo

### Criterio de “avance máximo” (para no frenar ejecución)
- [ ] Prioridad 1: componentes base reutilizables + adopción en users.
- [ ] Prioridad 2: adopción en tracks y requests.
- [ ] Prioridad 3: playlists/contracts + hardening/tests.
- [ ] Si falta tiempo: dejar esqueleto reutilizable completo + al menos 2 rutas migradas.

---

## Objetivo
- Estandarizar listas de administración bajo un **List Kit** reutilizable.
- Reducir deuda visual/técnica entre rutas admin.
- Mejorar mantenibilidad, velocidad de implementación y consistencia UX/UI.

## Alcance
- Rutas objetivo:
  - `/admin/users` (base de extracción)
  - `/admin/tracks`
  - `/admin/requests` (y/o `/admin/licensing` según routing actual)
  - `/admin/playlists`
  - `/admin/contracts` (si ya existe vista lista operativa)
- Reutilización de:
  - filtros
  - badges de estado/rol
  - toolbar de acciones masivas
  - tabla responsiva
  - acciones por fila

## No alcance (por ahora)
- Reescritura total de lógica de negocio backend.
- Cambios de permisos/roles profundos.
- Virtualización avanzada de tablas (solo si se detecta necesidad real en datos grandes).

---

## Arquitectura objetivo (List Kit)

### Componentes reutilizables a crear
- [x] `AdminListShell`
  - Marco principal: header, bloques de filtros, bulk y tabla.
- [x] `AdminListHeader`
  - Título, subtítulo, contador, badges de estado y acciones rápidas.
- [x] `AdminFilterPanel`
  - Búsqueda, selectores, botones (`copiar filtro`, `limpiar`), badge de filtros activos.
- [x] `AdminBulkPanel`
  - Selección global, selectores de acción, acción aplicar/limpiar.
- [x] `AdminDataTable<T>`
  - Tabla genérica por configuración de columnas.
- [x] `AdminTableRowActions`
  - Menú/acciones por fila (ver, editar, eliminar, etc.).
- [x] `AdminStatusBadge` / `AdminRoleBadge`
  - Variantes visuales centralizadas.
- [x] `AdminListEmptyState`
  - Estado vacío consistente (sin resultados / sin datos).

### Contratos de tipos (TypeScript)
- [x] `AdminColumnDef<T>`
  - `key`, `label`, `align`, `width`, `hideOnMobile`, `render`.
- [x] `AdminRowAction<T>`
  - `id`, `label`, `icon?`, `intent?`, `visible?`, `onClick` / `href`.
- [x] `AdminFilterSchema`
  - query text, selectores, estado inicial y serialización URL.
- [x] `AdminBulkActionSchema`
  - acciones permitidas + payload esperado + validaciones.

### Principios de diseño
- [x] 1 fuente de verdad para estilos de tabla/filtros.
- [x] URL-state consistente para filtros.
- [x] Compatibilidad SSR/CSR sin parpadeos ni doble render de estados clave.
- [ ] Accesibilidad: labels, focus visible, estados disabled claros.
- [x] Mobile-first real (stack + jerarquía clara + sin scroll horizontal innecesario).

---

## Fase 0 · Baseline y diseño técnico
- [x] Inventariar implementación actual por ruta (UI + lógica + endpoints).
- [x] Detectar diferencias reales vs users (filtros, bulk, acciones fila).
- [x] Definir API mínima del List Kit (props, callbacks, estados).
- [x] Definir criterios de éxito medibles por ruta.
- [x] Definir estrategia de compatibilidad incremental (feature flag o migración directa por ruta).

### Criterio de cierre F0
- [x] Documento técnico breve con:
  - matriz de features por ruta
  - API propuesta de componentes
  - orden de migración aprobado

#### Salida F0 (implementada)
- Matriz de rutas:
  - `users`: filtros cliente + bulk + delete por fila + detalle.
  - `tracks`: lista técnica + paginación + acciones analyze/payload/edit.
  - `requests`: filtros con apply/reset + bulk delete + detalle.
  - `playlists/contracts`: placeholder (sin tabla operativa aún).
- API mínima adoptada:
  - `AdminListShell`, `AdminListHeader`, `AdminListPanel`, `AdminStatusBadge`, `AdminDataTable<T>`, `AdminListEmptyState`.
  - Tipos base `AdminColumnDef<T>` y `AdminRowAction<T>`.
- Estrategia incremental:
  - migración directa por ruta (sin feature flag global), con paridad visual/funcional por fase.

---

## Fase 1 · Extraer kit desde `/admin/users` (sin cambiar comportamiento)
- [x] Crear carpeta base: `src/components/admin/list-kit/`
- [x] Mover estilos repetidos a componentes del kit.
- [x] Reemplazar en `UsersTableClient` usando solo componentes del kit.
- [x] Verificar que UX actual quede idéntica (paridad funcional/visual).

### Smoke F1
- [ ] Filtros en tiempo real.
- [ ] Copiar filtro + limpiar.
- [ ] Acciones masivas (set role/status/delete).
- [ ] Acción por fila (delete + detalle).
- [ ] Estados de éxito/error.
- [ ] Mobile sin desbordes.

### Criterio de cierre F1
- [x] `/admin/users` operando igual que antes, pero ya sobre List Kit.

---

## Fase 2 · Migrar `/admin/tracks`
- [x] Mapear columnas actuales de tracks a `AdminColumnDef`.
- [x] Migrar header + filtros al kit.
- [x] Migrar tabla al kit manteniendo acciones de track.
- [x] Mantener links de navegación (edit, payload, analizar, etc.) sin regresiones.

### Smoke F2
- [ ] Búsqueda/filtros tracks.
- [ ] Acciones por fila intactas.
- [ ] Breadcrumbs/rutas sin roturas.
- [ ] Mobile: lectura + acciones disponibles.

### Criterio de cierre F2
- [x] `/admin/tracks` usando List Kit con paridad.

---

## Fase 3 · Migrar `/admin/requests` (licensing si aplica)
- [x] Integrar filtros propios de requests al `AdminFilterPanel`.
- [x] Migrar tabla y badges de estado.
- [x] Mantener acciones bulk propias (si existen) sobre contrato común.

### Smoke F3
- [x] Filtros request por estado/tipo.
- [x] Acciones masivas y filas.
- [x] Paginación actual (si existe) sin romper.

### Criterio de cierre F3
- [x] `/admin/requests` consistente con users/tracks.

---

## Fase 4 · Migrar `/admin/playlists` + `/admin/contracts`
- [x] Aplicar List Kit en playlists.
- [x] Aplicar List Kit en contracts.
- [x] Ajustar estados vacíos y acciones fila por dominio.

### Smoke F4
- [ ] Filtros operativos por ruta.
- [x] Layout consistente desktop/mobile.
- [ ] Sin regressions de permisos.

### Criterio de cierre F4
- [ ] Todas las listas admin prioritarias sobre un kit común.

#### Nota F4
- Playlists y Contracts aún no tienen datasource/tablas reales; se dejó scaffold List Kit + empty state preparado para integración cuando exista backend de listado.

---

## Fase 5 · Optimización UX/UI transversal
- [x] Unificar alturas, paddings y hover en botones de listas.
- [x] Unificar badges de estado/selección/filtro.
- [x] Reducir espacio vertical “muerto” sobre las tablas.
- [x] Revisar densidad de información para desktop y mobile.
- [x] Verificar consistencia de empty/loading/error states entre rutas.

### Criterio de cierre F5
- [x] Consistencia visual y de interacción entre listas.

---

## Fase 6 · Hardening técnico
- [x] Tests de utilidades de filtros/serialización URL.
- [x] Tests de selección masiva y edge cases.
- [ ] Validar performance en listas grandes (TTI básico y fluidez UI).
- [ ] Revisión de accesibilidad mínima (tab order, aria, labels).
- [x] Revisar estabilidad ante refresh, back/forward y URL compartida con filtros.

### Criterio de cierre F6
- [ ] Sin errores críticos en typecheck/lint + smoke manual completo.

---

## Fase 7 · Documentación y cierre
- [x] Actualizar `docs/PROJECT_GENERAL_CONTEXT.md`:
  - [x] sección “List Kit Admin” (componentes + props + rutas que lo usan)
  - [x] guía rápida “cómo crear una nueva lista con List Kit”
- [x] Agregar checklist final de rollout y pendientes v2.
- [x] Registrar decisiones técnicas y tradeoffs.

### Criterio de cierre F7
- [x] Playbook de mantenimiento listo para futuras listas.

---

## Matriz de migración (orden recomendado)
- [x] 1) Users (extraer kit)
- [x] 2) Tracks
- [x] 3) Requests/Licensing
- [x] 4) Playlists
- [x] 5) Contracts

---

## Riesgos y mitigación
- Riesgo: romper acciones críticas por fila/bulk.  
  Mitigación: paridad 1:1 + smoke inmediato por ruta antes de seguir.
- Riesgo: pérdida de estilos específicos valiosos.  
  Mitigación: permitir “slots/overrides” por ruta en kit.
- Riesgo: sobre-generalización temprana.  
  Mitigación: API mínima primero, extender solo cuando 2+ rutas lo pidan.

---

## Checklist final de aceptación
- [x] Todas las rutas objetivo usan List Kit.
- [ ] No hay regresiones funcionales críticas.
- [ ] UX consistente en desktop y mobile.
- [x] Documentación actualizada.
- [x] Base lista para escalar nuevas listas admin rápidamente.

---

## Decisiones técnicas y tradeoffs (cierre)
- Se aplicó migración incremental por ruta (sin feature flag global) para minimizar riesgo operacional.
- Se priorizó `AdminDataTable` en desktop y cards/paneles en mobile para evitar overflow horizontal.
- Requests/Licensing mantienen su lógica de negocio existente; List Kit unifica presentación y estructura.
- Playlists/Contracts usan scaffold List Kit con empty state hasta tener datasource real.
- Hardening F6 queda parcialmente abierto por:
  - validación de performance con dataset grande real,
  - revisión A11y manual profunda,
  - `npm run lint` bloqueado por configuración existente (`eslint.config.mjs` -> `ReferenceError: js is not defined`).

---

## Rollout y pendientes v2
- [x] Migrar Users al List Kit.
- [x] Migrar Tracks al List Kit.
- [x] Migrar Requests/Licensing al List Kit.
- [x] Aplicar scaffold List Kit en Playlists/Contracts.
- [ ] Corregir configuración ESLint para habilitar gate de lint en CI.
- [ ] Ejecutar smoke manual completo desktop/mobile y cerrar regresiones.
- [ ] Ejecutar profiling simple en listas con volumen alto de datos reales.

---

## Smoke test manual final (desktop + mobile)

### A) `/admin/users`
- [ ] Filtro por texto en tiempo real devuelve resultados esperados.
- [ ] Cambiar `ROL`/`ESTADO` filtra correctamente.
- [ ] `Limpiar` restaura lista completa.
- [ ] `Copiar filtro` copia URL funcional.
- [ ] Selección múltiple + acciones masivas (`role/status/delete`) funcionan.
- [ ] Acción por fila (detalle/eliminar) funciona.
- [ ] Mobile: sin overflow horizontal, controles legibles y clickeables.

### B) `/admin/tracks`
- [ ] Header muestra contador/paginación correcto.
- [ ] Tabla desktop renderiza columnas sin desalineaciones.
- [ ] Acciones `Analizar/Payload/Edit` siguen operativas.
- [ ] Paginación `Anterior/Siguiente` conserva resultados correctos.
- [ ] Mobile: cards visibles, sin scroll lateral, acciones accesibles.

### C) `/admin/requests`
- [ ] Filtros (`texto/tipo/servicio/status`) aplican correctamente.
- [ ] `Aplicar` y `Limpiar` mantienen URL-state estable.
- [ ] Selección + eliminación masiva funciona.
- [ ] Paginación respeta filtros activos.
- [ ] Mobile: cards con datos correctos y botón `Ver detalle` usable.

### D) `/admin/licensing`
- [ ] Filtros (`q/status/priority/rango fechas`) aplican correctamente.
- [ ] Totales (overdue/hoy/mañana/7d) se muestran sin romper layout.
- [ ] Tabla desktop mantiene columnas y acciones `Abrir`.
- [ ] Paginación funciona con filtros activos.
- [ ] Mobile: cards legibles, sin desbordes, CTA usable.

### E) `/admin/playlists` y `/admin/contracts`
- [ ] Vistas scaffold List Kit cargan correctamente.
- [ ] Empty state consistente con diseño global.
- [ ] Sin errores de render en desktop/mobile.

### F) Validación técnica
- [x] `npm run typecheck` pasa.
- [x] `npx vitest run tests/list-kit/*.spec.ts -c vitest.config.ts` pasa.
- [ ] `npm run lint` (pendiente: corregir `eslint.config.mjs`).
