Entiendo. Ahora comprendo muchas cosas y por qué estábamos manteniendo una lógica distinta en Categorías.

Creo que estamos manteniendo una funcionalidad que tal vez no necesitamos del todo, pero necesito que tú me ayudes con la solcuón, porque es muy probable que esté comprendiendo algo mal.
Inicialmente quería hacer catálogos por categoría porque quería tener "Beats" y "Sync" como catálogos con su propia ruta.

En base a eso, creo que aplicamos una lógica diferente en los tags para Categorías.
Yo lo que quería era tener una ruta tipo /sync o /beats para acceder más rápido a cada tipo de música.

Ahora cambié la visión sobre eso.

- En primer lugar, necesito que agregues al contexto, en un archivo llamado /docs/PROJECT_GENERAL_CONTEXT.md: En lynxmedia.cl no habrá venta de BEATS para artistas/raperos. Eso lo haremos en otro proyecto de ODR.
- En Lynx Media nos enfocaremos, en cuánto a lo musical, sólo en SYNC LICENSING.

Ahora unas consideraciones para la implementación y planificación:

- Quiero que los _tags de categoría_ tengan la misma lógica que Moods, lo que supongo que significa sacar la lógica de pivote a TrackTags.
- Como ahora tendremos un solo catálogo, categorías será un tag más, ¿Podremos crear un filtro en /catalog que considere las variables principales para filtrar tracks en este contexto?
- /catalog será la página principal de catálogo.
- Ya no necesito /beats o /sync, deja todo limpio para usar esas rutas a futuro sin problemas.
- Tampoco necesito esos botones en /catalog con las Categorías.
- Ya que quitaremos la lógica de pivote, seguramente quedará lógica en código perdido, archivos innecesarios y que pueden llevar a confusiones, bugs, etc. Hay que dejar limpia esta implementación.

## Inventario de rutas y checklist (fuente vigente)

Regla de validación:

- Solo el usuario puede marcar un item como `listo` (`[x]`) de forma explícita.
- Si no hay confirmación explícita del usuario, el estado se mantiene en `pendiente` (`[ ]`).

Referencia única para `/admin/tracks/[id]/edit`:

- Usar exclusivamente la sección `## Inventario operativo actualizado (vigente)`.
- Dentro de esa sección, el bloque oficial es `### 3) Inventario completo de /admin/tracks/[id]/edit (módulos + campos internos)`.

---

/_ MANTENER SIEMPRE EL INVENTARIO DE COMPONENTES REUTILIZABLES AL FINAL DE ESTE DOCUMENTO _/

## STAGING (pendiente obligatorio antes de producción)

Estado actual:

- Proyecto en etapa de ajustes funcionales/visuales => **continuar en local**.
- No hacer corte de producción todavía.

Checklist mínimo a validar en staging antes de producción:

- [ ] Cookies/sesión en HTTPS real (`secure`, expiración, logout, invalidación).
- [ ] Flujos auth completos: invite/register/login/forgot/reset/verify-email.
- [ ] Turnstile en entorno público (dominio real permitido).
- [ ] Entregabilidad de correos con dominio real (SPF/DKIM/DMARC).
- [ ] Validación de roles/ownership en rutas protegidas (`ADMIN/STAFF/CREATOR`).
- [ ] Smoke mobile/desktop final sin overflow/regresiones.
- [ ] Monitoreo de errores server y logs de eventos auth/email.
- [ ] Retiro del fallback legacy `admin_session` según plan.

Regla para el asistente (futuro):

- Cuando se cumplan estos gatillos:
  1. auth/email/roles sin bugs bloqueantes por al menos 1 ciclo de smoke,
  2. UI principal de admin estable,
  3. se inicie preparación de release,
     debes emitir una alerta explícita en el chat con este formato:
     `🚨 ALERTA STAGING: es momento de levantar staging antes de producción.`

## COMANDOS

### RESET DE DB

> Objetivo: tener un inventario único de comandos para reset/reconstrucción de datos en local.
> Regla práctica: ejecutar solo en desarrollo y confirmar antes si necesitas conservar data.

| Comando | Tipo | Qué hace |
| --- | --- | --- |
| `npm run db:seed:reset` | Reset completo | Borra y repuebla base local con dataset de seed (`RESET_CONFIRM=YES`). |
| `npm run db:catalog:reset-main-tracks` | Reset parcial | Limpia y recarga tracks en la playlist `isMainCatalog=true` (catálogo principal). |
| `npm run db:backfill:playlists` | Backfill | Crea/arregla playlists por defecto (`All Tracks`), `publicId` y main catalog si falta. |
| `npm run db:seed:bulk` | Poblado masivo | Inserta datos dummy masivos para pruebas de listas/performance. |
| `npm run db:seed:modules` | Poblado módulos | Carga datos dummy de módulos operativos (playlists/sound kits/services/contracts). |
| `npm run db:seed:tickets` | Poblado tickets | Inserta tickets dummy para pruebas del módulo Tickets. |
| `npx prisma migrate reset` | Reset Prisma (manual) | Drop/recreate DB + aplica migraciones + seed (si está configurado). Uso manual/avanzado. |

### Otros comandos DB útiles (no reset)

| Comando | Qué hace |
| --- | --- |
| `npm run db:push` | Sincroniza esquema Prisma a DB (sin migración versionada). |
| `npm run db:migrate` | Aplica migraciones pendientes (`prisma migrate deploy`). |
| `npm run db:generate` | Crea/aplica migración en dev (`prisma migrate dev`). |
| `npm run db:studio` | Abre Prisma Studio para inspección/edición de datos. |

## Inventario de componentes reutilizables (proyecto)

### 1) UI base global (`src/components/ui`)

| Componente      | Ruta                                    | Uso principal                  | Estado |
| --------------- | --------------------------------------- | ------------------------------ | ------ |
| Accordion       | `src/components/ui/accordion.tsx`       | Contenedores expandibles       | Activo |
| Badge           | `src/components/ui/badge.tsx`           | Etiquetas de estado            | Activo |
| Button          | `src/components/ui/button.tsx`          | Botón base del proyecto        | Activo |
| Card            | `src/components/ui/card.tsx`            | Contenedor visual base         | Activo |
| Checkbox        | `src/components/ui/checkbox.tsx`        | Selección booleana             | Activo |
| Dialog          | `src/components/ui/dialog.tsx`          | Modales/confirmaciones         | Activo |
| DropdownMenu    | `src/components/ui/dropdown-menu.tsx`   | Menús contextuales             | Activo |
| Input           | `src/components/ui/input.tsx`           | Campo de texto base            | Activo |
| Label           | `src/components/ui/label.tsx`           | Etiqueta accesible de campos   | Activo |
| Select          | `src/components/ui/select.tsx`          | Selector de opciones           | Activo |
| Separator       | `src/components/ui/separator.tsx`       | Separadores visuales           | Activo |
| Sheet           | `src/components/ui/sheet.tsx`           | Panel lateral/drawer           | Activo |
| Slider          | `src/components/ui/slider.tsx`          | Rango deslizante               | Activo |
| Tabs            | `src/components/ui/tabs.tsx`            | Navegación por pestañas        | Activo |
| Textarea        | `src/components/ui/textarea.tsx`        | Texto multilínea base          | Activo |
| Tooltip         | `src/components/ui/tooltip.tsx`         | Ayudas contextuales            | Activo |
| useToast        | `src/components/ui/use-toast.ts`        | Hook de notificaciones         | Activo |
| TagChips        | `src/components/ui/TagChips.tsx`        | Sistema genérico de tags/chips | Activo |
| CopyButton      | `src/components/ui/CopyButton.tsx`      | Copiar texto con feedback      | Activo |
| CopyIconButton  | `src/components/ui/CopyIconButton.tsx`  | Copiar vía botón ícono         | Activo |
| AudioPlayer     | `src/components/ui/AudioPlayer.tsx`     | Reproductor de audio UI        | Activo |
| AudioPlayerDemo | `src/components/ui/AudioPlayerDemo.tsx` | Demo/uso de AudioPlayer        | Activo |
| CatalogCardUI   | `src/components/ui/catalog/card.tsx`    | Card visual de catálogo        | Activo |

### 2) UI admin compartida (`src/components/admin/ui`)

| Componente         | Ruta                                             | Uso principal                                             | Estado |
| ------------------ | ------------------------------------------------ | --------------------------------------------------------- | ------ |
| FormField          | `src/components/admin/ui/FormField.tsx`          | Envoltura estándar de campos admin                        | Activo |
| FormField2         | `src/components/admin/ui/FormField2.tsx`         | Variante antigua de FormField                             | Legacy |
| SaveStateBadge     | `src/components/admin/ui/SaveStateBadge.tsx`     | Estado corto de guardado/error                            | Activo |
| EditableIconInput  | `src/components/admin/ui/EditableIconInput.tsx`  | Input bloqueado con ícono editar y foco automático        | Activo |
| NumericSelectInput | `src/components/admin/ui/NumericSelectInput.tsx` | Input numérico sin spinners con select-all en click/focus | Activo |

### 3) Módulos reutilizables del editor de track (`src/components/admin/track`)

| Componente           | Ruta                                                      | Uso principal                  | Estado |
| -------------------- | --------------------------------------------------------- | ------------------------------ | ------ |
| TagModule            | `src/components/admin/track/TagModule.tsx`                | Wrapper de módulos de tags     | Activo |
| MoodChips            | `src/components/admin/track/MoodChips.tsx`                | Gestión de tags de moods       | Activo |
| UseChips             | `src/components/admin/track/UseChips.tsx`                 | Gestión de tags de usos        | Activo |
| CategoryChips        | `src/components/admin/track/CategoryChips.tsx`            | Gestión de tags de categorías  | Activo |
| CreativeForm         | `src/components/admin/track/CreativeForm.tsx`             | Módulo creativo del edit       | Activo |
| IdsForm              | `src/components/admin/track/IdsForm.tsx`                  | ISRC/ISWC/UPC                  | Activo |
| SyncMetaForm         | `src/components/admin/track/SyncMetaForm.tsx`             | Metadata comercial/sync        | Activo |
| DeliverablesForm     | `src/components/admin/track/DeliverablesForm.tsx`         | Entregables (versiones/stems)  | Activo |
| AudioAnalysisSection | `src/components/admin/track/AudioAnalysisSection.tsx`     | Visualización técnica de audio | Activo |
| CatalogTagsForm      | `src/components/admin/track/CatalogTagsForm.tsx`          | Flujo legacy de tags catálogo  | Legacy |
| DeleteTrackButton    | `src/components/admin/track/DeleteTrackButton.client.tsx` | Borrado de track en admin      | Activo |
| TrackEditForm        | `src/components/admin/track/TrackEditForm.tsx`            | Orquestador global de /edit    | Activo |
| RightsFormClient     | `src/components/admin/track/RightsFormClient.tsx`         | Módulo publishing/master       | Activo |

### 4) Subcomponentes reutilizables de Rights (`src/components/admin/track/rights`)

| Componente         | Ruta                                                       | Uso principal                    | Estado |
| ------------------ | ---------------------------------------------------------- | -------------------------------- | ------ |
| PublishingTable    | `src/components/admin/track/rights/PublishingTable.tsx`    | Tabla desktop writers/publishers | Activo |
| PublishingCards    | `src/components/admin/track/rights/PublishingCards.tsx`    | Cards mobile writers/publishers  | Activo |
| PublishingNewForms | `src/components/admin/track/rights/PublishingNewForms.tsx` | Alta de writer/publisher         | Activo |
| MasterTable        | `src/components/admin/track/rights/MasterTable.tsx`        | Tabla desktop master shares      | Activo |
| MasterCards        | `src/components/admin/track/rights/MasterCards.tsx`        | Cards mobile master shares       | Activo |
| MasterNewForm      | `src/components/admin/track/rights/MasterNewForm.tsx`      | Alta de titular master           | Activo |
| RightsToggles      | `src/components/admin/track/rights/RightsToggles.tsx`      | Toggles de derechos y flags      | Activo |

### 5) Componentes admin reutilizables (licensing/workflow)

| Componente          | Ruta                                           | Uso principal                       | Estado |
| ------------------- | ---------------------------------------------- | ----------------------------------- | ------ |
| AnalyzeActions      | `src/components/admin/AnalyzeActions.tsx`      | Acciones de análisis de solicitudes | Activo |
| AssigneePicker      | `src/components/admin/AssigneePicker.tsx`      | Asignación de responsable           | Activo |
| FollowUpPicker      | `src/components/admin/FollowUpPicker.tsx`      | Programación de seguimiento         | Activo |
| InternalNotesEditor | `src/components/admin/InternalNotesEditor.tsx` | Notas internas con autosave         | Activo |
| PriorityPicker      | `src/components/admin/PriorityPicker.tsx`      | Prioridad del caso                  | Activo |
| QuickAdminActions   | `src/components/admin/QuickAdminActions.tsx`   | Acciones rápidas de workflow        | Activo |
| ReplyTemplates      | `src/components/admin/ReplyTemplates.tsx`      | Plantillas de respuesta             | Activo |
| StatusPicker        | `src/components/admin/StatusPicker.tsx`        | Estado del caso/licencia            | Activo |

### 6) Catálogo y vista pública reutilizable

| Componente          | Ruta                                            | Uso principal                   | Estado |
| ------------------- | ----------------------------------------------- | ------------------------------- | ------ |
| CatalogView         | `src/components/catalog/CatalogView.tsx`        | Vista principal de catálogo     | Activo |
| TrackTags           | `src/components/catalog/TrackTags.tsx`          | Render de tags en catálogo      | Activo |
| CardView            | `src/components/catalog/views/CardView.tsx`     | Modo cards de catálogo          | Activo |
| SplitView           | `src/components/catalog/views/SplitView.tsx`    | Modo split de catálogo          | Activo |
| TableView           | `src/components/catalog/views/TableView.tsx`    | Modo tabla de catálogo          | Activo |
| CatalogFilterBar    | `src/components/public/CatalogFilterBar.tsx`    | Barra de filtros públicos       | Activo |
| TrackCard           | `src/components/public/TrackCard.tsx`           | Card pública de track           | Activo |
| TrackCardWave       | `src/components/public/TrackCardWave.tsx`       | Card con waveform               | Activo |
| TrackCardWavePlayer | `src/components/public/TrackCardWavePlayer.tsx` | Card + reproductor integrado    | Activo |
| TrackMetadataTable  | `src/components/public/TrackMetadataTable.tsx`  | Tabla metadata pública          | Activo |
| PublicPlayer        | `src/components/public/PublicPlayer.tsx`        | Reproductor público principal   | Activo |
| PublicAudioBar      | `src/components/public/PublicAudioBar.tsx`      | Barra de progreso/audio pública | Activo |
| WaveformScrubber    | `src/components/public/WaveformScrubber.tsx`    | Scrubber de waveform            | Activo |
| CopyLinkButton      | `src/components/public/CopyLinkButton.tsx`      | Copiar URL de track/catálogo    | Activo |
| LicensingDialog     | `src/components/public/LicensingDialog.tsx`     | Diálogo de licenciamiento       | Activo |
| PublicLicenseForm   | `src/components/public/PublicLicenseForm.tsx`   | Formulario público de licensing | Activo |
| SimilarTracks       | `src/components/public/SimilarTracks.tsx`       | Tracks relacionados             | Activo |

### 7) Audio reutilizable

| Componente     | Ruta                                      | Uso principal                    | Estado |
| -------------- | ----------------------------------------- | -------------------------------- | ------ |
| LinkedWaveform | `src/components/audio/LinkedWaveform.tsx` | Waveform sincronizado con player | Activo |
| QualityBadges  | `src/components/audio/QualityBadges.tsx`  | Badges de calidad/formatos       | Activo |
| Sparkline      | `src/components/audio/Sparkline.tsx`      | Visual mini de waveform          | Activo |

### 8) Comunes y layout reutilizable

| Componente            | Ruta                                              | Uso principal                  | Estado |
| --------------------- | ------------------------------------------------- | ------------------------------ | ------ |
| ClientOnly            | `src/components/common/ClientOnly.tsx`            | Render sólo en cliente         | Activo |
| ScrollToSectionButton | `src/components/common/ScrollToSectionButton.tsx` | Navegación por secciones       | Activo |
| SmoothScroll          | `src/components/common/SmoothScroll.tsx`          | Scroll suave global            | Activo |
| ThemeToggle (common)  | `src/components/common/ThemeToggle.tsx`           | Cambio de tema                 | Activo |
| Navbar                | `src/components/layout/Navbar.tsx`                | Barra superior principal       | Activo |
| Footer                | `src/components/layout/Footer.tsx`                | Pie de página                  | Activo |
| ThemeProvider         | `src/components/providers/ThemeProvider.tsx`      | Provider de tema               | Activo |
| FrontendShell         | `src/components/site/FrontendShell.tsx`           | Shell del frontend             | Activo |
| SiteHeader            | `src/components/site/SiteHeader.tsx`              | Header del sitio               | Activo |
| ThemeToggle (site)    | `src/components/site/ThemeToggle.tsx`             | Toggle tema en site shell      | Activo |
| SaveButton            | `src/components/forms/SaveButton.tsx`             | Botón reutilizable de guardado | Activo |
| copyable              | `src/components/copyable.tsx`                     | Wrapper para copiar contenido  | Activo |
| whitelist-dialog      | `src/components/whitelist-dialog.tsx`             | Dialog de whitelist            | Activo |

### 9) Dashboard reusable (`src/components/dashboard`)

| Componente                      | Ruta                                                | Uso principal                                                     | Estado |
| ------------------------------- | --------------------------------------------------- | ----------------------------------------------------------------- | ------ |
| DashboardShell                  | `src/components/dashboard/DashboardShell.tsx`       | Shell reusable con sidebar/topbar/content y versión mobile drawer | Activo |
| DashboardSidebar                | `src/components/dashboard/DashboardSidebar.tsx`     | Sidebar desktop + navegación activa por pathname                  | Activo |
| DashboardMobileSidebar          | `src/components/dashboard/DashboardSidebar.tsx`     | Navegación mobile dentro de `Sheet`                               | Activo |
| DashboardTopbar                 | `src/components/dashboard/DashboardTopbar.tsx`      | Topbar con título contextual, breadcrumbs y acciones              | Activo |
| DashboardBreadcrumbs            | `src/components/dashboard/DashboardBreadcrumbs.tsx` | Breadcrumb reusable para rutas dashboard                          | Activo |
| DashboardContent (Main Content) | `src/components/dashboard/DashboardContent.tsx`     | Wrapper de ancho/spacing para contenido dashboard                 | Activo |
| adminDashboardSections          | `src/components/dashboard/nav-config.admin.ts`      | Config centralizada de navegación admin                           | Activo |
| Tipos de contrato nav           | `src/components/dashboard/types.ts`                 | `DashboardNavItem` y `DashboardSection` para escalabilidad        | Activo |

### 10) Admin List Kit reusable (`src/components/admin/list-kit`)

| Componente           | Ruta                                                     | Uso principal                                                                    | Estado |
| -------------------- | -------------------------------------------------------- | -------------------------------------------------------------------------------- | ------ |
| AdminListShell       | `src/components/admin/list-kit/AdminListShell.tsx`       | Contenedor base de listas admin (borde/fondo/sombra)                             | Activo |
| AdminListHeader      | `src/components/admin/list-kit/AdminListHeader.tsx`      | Header estándar (título/subtítulo/contador/acciones)                             | Activo |
| AdminListPanel       | `src/components/admin/list-kit/AdminListPanel.tsx`       | Panel interno reutilizable para filtros/bulk/secciones auxiliares                | Activo |
| AdminControlsRow     | `src/components/admin/list-kit/AdminControlsRow.tsx`     | Fila horizontal reutilizable de controles con alineación al bottom               | Activo |
| AdminFilterPanel     | `src/components/admin/list-kit/AdminFilterPanel.tsx`     | Estructura de filtros con título, estado y acciones                              | Activo |
| AdminBulkPanel       | `src/components/admin/list-kit/AdminBulkPanel.tsx`       | Estructura de acciones masivas con estado de selección                           | Activo |
| AdminDataTable       | `src/components/admin/list-kit/AdminDataTable.tsx`       | Tabla tipada por columnas (`AdminColumnDef<T>`)                                  | Activo |
| AdminListButton      | `src/components/admin/list-kit/AdminListButton.tsx`      | Botón unificado de listas (hover/tonos/tamaños row/control/pill)                 | Activo |
| AdminStatusBadge     | `src/components/admin/list-kit/AdminStatusBadge.tsx`     | Badge de estado unificado (`neutral/success/warning/danger`)                     | Activo |
| AdminIconBadge       | `src/components/admin/list-kit/AdminStatusBadge.tsx`     | Badge compacto con ícono + texto + tono (`neutral/success/warning/danger`)       | Activo |
| AdminRoleBadge       | `src/components/admin/list-kit/AdminStatusBadge.tsx`     | Badge compacto de rol con ícono + texto (`ADMIN/STAFF/CREATOR`)                  | Activo |
| AdminListEmptyState  | `src/components/admin/list-kit/AdminListEmptyState.tsx`  | Estado vacío estandarizado                                                       | Activo |
| AdminTableRowActions | `src/components/admin/list-kit/AdminTableRowActions.tsx` | Acciones por fila reutilizables (link/acción local)                              | Activo |
| Tipos list-kit       | `src/components/admin/list-kit/types.ts`                 | `AdminColumnDef`, `AdminRowAction`, `AdminFilterSchema`, `AdminBulkActionSchema` | Activo |

Guía rápida: crear una nueva lista admin con List Kit

1. Crear página server que obtenga datos + filtros desde `searchParams`.
2. En cliente, envolver la vista con `AdminListShell`.
3. Usar `AdminListHeader` para título, contador y acciones principales.
4. Montar filtros con `AdminFilterPanel` (+ `LabeledSelect` si aplica).
5. Si hay operaciones masivas, usar `AdminBulkPanel`.
6. Para desktop, renderizar tabla con `AdminDataTable<T>` + `AdminColumnDef<T>`.
7. Para mobile, mantener cards/paneles compactos sin overflow horizontal.
8. Mostrar estados vacíos con `AdminListEmptyState`.
9. Registrar acciones por fila con `AdminTableRowActions` o botón local.
10. Cerrar con smoke desktop/mobile y validar `typecheck`.

Definición operativa (para evitar ambigüedad):

- Desde ahora, **“List Kit” = vista de lista completa reutilizable**, no solo la tabla.
- Una lista “List Kit compliant” incluye como mínimo:
  1. `AdminListShell`
  2. `AdminListHeader`
  3. `AdminFilterPanel` + `AdminControlsRow`
  4. `AdminBulkPanel` + `AdminControlsRow` (si hay selección masiva)
  5. `AdminDataTable` (desktop) + cards mobile equivalentes
  6. `AdminListButton` + `AdminStatusBadge`/`AdminIconBadge` para interacción y estados

Regla UX/UI obligatoria (List Kit y módulos admin):

- No usar scrollers horizontales por defecto (desktop ni mobile), salvo requerimiento explícito del usuario.
- Los controles deben reflow (wrap) dentro del contenedor antes de forzar overflow.
- En mobile, priorizar cards/stack vertical en vez de tablas con scroll horizontal.
- Mantener legibilidad/accesibilidad: evitar recortes de información y evitar que acciones clave queden fuera de viewport.

Registro vigente de lugares donde usamos listas:

- Listas admin **con List Kit**:
  - `/admin/users` → `src/components/admin/users/UsersTableClient.tsx` (**base visual/fuente de verdad**)
  - `/admin/tracks` → `src/app/admin/tracks/page.tsx` + `src/components/admin/tracks/TracksTableClient.tsx`
  - `/admin/playlists` → `src/app/admin/playlists/page.tsx` + `src/components/admin/playlists/PlaylistsTableClient.tsx`
  - `/admin/sound-kits` → `src/app/admin/sound-kits/page.tsx` + `src/components/admin/sound-kits/SoundKitsTableClient.tsx`
  - `/admin/services` → `src/app/admin/services/page.tsx` + `src/components/admin/services/ServicesTableClient.tsx`
  - `/admin/contracts` → `src/app/admin/contracts/page.tsx` + `src/components/admin/contracts/ContractsTableClient.tsx`
  - `/admin/requests` → `src/app/admin/requests/page.tsx` + `src/app/admin/requests/_client.tsx`
  - `/admin/tickets` → `src/app/admin/tickets/page.tsx` + `src/components/admin/tickets/TicketsTableClient.tsx`
  - `/admin/licensing` → `src/app/admin/licensing/page.tsx` + `src/app/admin/licensing/_client.tsx`

- Listas/table-like **fuera de List Kit** (legacy o secundarias):
  - bloque “Invitaciones activas” dentro de `/admin/users` (`src/app/admin/users/page.tsx`)
  - tablas internas de edición por módulo (rights, deliverables, etc.) en `/admin/tracks/[id]/edit/*`

### 11) Módulos operativos nuevos (Playlists / Sound Kits / Services / Contracts)

Rutas admin activas:

- `src/app/admin/playlists/page.tsx` (lista)
- `src/app/admin/playlists/[id]/page.tsx` (detalle + edición rápida)
- `src/app/admin/sound-kits/page.tsx` (lista)
- `src/app/admin/sound-kits/[id]/page.tsx` (detalle + edición rápida)
- `src/app/admin/services/page.tsx` (lista)
- `src/app/admin/services/[id]/page.tsx` (detalle + edición rápida)
- `src/app/admin/contracts/page.tsx` (lista)
- `src/app/admin/contracts/[id]/page.tsx` (detalle + edición rápida)

Rutas playlist-as-catalog activas:

- `src/app/catalog/page.tsx` (catálogo principal desde playlist main)
- `src/app/playlist/[id]/page.tsx` (vista pública por `publicId`/`slug`/`id`, soporte `?embed=1`)
- `src/app/creator/playlists/page.tsx` (lista creator)
- `src/app/creator/playlists/[id]/page.tsx` (detalle creator)

Clientes List Kit por módulo:

- `src/components/admin/playlists/PlaylistsTableClient.tsx`
- `src/components/admin/sound-kits/SoundKitsTableClient.tsx`
- `src/components/admin/services/ServicesTableClient.tsx`
- `src/components/admin/contracts/ContractsTableClient.tsx`

Editores rápidos por módulo:

- `src/components/admin/playlists/PlaylistDetailEditor.tsx`
- `src/components/admin/playlists/PlaylistTrackManager.tsx`
- `src/components/admin/playlists/PlaylistShareManager.tsx`
- `src/components/admin/sound-kits/SoundKitDetailEditor.tsx`
- `src/components/admin/services/ServiceDetailEditor.tsx`
- `src/components/admin/contracts/ContractDetailEditor.tsx`

APIs admin (CRUD/bulk):

- `/api/admin/playlists`, `/api/admin/playlists/[id]`, `/api/admin/playlists/bulk`
- `/api/admin/playlists/[id]/tracks` (asignar/quitar/reordenar tracks)
- `/api/admin/playlists/[id]/share` (compartir por email + revocar)
- `/api/admin/sound-kits`, `/api/admin/sound-kits/[id]`, `/api/admin/sound-kits/bulk`
- `/api/admin/services`, `/api/admin/services/[id]`, `/api/admin/services/bulk`
- `/api/admin/contracts`, `/api/admin/contracts/[id]`, `/api/admin/contracts/bulk`

Modelos Prisma agregados para estos módulos:

- `Playlist` + pivote `PlaylistTrack` + ACL `PlaylistViewer`
- `SoundKit`
- `ServiceOffer`
- `ContractRecord`

Enums Prisma agregados:

- `PlaylistStatus`, `PlaylistVisibility`
- `SoundKitStatus`
- `ServiceOfferStatus`, `ServiceCategory`
- `ContractStatus`

Contrato playlist-as-catalog (vigente):

- `/catalog` renderiza la playlist marcada como main (`isMainCatalog=true`).
- Existe fallback temporal legacy en `/catalog` con flag `CATALOG_USE_LEGACY=1`.
- `PUBLIC + PUBLISHED` expone playlist públicamente.
- `INTERNAL/PRIVATE` requiere sesión/autorización (owner, admin/staff o compartido por `PlaylistViewer`).

## Inventario operativo actualizado (vigente)

Nota:

- Esta sección es la referencia vigente para trabajo de mantenimiento fino.
- Si hay diferencias con listas anteriores del documento, usar esta sección.
- Regla de estado: solo el usuario marca `[x]`; por defecto todo queda en `[ ]`.
- Clasificación de componentes:
  - `[Reusable]`: ya reusable y compartible.
  - `[No reusable]`: específico de una ruta/módulo.
  - `[ R ]`: hoy no reusable, pero conviene extraerlo a reusable.

### 1) Inventario de componentes reutilizables (con internos identificables)

#### `EditableIconInput` (`src/components/admin/ui/EditableIconInput.tsx`)

- [ ] Interno: campo base (`Input`) de texto editable/bloqueable
- [ ] Interno: botón ícono editar (`SquarePen`)
- [ ] Prop clave: `value`
- [ ] Prop clave: `onChange(value)`
- [ ] Prop clave: `onCommit(value)` (async/sync)
- [ ] Prop clave: `placeholder`
- [ ] Prop clave: `lockOnInit`
- [ ] Prop clave: `commitOnEnter`
- [ ] Prop clave: `commitOnBlur`
- [ ] Prop clave: `relockOnCommit`
- [ ] Prop clave: `commitIfChanged`
- [ ] Comportamiento: click en ícono desbloquea + focus + select-all
- [ ] Comportamiento: click en input desbloquea sin select-all

#### `NumericSelectInput` (`src/components/admin/ui/NumericSelectInput.tsx`)

- [ ] Interno: input numérico sin spinners nativos
- [ ] Interno: select-all en focus/click
- [ ] Prop clave: `value`
- [ ] Prop clave: `onChange(value)`
- [ ] Prop clave: `onCommit(value)` (async/sync)
- [ ] Prop clave: `min` / `max` / `step`
- [ ] Prop clave: `commitOnEnter`
- [ ] Prop clave: `commitOnBlur`
- [ ] Prop clave: `commitIfChanged`
- [ ] Comportamiento: Enter dispara commit y evita submit global
- [ ] Comportamiento: blur dispara commit (si corresponde)

#### `SaveStateBadge` (`src/components/admin/ui/SaveStateBadge.tsx`)

- [ ] Estado: `idle`
- [ ] Estado: `saving`
- [ ] Estado: `saved`
- [ ] Estado: `error`
- [ ] Labels configurables por prop

#### `TagChips` (`src/components/ui/TagChips.tsx`)

- [ ] Interno: lista de asignados (chips seleccionados)
- [ ] Interno: botón quitar chip asignado (`X`)
- [ ] Interno: botón toggle panel (si `showToggleButton=true`)
- [ ] Interno: panel sugerencias (inline)
- [ ] Interno: input búsqueda
- [ ] Interno: botón limpiar búsqueda (`X`)
- [ ] Interno: botón `Añadir` desde input
- [ ] Interno: CTA `Crear y añadir` (si `allowCreate`)
- [ ] Interno: lista chips sugeridos
- [ ] Interno: botón eliminar sugerido (`X`, si `allowDeleteCatalog`)
- [ ] Interno: diálogo confirmación eliminar sugerido
- [ ] Prop clave: `selected`
- [ ] Prop clave: `onChange(chips)`
- [ ] Prop clave: `fetchAll`
- [ ] Prop clave: `fetchSuggestions`
- [ ] Prop clave: `normalize`
- [ ] Prop clave: `onCreate`
- [ ] Prop clave: `onDeleteCatalog`
- [ ] Prop clave: `renderAboveAssigned`
- [ ] Prop clave: `renderAboveToggle`
- [ ] Prop clave: `defaultOpen` / `showToggleButton`

#### `MoodChips` (`src/components/admin/track/MoodChips.tsx`)

- [ ] Wrapper reusable sobre `TagChips` + `useTagCatalog`
- [ ] Endpoint catálogo: `GET/POST /api/moods`
- [ ] Endpoint asignación: `GET/POST /api/tracks/:id/moods`
- [ ] Normalización: UPPERCASE
- [ ] Interno: botón `Guardar Moods`
- [ ] Interno: hidden input serializado (`name="moods"`)
- [ ] Interno: `onSaveState` para badge de módulo

#### `UseChips` (`src/components/admin/track/UseChips.tsx`)

- [ ] Wrapper reusable sobre `TagChips` + `useTagCatalog`
- [ ] Endpoint catálogo: `GET/POST /api/uses`
- [ ] Endpoint asignación: `GET/POST /api/tracks/:id/uses`
- [ ] Normalización: UPPERCASE (actual)
- [ ] Interno: botón `Guardar Usos`
- [ ] Interno: hidden input serializado (`name="uses"`)
- [ ] Interno: `onSaveState` para badge de módulo

#### `CategoryChips` (`src/components/admin/track/CategoryChips.tsx`)

- [ ] Wrapper reusable sobre `TagChips` + `useTagCatalog`
- [ ] Endpoint catálogo: `GET/POST/DELETE /api/categories`
- [ ] Endpoint asignación: `GET/POST /api/tracks/:id/categories`
- [ ] Normalización: UPPERCASE + `slugify`
- [ ] Interno: botón `Guardar Categorías`
- [ ] Interno: hidden input serializado (`name="catalogTags"` por default en `/edit`)
- [ ] Interno: rehidratación inicial desde API solo si SSR llega vacío
- [ ] Interno: bloqueo delete de categoría si está asignada

#### Subcomponentes Rights reutilizables (`src/components/admin/track/rights/*`)

- [ ] `PublishingTable` (desktop WRITER/PUBLISHER)
- [ ] `PublishingCards` (mobile WRITER/PUBLISHER)
- [ ] `PublishingNewForms` (alta WRITER/PUBLISHER)
- [ ] `MasterTable` (desktop MASTER)
- [ ] `MasterCards` (mobile MASTER)
- [ ] `MasterNewForm` (alta MASTER)
- [ ] `RightsToggles` (toggles/flags derechos)

### 2) Inventario completo de `/admin` (Dashboard Admin)

Estado de ruta:

- [ ] Ruta revisada/validada por usuario

#### A. Shell / Layout

- [ ] [No reusable] `src/app/admin/layout.tsx` (entry del layout admin)
- [ ] [No reusable][ R ] `src/components/admin/AdminDashboardLayoutClient.tsx` (wrapper cliente de admin)
- [ ] [Reusable] `DashboardShell` (`src/components/dashboard/DashboardShell.tsx`)
- [ ] [Reusable] `DashboardContent (Main Content)` (`src/components/dashboard/DashboardContent.tsx`)

#### B. Navegación lateral (Sidebar)

- [ ] [Reusable] `DashboardSidebar` (`src/components/dashboard/DashboardSidebar.tsx`)
- [ ] [Reusable] `DashboardMobileSidebar` (`src/components/dashboard/DashboardSidebar.tsx`)
- [ ] [Reusable] Contratos nav (`DashboardNavItem`, `DashboardSection`) en `src/components/dashboard/types.ts`
- [ ] [No reusable][ R ] Config admin de nav (`adminDashboardSections`) en `src/components/dashboard/nav-config.admin.ts`
- [ ] [No reusable][ R ] Agrupaciones de navegación: `General`, `Workspace`, `Licensing`, `System`
- [ ] [No reusable][ R ] Items de navegación admin:
  - [ ] `Overview` (`/admin`)
  - [ ] `Account` (`/admin/account`)
  - [ ] `Tracks` (`/admin/tracks`)
  - [ ] `Uploads` (`/admin/uploads`)
  - [ ] `Playlists` (`/admin/playlists`)
  - [ ] `Sound Kits` (`/admin/sound-kits`)
  - [ ] `Services` (`/admin/services`)
  - [ ] `Requests` (`/admin/licensing`)
  - [ ] `Contracts` (`/admin/contracts`)
  - [ ] `Contact Inbox` (`/admin/requests`)
  - [ ] `Audit Log` (`/admin/audit-log`)
  - [ ] `Settings` (`/admin/settings`)

#### C. Topbar / Breadcrumbs / acciones globales

- [ ] [Reusable] `DashboardTopbar` (`src/components/dashboard/DashboardTopbar.tsx`)
- [ ] [Reusable] `DashboardBreadcrumbs` (`src/components/dashboard/DashboardBreadcrumbs.tsx`)
- [ ] [No reusable][ R ] Acción topbar: botón `Sitio público`
- [ ] [Reusable] Acción topbar: `ThemeToggle`
- [ ] [No reusable][ R ] Acción topbar: `Cerrar sesión` (form POST `/admin/logout`)
- [ ] [No reusable][ R ] Título contextual por ruta activa (mapping desde nav config)

#### D. Drawer mobile

- [ ] [Reusable] `Sheet` + `SheetContent` (ui base)
- [ ] [No reusable][ R ] `SheetTitle` sr-only específico de navegación admin
- [ ] [No reusable][ R ] Estado local `mobileOpen`

#### E. Overview + Placeholders de rutas

- [ ] [No reusable][ R ] Overview page (`src/app/admin/page.tsx`)
- [ ] [No reusable][ R ] Tracks list page (`src/app/admin/tracks/page.tsx`)
- [ ] [No reusable][ R ] Tracks table client (`src/components/admin/tracks/TracksTableClient.tsx`)
- [ ] [No reusable][ R ] `PlaceholderPage` (`src/components/admin/PlaceholderPage.tsx`)
- [ ] [No reusable][ R ] Placeholder `Account` (`src/app/admin/account/page.tsx`)
- [ ] [No reusable][ R ] Lista `Playlists` con List Kit (`src/app/admin/playlists/page.tsx`)
- [ ] [No reusable][ R ] Lista `Sound Kits` con List Kit (`src/app/admin/sound-kits/page.tsx`)
- [ ] [No reusable][ R ] Lista `Services` con List Kit (`src/app/admin/services/page.tsx`)
- [ ] [No reusable][ R ] Lista `Contracts` con List Kit (`src/app/admin/contracts/page.tsx`)
- [ ] [No reusable][ R ] Cliente `PlaylistsTableClient` (`src/components/admin/playlists/PlaylistsTableClient.tsx`)
- [ ] [No reusable][ R ] Cliente `SoundKitsTableClient` (`src/components/admin/sound-kits/SoundKitsTableClient.tsx`)
- [ ] [No reusable][ R ] Cliente `ServicesTableClient` (`src/components/admin/services/ServicesTableClient.tsx`)
- [ ] [No reusable][ R ] Cliente `ContractsTableClient` (`src/components/admin/contracts/ContractsTableClient.tsx`)
- [ ] [No reusable][ R ] Detalle playlist (`src/app/admin/playlists/[id]/page.tsx`)
- [ ] [No reusable][ R ] Detalle sound kit (`src/app/admin/sound-kits/[id]/page.tsx`)
- [ ] [No reusable][ R ] Detalle service (`src/app/admin/services/[id]/page.tsx`)
- [ ] [No reusable][ R ] Detalle contract (`src/app/admin/contracts/[id]/page.tsx`)
- [ ] [No reusable][ R ] Placeholder `Audit Log` (`src/app/admin/audit-log/page.tsx`)
- [ ] [No reusable][ R ] Placeholder `Settings` (`src/app/admin/settings/page.tsx`)

### 3) Inventario completo de `/admin/tracks/[id]/edit` (módulos + campos internos, arquitectura modular vigente)

Estado de ruta:

- [ ] Ruta revisada/validada por usuario

#### A. Nueva estructura de rutas `edit` (vigente)

- [ ] [No reusable] `/admin/tracks/[id]/edit` -> Overview modular (`src/app/admin/tracks/[id]/edit/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/creative` -> Módulo Creativo (`src/app/admin/tracks/[id]/edit/creative/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/rights` -> Módulo Derechos (`src/app/admin/tracks/[id]/edit/rights/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/metadata` -> Módulo Metadata (`src/app/admin/tracks/[id]/edit/metadata/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/deliverables` -> Módulo Entregables (`src/app/admin/tracks/[id]/edit/deliverables/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/review` -> Módulo Review (`src/app/admin/tracks/[id]/edit/review/page.tsx`)
- [ ] [No reusable] `/admin/tracks/[id]/edit/full` -> Vista completa legacy de compatibilidad (`src/app/admin/tracks/[id]/edit/full/page.tsx`)
- [ ] [No reusable] `/admin/track/[id]/edit` -> redirect legacy hacia ruta canonical (`src/app/admin/track/[id]/edit/page.tsx`)

#### B. Shell y navegación compartida de edición

- [ ] [Reusable] `TrackEditShell` (`src/components/admin/track/edit/TrackEditShell.tsx`)
- [ ] [No reusable][ R ] Config de navegación de módulos (`src/components/admin/track/edit/module-nav.ts`)
- [ ] [No reusable][ R ] Cabecera contextual de módulo (acciones de topbar por página `page.tsx`)
- [ ] [No reusable][ R ] Barra sticky de guardado por módulo (`CreativeModuleForm`, `RightsModuleForm`, `MetadataModuleForm`, `DeliverablesModuleForm`)

#### C. Módulo `Overview` (`/edit`)

Componentes por módulo:

- [ ] [No reusable] Página Overview (`src/app/admin/tracks/[id]/edit/page.tsx`)
- [ ] [No reusable][ R ] `StatusChip` (componente local en `page.tsx`)
- [ ] [No reusable][ R ] `ModuleCard` (componente local en `page.tsx`)

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `DeleteTrackButton`
- [ ] [Reusable] `TrackAnalyzeHeaderButtons`
- [ ] [Reusable] `Button`

#### D. Módulo `Creativo` (`/edit/creative`)

Componentes por módulo:

- [ ] [No reusable] Página Creative (`src/app/admin/tracks/[id]/edit/creative/page.tsx`)
- [ ] [No reusable][ R ] `CreativeModuleForm` (`src/components/admin/track/edit/CreativeModuleForm.tsx`)
- [ ] [Reusable] `CreativeForm`
- [ ] [Reusable] `MoodChips`
- [ ] [Reusable] `UseChips`
- [ ] [Reusable] `CategoryChips`

Campos internos principales:

- [ ] Input: `title`
- [ ] Input: `artist`
- [ ] Input: `bpm`
- [ ] Input: `key`
- [ ] Select+hidden: `trackType`
- [ ] Textarea: `genres`
- [ ] Textarea: `subgenres`
- [ ] Hidden input: `moods`
- [ ] Hidden input: `uses`
- [ ] Hidden input: `catalogTags`

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `FormField`
- [ ] [Reusable] `SaveStateBadge`
- [ ] [Reusable] `EditableIconInput`
- [ ] [Reusable] `NumericSelectInput`
- [ ] [Reusable] `TagChips` (vía wrappers Mood/Use/Category)
- [ ] [Reusable] `Button`
- [ ] [Reusable] `Input`

#### E. Módulo `Derechos` (`/edit/rights`)

Componentes por módulo:

- [ ] [No reusable] Página Rights (`src/app/admin/tracks/[id]/edit/rights/page.tsx`)
- [ ] [No reusable][ R ] `RightsModuleForm` (`src/components/admin/track/edit/RightsModuleForm.tsx`)
- [ ] [Reusable] `RightsFormClient`
- [ ] [Reusable] `PublishingTable`
- [ ] [Reusable] `PublishingCards`
- [ ] [Reusable] `PublishingNewForms`
- [ ] [Reusable] `MasterTable`
- [ ] [Reusable] `MasterCards`
- [ ] [Reusable] `MasterNewForm`
- [ ] [Reusable] `RightsToggles`

Campos internos principales:

- [ ] Hidden input: `publishingShares`
- [ ] Hidden input: `masterShares`
- [ ] WRITER item: `name`, `sortOrder`, `sharePct`, `pro`, `ipiNumber`, `caeNumber`
- [ ] WRITER alta: `newWriter.name`, `newWriter.sharePct`, `newWriter.ipiNumber`, `newWriter.pro`, `newWriter.caeNumber`
- [ ] PUBLISHER item: `name`, `sortOrder`, `sharePct`, `pro`, `ipiNumber`, `caeNumber`
- [ ] PUBLISHER alta: `newPublisher.name`, `newPublisher.sharePct`, `newPublisher.ipiNumber`, `newPublisher.pro`, `newPublisher.caeNumber`
- [ ] MASTER item: `name`, `sortOrder`, `sharePct`, `contact`, `notes`
- [ ] MASTER alta: `newMaster.name`, `newMaster.sharePct`, `newMaster.contact`, `newMaster.notes`
- [ ] Toggles/campos: `mfn`, `oneStop`, `clearedForSync`, `contentIdEnrolled`, `contentIdAdmin`, `contentIdWhitelist`, `master`, `restrictions`

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `FormField`
- [ ] [Reusable] `SaveStateBadge`
- [ ] [Reusable] `EditableIconInput`
- [ ] [Reusable] `NumericSelectInput`
- [ ] [Reusable] `Button`
- [ ] [Reusable] `Input`
- [ ] [Reusable] `Textarea`
- [ ] [Reusable] `Checkbox`
- [ ] [Reusable] `Label`
- [ ] [Reusable] `Dialog`

#### F. Módulo `Metadata` (`/edit/metadata`)

Componentes por módulo:

- [ ] [No reusable] Página Metadata (`src/app/admin/tracks/[id]/edit/metadata/page.tsx`)
- [ ] [No reusable][ R ] `MetadataModuleForm` (`src/components/admin/track/edit/MetadataModuleForm.tsx`)
- [ ] [Reusable] `IdsForm`
- [ ] [Reusable] `SyncMetaForm`

Campos internos principales:

- [ ] Input: `isrc`
- [ ] Input: `iswc`
- [ ] Input: `upc`
- [ ] Select+hidden: `licenseType`
- [ ] Input: `exclusiveTermMonths`
- [ ] Input: `mediaBuy`
- [ ] Textarea: `exclusiveTerritories`
- [ ] Textarea: `restrictedTerritories`
- [ ] Textarea: `restrictedIndustries`
- [ ] Textarea: `restrictedPlatforms`
- [ ] Textarea: `restrictedBrands`
- [ ] Textarea: `restrictions`
- [ ] Select+hidden: `pricingTier`
- [ ] Input: `budgetMin`
- [ ] Input: `budgetMax`
- [ ] Select+hidden: `budgetCurrency`

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `FormField`
- [ ] [Reusable] `EditableIconInput`
- [ ] [Reusable] `NumericSelectInput`
- [ ] [Reusable] `Select`
- [ ] [Reusable] `Input`
- [ ] [Reusable] `Textarea`
- [ ] [Reusable] `Button`

#### G. Módulo `Entregables` (`/edit/deliverables`)

Componentes por módulo:

- [ ] [No reusable] Página Deliverables (`src/app/admin/tracks/[id]/edit/deliverables/page.tsx`)
- [ ] [No reusable][ R ] `DeliverablesModuleForm` (`src/components/admin/track/edit/DeliverablesModuleForm.tsx`)
- [ ] [Reusable] `DeliverablesForm`

Campos internos principales:

- [ ] Textarea: `versions`
- [ ] Textarea: `stems`

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `FormField`
- [ ] [Reusable] `Textarea`
- [ ] [Reusable] `Button`

#### H. Módulo `Review` (`/edit/review`)

Componentes por módulo:

- [ ] [No reusable] Página Review (`src/app/admin/tracks/[id]/edit/review/page.tsx`)
- [ ] [No reusable][ R ] Cards resumen locales (Creativo/Derechos/Metadata+Entrega)

Reutilizables usados:

- [ ] [Reusable] `TrackEditShell`
- [ ] [Reusable] `TrackAnalyzeHeaderButtons`
- [ ] [Reusable] `Button`

#### I. Ruta de compatibilidad `full` (`/edit/full`)

Componentes por módulo:

- [ ] [No reusable] Página Full legacy (`src/app/admin/tracks/[id]/edit/full/page.tsx`)
- [ ] [Reusable] `TrackEditForm` (orquestador legacy)
- [ ] [Reusable] `AudioAnalysisSection`

Alcance funcional de compatibilidad:

- [ ] Guardado global `Guardar todo`
- [ ] Edición integral en una sola vista (fallback)
- [ ] Navegación modular con acceso a `Vista completa`

### 4) Plantilla de checklist para nuevas rutas

```md
### Ruta: `/ruta/a/trabajar`

Fecha de confirmación: `pendiente`

Módulos:

- [ ] Módulo A
- [ ] Módulo B

Campos internos:

- [ ] Campo 1
- [ ] Campo 2
```
