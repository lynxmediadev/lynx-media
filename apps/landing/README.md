# apps/landing

Landing pública de Lynx Media (`lynxmedia.cl`).

Estado actual:
- Estructura inicial creada (Fase 1 de migración/split).
- Baseline visual conectado a `@lynx/brand-tokens` y `@lynx/brand-ui`.
- Infra de datos separada iniciada (Fase 3): `prisma/schema.prisma` propio.
- API de contacto implementada (Fase 4 baseline): `POST /api/contact`.
- Homepage alineado visualmente con Platform (`HomeSnap` + `FrontendShell` compartidos).

Reglas:
- No incluir lógica de dominio de Plataforma (tracks/playlists/licensing).
- Usar solo capas compartidas visuales (`packages/brand-ui`, `packages/brand-tokens`).

DB Landing (separada):
- Variable: `LANDING_DATABASE_URL` (ver `.env.example` de esta app).
- Modelo base: `ContactLead`.

Comandos útiles:
- `npm run landing:db:generate`
- `npm run landing:db:push`
- `npm run landing:db:migrate`
- `npm run landing:preflight`

Fase 4 (baseline):
- Formulario en `app/page.tsx`.
- Persistencia de leads en `ContactLead`.
- Validación + honeypot + rate-limit en memoria.
- Notificación configurable:
  - `LANDING_CONTACT_EMAIL_PROVIDER=console` (default)
  - `LANDING_CONTACT_EMAIL_PROVIDER=brevo` + `LANDING_BREVO_API_KEY`
  - `LANDING_CONTACT_FROM_EMAIL`, `LANDING_CONTACT_FROM_NAME`
  - destino en `LANDING_CONTACT_NOTIFY_EMAIL`
- Auto reply opcional al usuario:
  - `LANDING_CONTACT_SEND_AUTOREPLY=1`
  - `LANDING_CONTACT_AUTOREPLY_SUBJECT=...`

Compatibilidad homepage Platform:
- Ruta puente `POST /api/contact-request` en Landing para reutilizar el formulario de contacto del HomeSnap.
