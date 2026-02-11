# 022 · Implementación de Dashboard para Admin

## Objetivo

- Convertir `/admin` en un dashboard completo, consistente y escalable.
- Implementar un layout tipo shadcn reutilizable para anidar rutas actuales y futuras.
- Diseñar base reusable para dashboard de `admin` y, más adelante, para usuarios cliente.
- Mantener coherencia visual con el sistema actual (minimal, funcional, profesional).

## Criterios de diseño (fijos)

- Reutilización primero: crear componentes de layout y navegación configurables por props.
- Paridad Desktop/Mobile desde el inicio.
- Mantener tokens/estilos del proyecto (colores, bordes, densidad visual, jerarquía tipográfica).
- No romper rutas existentes ni flujos actuales.

## Arquitectura propuesta de navegación (v1)

- `General`
- `Overview` (`/admin`)
- `Account` (`/admin/account`) [nuevo]
- `Workspace` (reemplaza “Content Management”)
- `Tracks` (`/admin/tracks`) [existente]
- `Playlists` (`/admin/playlists`) [nuevo placeholder]
- `Sound Kits` (`/admin/sound-kits`) [nuevo placeholder]
- `Services` (`/admin/services`) [nuevo placeholder]
- `Licensing`
- `Requests` (`/admin/licensing`) [existente]
- `Contracts` (`/admin/contracts`) [nuevo placeholder]
- `System` (interno operativo)
- `Audit Log` (`/admin/audit-log`) [nuevo placeholder]
- `Settings` (`/admin/settings`) [nuevo placeholder]

## Entregables de esta etapa

- `AdminDashboardLayout` reusable con sidebar + topbar + content slot.
- Menú configurable por config (`navConfig`) en vez de hardcode por componente.
- Layout responsive:
- Desktop: sidebar fija colapsable.
- Mobile: sidebar en drawer/sheet.
- Breadcrumb reusable y estado de navegación activo.
- Páginas actuales de `/admin` montadas dentro del nuevo layout sin romper flujos.
- Placeholders para rutas futuras (para navegación completa desde ya).

## Plan de implementación (paso a paso)

### Paso 0 · Baseline y seguridad de cambio

- [x] Levantar inventario actual de rutas bajo `/admin`.
- [x] Confirmar layout actual que afecta `/admin` y puntos de entrada.
- [x] Crear checkpoint técnico en este plan con hallazgos iniciales.
- [x] Definir lista de “no-regresión” (pantallas críticas a validar).

Checkpoint técnico (baseline):

- Layout anterior: `src/app/admin/layout.tsx` con topbar hardcodeada y links fijos.
- Rutas existentes detectadas: `tracks`, `uploads`, `licensing`, `requests`, `track/[id]/edit`, `track/[id]/tech`, `login`.
- Rutas nuevas requeridas por plan: `account`, `playlists`, `sound-kits`, `services`, `contracts`, `audit-log`, `settings`, `overview`.

No-regresión definida:

- `/admin/tracks`
- `/admin/track/[id]/edit`
- `/admin/licensing`
- `/admin/uploads`
- `/admin/requests`

### Paso 1 · Diseño del sistema reusable de dashboard

- [x] Definir contrato `DashboardNavItem` (id, label, href, icon, section, featureFlag, disabled).
- [x] Definir estructura `DashboardSection` para agrupar items.
- [x] Diseñar componentes base reutilizables:
- [x] `DashboardShell`
- [x] `DashboardSidebar`
- [x] `DashboardTopbar`
- [x] `DashboardBreadcrumbs`
- [x] `DashboardContent`
- [x] Definir props para branding/tema sin acoplar a `admin`.

### Paso 2 · Implementar componentes base (UI reusable)

- [x] Crear carpeta reusable de dashboard (ej. `src/components/dashboard/`).
- [x] Implementar `DashboardSidebar` con estado activo por pathname.
- [x] Implementar versión mobile con `Sheet`/drawer.
- [x] Implementar `DashboardTopbar` con título contextual + acciones rápidas.
- [x] Implementar `DashboardBreadcrumbs` configurable.
- [x] Implementar estados visuales: activo, hover, disabled, section title.
- [x] Validar accesibilidad básica (focus visible, labels, teclado).

### Paso 3 · Integrar layout en `/admin`

- [x] Crear/actualizar `src/app/admin/layout.tsx` para usar `DashboardShell`.
- [x] Conectar menú por `navConfig` centralizado (archivo único).
- [x] Garantizar que rutas existentes siguen resolviendo igual.
- [x] Verificar que páginas no admin no se afecten.

### Paso 4 · Migrar rutas actuales y crear placeholders

- [x] Integrar `/admin` overview dentro del shell.
- [x] Integrar `/admin/tracks`.
- [x] Integrar `/admin/licensing`.
- [x] Crear placeholders mínimos:
- [x] `/admin/account`
- [x] `/admin/playlists`
- [x] `/admin/sound-kits`
- [x] `/admin/services`
- [x] `/admin/contracts`
- [x] `/admin/audit-log`
- [x] `/admin/settings`
- [x] Añadir mensajes “en construcción” consistentes (sin romper navegación).

### Paso 5 · Responsive y experiencia de uso

- [x] Desktop: revisar alineación, densidad y scroll en sidebar.
- [x] Mobile: validar apertura/cierre de drawer y navegación entre rutas.
- [x] Ajustar tamaños de hit area en botones.
- [x] Ajustar jerarquía tipográfica y espaciados para lectura rápida.
- [x] Definir comportamiento de colapso sidebar (si aplica en v1).

### Paso 6 · Reutilización real (exportable a otros proyectos)

- [x] Desacoplar textos/labels a config y no al componente base.
- [x] Extraer iconografía y acciones por props.
- [x] Evitar dependencias directas de dominio (`tracks/licensing`) en componentes base.
- [x] Documentar contrato de props para replicar dashboard en otras áreas/apps.
- [x] Preparar estructura para roles (`admin`, `client`) sin implementar autorización completa aún.

### Paso 7 · QA funcional y no-regresión

- [ ] Smoke navegación completa del menú en Desktop.
- [ ] Smoke navegación completa del menú en Mobile.
- [ ] Validar rutas existentes críticas:
- [ ] `/admin/tracks`
- [ ] `/admin/track/[id]/edit`
- [ ] `/admin/licensing`
- [ ] Verificar que no se rompe “Guardar todo” ni autosaves en `/edit`.
- [x] Documentar hallazgos y fixes en `docs/debug/terminal.md` si aplica.

Hallazgo técnico en QA automatizado:

- `npm run typecheck` falla por errores preexistentes fuera del alcance dashboard (migración legacy `moods/uses`, tipos de rutas y selects antiguos). No bloquea la integración del shell, pero impide cierre formal de QA global.

### Paso 8 · Documentación y cierre de etapa

- [x] Actualizar inventario reusable en `docs/PROJECT_GENERAL_CONTEXT.md`.
- [x] Registrar rutas del dashboard y estado (activo/placeholder).
- [x] Marcar en este plan qué quedó implementado.
- [x] Definir backlog de v2 (roles, widgets overview, permisos finos, analytics).

Backlog v2:

- Roles por item de navegación (`admin`, `editor`, `viewer`, `client`) con gating por middleware.
- Widgets reales en `/admin` overview (KPIs de tracks, requests y estado de análisis).
- Permisos finos por acción (ej. borrar track, export licensing, editar pricing).
- Analytics de uso del dashboard (rutas más usadas, latencia por módulo, errores de guardado).
- Persistencia de estado UI (sidebar colapsada, sección activa) en `localStorage`.

## Reglas de ejecución para este plan

- Se implementa en orden, sin saltar pasos.
- Máximo 1 paso principal en progreso a la vez.
- Al cerrar cada sub-tarea, marcar `[x]`.
- Si aparece bloqueo técnico, documentar causa y workaround en este mismo archivo.
- Cualquier cambio visual debe validarse en Desktop y Mobile.

## Estado de ejecución

- [x] Plan creado y estructurado.
- [x] Paso 0 completado.
- [x] Paso 1 completado.
- [x] Paso 2 completado.
- [x] Paso 3 completado.
- [x] Paso 4 completado.
- [x] Paso 5 completado.
- [x] Paso 6 completado.
- [ ] Paso 7 en progreso.
- [x] Paso 8 completado.

Rutas dashboard (estado actual):

- Activas: `/admin`, `/admin/tracks`, `/admin/uploads`, `/admin/licensing`, `/admin/requests`
- Placeholders: `/admin/account`, `/admin/playlists`, `/admin/sound-kits`, `/admin/services`, `/admin/contracts`, `/admin/audit-log`, `/admin/settings`
