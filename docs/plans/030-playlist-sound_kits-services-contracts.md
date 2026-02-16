# 030 · Playlists + Sound Kits + Services + Contracts (MVP operativo + List Kit)

## Prompt operativo (auto-instrucciones para Codex)
> Objetivo: dejar **4 módulos operativos reales** (`/admin/playlists`, `/admin/sound-kits`, `/admin/services`, `/admin/contracts`) con datos reales/dummy y UI consistente con List Kit.
>
> Reglas de ejecución:
> 1) Entregar valor por fases y mantener siempre app compilando.
> 2) Priorizar MVP funcional completo (CRUD básico + listado + filtros + acciones masivas mínimas).
> 3) Reutilizar List Kit y componentes ya existentes antes de crear nuevos.
> 4) Garantizar desktop + mobile en cada módulo.
> 5) Registrar estado y bloqueos al final en `docs/debug/terminal.md`.
> 6) No romper módulos actuales (`users`, `tracks`, `requests`).

---

## Objetivo
Crear sistemas internos base para:
- Playlists
- Sound Kits
- Services
- Contracts

y visualizarlos con List Kit (misma estética/estructura que Users/Tracks/Requests), con dummy data útil para smoke test inmediato.

---

## Alcance (MVP de esta fase)
- Modelos Prisma + migración.
- APIs admin base por módulo (list/create/update/delete + bulk mínimo).
- Vistas admin con List Kit.
- Seeding dummy data coherente por módulo.
- Filtros y paginación básica.
- Estado y badges unificados.

## Fuera de alcance (por ahora)
- Firma digital real de contratos.
- Pasarela de pagos.
- Motor complejo de reglas de pricing.
- Upload/files avanzados con storage final (usar placeholders URL si aplica).

---

## Diseño de dominio propuesto

### 1) Playlists
- Entidad: `Playlist`
  - `id`, `createdAt`, `updatedAt`
  - `name`, `slug (unique)`, `description?`
  - `status` (`DRAFT | PUBLISHED | ARCHIVED`)
  - `visibility` (`PRIVATE | INTERNAL | PUBLIC`)
  - `coverUrl?`, `ownerUserId?`
  - `featured` (bool), `sortOrder` (int)
- Relación: `PlaylistTrack` (N:M con `Track`)
  - `playlistId`, `trackId`, `sortOrder`

### 2) Sound Kits
- Entidad: `SoundKit`
  - `id`, `createdAt`, `updatedAt`
  - `name`, `slug (unique)`, `description?`
  - `status` (`DRAFT | PUBLISHED | ARCHIVED`)
  - `price` (int), `currency` (`Currency`)
  - `coverUrl?`, `previewUrl?`
  - `ownerUserId?`, `featured` (bool), `sortOrder` (int)

### 3) Services
- Entidad: `ServiceOffer`
  - `id`, `createdAt`, `updatedAt`
  - `name`, `slug (unique)`, `category`
  - `status` (`ACTIVE | PAUSED | ARCHIVED`)
  - `description?`
  - `priceFrom?`, `priceTo?`, `currency` (`Currency`)
  - `turnaroundDays?`, `featured` (bool), `sortOrder` (int)
- `category` sugerida:
  - `MIX_MASTER`, `PRODUCTION`, `COMPOSITION`, `SOUND_DESIGN`, `OTHER`

### 4) Contracts
- Entidad: `Contract`
  - `id`, `createdAt`, `updatedAt`
  - `contractNumber (unique)`
  - `title`, `counterpartyName`, `counterpartyEmail?`
  - `status` (`DRAFT | SENT | NEGOTIATION | SIGNED | EXPIRED | CANCELED`)
  - `amount?` (int), `currency` (`Currency`)
  - `startsAt?`, `endsAt?`, `signedAt?`
  - `trackId?` (relación opcional a `Track`)
  - `requestId?` (string opcional para enlazar a request/licensing)
  - `fileUrl?`, `notes?`, `ownerUserId?`

---

## Arquitectura de implementación

### A) Prisma + DB
- [x] Crear enums nuevos en `prisma/schema.prisma`.
- [x] Crear modelos y relaciones mínimas.
- [x] Generar migración (`prisma migrate dev`).
- [x] Regenerar cliente Prisma.

### B) Seed / dummy data
- [x] Crear script `prisma/seed.modules.ts` (o integrar en seed actual).
- [x] Poblar mínimo:
  - [x] 10 playlists
  - [x] 12 sound kits
  - [x] 8 services
  - [x] 15 contracts
- [x] Datos realistas (nombres, estados variados, montos/fechas coherentes).
- [x] Comando npm dedicado (ej: `db:seed:modules`).

### C) APIs admin
- [x] `/api/admin/playlists` + `/api/admin/playlists/bulk` + `/api/admin/playlists/[id]`
- [x] `/api/admin/sound-kits` + `/api/admin/sound-kits/bulk` + `/api/admin/sound-kits/[id]`
- [x] `/api/admin/services` + `/api/admin/services/bulk` + `/api/admin/services/[id]`
- [x] `/api/admin/contracts` + `/api/admin/contracts/bulk` + `/api/admin/contracts/[id]`
- [x] Guardas por rol (`ADMIN` y eventualmente `STAFF` según reglas actuales).

### D) UI admin con List Kit
- [x] Crear clients por módulo:
  - [x] `src/components/admin/playlists/PlaylistsTableClient.tsx`
  - [x] `src/components/admin/sound-kits/SoundKitsTableClient.tsx`
  - [x] `src/components/admin/services/ServicesTableClient.tsx`
  - [x] `src/components/admin/contracts/ContractsTableClient.tsx`
- [x] Migrar pages:
  - [x] `src/app/admin/playlists/page.tsx`
  - [x] `src/app/admin/sound-kits/page.tsx`
  - [x] `src/app/admin/services/page.tsx`
  - [x] `src/app/admin/contracts/page.tsx`
- [x] Paridad visual con Users/Tracks/Requests:
  - [x] Header estándar
  - [x] Filtros (izquierda)
  - [x] Acciones masivas (derecha)
  - [x] Tabla desktop + cards mobile
  - [x] Badges reutilizables (`AdminIconBadge`, `AdminStatusBadge`)

### E) UX mínima por módulo
- [x] Filtros por texto y estado.
- [x] Bulk mínimo:
  - [x] cambiar estado
  - [x] eliminar (confirmación)
- [x] Acción fila:
  - [x] abrir detalle
  - [x] eliminar (si aplica)
- [x] Paginación básica.

### F) Detalle rápido por entidad (MVP)
- [x] Ruta detalle por módulo con datos clave:
  - [x] `/admin/playlists/[id]`
  - [x] `/admin/sound-kits/[id]`
  - [x] `/admin/services/[id]`
  - [x] `/admin/contracts/[id]`
- [x] Edición mínima de campos críticos (status, nombre/título, notas).

### G) Documentación
- [x] Actualizar `docs/PROJECT_GENERAL_CONTEXT.md`:
  - [x] inventario de nuevos componentes
  - [x] nuevas rutas admin
  - [x] modelos nuevos (resumen funcional)
- [x] Actualizar `docs/plans/029-admin-list-kit.md` con adopción en nuevos módulos.

---

## Fases de ejecución recomendadas (orden)

### Fase 0 · Preparación técnica
- [x] Revisar schema actual y evitar colisiones de nombres.
- [x] Definir enums/modelos finales.
- [x] Definir estrategia de seed.

### Fase 1 · Capa DB completa
- [x] Migración Prisma aplicada.
- [x] Seed dummy operativo.
- [x] Validación rápida en Prisma Studio.

### Fase 2 · API layer
- [x] Endpoints list/create/update/delete por módulo.
- [x] Endpoint bulk por módulo.
- [x] Validaciones básicas de payload.

### Fase 3 · UI List Kit (4 módulos)
- [x] Playlists con List Kit.
- [x] Sound Kits con List Kit.
- [x] Services con List Kit.
- [x] Contracts con List Kit.

### Fase 4 · Detalles + edición mínima
- [x] Detalles por entidad.
- [x] Guardado de campos mínimos.

### Fase 5 · QA/smoke + hardening
- [x] Typecheck + lint.
- [x] Smoke desktop/mobile.
- [x] Ajustes de UX críticos.

---

## Smoke checklist (para tu vuelta)

### 1) Datos y carga
- [x] `/admin/playlists` carga lista real (no placeholder).
  - Esperado: se ven filas/cards y contador > 0.
- [x] `/admin/sound-kits` carga lista real.
  - Esperado: se ven kits con estado y precio.
- [x] `/admin/services` carga lista real.
  - Esperado: se ven servicios con categoría y estado.
- [x] `/admin/contracts` carga lista real.
  - Esperado: se ven contratos con estado/monto/fechas.

### 2) Filtros
- [x] Filtro por texto en cada módulo.
  - Esperado: lista se reduce según coincidencias.
- [x] Filtro por estado en cada módulo.
  - Esperado: solo muestra estado seleccionado.
- [x] Limpiar filtros.
  - Esperado: vuelve dataset completo.

### 3) Acciones masivas
- [x] Seleccionar items (fila + select all).
  - Esperado: contador de selección correcto.
- [x] Bulk cambiar estado.
  - Esperado: status cambia y persiste al recargar.
- [x] Bulk delete (con confirmación).
  - Esperado: items se eliminan y contador actualiza.

### 4) Responsive
- [x] Desktop: tabla sin desbordes críticos.
  - Esperado: columnas legibles.
- [x] Mobile: cards legibles y acciones accesibles.
  - Esperado: sin scroll horizontal roto.

### 5) Integridad
- [x] Recargar cada ruta tras cambios.
  - Esperado: persiste en DB.
- [x] No afecta Users/Tracks/Requests.
  - Esperado: módulos previos intactos.

### Resultado smoke técnico (ejecutado por Codex)
- `npm run db:seed:modules` ✅
- `npm run typecheck` ✅
- `npx eslint` focal (archivos nuevos/modificados) ✅
- Smoke HTTP autenticado (dev server :3010):
  - GET 200: `/admin/playlists`, `/admin/sound-kits`, `/admin/services`, `/admin/contracts`
  - GET 200 con filtros: `?q=`, `?status=`, `?category=` según módulo
  - GET 200 sin regresión: `/admin/users`, `/admin/tracks`, `/admin/requests`
- Smoke API autenticado:
  - POST create + bulk status + bulk delete en `/api/admin/playlists` ✅
  - POST create + bulk status + bulk delete en `/api/admin/sound-kits` ✅
  - POST create + bulk status + bulk delete en `/api/admin/services` ✅
  - POST create + bulk status + bulk delete en `/api/admin/contracts` ✅
  - PATCH por `id` validado en los 4 módulos (cambio de nombre/título + estado) ✅

---

## Riesgos y mitigaciones
- Riesgo: scope muy grande para una sola pasada.
  - Mitigación: MVP uniforme primero, detalles avanzados después.
- Riesgo: inconsistencia entre módulos.
  - Mitigación: usar List Kit + presets compartidos.
- Riesgo: seed no representativo.
  - Mitigación: datos variados por estado/fechas/montos.

---

## Entrega mínima aceptable (en 1 hora de ejecución continua)
- [x] Modelos + migración creados.
- [x] Seed dummy ejecutable para los 4 módulos.
- [x] Las 4 rutas dejan de ser placeholder.
- [x] Las 4 rutas usan List Kit (filtros + bulk + tabla/cards).
- [x] Typecheck OK.

## Entrega ideal
- [x] + detalle por entidad.
- [x] + edición mínima persistente.
- [x] + documentación completa actualizada.

## Nota de continuidad (integración 032)

- El módulo `Playlist` de este plan fue extendido por 032 para cubrir catálogo público:
  - campos `publicId`, `isMainCatalog`, `embedEnabled`, `isAutoAllTracks`
  - ACL de compartidos con `PlaylistViewer`
  - rutas públicas `/catalog` y `/playlist/[id]`
- Este plan 030 sigue siendo base del CRUD/listado interno; 032 agrega capa de publicación/compartición.
