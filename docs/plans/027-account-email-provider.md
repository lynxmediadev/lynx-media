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
- `APP_BASE_URL=http://localhost:3000` (dev) / dominio real (staging/prod)
- `AUTH_EMAIL_FROM=noreply@tu-dominio.com`
- `BREVO_API_KEY=...`
- `TURNSTILE_SITE_KEY=...`
- `TURNSTILE_SECRET_KEY=...`
- `TURNSTILE_ENABLED=0|1`

---

## Plan faseado (checklist ejecutable)

### Fase 0 · Preparación
- [ ] Definir envs en `.env.example` sin secretos.
- [ ] Crear capa `email provider` (interface + selector).
- [ ] Implementar provider `console` para dev local.
- [ ] Documentar configuración mínima en `docs/debug/COMANDOS.md`.

### Fase 1 · Brevo adapter
- [ ] Implementar `BrevoProvider` con API transaccional.
- [ ] Manejo de errores tipado (429, 401, timeout).
- [ ] Timeout y retry simple (máx 2 intentos).
- [ ] Fallback a `console` cuando provider no esté configurado en dev.

### Fase 2 · Templates
- [ ] Template invite (subject/html/text).
- [ ] Template reset password.
- [ ] Template verify email.
- [ ] Funciones helper para URLs seguras.

### Fase 3 · Integración Invite
- [ ] Integrar email real en `POST /admin/users/invite`.
- [ ] Mantener retorno de `link` en UI solo si provider=console/dev.
- [ ] Registrar evento de envío.
- [ ] Smoke invite e2e.

### Fase 4 · Integración Forgot/Reset
- [ ] Conectar `forgot-password` a provider real.
- [ ] Asegurar mensajes UX no filtren existencia de cuenta.
- [ ] Mantener invalidación sesiones al reset.
- [ ] Smoke forgot/reset e2e.

### Fase 5 · Verify Email real
- [ ] Agregar modelo Prisma `EmailVerificationToken`.
- [ ] Crear endpoint confirmación.
- [ ] Activar flag de `emailVerifiedAt` al confirmar.
- [ ] Gate progresivo (warning primero, enforce después).

### Fase 6 · Turnstile
- [ ] Componente reutilizable de captcha en forms auth.
- [ ] Validación server-side en submit routes.
- [ ] Errores UX claros (`captcha_required`, `captcha_failed`).
- [ ] Smoke anti-bot en login/register/reset.

### Fase 7 · Seguridad y hardening
- [ ] Revisar logs para evitar PII sensible.
- [ ] Reforzar rate-limit por action/fingerprint.
- [ ] Auditoría de secretos y env checks.
- [ ] Checklist SPF/DKIM/DMARC documentado.

### Fase 8 · QA final y rollout
- [ ] Smoke desktop/mobile auth lifecycle.
- [ ] QA por rol (`ADMIN/STAFF/CREATOR`) sin regresiones.
- [ ] Activar `AUTH_EMAIL_PROVIDER=brevo` en staging.
- [ ] Runbook de incidentes y rollback.

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
- `typecheck` limpio.
- Sin errores críticos de auth en `docs/debug/terminal.md`.
- Runbook mínimo de operación + recuperación documentado.

---

## Preguntas abiertas (para afinar antes de implementación)
1) ¿Dominio de envío final para `AUTH_EMAIL_FROM` (ej. `noreply@lynxmedia.cl`)?
2) ¿Verify email será obligatorio para login en v1 o v1.1?
3) ¿Quieres también email transaccional al cambiar password (notificación de seguridad)?
