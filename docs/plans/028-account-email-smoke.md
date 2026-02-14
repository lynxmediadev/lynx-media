# 028 · Account Email Smoke (manual + rápido)

## Prompt operativo (auto-instrucciones)
> Ejecutar smoke por capas, de menor a mayor costo:
> 1) local sin proveedor real (`console`),  
> 2) local con proveedor real (`brevo`),  
> 3) revisar UX/roles en desktop + mobile.  
> Regla: no avanzar a la siguiente capa si la anterior falla.

---

## Objetivo
- Validar end-to-end: `invite -> register -> verify email -> login -> forgot/reset`.
- Reducir fricción para pruebas repetidas.
- Dejar un checklist estable para repetir después de cambios.

---

## Cómo evitar crear correos dummy nuevos cada vez (recomendado)

### Estrategia A (más rápida, recomendada para desarrollo diario)
- Usar `AUTH_EMAIL_PROVIDER=console` y `AUTH_EMAIL_DEBUG_LINKS=1`.
- No necesitas bandeja real: recibes links de debug en UI/redirect.
- Reutiliza siempre 3 cuentas fijas:
  - `smoke.creator@...`
  - `smoke.staff@...`
  - `smoke.admin@...`

### Estrategia B (cuando quieras validar entregabilidad real)
- Mantener una sola bandeja real y usar alias (`+tag`) si tu proveedor lo soporta:
  - `tuemail+creator@...`
  - `tuemail+staff@...`
  - `tuemail+admin@...`
- Crear invitaciones con esos aliases y repetir pruebas sin inventar emails nuevos.

### Estrategia C (limpieza periódica)
- Cada cierto tiempo, borrar/depurar usuarios smoke desde DB (o admin panel cuando tengamos bulk delete).
- Mantener sólo 3–5 cuentas smoke estables.

---

## Nota importante de host local
- Si levantas Next con `--hostname 0.0.0.0`, **navega en** `http://localhost:3000` (o `127.0.0.1`).
- `http://0.0.0.0:3000` en navegador puede fallar con `ERR_ADDRESS_INVALID`.

---

## Preparación mínima

### 1) Variables de entorno (modo local rápido)
Objetivo: testear lógica sin depender de proveedor externo.

```env
AUTH_EMAIL_PROVIDER=console
AUTH_EMAIL_DEBUG_LINKS=1
TURNSTILE_ENABLED=0
AUTH_ENFORCE_VERIFIED_EMAIL=0
APP_BASE_URL=http://localhost:3000
```

### 2) Preflight de configuración
Objetivo: detectar errores de env antes del smoke.

```bash
npm run auth:preflight
```

Esperado:
- `OK: configuración mínima válida.`
- Warnings aceptables en local (si aplica).

### 3) Bootstrap admin (si aún no existe)
Objetivo: asegurar acceso admin al panel.

```bash
AUTH_BOOTSTRAP_ADMIN_EMAIL=admin@lynx.local AUTH_BOOTSTRAP_ADMIN_PASSWORD=TuClaveSegura123! npm run db:bootstrap:auth
```

---

## Smoke manual paso a paso (modo `console`)

### Fase 1 · Invite + Register
- [ ] **Paso 1**: crear invitación CREATOR.
  - Comando:
    ```bash
    INVITE_EMAIL=smoke.creator@example.com INVITE_ROLE=CREATOR APP_BASE_URL=http://localhost:3000 npm run db:create:invite
    ```
  - Objetivo: obtener `registerUrl`.

- [ ] **Paso 2**: abrir `registerUrl` en navegador y completar registro.
  - Objetivo: redirección a `/auth/verify-email?ok=sent`.

- [ ] **Paso 3**: confirmar email usando `debugLink` (visible en UI en modo console).
  - Objetivo: `/auth/verify-email?ok=verified`.

### Fase 2 · Login + Guard de verificación
- [ ] **Paso 4**: login en `/auth/login` con cuenta recién creada.
  - Objetivo: acceso exitoso a `/creator/tracks`.

- [ ] **Paso 5 (opcional)**: activar `AUTH_ENFORCE_VERIFIED_EMAIL=1` y probar login sin verificar.
  - Objetivo: bloqueo con `err=unverified`.

### Fase 3 · Forgot / Reset
- [ ] **Paso 6**: ir a `/auth/forgot-password`, solicitar reset.
  - Objetivo: `ok=sent` y `debugLink`.

- [ ] **Paso 7**: abrir `debugLink`, cambiar password.
  - Objetivo: redirección a `/auth/login?ok=password_reset`.

- [ ] **Paso 8**: login con nueva password.
  - Objetivo: acceso OK.

### Fase 4 · Reenvío verify + rate-limit
- [ ] **Paso 9**: desde `/auth/verify-email`, usar reenvío varias veces.
  - Objetivo: luego del umbral, aparecer `err=rate_limited`.

---

## Smoke manual con proveedor real (Brevo)

### Configuración
Objetivo: validar entregabilidad real de correos.

```env
AUTH_EMAIL_PROVIDER=brevo
AUTH_EMAIL_FROM=noreply@tu-dominio.com
BREVO_API_KEY=xxxxxxxx
APP_BASE_URL=http://localhost:3000
TURNSTILE_ENABLED=0
AUTH_EMAIL_DEBUG_LINKS=0
```

### Preflight
- [ ] Ejecutar:
  ```bash
  npm run auth:preflight
  ```
- Objetivo: sin errores críticos de env.

### Pruebas
- [ ] Repetir Fase 1–3 sin `debugLink`.
- [ ] Confirmar recepción real en inbox (Gmail/Outlook/etc).
- [ ] Confirmar que links funcionan desde correo real.

---

## Checklist rápido por rol
- [ ] `ADMIN`: login `/admin/login`, acceso `/admin/users`.
- [ ] `STAFF`: login `/admin/login`, sin acceso a users/roles.
- [ ] `CREATOR`: login `/auth/login`, acceso sólo a `/creator/**` y ownership correcto.

---

## Qué falta en tabla USERS (backlog inmediato)
- [x] Acción por fila: **Eliminar usuario** (confirmación previa).
- [x] Selección múltiple (checkbox por fila + “select all”).
- [x] Bulk actions:
  - [x] bulk role update
  - [x] bulk status update
  - [x] bulk delete (con confirmación)
- [x] Protección: no permitir borrarte a ti mismo (`currentUser`).
- [ ] Auditoría: registrar acción masiva en log.
- [x] Página detalle por usuario (`/admin/users/[id]`) sólo admin.

> Nota: ahora `/admin/users` incluye delete por fila + bulk. Falta auditoría de acciones masivas.

---

## Definiciones útiles (glosario corto)
- **Preflight**: validación previa a ejecutar un flujo real.  
  En este caso, revisa env mínima de auth/email/captcha para evitar errores evitables.
- **Smoke test**: prueba corta y crítica para confirmar que lo esencial funciona.
- **Hardening**: mejoras de seguridad/robustez sin cambiar funcionalidad principal.
- **Rate-limit**: límite de intentos por ventana de tiempo.
- **Fallback**: ruta alternativa cuando falla un componente (ej: provider real -> console en dev).

---

## Criterio de “listo para seguir”
- [ ] Smoke `console` 100% OK.
- [ ] Smoke `brevo` básico OK (invite/reset/verify llegan).
- [ ] Roles (`ADMIN/STAFF/CREATOR`) validados manualmente.
- [ ] Sin errores en `docs/debug/terminal.md` durante el ciclo completo.

---

## Actualización UI `/admin/users` (2026-02-14)

- Se rediseñó la vista de users en layout tipo inbox/lista para uso operativo.
- Se separaron controles en dos módulos:
  - `Filtros de lista` (búsqueda en tiempo real + rol/estado + copy filter + clear).
  - `Acciones masivas` (selección + acción + aplicar + limpieza de selección).
- El filtro ahora actualiza en tiempo real y sincroniza URL sin submit completo.
- Se agregó `LabeledSelect` reutilizable (`src/components/admin/ui/LabeledSelect.tsx`) para unificar estilo de selector + título.
- Hover de botones en users unificado a gris sutil (`hover:bg-muted/45`) para consistencia visual.
