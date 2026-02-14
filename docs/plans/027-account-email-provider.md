# 027 · Account Email Provider (Brevo + Turnstile)

## Prompt operativo (auto-instrucciones para ejecutar este plan)
> Implementar en fases cortas, sin romper auth actual ni ownership.
> Reglas:
> 1) no reemplazar el sistema de cuentas/roles existente, solo complementarlo,
> 2) feature flags por flujo para poder rollback rápido,
> 3) provider-agnostic (interfaz + adapters),
> 4) seguridad por defecto (tokens cortos de vida, rate-limit, no logs sensibles),
> 5) pruebas por fase (typecheck + smoke mínimo),
> 6) actualizar avance en este documento y en `docs/debug/terminal.md`.

---

## Decisión cerrada
- **Proveedor de email transaccional:** **Brevo** (plan free para v1).
- **Protección anti-bot en formularios auth:** **Cloudflare Turnstile**.
- **Auth/roles/ownership:** mantener implementación interna actual (Prisma + sesiones DB).

### Justificación técnica
- Mantiene bajo costo inicial y evita lock-in en identidad.
- Permite escalar luego a otro provider sin refactor masivo (por interfaz).
- Turnstile agrega seguridad en login/register/reset con fricción baja.

---

## Objetivo
Implementar envío real de correos para:
1) invitación de cuenta,  
2) reset password,  
3) verify email,  
con observabilidad y fallback controlado.

---

## Alcance v1 (in)
- Email provider desacoplado (`console` + `brevo`).
- Modo local de pruebas de email sin producción (`console` y opcional `mailpit` SMTP).
- Templates de email (invite/reset/verify).
- Verify email completo (token + confirm route).
- Turnstile server-side en auth forms críticos.
- Logging técnico de eventos de envío.

## Fuera de alcance v1 (out)
- Migración a proveedor auth externo (Clerk/Auth0/Supabase Auth).
- Flujos enterprise (SAML/SCIM).
- Queues distribuidas complejas (usar async liviano + retry simple).

---

## Diseño objetivo

### 1) Capa de provider
- `src/lib/account-auth/email/types.ts`
  - `EmailProvider` interface.
- `src/lib/account-auth/email/providers/console.ts`
- `src/lib/account-auth/email/providers/brevo.ts`
- `src/lib/account-auth/email/index.ts`
  - selector por `AUTH_EMAIL_PROVIDER`.

### 2) Templates transaccionales
- `src/lib/account-auth/email/templates/invite.ts`
- `src/lib/account-auth/email/templates/reset-password.ts`
- `src/lib/account-auth/email/templates/verify-email.ts`

### 3) Verify email
- Prisma: `EmailVerificationToken` (hash token, expiresAt, usedAt, userId).
- Rutas:
  - `POST /auth/verify-email/send` (opcional para reenvío)
  - `GET /auth/verify-email/confirm?token=...`

### 4) Turnstile
- Cliente:
  - componente reutilizable `AuthTurnstileField`.
- Server:
  - `src/lib/account-auth/turnstile.ts` para verify token con Cloudflare.
- Aplicar en:
  - `/auth/login/submit`
  - `/auth/register/submit`
  - `/auth/forgot-password/submit`
  - `/auth/reset-password/submit`

### 5) Observabilidad
- Logs estructurados:
  - `email_invite_sent`
  - `email_reset_sent`
  - `email_verify_sent`
  - `email_provider_error`
- Nunca loggear token crudo ni password.

---

## Variables de entorno (v1)
- `AUTH_EMAIL_PROVIDER=console|brevo`
- `AUTH_EMAIL_DEBUG_LINKS=0|1` (mostrar links de debug en UI cuando aplique)
- `APP_BASE_URL=http://localhost:3000` (dev) / dominio real (staging/prod)
- `AUTH_EMAIL_FROM=noreply@tu-dominio.com`
- `BREVO_API_KEY=...`
- `TURNSTILE_SITE_KEY=...`
- `TURNSTILE_SECRET_KEY=...`
- `TURNSTILE_ENABLED=0|1`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY=...` (cliente)

---

## Plan faseado (checklist ejecutable)

### Fase 0 · Preparación
- [x] Definir envs en `.env.example` sin secretos.
- [x] Crear capa `email provider` (interface + selector).
- [x] Implementar provider `console` para dev local.
- [x] Documentar configuración mínima en `docs/debug/COMANDOS.md`.

### Fase 1 · Brevo adapter
- [x] Implementar `BrevoProvider` con API transaccional.
- [x] Manejo de errores tipado (429, 401, timeout).
- [x] Timeout y retry simple (máx 2 intentos).
- [x] Fallback a `console` cuando provider no esté configurado en dev.

### Fase 2 · Templates
- [x] Template invite (subject/html/text).
- [x] Template reset password.
- [x] Template verify email.
- [x] Funciones helper para URLs seguras.

### Fase 3 · Integración Invite
- [x] Integrar email real en `POST /admin/users/invite`.
- [x] Mantener retorno de `link` en UI solo si provider=console/dev.
- [x] Registrar evento de envío.
- [x] Smoke invite e2e.

### Fase 4 · Integración Forgot/Reset
- [x] Conectar `forgot-password` a provider real.
- [x] Asegurar mensajes UX no filtren existencia de cuenta.
- [x] Mantener invalidación sesiones al reset.
- [x] Smoke forgot/reset e2e.

### Fase 5 · Verify Email real
- [x] Agregar modelo Prisma `EmailVerificationToken`.
- [x] Crear endpoint confirmación.
- [x] Activar flag de `emailVerifiedAt` al confirmar.
- [x] Gate progresivo (warning primero, enforce después).

### Fase 6 · Turnstile
- [x] Componente reutilizable de captcha en forms auth.
- [x] Validación server-side en submit routes.
- [x] Errores UX claros (`captcha_required`, `captcha_failed`).
- [x] Smoke anti-bot en login/register/reset.

### Fase 7 · Seguridad y hardening
- [x] Revisar logs para evitar PII sensible.
- [x] Reforzar rate-limit por action/fingerprint.
- [x] Auditoría de secretos y env checks.
- [x] Checklist SPF/DKIM/DMARC documentado.

### Fase 8 · QA final y rollout
- [ ] Smoke desktop/mobile auth lifecycle.
- [ ] QA por rol (`ADMIN/STAFF/CREATOR`) sin regresiones.
- [ ] Activar `AUTH_EMAIL_PROVIDER=brevo` en staging.
- [ ] Runbook de incidentes y rollback.

### Fase 9 · Retiro legacy `admin_session` (obligatorio de cierre)
- [ ] Definir fecha oficial de corte (propuesta: **March 2, 2026**).
- [ ] Agregar telemetría de uso legacy por ruta (`legacy_admin_session_used`).
- [ ] Semana 1: desactivar emisión de cookies legacy en login (`/admin/login/submit`).
- [ ] Semana 2: bloquear aceptación de `admin_session` en middleware/guards.
- [ ] Semana 3: eliminar ramas legacy y variables no usadas.
- [ ] Actualizar documentación operativa y checklist de rollback.

---

## Smoke checklist específico (027)
- [ ] Invite enviada y recibida en bandeja real.
- [ ] Link de invite crea cuenta válida con rol correcto.
- [ ] Forgot envía reset y token expira correctamente.
- [ ] Reset actualiza password + invalida sesiones previas.
- [ ] Verify email confirma y setea `emailVerifiedAt`.
- [ ] Turnstile bloquea submit inválido.
- [ ] Turnstile permite submit válido.
- [ ] Sin filtración de tokens en logs.

---

## Estrategia de rollback
- Mantener `AUTH_EMAIL_PROVIDER=console` como modo seguro.
- Feature flag para verify-email enforcement.
- Si Brevo falla: desactivar provider y conservar flujos funcionales con `console`.
- No borrar rutas antiguas hasta pasar smoke + QA.

---

## Criterio de terminado
- Todos los checks de Fase 8 en verde.
- Fase 9 completada (sin tráfico legacy en logs por al menos 7 días).
- `typecheck` limpio.
- Sin errores críticos de auth en `docs/debug/terminal.md`.
- Runbook mínimo de operación + recuperación documentado.

---

## Preguntas abiertas (para afinar antes de implementación)
1) ¿Dominio de envío final para `AUTH_EMAIL_FROM` (ej. `noreply@lynxmedia.cl`)?
2) ¿Verify email será obligatorio para login en v1 o v1.1?
3) ¿Quieres también email transaccional al cambiar password (notificación de seguridad)?

---

## Estado actual (avance real al 2026-02-13)
- Implementado: provider desacoplado (`console` + `brevo`), templates invite/reset/verify, verify-email full flow, Turnstile opcional con validación server-side, fallback seguro en dev.
- Integrado: `/admin/users/invite`, `/api/admin/users/invite`, `/auth/forgot-password/submit`, `/auth/register/submit`, `/auth/verify-email/send`, `/auth/verify-email/confirm`.
- Hardening aplicado: rate-limit para `verify_email_send`; sanitización de tokens en logs del provider console.
- Preflight operativo agregado: `npm run auth:preflight` (valida env de provider/captcha/base URL).
- Prisma: migración creada `20260213190242_account_email_provider_verify_email`.
- Smoke técnico local: invite/register/verify/reset OK (modo `AUTH_EMAIL_PROVIDER=console`, `TURNSTILE_ENABLED=0`).

### Pendiente para cerrar 027
- Ejecutar `npm run auth:preflight` con env reales de staging/prod.
- Validar SPF/DKIM/DMARC con dominio definitivo (DNS aplicado).
- Smoke manual final desktop/mobile por rol y cierre de runbook operativo.

### Checklist SPF / DKIM / DMARC (Brevo)
- SPF (DNS TXT): incluir proveedor de Brevo en el registro SPF del dominio emisor.
- DKIM: habilitar y validar las claves DKIM que entrega Brevo para el dominio.
- DMARC (DNS TXT): definir política inicial `p=none` + monitoreo; luego escalar a `quarantine/reject`.
- Return-Path / dominio verificado: completar verificación de dominio en panel Brevo.
- Prueba de entregabilidad: enviar invite/reset/verify a Gmail/Outlook y revisar encabezados `spf=pass`, `dkim=pass`, `dmarc=pass`.

---

## Checklist manual E2E (026 -> 027)

> Objetivo: validar cuentas, roles, ownership, sesiones, invitaciones, verify email, reset password, captcha y provider de correos.
> Peras y manzanas: cada check dice **qué probar** y al final “**Esperado:**” te dice qué debería pasar si está bien.

### A) Preparación base
- [ ] `npm run auth:preflight` sin errores críticos. **Esperado:** termina en OK (warnings de local pueden existir).
Auth preflight
- AUTH_EMAIL_PROVIDER=console
- TURNSTILE_ENABLED=0
- AUTH_ENFORCE_VERIFIED_EMAIL=0

Warnings:
- AUTH_EMAIL_FROM está vacío. En modo console funciona, pero debes definirlo para provider real.
- APP_BASE_URL no está definido. Se usará el origin de la request.

OK: configuración mínima válida.

- [ OK ] Servidor local arriba (`npm run dev -- --hostname 0.0.0.0 --port 3000`) y acceso por `http://localhost:3000`. **Esperado:** carga normal, sin `ERR_ADDRESS_INVALID`.


- [ OK ] `AUTH_BOOTSTRAP_ADMIN_EMAIL` y `AUTH_BOOTSTRAP_ADMIN_PASSWORD` definidos para poder entrar como admin. **Esperado:** login admin posible.
- [ NO ENTENDÍ ESTA PRUEBA ] Si faltan cuentas base, ejecutar bootstrap admin. **Esperado:** se crea/actualiza admin activo.

### B) Invitaciones y registro por rol
- [ ] Crear invitación `CREATOR` (admin panel o script) y verificar `ok=invite_created`. **Esperado:** invitación creada y visible como activa.
- [ ] Crear invitación `STAFF`. **Esperado:** invitación activa con rol STAFF.
- [ ] Crear invitación `ADMIN`. **Esperado:** invitación activa con rol ADMIN.
- [ ] Abrir link de registro CREATOR y completar formulario (password valida). **Esperado:** cuenta creada y redirección a verify-email.
- [ ] Abrir link de registro STAFF y completar formulario. **Esperado:** cuenta STAFF creada.
- [ ] Abrir link de registro ADMIN y completar formulario. **Esperado:** cuenta ADMIN creada.
- [ ] Verificar que token de invitación no pueda reusarse. **Esperado:** segundo intento bloqueado.
- [ ] Verificar manejo de token inválido/expirado (`err=invite` o equivalente). **Esperado:** mensaje de token inválido/expirado.

### C) Verify email
- [ ] Tras registro, confirmar redirección a `/auth/verify-email`. **Esperado:** pantalla de verificación visible.
- [ ] En modo `console`, usar `debugLink` y confirmar email (`ok=verified`). **Esperado:** cuenta queda con `emailVerifiedAt`.
- [ ] Reenviar verify email desde `/auth/verify-email/send` y confirmar `ok=verify_sent`. **Esperado:** reenvío exitoso.
- [ ] Forzar varios reenvíos y verificar rate-limit (`err=rate_limited`). **Esperado:** bloqueo temporal después del umbral.
- [ ] Con `AUTH_ENFORCE_VERIFIED_EMAIL=1`, validar bloqueo de login sin verificación (`err=unverified`). **Esperado:** no deja iniciar sesión si no verifica.

### D) Login / Logout por rol
- [ ] Login CREATOR por `/auth/login` -> redirección a `/creator/tracks`. **Esperado:** entra sólo a área creator.
- [ ] Login STAFF por `/admin/login` -> acceso a `/admin/tracks`. **Esperado:** entra a admin limitado.
- [ ] Login ADMIN por `/admin/login` -> acceso completo admin. **Esperado:** acceso a rutas de usuarios/roles.
- [ ] Logout en cada rol y verificar que rutas protegidas redirigen a login. **Esperado:** sesión cerrada correctamente.
- [ ] Verificar error de credenciales inválidas (`err=invalid`). **Esperado:** no inicia sesión y muestra error.

### E) Autorización y ownership (026)
- [ ] CREATOR A crea track y lo ve en `/creator/tracks`. **Esperado:** sólo aparecen sus propios tracks.
- [ ] CREATOR B no puede abrir track de A por URL (bloqueo/404/403 esperado). **Esperado:** acceso denegado.
- [ ] CREATOR B no puede mutar tags del track de A (403). **Esperado:** backend responde prohibido.
- [ ] ADMIN sí puede abrir/editar tracks de cualquier owner. **Esperado:** acceso total administrativo.
- [ ] STAFF no accede a `/admin/users` ni `/admin/users/roles`. **Esperado:** redirección/bloqueo.

### F) Gestión de usuarios admin
- [ ] En `/admin/users`, editar nombre/rol/estado por fila funciona. **Esperado:** cambios persisten al recargar.
- [ ] Bulk `set_role` funciona con selección múltiple. **Esperado:** todos los seleccionados cambian rol.
- [ ] Bulk `set_status` funciona con selección múltiple. **Esperado:** todos los seleccionados cambian estado.
- [ ] Bulk `delete` funciona con confirmación. **Esperado:** elimina seleccionados y actualiza lista.
- [ ] Delete individual funciona. **Esperado:** elimina ese usuario puntual.
- [ ] Probar protección de self-delete y self-bulk (debe bloquear). **Esperado:** no permite tocar tu propia cuenta admin.
- [ ] Probar protección de último admin activo (`last_admin_protected`). **Esperado:** no deja dejar sistema sin admin.
- [ ] Probar página detalle `/admin/users/[id]` (solo admin). **Esperado:** admin entra, staff no.

### G) Forgot / Reset / Cambio de password
- [ ] Forgot password (`/auth/forgot-password`) responde `ok=sent` sin filtrar existencia de cuenta. **Esperado:** mismo mensaje exista o no el email.
- [ ] En modo `console`, usar `debugLink` para abrir reset. **Esperado:** abre formulario de nueva password.
- [ ] Reset password exitoso redirige a `/auth/login?ok=password_reset`. **Esperado:** login con nueva clave funciona.
- [ ] Verificar que sesiones previas se invalidan tras reset. **Esperado:** sesiones antiguas quedan fuera.
- [ ] En `/admin/account`, cambiar password y verificar invalidación global de sesiones. **Esperado:** seguridad aplicada en todas las sesiones.

### H) Turnstile (027)
- [ ] Con `TURNSTILE_ENABLED=0`, login/register/reset funcionan sin captcha. **Esperado:** flujo normal.
- [ ] Con `TURNSTILE_ENABLED=1` y claves válidas, submit sin token falla (`err=captcha`). **Esperado:** bloqueo anti-bot.
- [ ] Con token válido, submit exitoso. **Esperado:** formulario continúa.
- [ ] Validar formularios con Turnstile: login, register, forgot, reset, admin login. **Esperado:** comportamiento consistente en todos.

### I) Provider de correo
- [ ] Modo `console`: invite/reset/verify funcionan y exponen links debug solo cuando corresponde. **Esperado:** puedes probar sin proveedor real.
- [ ] Verificar que logs no muestran token crudo (token redacted). **Esperado:** seguridad de logs.
- [ ] Modo `brevo` con API key real: llegan correos de invite/reset/verify. **Esperado:** entregabilidad real.
- [ ] Verificar remitente `AUTH_EMAIL_FROM` correcto. **Esperado:** correos salen con remitente oficial.
- [ ] Verificar fallback esperado en dev cuando falta config de Brevo. **Esperado:** no rompe flujo, usa console en dev.

### J) Cierre de smoke
- [ ] Registrar resultados en `docs/debug/terminal.md`. **Esperado:** evidencia reproducible del test.
- [ ] Marcar checks de Fase 8 en este archivo si todo está verde. **Esperado:** estado del plan actualizado.
- [ ] Listar bloqueos reales (si los hay) con pasos para reproducir. **Esperado:** backlog claro para resolver.
