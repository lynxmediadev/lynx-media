# 026 · Account System + Ownership (CREATOR)

## Prompt operativo (para ejecutar este plan)
> Implementar por fases sin romper `/admin` ni el flujo actual de edición.
> Reglas:
> 1) migración incremental con rollback claro,
> 2) seguridad por defecto (hashing fuerte, sesiones revocables, rate limit),
> 3) autorización server-side en mutaciones y lecturas sensibles,
> 4) ownership estricto por cuenta para `CREATOR`,
> 5) no eliminar legado hasta validar paridad funcional,
> 6) documentar en `docs/debug/terminal.md` y actualizar inventario en `docs/PROJECT_GENERAL_CONTEXT.md`.

---

## Decisiones cerradas (resueltas)
- [x] Registro por invitación.
- [x] `STAFF` puede borrar tracks (además de editar).
- [x] Panel de creator en ruta `/creator`.
- [x] v1 con email/password (sin OAuth en v1).
- [x] Owner por defecto de datos legacy: cuenta admin bootstrap.
- [ ] Definir fecha exacta para retirar login legacy (`admin_session`).

---

## Objetivo de negocio y producto
- Login/registro/cuentas independientes.
- Roles:
  - `ADMIN`
  - `STAFF`
  - `CREATOR`
- Cada `CREATOR` debe ver y editar solo recursos propios.

---

## Estado de implementación (avance real)

### Modelo de datos (Prisma)
- [x] `UserRole`: `ADMIN`, `STAFF`, `CREATOR`
- [x] `UserStatus`: `ACTIVE`, `INVITED`, `SUSPENDED`
- [x] `User`
- [x] `UserSession`
- [x] `PasswordResetToken`
- [x] `InviteToken`
- [x] `Track.ownerUserId` + índice
- [x] `LicensingRequest.ownerUserId` + índice
- [x] Migración aplicada (`20260213053053_account_system_phase1`)
- [x] Script bootstrap admin + backfill ownership (`npm run db:bootstrap:auth`)
- [ ] `ownerUserId` en modelos no existentes aún (`Playlist`/`Upload`) cuando existan en schema
- [ ] Endurecer ownership a `NOT NULL` después del rollout completo

### Auth base
- [x] Password hashing/verificación (`scrypt`) en `src/lib/account-auth/password.ts`
- [x] Sesiones DB + cookie firmada `app_session` (`v2`) en `src/lib/account-auth/session.ts`
- [x] Guards server-side (`requireRole`, ownership check) en `src/lib/account-auth/guards.ts`
- [x] Login nuevo `/auth/login`
- [x] Registro por invitación `/auth/register`
- [x] Logout nuevo `/auth/logout`
- [x] Cambio de password autenticado con invalidación global de sesiones (`/auth/change-password/submit`)
- [x] Login admin híbrido (nuevo + fallback legacy) `/admin/login/submit`
- [x] Logout admin limpia sesión nueva + legacy `/admin/logout`

### Middleware
- [x] `/admin/**` protegido para `ADMIN|STAFF` con fallback legacy temporal
- [x] `/creator/**` protegido para `CREATOR`
- [x] Redirección correcta a login según zona

### Ownership v1 aplicado
- [x] Crea track con `ownerUserId` cuando existe sesión nueva (`/api/tracks`)
- [x] Solicitudes públicas de licensing heredan owner desde el track (`/api/contact`, `/api/licensing/request`)
- [x] Panel creator inicial:
  - [x] `/creator/tracks` (solo tracks propios)
  - [x] `/creator/tracks/[id]` (detalle propio)
  - [x] `/creator/tracks/[id]/update` (edición básica propia)

### Herramientas operativas
- [x] Script bootstrap admin: `npm run db:bootstrap:auth`
- [x] Script crear invitación: `npm run db:create:invite`

---

## Plan por fases (actualizado)

### Fase 0 · Definiciones cerradas
- [x] Política de registro cerrada (invitación).
- [x] Permisos base de `STAFF` cerrados.
- [x] Ruta panel creator cerrada (`/creator`).
- [ ] Fecha de retiro de legacy cerrada.

### Fase 1 · Base auth
- [x] Tablas/enums auth en Prisma.
- [x] Migración + bootstrap de usuario admin inicial.
- [x] Login/logout funcional con sesión DB.
- [x] Middleware híbrido (nuevo + fallback).
- [x] Completar forgot/reset en UI y backend.
- [ ] Verify email con proveedor real (pendiente de proveedor elegido).

### Fase 2 · Ownership schema
- [x] `ownerUserId` en `Track` y `LicensingRequest`.
- [x] Backfill inicial de owner en legacy.
- [x] Índices por owner.
- [ ] Subir owner a `NOT NULL` tras validación.

### Fase 3 · Ownership enforcement backend
- [x] Filtros por owner en panel creator (list/detail/update).
- [x] Guardas de acceso cross-owner en rutas creator.
- [x] Expandir enforcement principal en API de tags/analyze/audio-check por ownership/rol.
- [x] Revisar server actions legacy de edit avanzado para guardas explícitas por rol.

### Fase 4 · UI por rol
- [x] Crear rutas base de creator.
- [x] Ajustar sidebar/topbar dinámico por rol (staff sin users/roles).
- [x] Garantizar breadcrumbs/acciones consistentes por rol.

### Fase 5 · Registro y lifecycle
- [x] Registro por invitación.
- [x] Forgot/reset password.
- [x] Cambio de password desde `/admin/account` (ADMIN/STAFF).
- [ ] Verify email real por proveedor.
- [x] Suspensión/reactivación completa.

### Fase 6 · Gestión de usuarios (admin)
- [x] `/admin/users` listado.
- [x] Filtros role/status.
- [x] Cambio de rol.
- [x] Suspensión/reactivación.
- [x] UI de invitaciones + matriz de atribuciones por rol.

### Fase 7 · Seguridad y performance
- [x] Rate limit login/register/reset.
- [x] Invalidación global de sesiones al cambiar password.
- [x] Invalidación de sesiones al reset de password y suspensión de usuario.
- [x] Auditoría de queries por ownership.
- [x] Hardening final cookies/sesión.

### Fase 8 · QA, rollout y limpieza
- [ ] Smoke desktop/mobile completo.
- [x] QA de límites por rol + ownership.
- [ ] Activar auth nueva como default operativa.
- [ ] Retirar fallback legacy.
- [ ] Runbook final.

---

## Smoke checklist (pendientes de validación funcional)
- [x] `CREATOR A` crea track y solo lo ve `CREATOR A`.
- [x] `CREATOR B` no puede abrir/editar track de `CREATOR A` por URL.
- [x] `ADMIN` puede ver/editar recursos de todos.
- [x] `STAFF` respeta límites cerrados.
- [x] Registro/login/logout funcionan de extremo a extremo.
- [ ] Flujo creator sin overflow en mobile.

---

## Deuda técnica detectada en esta fase
- [x] Resolver deuda legacy `moods/uses` para recuperar `tsc --noEmit` limpio:
  - `src/app/api/tracks/route.ts`
  - `prisma/seed.bulk.ts`
  - `src/components/public/SimilarTracks.tsx`
- [x] Resolver import faltante:
  - `src/components/admin/track/CatalogTagsForm.tsx` -> `@/app/admin/track/actions/update-catalog-tags`
- [x] Typecheck global limpio (`npm run typecheck`).

---

## Comandos útiles para esta implementación
- Bootstrap admin + backfill owner:
  - `npm run db:bootstrap:auth`
- Crear invitación:
  - `INVITE_EMAIL=creator@example.com npm run db:create:invite`
- Login creator:
  - usar URL de registro generada por script de invitación.

---

## Respuestas del producto (histórico)
1) Registro: **por invitación**.  
2) `STAFF`: **puede borrar tracks** (y se pide una vista de atribuciones por rol).  
3) Panel creator: **`/creator`**.  
4) Email provider: pendiente, ideal opción gratuita/configurable.  
5) Retiro legacy: pendiente, decidir tras smoke estable.  
6) OAuth: en v1, **solo email/password**.  
7) `CREATOR`: debe ver todo lo asociado a su material.  
8) Owner legacy por defecto: **sí**, cuenta admin bootstrap.
