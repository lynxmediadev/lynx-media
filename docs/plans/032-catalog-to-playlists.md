# 032 - Catalog -> Playlists (plan maestro)

## Preguntas de alineacion (responder antes de implementar)

> Estas respuestas cierran alcance y evitan retrabajo. Marcar o completar aqui mismo.

1) [ A ] `/catalog` sera:
   - A) una sola playlist "principal"
   - B) un indice de playlists publicas
   - C) otra opcion: `_____`
Por ahora una sola playlist principal creada y administrada por admin.


2) [ A ] Quien define cual playlist es la "principal" de `/catalog`?
   - A) solo ADMIN
   - B) ADMIN + STAFF
   - C) por configuracion global

3) [ B ] Lista por defecto "All Tracks":
   - A) STAFF + ADMIN (como pediste)
   - B) todos los roles con biblioteca (incluyendo CREATOR)
   - C) solo CREATOR
Aquí hago una apreciación. Quiero que CREATOR tenga playlists y pueda administrarlas, pero me gustaría crear otro ROL (no sé cuál), que no tenga opción de crear/editar playlists. Si puedes, en esta misma pasada crea ese ROL y agrégalo al "Ver como..".


4) [ A ] La playlist por defecto "All Tracks" debe ser:
   - A) dinamica (siempre incluye todos los tracks actuales del owner)
   - B) snapshot (se crea una vez y luego se edita manualmente)

5) [ TODAS ] Visibilidad final de playlists:
   - `PRIVATE`: solo owner + ADMIN/STAFF
   - `INTERNAL`: usuarios logueados autorizados
   - `PUBLIC`: web publica + URL compartible
   Confirmado? [ No entendí este confirmado, pero bueno, confirmemos todas ajaja. ]
   
   Me gustaría poder elegir, como en GoogleDrive, al compartir el enlace si quiero que sea "Cualquier persona con el enlace" o enviar invitación/habilitar a otra cuenta a ver ese enlace.
   Eso es por si quiero compartir enlaces internos y otros públicos, tener todo cubierto y ordenado.

6) [ SI ] Puede un track pertenecer a multiples playlists? (recomendado: si) [ SI ]

7) [ B ] Enlace compartible de playlist publica:
   - A) `/catalog/{slug}`
   - B) `/playlist/{slug}`
   - C) ambos con canonical unico
COMENTARIOS: 
- Recuerda que también quiero que sea embedeable para usar en otros lugares del proyecto. Agrega la opción de embedear a las playlists.
- El slug podría ser una id asignada al azar por estas librerías de id's. Si es posible que sea una id corta para que quede /playlist/[id_corta]


8) [ C ] Embed externo:
   - A) iframe `src=/catalog/{slug}?embed=1`
   - B) script embebible
   - C) ambos (fase 1 iframe, fase 2 script)
La verdad no sé qué es mejor porque desconozco sus implicancias. Si tú me lo recomiendas, aplica ambos.


9) [ C ] Filtros legacy de `/catalog` (`mood/use/cat`) deben:
   - A) mantenerse en la vista playlist
   - B) mantenerse solo en "Main Catalog"
   - C) retirarse y reemplazarse por filtros por playlist
Quisiera resetear/retirar toda esa metadata que no usaremos para que no sobre. Puedes crear dummy de todo después.
Quiero que los filtros por playlist sean más eficientes, rápidos de cargar, optimizables y optimizados que los tags. Quiero un sistema de tags sólido y robusto, pero liviano para que la página se sienta liviana.  Sé inteligente para crear este sistema de "categorización/filtro/tags/lo que sea mejor" para playlist, porque es muy probable que usemos este sistema después en otra cosa.


10) [ __ ] Permisos de gestion cross-account:
    - ADMIN y STAFF pueden editar playlists de otros roles (incluyendo CREATOR): [ SI ]
    - CREATOR puede editar solo sus playlists: [ SI, SÓLO LAS SUYAS ]

11) [ __ ] Metadata minima visible en playlist publica por track:
    - titulo, artista, bpm, key, duracion, tags, waveform, botones actions (usa botones como en /users, pero mantén el ícono, tooltip y rutas actuales de estos botones)
    Confirmado? [ SI ]

12) [ SI ] Acciones visibles en playlist publica (columna ACTIONS):
    - [ SI ] Copiar link track
    - [ SI ] Ver track
    - [ SI ] License
    - [ SI ] Stems
    - [ SI ] Video preview
    - [ SI ] Otros: `_____`

13) [ RECOMENDACIÓN APLICADA ] SEO / indexacion:
    - indexar solo playlists `PUBLIC` [ SI ]
    - bloquear `PRIVATE` e `INTERNAL` [ SI ]

14) [ VAMOS A USAR /catalog PARA UNA PLAYLIST GENERAL/GLOBAL ] Migracion de `/catalog` legacy:
    - A) mantener fallback temporal
    - B) redireccion completa cuando todo este listo
    - C) apagar por flag

---

## Prompt operativo (auto-instrucciones para Codex)

> Objetivo: reemplazar el concepto de catalogo unico por catalogos basados en playlists, manteniendo UX profesional, performance y compatibilidad controlada.
>
> Reglas:
> 1) Ejecutar por fases y con feature flags cuando aplique.
> 2) Mantener paridad mobile + desktop en cada paso.
> 3) Reutilizar List Kit en admin; no duplicar patrones visuales.
> 4) Evitar scroll horizontal en cualquier vista (regla del proyecto).
> 5) No romper auth/roles ni rutas existentes sin fallback.
> 6) Registrar decisiones y riesgos en este mismo plan.
> 7) Cerrar cada fase con smoke tecnico y smoke manual.

---

## Contexto actual (resumen tecnico)

- Existe `Playlist` y `PlaylistTrack` en Prisma.
- Existe admin base en `/admin/playlists` + detalle `/admin/playlists/[id]`.
- `/catalog` aun funciona como catalogo legacy con filtros por query (`mood/use/cat`) y reproductor.
- Ya existe infraestructura de roles (`ADMIN`, `STAFF`, `CREATOR`) y ownership en `Track.ownerUserId`.
- Existe List Kit reusable para listas admin (headers, filtros, bulk, tabla/cards, badges, botones).

---

## Objetivo funcional

Convertir playlists en la unidad oficial de catalogo:
- Cada playlist es un catalogo compartible.
- `/catalog` se monta desde playlist(s), no desde logica legacy desacoplada.
- Roles autorizados crean/gestionan playlists y asignan tracks segun permisos.
- Playlist publica mantiene experiencia rica: reproductor, waveform y acciones de track.

---

## Fuera de alcance (esta fase)

- Monetizacion/checkout de licencias.
- Permisos granulares por item (ACL compleja por track/playlist con grants avanzados).
- Analytics avanzadas por reproduccion (dejar hooks listos, sin producto final).
- Editor WYSIWYG de landing por playlist.

---

## Diseno objetivo (arquitectura)

### A) Dominio de Playlist como Catalog
- `Playlist` mantiene metadatos editoriales (name, slug, description, status, visibility, owner).
- `PlaylistTrack` mantiene orden y pertenencia track<->playlist.
- Agregar (si falta) campos opcionales para publicacion:
  - `isMainCatalog` (bool, unico global o por tenant segun decision).
  - `shareToken` (si se requiere URL no adivinable para INTERNAL).
  - `embedEnabled` (bool).

### B) Rutas objetivo
- Publico:
  - `/catalog` -> playlist principal o indice de playlists publicas (segun respuesta Q1).
  - `/catalog/[slug]` -> pagina publica de playlist.
- Admin/Staff:
  - `/admin/playlists` (List Kit)
  - `/admin/playlists/[id]` (editor + asignacion tracks + share/embed)
- Creator:
  - `/creator/playlists` + detalle/edicion propia.

### C) Permisos (RBAC)
- `ADMIN`: control total.
- `STAFF`: gestion operativa segun politica (idealmente casi total en contenido).
- `CREATOR`: solo recursos propios.
- Guardas en server actions y APIs (no solo en UI).

### D) Compatibilidad legacy
- Mantener fallback temporal para `/catalog` mientras se valida nueva ruta.
- Definir fecha de retiro y checklist de apagado.

---

## Plan de implementacion por fases

## Fase 0 - Definiciones y contrato funcional
- [x] Resolver las 14 preguntas de alineacion.
- [x] Congelar contrato de rutas finales (`/catalog`, `/playlist/[id]`, embed).
- [x] Congelar matriz RBAC por rol y ownership.
- [x] Definir decision de deprecacion de `/catalog` legacy (migración progresiva con fallback).

## Fase 1 - Modelo de datos y migraciones
- [x] Auditar si `Playlist` requiere campos nuevos para "catalog behavior".
- [x] Crear migracion Prisma (campos nuevos + indices utiles para filtros comunes).
- [x] Asegurar constraints:
  - [x] Slug unico
  - [x] Unicidad funcional de playlist principal (enforzada en lógica de API)
  - [x] Integridad `PlaylistTrack.sortOrder`
- [x] Backfill de datos iniciales.

## Fase 2 - Orquestacion de playlists por usuario
- [x] Implementar provision de playlist por defecto ("All Tracks") al crear usuario autorizado.
- [x] Script de backfill para usuarios actuales (STAFF/ADMIN/CREATOR según decisión final).
- [x] Definir si playlist por defecto es dinamica o snapshot.
- [x] Si es dinamica:
  - [x] lógica de resolución dinámica por owner (sin job adicional en v1).

## Fase 3 - API/Server Actions (admin + creator + public)
- [x] Endpoints/acciones para:
  - [x] CRUD playlists
  - [x] asignar/quitar/reordenar tracks
  - [x] publicar/despublicar
  - [x] copiar/share URL y config embed (base v1)
- [x] Endpoint publico playlist por id/slug optimizado (solo campos necesarios).
- [x] Validaciones fuertes en server:
  - [x] ownership
  - [x] rol
  - [x] estado/visibilidad

## Fase 4 - UI admin/creator (List Kit + editor playlist)
- [x] Homologar `/admin/playlists` al patron Users (fuente visual base).
- [x] Crear/ajustar editor de playlist:
  - [x] metadata (nombre, descripcion, estado, visibilidad)
  - [x] selector de tracks (v1 con asignación directa)
  - [x] orden manual y persistencia de orden (v1 con mover arriba/abajo)
  - [x] boton "copiar URL playlist"
  - [x] bloque "embed" con snippet simple
- [x] Vista creator equivalente con limites por ownership.

## Fase 5 - Public playlist experience (reemplazo catalog)
- [x] Crear `/playlist/[id]` con:
  - [x] reproductor
  - [x] waveform
  - [x] acciones actuales de catalogo
  - [x] layout limpio mobile/desktop
- [x] Montar `/catalog` segun decision de producto:
  - [x] main playlist global
- [x] Mantener canonical/SEO correcto.

## Fase 6 - Embeds y compartir
- [x] Implementar modo embed (`?embed=1`) minimal.
- [x] Asegurar UI sin chrome innecesario (header compacto para embed).
- [x] Boton copiar URL / copiar embed code en admin.

## Fase 7 - Migracion funcional desde catalog legacy
- [x] Mapear funcionalidades legacy a nueva implementacion.
- [x] Mantener fallback temporal con feature flag.
- [x] Ejecutar plan de switch:
  - [x] canary interno (smoke técnico con/ sin `CATALOG_USE_LEGACY=1`)
  - [x] validacion smoke
  - [x] activacion global (default actual: nueva implementación ON)
- [x] Documentar retiro de rutas/componentes legacy.

## Fase 8 - Performance, seguridad y QA
- [x] Optimizar consultas (select minimo, paginacion, indices base).
- [x] Revisar cache y revalidaciones (`revalidatePath` donde aplique).
- [x] Validar anti-abuso en endpoints publicos.
- [ ] QA responsive completo (sin scroll horizontal) [manual pendiente].
- [x] QA de permisos cruzados por rol (smoke técnico automatizado).

## Fase 9 - Documentacion y cierre
- [x] Actualizar `docs/PROJECT_GENERAL_CONTEXT.md`:
  - [x] nuevas rutas
  - [x] nuevos componentes reutilizables
  - [x] contrato playlist-as-catalog
- [x] Actualizar plan 030/029 en secciones relacionadas si se pisan.
- [x] Dejar checklist final de pendientes v2.

---

## Checklist smoke (cuando se implemente)

### A. Playlist como catalogo
- [x] Crear playlist nueva y asignar tracks.
- [x] Compartir URL y abrirla sin sesion (si PUBLIC).
- [x] Verificar reproduccion + waveform + actions (smoke técnico de render; reproducción manual final pendiente).

### B. Roles y ownership
- [x] CREATOR solo edita playlists propias.
- [x] STAFF/ADMIN pueden gestionar playlists de terceros.
- [x] Usuario no autorizado recibe 403/redirect controlado.

### C. Default playlist
- [x] Usuario nuevo autorizado recibe playlist por defecto.
- [x] Backfill crea playlist por defecto a usuarios existentes.
- [x] Comportamiento dinamico/snapshot se cumple segun decision.

### D. Catalog route
- [x] `/catalog` refleja nueva fuente playlist.
- [x] `/playlist/[id|slug|publicId]` carga correcto por identificador.
- [x] Legacy apagado o en fallback controlado.

### E. UX/UI
- [ ] List Kit consistente en admin (users como base visual).
- [ ] Sin scroll horizontal en desktop/mobile.
- [ ] Botones/hover/badges consistentes con design system actual.

---

## Riesgos y mitigaciones

- Riesgo: ambiguedad de producto en `/catalog`.
  - Mitigacion: cerrar Q1-Q2 antes de codigo.
- Riesgo: permisos incompletos y fugas de datos.
  - Mitigacion: guardas server-first + smoke por rol.
- Riesgo: retrabajo por legacy acoplado.
  - Mitigacion: feature flag + apagado por fases.
- Riesgo: degradacion de performance por queries pesadas.
  - Mitigacion: indices, selects acotados, paginacion.

---

## Decisiones ya tomadas (de esta conversacion)

- [x] El concepto "catalogo" pasa a ser "playlists".
- [x] Debe existir URL compartible de playlist.
- [x] Debe mantenerse reproduccion + waveform + actions del catalog legacy.
- [x] List Kit es la base visual para admin.

## Pendientes de decision bloqueantes
- [x] Respuestas de alineacion capturadas.
- [x] Confirmar UX final para sharing granular estilo Google Drive (UI + permisos finos) [v1 implementada: visibilidad + compartidos por email en detalle playlist].

---

## Registro de ejecución (estado actual)

- [x] Migración aplicada: `20260215023000_playlist_catalog_phase1`.
- [x] Nuevos campos playlist: `publicId`, `isMainCatalog`, `embedEnabled`, `isAutoAllTracks`.
- [x] Nuevo modelo de sharing base: `PlaylistViewer`.
- [x] Nuevo rol agregado: `CLIENT` + integrado en auth, invitaciones, users y "Ver como".
- [x] Nueva ruta pública: `/playlist/[id]` con control de visibilidad.
- [x] Compatibilidad URL legacy: `/catalog/[slug]` redirige a `/playlist/[slug]`.
- [x] `/catalog` ahora consume playlist principal global.
- [x] Backfill ejecutado: playlists por defecto + main catalog.
- [x] Creator ahora tiene módulo `/creator/playlists`.
- [x] Gestión v1 de tracks por playlist (add/remove/reorder API + UI v1).
- [x] Gestión v1 de compartidos por playlist (`PlaylistViewer`) en admin + creator.
- [x] Revalidaciones agregadas en mutaciones de playlist/tracks/share.
- [x] Fallback legacy de `/catalog` controlado por `CATALOG_USE_LEGACY=1`.
- [x] Verificación técnica ejecutada: `npm run typecheck` OK + eslint focal OK.

## Decisión de retiro legacy (`/catalog`)

- Se mantiene fallback temporal por flag (`CATALOG_USE_LEGACY=1`) para canary interno.
- Modo por defecto actual: nueva implementación playlist-first.
- Retiro definitivo recomendado cuando QA manual de permisos y responsive esté cerrado.

## Pendientes v2 (post cierre técnico)

- [ ] Ordenamiento drag-and-drop en tracks de playlist (hoy: up/down).
- [ ] ACL granular por playlist (roles de viewer/editor más finos).
- [ ] QA manual multi-rol completo (ADMIN/STAFF/CREATOR/CLIENT).
- [ ] QA visual responsive completo (desktop/mobile).
- [ ] Apagado definitivo del fallback legacy (`CATALOG_USE_LEGACY`).

## Registro de smoke técnico (auto, ejecutado por Codex)

Comandos corridos:

- `npm run typecheck` ✅
- `npx eslint <archivos tocados en 032>` ✅
- `npm run lint` ✅ (warnings legacy preexistentes en proyecto; 0 errores)
- `npm run db:backfill:playlists` ✅ (idempotente: `defaultCreated: 0`, `publicIdsFixed: 0`)

Smokes HTTP locales (Next dev en `127.0.0.1`, puertos efímeros):

1) Modo nuevo (`CATALOG_USE_LEGACY` desactivado)
- `GET /catalog` → `200`
- `GET /playlist/{mainPublicId}` → `200`
- `GET /playlist/{mainPublicId}?embed=1` → `200`
- `GET /api/admin/playlists` sin sesión → `401` (esperado)
- `GET /api/admin/playlists/{id}/share` sin sesión → `401` (esperado)

2) Modo fallback legacy (`CATALOG_USE_LEGACY=1`)
- `GET /catalog` → `200`
- Respuesta contiene marcadores de modo legacy/compatibilidad → OK

Resultado:
- Smoke técnico backend/rutas **OK** para alcance implementado.
- Queda pendiente únicamente smoke manual visual/responsive y cross-role end-to-end.

### Smoke técnico adicional (matriz rol + visibilidad, auto)

Ejecución adicional automatizada con usuarios smoke (`ADMIN/STAFF/CREATOR/CLIENT`) y playlists dedicadas:

- Login por rol (`/auth/login/submit`) con cookie de sesión válida:
  - `ADMIN`: `303` + `app_session=yes`
  - `STAFF`: `303` + `app_session=yes`
  - `CREATOR`: `303` + `app_session=yes`
  - `CLIENT`: `303` + `app_session=yes`

- RBAC API playlists:
  - `GET /api/admin/playlists` unauth → `401` ✅
  - `GET /api/admin/playlists` CLIENT → `401` ✅
  - `GET /api/admin/playlists` CREATOR → `200` ✅
  - `PATCH own playlist` CREATOR → `200` ✅
  - `PATCH playlist ajena` CREATOR → `403` ✅
  - `PATCH playlist CREATOR` STAFF → `200` ✅

- Tracks por playlist (CREATOR):
  - `POST /tracks` add track1 → `200` ✅
  - `POST /tracks` add track2 → `200` ✅
  - `PATCH /tracks` reorder track1/track2 → `200` ✅
  - `DELETE /tracks` remove track2 → `200` ✅

- Sharing + visibilidad:
  - `POST /share` (creator comparte a client) → `200` ✅
  - `PATCH visibility=PRIVATE,status=PUBLISHED` → `200` ✅
  - `GET /playlist/{id}` unauth (PRIVATE) → `307` ✅
  - `GET /playlist/{id}` client compartido (PRIVATE) → `200` ✅
  - `GET /playlist/{id}` client no compartido (PRIVATE) → `404` ✅
  - `PATCH visibility=PUBLIC,status=PUBLISHED` → `200` ✅
  - `GET /playlist/{id}` unauth (PUBLIC) → `200` ✅

Notas:
- Se detectó un `500` intermitente en un servidor dev previo de larga vida (`vendor-chunks/tslib.js` faltante).  
  En server limpio dedicado para smoke el flujo quedó **estable y OK**.

### Smoke técnico adicional 2 (registro + default playlist + legacy)

- Registro invitado CREATOR (`/auth/register/submit`) con token válido:
  - `register_submit_status=303` ✅
  - playlist default auto creada (`isAutoAllTracks=true`) → `default_playlist_yes` ✅

- Legacy fallback en server limpio (`CATALOG_USE_LEGACY=1`):
  - `GET /catalog` → `200` ✅
  - marcador de contenido legacy presente → `ok` ✅

### Smoke técnico adicional 3 (playlist pública con contenido)

- Setup smoke + login creator + patch `PUBLIC/PUBLISHED` + add track por API:
  - render de track en `/playlist/{publicId}`: `playlist_contains_track=yes` ✅
  - render de marcadores de waveform/actions/player: `playlist_contains_player_markers=yes` ✅

### Hotfix operativo (catalogo vacío por MAIN CATALOG sin tracks)

- Se agregó script operativo:
  - `npm run db:catalog:reset-main-tracks`
- Qué hace:
  - detecta la playlist `isMainCatalog=true`
  - desactiva `isAutoAllTracks` para esa playlist
  - limpia sus links actuales (`PlaylistTrack`)
  - vuelve a cargar todos los tracks existentes en orden (`sortOrder`)
- Caso real aplicado en entorno local:
  - main catalog tenía `isAutoAllTracks=true` + owner con 0 tracks
  - resultado: `/catalog` vacío
  - tras reset: `14` tracks enlazados y `/catalog` vuelve a mostrar contenido

### Nota UX/gestión de tracks (admin)

- La gestión de tracks sí existe en:
  - `/admin/playlists/[id]` → bloque **"Tracks de la playlist"**
- Mejora aplicada:
  - en detalle de playlist admin, `ADMIN/STAFF` ahora ven tracks globales para asignar
  - antes quedaban filtrados por `ownerUserId` de la playlist (podía dejar el selector vacío)
