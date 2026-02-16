# apps/platform

Plataforma operativa (nombre final pendiente) derivada del proyecto actual.

Estado actual:
- Estructura inicial creada (Fase 1 de migración/split).
- Código fuente principal sigue temporalmente en la raíz (`src/`) hasta migración interna por fases.

Objetivo:
- Concentrar dominio de negocio: tracks, playlists, users, requests, contracts, etc.

DB:
- La plataforma mantiene su datasource actual (`DATABASE_URL`) en la raíz.
- La landing usa schema/env independiente (`LANDING_DATABASE_URL`).

Referencia de env de producción:
- `apps/platform/.env.production.example`
