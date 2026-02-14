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

> Objetivo: validar de punta a punta cuentas, roles, ownership, sesiones, invitaciones, verify-email, reset-password, captcha y provider de correo.
> Cómo usar esta guía: ejecutar cada check en orden. Cada check trae una explicación breve y un resultado esperado en línea separada.

### A) Preparación base
- [ ] A1. Ejecutar `npm run auth:preflight`.
  - Peras y manzanas: valida que las variables mínimas de auth/email/captcha estén coherentes antes de probar.
  - Esperado: termina en `OK`; puede mostrar warnings de entorno local (ej. `AUTH_EMAIL_FROM` o `APP_BASE_URL`).

- [ ] A2. Levantar app con `npm run dev -- --hostname 0.0.0.0 --port 3000` y abrir `http://localhost:3000`.
  - Peras y manzanas: confirma que estás usando la URL correcta para navegador local (no `0.0.0.0` como URL de navegación).
  - Esperado: carga normal sin `ERR_ADDRESS_INVALID`.

- [ ] A3. Verificar que existen `AUTH_BOOTSTRAP_ADMIN_EMAIL` y `AUTH_BOOTSTRAP_ADMIN_PASSWORD` en `.env`.
  - Peras y manzanas: esto asegura que puedes entrar como admin para ejecutar las pruebas de gestión.
  - Esperado: login admin posible en `/admin/login`.

- [ ] A4. Si no puedes entrar como admin, ejecutar bootstrap (`npm run db:bootstrap:auth` con envs del admin).
  - Peras y manzanas: crea o actualiza la cuenta admin base sin tocar cuentas de prueba existentes.
  - Esperado: admin activo y credenciales funcionales.

### B) Invitaciones y registro por rol
- [ ] B1. Crear invitación `CREATOR` desde `/admin/users`.
  - Peras y manzanas: valida el flujo de alta de cuentas no-admin.
  - Esperado: mensaje `ok=invite_created` e invitación activa en lista.

- [ ] B2. Crear invitación `STAFF`.
  - Peras y manzanas: prueba el rol operativo intermedio.
  - Esperado: invitación activa con rol `STAFF`.

- [ ] B3. Crear invitación `ADMIN`.
  - Peras y manzanas: prueba el alta de cuentas con permisos máximos.
  - Esperado: invitación activa con rol `ADMIN`.

- [ ] B4. Abrir cada link de invitación y completar registro.
  - Peras y manzanas: confirma que el token de invitación realmente habilita el seteo de password y activación de cuenta.
  - Esperado: cuenta creada y redirección a flujo de verificación de email.

- [ ] B5. Reusar un link ya usado.
  - Peras y manzanas: evita que un mismo token pueda registrar múltiples cuentas.
  - Esperado: segundo uso bloqueado.

- [ ] B6. Probar token inválido o expirado manualmente (`?token=xxx`).
  - Peras y manzanas: valida hardening del flujo de invitación.
  - Esperado: error claro de token inválido/expirado.

### C) Verify email
- [ ] C1. Confirmar redirección a `/auth/verify-email` después del registro.
  - Peras y manzanas: comprueba que el sistema no asume email validado por defecto.
  - Esperado: pantalla de verificación visible.

- [ ] C2. En provider `console`, usar `debugLink` para confirmar email.
  - Peras y manzanas: simula clic de correo sin depender aún de proveedor real.
  - Esperado: `ok=verified` y `emailVerifiedAt` seteado.

- [ ] C3. Reenviar verify email desde `/auth/verify-email/send`.
  - Peras y manzanas: comprueba recuperación cuando el usuario no recibe el primer correo.
  - Esperado: `ok=verify_sent`.

- [ ] C4. Forzar varios reenvíos seguidos.
  - Peras y manzanas: valida rate-limit anti abuso.
  - Esperado: error `err=rate_limited` al superar el umbral.

- [ ] C5. Activar `AUTH_ENFORCE_VERIFIED_EMAIL=1` y probar login sin verificar.
  - Peras y manzanas: confirma que el gate de verificación funciona cuando se habilita.
  - Esperado: bloqueo con `err=unverified`.

### D) Login / Logout por rol
- [ ] D1. Login CREATOR por `/auth/login`.
  - Peras y manzanas: valida ruta de entrada de usuario de catálogo.
  - Esperado: redirección a `/creator/tracks`.

- [ ] D2. Login STAFF por `/admin/login`.
  - Peras y manzanas: valida acceso admin limitado.
  - Esperado: entra a área admin permitida.

- [ ] D3. Login ADMIN por `/admin/login`.
  - Peras y manzanas: valida permisos completos.
  - Esperado: acceso a `/admin/users` y `/admin/users/roles`.

- [ ] D4. Logout en cada rol y volver a abrir una ruta protegida.
  - Peras y manzanas: asegura cierre de sesión real, no solo visual.
  - Esperado: redirección a login.

- [ ] D5. Probar credenciales inválidas.
  - Peras y manzanas: valida manejo de error de autenticación.
  - Esperado: `err=invalid` sin iniciar sesión.

### E) Autorización y ownership (026)
- [ ] E1. CREATOR A crea track y lo ve en su listado.
  - Peras y manzanas: valida ownership básico por usuario.
  - Esperado: solo ve sus tracks.

- [ ] E2. CREATOR B intenta abrir track de A por URL.
  - Peras y manzanas: prueba aislamiento entre cuentas.
  - Esperado: bloqueo (`403/404` o redirección según guard actual).

- [ ] E3. CREATOR B intenta mutar tags del track de A.
  - Peras y manzanas: valida permisos en backend, no solo en UI.
  - Esperado: respuesta `403`.

- [ ] E4. ADMIN abre y edita tracks de distintos owners.
  - Peras y manzanas: confirma visibilidad/edición global administrativa.
  - Esperado: permitido.

- [ ] E5. STAFF intenta abrir `/admin/users` y `/admin/users/roles`.
  - Peras y manzanas: verifica límite de permisos staff.
  - Esperado: acceso denegado.

### F) Gestión de usuarios admin
- [ ] F1. Editar nombre/rol/estado por fila en `/admin/users`.
  - Peras y manzanas: valida mutaciones puntuales en UI de tabla.
  - Esperado: cambios persisten al recargar.

- [ ] F2. Ejecutar bulk `set_role`.
  - Peras y manzanas: valida acciones masivas con selección múltiple.
  - Esperado: todos los seleccionados cambian rol.

- [ ] F3. Ejecutar bulk `set_status`.
  - Peras y manzanas: valida suspensión/activación masiva.
  - Esperado: estados actualizados para todos los seleccionados.

- [ ] F4. Ejecutar bulk `delete` con confirmación.
  - Peras y manzanas: valida flujo destructivo masivo.
  - Esperado: usuarios eliminados y lista actualizada.

- [ ] F5. Ejecutar delete individual por fila.
  - Peras y manzanas: valida operación destructiva puntual.
  - Esperado: usuario eliminado.

- [ ] F6. Probar self-delete y self-bulk.
  - Peras y manzanas: evita borrar/modificar tu propia cuenta admin por error.
  - Esperado: bloqueado.

- [ ] F7. Intentar dejar sistema sin admin activo.
  - Peras y manzanas: prueba guard crítico de seguridad.
  - Esperado: `last_admin_protected`.

- [ ] F8. Revisar detalle `/admin/users/[id]` con admin y staff.
  - Peras y manzanas: valida protección de ruta de detalle.
  - Esperado: admin entra, staff no.

### G) Forgot / Reset / Cambio de password
- [ ] G1. Enviar forgot-password para email existente y no existente.
  - Peras y manzanas: evita filtración de existencia de cuentas.
  - Esperado: misma respuesta UX (`ok=sent`) en ambos casos.

- [ ] G2. En modo `console`, abrir `debugLink` de reset.
  - Peras y manzanas: prueba el flujo completo sin correo real.
  - Esperado: abre form de nueva password.

- [ ] G3. Completar reset exitoso.
  - Peras y manzanas: confirma que la contraseña realmente cambia.
  - Esperado: redirección a `/auth/login?ok=password_reset` y login con clave nueva.

- [ ] G4. Verificar invalidación de sesiones previas después de reset.
  - Peras y manzanas: requisito de seguridad para cuentas comprometidas.
  - Esperado: sesiones antiguas quedan inválidas.

- [ ] G5. Cambiar password desde `/admin/account`.
  - Peras y manzanas: prueba cambio de credenciales desde panel interno.
  - Esperado: cambio aplicado + invalidación global de sesiones.

### H) Turnstile (027)
- [ ] H1. Con `TURNSTILE_ENABLED=0`, probar login/register/forgot/reset/admin-login.
  - Peras y manzanas: baseline sin captcha.
  - Esperado: flujos operan normal.

- [ ] H2. Con `TURNSTILE_ENABLED=1`, enviar forms sin token válido.
  - Peras y manzanas: valida protección anti-bot efectiva.
  - Esperado: `err=captcha` o equivalente.

- [ ] H3. Con token válido, reenviar los mismos forms.
  - Peras y manzanas: asegura que captcha no rompe usuarios reales.
  - Esperado: submit exitoso.

### I) Provider de correo
- [ ] I1. Modo `console`: probar invite/reset/verify.
  - Peras y manzanas: valida entorno local completo sin depender de terceros.
  - Esperado: todo funciona y aparece `debugLink` cuando corresponde.

- [ ] I2. Revisar logs de consola/terminal para tokens.
  - Peras y manzanas: controla que no haya fuga de secretos en logs.
  - Esperado: token redacted (no token crudo).

- [ ] I3. Modo `brevo` con API key real: enviar invite/reset/verify.
  - Peras y manzanas: prueba entregabilidad real.
  - Esperado: correos llegan en bandeja.

- [ ] I4. Validar remitente.
  - Peras y manzanas: consistencia de marca y compliance técnica.
  - Esperado: `AUTH_EMAIL_FROM` correcto en correos salientes.

- [ ] I5. Quitar config de Brevo en dev y reintentar.
  - Peras y manzanas: prueba fallback seguro para no bloquear QA local.
  - Esperado: flujo sigue funcional vía `console`.

### J) Cierre de smoke
- [ ] J1. Registrar resultados en `docs/debug/terminal.md`.
  - Peras y manzanas: deja evidencia reproducible y evita “funciona en mi máquina”.
  - Esperado: comando, resultado y error (si aplica) documentados.

- [ ] J2. Marcar checks de Fase 8 en este plan.
  - Peras y manzanas: cierra estado del plan con trazabilidad.
  - Esperado: Fase 8 reflejada según resultados reales.

- [ ] J3. Documentar bloqueos pendientes (si los hay).
  - Peras y manzanas: convierte problemas abiertos en backlog accionable.
  - Esperado: cada bloqueo con pasos para reproducir + impacto.
