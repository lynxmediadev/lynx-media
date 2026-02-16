# apps/landing

Landing pública de Lynx Media (`lynxmedia.cl`).

Estado actual:
- Estructura inicial creada (Fase 1 de migración/split).
- Baseline visual local en `src/styles/globals.base.css`.
- Componentes UI locales en `src/components/ui/*`.
- Infra de datos separada iniciada (Fase 3): `prisma/schema.prisma` propio.
- API de contacto implementada (Fase 4 baseline): `POST /api/contact`.
- Homepage dedicada de Landing en `app/LandingHero.tsx`.

Reglas:
- No incluir lógica de dominio de Plataforma (tracks/playlists/licensing).
- No depender de `src/` ni `prisma/` de la raíz del monorepo.

DB Landing (separada):
- Variable: `LANDING_DATABASE_URL` (ver `.env.example` de esta app).
- Modelo base: `ContactLead`.

Comandos útiles:
- `npm run db:generate`
- `npm run db:push`
- `npm run db:migrate`
- `npm run landing:preflight`
- `npm run build`

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

Compatibilidad de formulario:
- Ruta puente `POST /api/contact-request` en Landing para mantener contrato del payload previo.
