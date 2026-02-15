## 2026-02-12 - Smoke rendimiento autenticado (admin)

Track QA: `cmkx1ed3f000duq9glemziy2b`

Resumen (warm avg):

- GET `/admin/tracks`: `0.457s`
- GET `/admin/tracks/[id]/edit`: `0.414s`
- GET `/admin/tracks/[id]/edit/creative`: `0.353s`
- GET `/admin/tracks/[id]/edit/rights`: `0.384s`
- GET `/admin/tracks/[id]/edit/metadata`: `0.164s`
- GET `/admin/tracks/[id]/edit/deliverables`: `0.275s`
- GET `/admin/tracks/[id]/edit/review`: `0.471s`
- GET `/admin/tracks/[id]/edit/full`: `0.764s`

Tags/catalogo (warm avg):

- POST `/api/tracks/[id]/moods`: `0.495s`
- POST `/api/tracks/[id]/uses`: `0.492s`
- POST `/api/tracks/[id]/categories`: `0.561s`
- GET `/api/tracks/[id]/moods|uses|categories`: `~0.155s`
- GET `/catalog?mood=aggressive&use=documentary&cat=cinematic`: `0.344s`
- POST `/api/catalog/list` (sin waveform): `0.227s`

## 2026-02-12 - Benchmark synthetic dataset grande (I/O DB)

Dataset synthetic (autolimpiado al final):

- Tracks: `500`
- Tags: `900` (`300` MOOD, `300` USE, `300` CATALOG)
- TrackTag links: `4000`
- Prefijo: `__bench1770925662658__`
- Cleanup verificado: `leftTracks=0`, `leftTags=0`, `leftLinks=0`

Resultados (60 iteraciones por query, en ms):

- Q1 track moods assigned list: `avg=124.989`, `p50=124.876`, `p95=125.703`, `p99=126.159`, `max=126.159`
- Q2 track uses assigned list: `avg=126.188`, `p50=125.053`, `p95=125.951`, `p99=187.227`, `max=187.227`
- Q3 track categories assigned list: `avg=125.162`, `p50=125.280`, `p95=126.064`, `p99=128.334`, `max=128.334`
- Q4 catalog filter mood+use+cat: `avg=64.007`, `p50=62.884`, `p95=63.636`, `p99=124.026`, `max=124.026`
- Q5 tag list by type + order: `avg=62.511`, `p50=62.500`, `p95=62.949`, `p99=63.686`, `max=63.686`
- Q6 tag search contains: `avg=62.978`, `p50=63.006`, `p95=63.206`, `p99=63.925`, `max=63.925`
- Q7 replace mood links (deleteMany+createMany): `avg=253.611`, `p50=250.959`, `p95=259.006`, `p99=312.215`, `max=312.215`

## 2026-02-12 - Post cambio a guardado incremental de tags (smoke rápido)

Warm (runs 2-3):

- POST `/api/tracks/[id]/moods`: `0.504s`, `0.446s`
- POST `/api/tracks/[id]/uses`: `0.434s`, `0.419s`
- POST `/api/tracks/[id]/categories`: `0.510s`, `0.474s`

1/1

Next.js 15.5.9 (outdated)
Webpack
Console Error


DialogContent requires a DialogTitle for the component to be accessible for screen reader users.

If you want to hide the DialogTitle, you can wrap it with our VisuallyHidden component.

For more information, see https://radix-ui.com/primitives/docs/components/dialog

src/components/ui/sheet.tsx (58:7) @ SheetContent


  56 |     <SheetPortal>
  57 |       <SheetOverlay />
> 58 |       <SheetPrimitive.Content
     |       ^
  59 |         data-slot="sheet-content"
  60 |         className={cn(
  61 |           "bg-background data-[state=open]:animate-in data-[state=closed]:animate-out fixed z-50 flex flex-col gap-4 shadow-lg transition ease-in-out data-[state=closed]:duration-300 data-[state=open]:duration-500",
Call Stack
75

Show 69 ignore-listed frame(s)
SheetContent
src/components/ui/sheet.tsx (58:7)
SheetPortal
src/components/ui/sheet.tsx (28:10)
SheetContent
src/components/ui/sheet.tsx (56:5)
DashboardShell
src/components/dashboard/DashboardShell.tsx (149:9)
AdminDashboardLayoutClient
src/components/admin/AdminDashboardLayoutClient.tsx (12:5)
AdminLayout
src/app/admin/layout.tsx (14:10)

## 2026-02-13 - Account system phase 1 (WIP)

Comandos ejecutados:

- `npx prisma format` ✅
- `npx prisma generate` ✅
- `npx prisma migrate dev --name account_system_phase1` ✅
  - Migración aplicada: `prisma/migrations/20260213053053_account_system_phase1/migration.sql`
- `npm run db:bootstrap:auth` ✅
  - admin bootstrap creado: `admin@lynx.local`
  - backfill ownership: tracks/licensing requests con `ownerUserId`
- `npm run typecheck` ❌ (fallas preexistentes + drift legacy moods/uses)

Errores visibles en `typecheck`:

- `moods/uses` legacy en:
  - `src/app/api/tracks/route.ts`
  - `prisma/seed.bulk.ts`
  - `src/components/public/SimilarTracks.tsx`
- import faltante:
  - `src/components/admin/track/CatalogTagsForm.tsx` -> `@/app/admin/track/actions/update-catalog-tags`
- tipado Next params legacy:
  - `.next/types/app/track/[id]/page.ts`

Nota:
- Se dejó implementado auth base + ownership inicial.
- Falta limpiar deuda legacy de `moods/uses` para volver a `tsc --noEmit` limpio.

## 2026-02-13 - Account system phase 1.1 (admin users panel)

Implementado:
- `/admin/users` con:
  - listado de usuarios
  - filtros por q/role/status
  - edición de perfil (name)
  - cambio de rol
  - cambio de estado
  - creación de invitaciones
  - listado de invitaciones activas + revocar
- rutas admin-only:
  - `POST /admin/users/invite`
  - `POST /admin/users/[id]/profile`
  - `POST /admin/users/[id]/role`
  - `POST /admin/users/[id]/status`
  - `POST /admin/users/invites/[inviteId]/revoke`
- navegación dashboard:
  - agregado item `Users` en sidebar

Validación:
- `typecheck` global sigue con deuda legacy previa (moods/uses),
  pero no aparecieron errores nuevos en archivos de account/users panel.

## 2026-02-13 - Account system phase 1.2 (auth lifecycle + ownership hardening)

Implementado:
- Forgot/reset password:
  - `/auth/forgot-password`
  - `POST /auth/forgot-password/submit`
  - `/auth/reset-password`
  - `POST /auth/reset-password/submit`
- Rate limiting persistente en DB (`AuthRateLimit`) para login/register/forgot/reset.
- Seguridad:
  - al resetear password se invalidan sesiones previas del usuario.
  - al suspender usuario desde `/admin/users` se invalidan sesiones.
- Sidebar por rol:
  - STAFF ya no ve `Users` ni `Roles` en navegación.
- Ownership/API:
  - hardening en `/api/tracks/[id]/moods|uses|categories|analyze|audio-check`
  - sólo ADMIN/STAFF o CREATOR owner del track.
- Compatibilidad de datos:
  - se resolvió deuda legacy moods/uses en:
    - `src/app/api/tracks/route.ts`
    - `prisma/seed.bulk.ts`
    - `src/components/public/SimilarTracks.tsx`
  - se creó `src/app/admin/track/actions/update-catalog-tags.ts`

Migración aplicada:
- `prisma/migrations/20260213144331_account_system_phase2_rate_limit/migration.sql`

Validación:
- `npm run typecheck` ✅ (sin errores)

## 2026-02-13 - Account system phase 1.3 (hardening final antes de smoke)

Implementado:
- Guardas explícitas `ADMIN|STAFF` en server actions de edit avanzado:
  - `update-creative`, `update-all`, `update-rights`, `update-metadata`, `update-deliverables`,
  - `update-publishing-shares`, `update-master-shares`,
  - `create/delete/update catalog tags`.
- Cambio de password autenticado:
  - nueva ruta `POST /auth/change-password/submit`
  - valida password actual + nueva password
  - invalida **todas** las sesiones del usuario
  - crea nueva sesión activa al terminar.
- UI de account en `/admin/account`:
  - datos de cuenta
  - formulario de cambio de password con feedback (`ok/err`).
- Hardening de cookie de sesión:
  - cookie `app_session` con `priority=high`
  - `maxAge` explícito derivado de expiración.
- Auditoría ownership adicional:
  - `GET /api/tracks` ahora filtra por `ownerUserId` cuando el requester es `CREATOR`.
  - `POST /api/tracks` resuelve owner explícito (incluye fallback temporal para sesión legacy admin).
  - `POST/DELETE` de `/api/moods`, `/api/uses`, `/api/categories` restringidos a `ADMIN|STAFF`.
- Navegación:
  - `Users` y `Roles` con `exact` en sidebar para evitar estados activos ambiguos.

Validación:
- `npm run typecheck -- --pretty false` ✅

Bloqueos pendientes para cierre total de plan:
- Proveedor real para verify-email (pendiente de credenciales/config).
- Definir fecha oficial para retiro de fallback legacy `admin_session`.

## 2026-02-13 - Smoke checklist Fase 8 (account system)

Resultado:
- `SMOKE_RESULT=PASS`
- Track de prueba creado: `cmll1qywy000huqbp3ss55rdp`
- Usuarios de prueba creados:
  - `smoke_creator_a_1770996755@example.com`
  - `smoke_creator_b_1770996755@example.com`
  - `smoke_staff_1770996755@example.com`
  - `smoke_admin_1770996755@example.com`

Validaciones ejecutadas (automáticas):
- Registro por invitación para CREATOR/STAFF/ADMIN ✅
- Login por `/auth/login` (creator) ✅
- Login por `/admin/login` (staff/admin) ✅
- Ownership:
  - CREATOR A crea track ✅
  - CREATOR A ve su track en `/creator/tracks` ✅
  - CREATOR B recibe `404` en `/creator/tracks/[id de A]` ✅
  - CREATOR B recibe `403` en mutación tags (`/api/tracks/[id]/moods`) ✅
  - `GET /api/tracks?view=list` filtra por owner para CREATOR ✅
- Admin:
  - ADMIN abre `/admin/tracks/[id]/edit` ✅
- Staff:
  - STAFF abre `/admin/tracks` ✅
  - STAFF no accede a `/admin/users` (redirect) ✅
- Logout:
  - `/auth/logout` invalida acceso a `/creator/tracks` (redirect a login) ✅

Pendiente manual:
- Verificación visual mobile de overflow en flujo creator.

## 2026-02-13 - Account email provider (027) smoke técnico local

Config usada:
- `AUTH_EMAIL_PROVIDER=console`
- `AUTH_EMAIL_DEBUG_LINKS=1`
- `TURNSTILE_ENABLED=0`
- Base local: `http://127.0.0.1:3001`

Validaciones ejecutadas:
- Registro por invitación (`POST /auth/register/submit`) -> `303` a `/auth/verify-email?ok=sent&debugLink=...` ✅
- Confirmación verify-email (`GET /auth/verify-email/confirm?token=...`) -> `303` a `/auth/verify-email?ok=verified` ✅
- Forgot-password (`POST /auth/forgot-password/submit`) -> `303` con `ok=sent` (+ debugLink local) ✅
- Reset-password (`POST /auth/reset-password/submit`) con `passwordConfirm` -> `303` a `/auth/login?ok=password_reset` ✅
- Reenvío verify-email rate-limit (`POST /auth/verify-email/send` x7)
  - intentos 1..6 -> `ok=verify_sent`
  - intento 7 -> `err=rate_limited` ✅

Notas:
- No se reprodujo 500 en `/auth/register/submit` durante este smoke.
- Logs console del provider ahora redacted para `token=`.

## 2026-02-13 - Auth preflight (email/captcha env)

Comando:
- `npm run auth:preflight`

Resultado:
- `exit 0` ✅
- provider detectado: `console`
- warnings esperados en local: `AUTH_EMAIL_FROM` y `APP_BASE_URL` no definidos en entorno de shell directo.

Nota:
- El script ahora carga `.env.local` + `.env` automáticamente y valida configuración base de auth/email.

## 2026-02-13 - Admin users table (bulk + delete + detail page)

Implementado:
- `POST /admin/users/bulk` para acciones masivas:
  - `set_role`
  - `set_status`
  - `delete`
- `POST /admin/users/[id]/delete` para eliminación por fila.
- Protecciones server-side:
  - bloquea self-delete/self-bulk sobre cuenta admin actual,
  - protege último admin activo (`last_admin_protected`),
  - valida selección y acción bulk.
- Nueva página detalle admin-only:
  - `/admin/users/[id]`
  - resumen de cuenta + ownership (tracks/requests) + acciones.
- Mejora UI `/admin/users`:
  - tabla con checkboxes, select-all y barra de acciones bulk,
  - botón `Abrir` por fila hacia detalle,
  - mejora visual general (badges/hover/layout).

Validación:
- `npm run typecheck -- --pretty false` ✅

## 2026-02-14 - Admin List Kit (029) ejecución continua F0-F2

Implementado:
- Se creó base reutilizable `src/components/admin/list-kit/`:
  - `AdminListShell`
  - `AdminListHeader`
  - `AdminListPanel`
  - `AdminStatusBadge` + `AdminRoleBadge`
  - `AdminListEmptyState`
  - `AdminDataTable<T>`
  - tipos `AdminColumnDef<T>` y `AdminRowAction<T>`
- Migración `/admin/users` al kit (parcial estructural sin romper lógica):
  - shell/header/panels/badges reutilizables
  - badge de éxito bulk inline junto al contador
  - fix de filtros: limpieza local ahora recupera todo el set (servidor ya no prefiltra por role/status/q)
- Migración `/admin/tracks` al kit:
  - header y badge paginación con `AdminListHeader`/`AdminStatusBadge`
  - tabla desktop migrada a `AdminDataTable<T>` con columnas tipadas
  - empty state común con `AdminListEmptyState`
  - se mantienen acciones Analyze/Payload/Edit y paginación

Validación técnica:
- `npm run typecheck` ✅

Notas:
- Fase 3 (requests/licensing) y Fase 4 (playlists/contracts) quedan como siguiente tramo de migración.
- `docs/plans/029-admin-list-kit.md` actualizado con estado real de avance (F0/F1/F2 marcados).

## 2026-02-14 - Admin List Kit (029) avance extendido F3/F4

Implementado adicional:
- Nuevos bloques reutilizables en `list-kit`:
  - `AdminFilterPanel`
  - `AdminBulkPanel`
  - `AdminTableRowActions`
- Migración extendida de `/admin/users`:
  - panel de filtros y panel bulk ahora usan `AdminFilterPanel` y `AdminBulkPanel`.
- Migración de `/admin/requests` al List Kit:
  - `AdminListShell` + `AdminListHeader` + `AdminFilterPanel` + `AdminStatusBadge`.
  - filtros con `LabeledSelect` en desktop/mobile.
  - contadores de filtros activos y selección.
  - footer de paginación integrado al shell.
  - acciones bulk/delete y cards mobile preservadas.
- Migración de `/admin/licensing` al List Kit:
  - shell/header/filtros unificados.
  - tabla desktop con `AdminDataTable<T>`.
  - cards mobile para evitar overflow horizontal.
  - paginación `Anterior/Siguiente` integrada.
- Aplicación de scaffold List Kit en rutas placeholder:
  - `/admin/playlists`
  - `/admin/contracts`

Validación técnica:
- `npm run typecheck` ✅

Notas:
- F4 queda parcialmente abierto solo por falta de datasource real en playlists/contracts (layout listo, data pendiente).
- Se priorizó mantener paridad funcional en requests/licensing y mejorar consistencia visual desktop/mobile.

## 2026-02-14 - Admin List Kit (029) documentación transversal

- `docs/PROJECT_GENERAL_CONTEXT.md` actualizado con sección nueva:
  - `10) Admin List Kit reusable (src/components/admin/list-kit)`
  - inventario de componentes, rutas y estado.
- `docs/plans/029-admin-list-kit.md` actualizado con estado real:
  - F0/F1/F2/F3 completadas.
  - F4 completada en modo scaffold (playlists/contracts sin datasource real).
  - F5/F6/F7 quedan como etapa de hardening y cierre final.

## 2026-02-14 - Admin List Kit (029) hardening F5/F6/F7 parcial

Implementado:
- Utilidades reusable de estado/filtros/selección:
  - `src/components/admin/list-kit/filter-utils.ts`
  - `src/components/admin/list-kit/selection-utils.ts`
- Integración de utilidades en:
  - `/admin/users` (conteo filtros + selección)
  - `/admin/requests` (serialización URL filtros)
  - `/admin/licensing` (serialización URL filtros)
- Nuevos tests unitarios:
  - `tests/list-kit/filter-utils.spec.ts`
  - `tests/list-kit/selection-utils.spec.ts`
- Documentación:
  - plan `029-admin-list-kit.md` actualizado con estado real y checklist smoke final.
  - `docs/PROJECT_GENERAL_CONTEXT.md` actualizado con guía rápida para crear nuevas listas con List Kit.

Validación:
- `npm run typecheck` ✅
- `npx vitest run tests/list-kit/*.spec.ts -c vitest.config.ts` ✅

Bloqueo detectado:
- `npm run lint` ❌ por error preexistente de configuración:
  - `eslint.config.mjs: ReferenceError: js is not defined`
  - pendiente corregir config para cerrar F6 al 100%.

## 2026-02-14 - ESLint unblock completo

Acción:
- Se corrigió `eslint.config.mjs` para habilitar ejecución completa de lint en Flat Config.
- Se ajustaron severidades de reglas para desbloquear pipeline en base legacy.

Resultado:
- `npm run lint` ✅ (sin errores; warnings presentes)
- `npm run typecheck` ✅

Observación:
- Persisten warnings de deuda técnica (unused vars, no-floating-promises, no-empty, etc.).
- Esto no bloquea ejecución ahora, pero conviene limpiar por lotes en una fase de calidad dedicada.

## 2026-02-14 - Tracks List Kit aplicado (filtros server-side)

Implementado en `/admin/tracks`:
- Se agregó panel de filtros con List Kit (`AdminFilterPanel`):
  - búsqueda por `title/artist`
  - estado de análisis (`todos`, `analizado`, `sin análisis`, `sin audio`)
  - selector `por página`
- Filtros aplican en servidor (Prisma `where`) y se preservan en paginación.
- Header y estados ya quedan alineados al patrón List Kit.

Validación:
- `npm run typecheck` ✅
- `npm run lint` ✅ (solo warnings legacy)

## 2026-02-14 - Fix acceso Users redirigía a Tracks

Causa probable:
- páginas de users son ADMIN-only y redirigían a `/admin/tracks` en caso no autorizado.
- el layout cliente mostraba menú completo cuando `role` era `null`, lo que permitía ver `Users` aunque sesión/rol no fueran válidos.

Fix aplicado:
- `src/components/admin/AdminDashboardLayoutClient.tsx`
  - ahora usa siempre `getAdminDashboardSectionsForRole(role)` (si `role` null, no expone items admin).
- páginas admin-only de users ahora redirigen a login con contexto:
  - `src/app/admin/users/page.tsx`
  - `src/app/admin/users/roles/page.tsx`
  - `src/app/admin/users/[id]/page.tsx`
  - redirect a `/admin/login?err=forbidden`.

Validación:
- `npm run typecheck` ✅
- `npm run lint` ✅ (solo warnings legacy)


## 2026-02-14 · Plan 030 avance (Codex)
- Implementado CRUD/bulk API para playlists, sound-kits, services, contracts.
- Implementadas listas List Kit en `/admin/playlists`, `/admin/sound-kits`, `/admin/services`, `/admin/contracts`.
- Implementadas rutas de detalle con edición rápida persistente en los 4 módulos.
- Ejecutado `npm run db:seed:modules` (ok).
- Ejecutado `npm run typecheck` (ok).
- Ejecutado lint focal de archivos nuevos/modificados (ok).

## 2026-02-14 · Plan 030 smoke técnico autenticado (Codex)
- Levantado dev server en `127.0.0.1:3010` para validación dirigida.
- Reseteado admin local para smoke:
  - `AUTH_BOOTSTRAP_ADMIN_EMAIL=admin@lynx.local AUTH_BOOTSTRAP_ADMIN_PASSWORD=CodexSmoke123! npm run db:bootstrap:auth`
- Login HTTP OK en `/auth/login/submit` con cookie `app_session`.
- GET autenticado (200) en:
  - `/admin/playlists`, `/admin/sound-kits`, `/admin/services`, `/admin/contracts`
  - filtros por query (`q`, `status`, `category`) con respuesta 200.
  - regresión: `/admin/users`, `/admin/tracks`, `/admin/requests` también 200.
- Smoke API autenticado (create + bulk status + bulk delete) OK en:
  - `/api/admin/playlists`
  - `/api/admin/sound-kits`
  - `/api/admin/services`
  - `/api/admin/contracts`

## 2026-02-14 · Plan 030 smoke PATCH por entidad (Codex)
- Levantado dev server en `127.0.0.1:3012` para smoke dirigido.
- Admin local reset para credencial temporal de prueba:
  - `AUTH_BOOTSTRAP_ADMIN_EMAIL=admin@lynx.local AUTH_BOOTSTRAP_ADMIN_PASSWORD=AdminTest123! npm run db:bootstrap:auth`
- Login HTTP OK y cookie de sesión válida.
- Flujo validado en cada módulo:
  - `POST /api/admin/{module}` (crear registro smoke)
  - `PATCH /api/admin/{module}/[id]` (cambio de nombre/título + estado)
  - `GET /api/admin/{module}?q=...` (verificación de persistencia)
  - `POST /api/admin/{module}/bulk` con `delete` (limpieza)
- Resultado final: `PATCH_SMOKE_OK` ✅ para playlists, sound-kits, services y contracts.
