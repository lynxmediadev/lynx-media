Entiendo. Ahora comprendo muchas cosas y por qué estábamos manteniendo una lógica distinta en Categorías.

Creo que estamos manteniendo una funcionalidad que tal vez no necesitamos del todo, pero necesito que tú me ayudes con la solcuón, porque es muy probable que esté comprendiendo algo mal.
Inicialmente quería hacer catálogos por categoría porque quería tener "Beats" y "Sync" como catálogos con su propia ruta.

En base a eso, creo que aplicamos una lógica diferente en los tags para Categorías.
Yo lo que quería era tener una ruta tipo /sync o /beats para acceder más rápido a cada tipo de música.

Ahora cambié la visión sobre eso.
- En primer lugar, necesito que agregues al contexto, en un archivo llamado /docs/PROJECT_GENERAL_CONTEXT.md: En lynxmedia.cl no habrá venta de BEATS para artistas/raperos. Eso lo haremos en otro proyecto de ODR.
- En Lynx Media nos enfocaremos, en cuánto a lo musical, sólo en SYNC LICENSING.

Ahora unas consideraciones para la implementación y planificación:
- Quiero que los *tags de categoría* tengan la misma lógica que Moods, lo que supongo que significa sacar la lógica de pivote a TrackTags.
- Como ahora tendremos un solo catálogo, categorías será un tag más, ¿Podremos crear un filtro en /catalog que considere las variables principales para filtrar tracks en este contexto?
- /catalog será la página principal de catálogo.
- Ya no necesito /beats o /sync, deja todo limpio para usar esas rutas a futuro sin problemas.
- Tampoco necesito esos botones en /catalog con las Categorías.
- Ya que quitaremos la lógica de pivote, seguramente quedará lógica en código perdido, archivos innecesarios y que pueden llevar a confusiones, bugs, etc. Hay que dejar limpia esta implementación.



## Inventario de rutas y checklist (fuente vigente)

Regla de validación:
- Solo el usuario puede marcar un item como `listo` (`[x]`) de forma explícita.
- Si no hay confirmación explícita del usuario, el estado se mantiene en `pendiente` (`[ ]`).

Referencia única para `/admin/track/[id]/edit`:
- Usar exclusivamente la sección `## Inventario operativo actualizado (vigente)`.
- Dentro de esa sección, el bloque oficial es `### 2) Inventario completo de /admin/track/[id]/edit (módulos + campos internos)`.















___________________________________________________________

/* MANTENER SIEMPRE EL INVENTARIO DE COMPONENTES REUTILIZABLES AL FINAL DE ESTE DOCUMENTO */ 

## Inventario de componentes reutilizables (proyecto)

### 1) UI base global (`src/components/ui`)
| Componente | Ruta | Uso principal | Estado |
|---|---|---|---|
| Accordion | `src/components/ui/accordion.tsx` | Contenedores expandibles | Activo |
| Badge | `src/components/ui/badge.tsx` | Etiquetas de estado | Activo |
| Button | `src/components/ui/button.tsx` | Botón base del proyecto | Activo |
| Card | `src/components/ui/card.tsx` | Contenedor visual base | Activo |
| Checkbox | `src/components/ui/checkbox.tsx` | Selección booleana | Activo |
| Dialog | `src/components/ui/dialog.tsx` | Modales/confirmaciones | Activo |
| DropdownMenu | `src/components/ui/dropdown-menu.tsx` | Menús contextuales | Activo |
| Input | `src/components/ui/input.tsx` | Campo de texto base | Activo |
| Label | `src/components/ui/label.tsx` | Etiqueta accesible de campos | Activo |
| Select | `src/components/ui/select.tsx` | Selector de opciones | Activo |
| Separator | `src/components/ui/separator.tsx` | Separadores visuales | Activo |
| Sheet | `src/components/ui/sheet.tsx` | Panel lateral/drawer | Activo |
| Slider | `src/components/ui/slider.tsx` | Rango deslizante | Activo |
| Tabs | `src/components/ui/tabs.tsx` | Navegación por pestañas | Activo |
| Textarea | `src/components/ui/textarea.tsx` | Texto multilínea base | Activo |
| Tooltip | `src/components/ui/tooltip.tsx` | Ayudas contextuales | Activo |
| useToast | `src/components/ui/use-toast.ts` | Hook de notificaciones | Activo |
| TagChips | `src/components/ui/TagChips.tsx` | Sistema genérico de tags/chips | Activo |
| CopyButton | `src/components/ui/CopyButton.tsx` | Copiar texto con feedback | Activo |
| CopyIconButton | `src/components/ui/CopyIconButton.tsx` | Copiar vía botón ícono | Activo |
| AudioPlayer | `src/components/ui/AudioPlayer.tsx` | Reproductor de audio UI | Activo |
| AudioPlayerDemo | `src/components/ui/AudioPlayerDemo.tsx` | Demo/uso de AudioPlayer | Activo |
| CatalogCardUI | `src/components/ui/catalog/card.tsx` | Card visual de catálogo | Activo |

### 2) UI admin compartida (`src/components/admin/ui`)
| Componente | Ruta | Uso principal | Estado |
|---|---|---|---|
| FormField | `src/components/admin/ui/FormField.tsx` | Envoltura estándar de campos admin | Activo |
| FormField2 | `src/components/admin/ui/FormField2.tsx` | Variante antigua de FormField | Legacy |
| SaveStateBadge | `src/components/admin/ui/SaveStateBadge.tsx` | Estado corto de guardado/error | Activo |
| EditableIconInput | `src/components/admin/ui/EditableIconInput.tsx` | Input bloqueado con ícono editar y foco automático | Activo |
| NumericSelectInput | `src/components/admin/ui/NumericSelectInput.tsx` | Input numérico sin spinners con select-all en click/focus | Activo |

### 3) Módulos reutilizables del editor de track (`src/components/admin/track`)
| Componente | Ruta | Uso principal | Estado |
|---|---|---|---|
| TagModule | `src/components/admin/track/TagModule.tsx` | Wrapper de módulos de tags | Activo |
| MoodChips | `src/components/admin/track/MoodChips.tsx` | Gestión de tags de moods | Activo |
| UseChips | `src/components/admin/track/UseChips.tsx` | Gestión de tags de usos | Activo |
| CategoryChips | `src/components/admin/track/CategoryChips.tsx` | Gestión de tags de categorías | Activo |
| CreativeForm | `src/components/admin/track/CreativeForm.tsx` | Módulo creativo del edit | Activo |
| IdsForm | `src/components/admin/track/IdsForm.tsx` | ISRC/ISWC/UPC | Activo |
| SyncMetaForm | `src/components/admin/track/SyncMetaForm.tsx` | Metadata comercial/sync | Activo |
| DeliverablesForm | `src/components/admin/track/DeliverablesForm.tsx` | Entregables (versiones/stems) | Activo |
| AudioAnalysisSection | `src/components/admin/track/AudioAnalysisSection.tsx` | Visualización técnica de audio | Activo |
| CatalogTagsForm | `src/components/admin/track/CatalogTagsForm.tsx` | Flujo legacy de tags catálogo | Legacy |
| DeleteTrackButton | `src/components/admin/track/DeleteTrackButton.client.tsx` | Borrado de track en admin | Activo |
| TrackEditForm | `src/components/admin/track/TrackEditForm.tsx` | Orquestador global de /edit | Activo |
| RightsFormClient | `src/components/admin/track/RightsFormClient.tsx` | Módulo publishing/master | Activo |

### 4) Subcomponentes reutilizables de Rights (`src/components/admin/track/rights`)
| Componente | Ruta | Uso principal | Estado |
|---|---|---|---|
| PublishingTable | `src/components/admin/track/rights/PublishingTable.tsx` | Tabla desktop writers/publishers | Activo |
| PublishingCards | `src/components/admin/track/rights/PublishingCards.tsx` | Cards mobile writers/publishers | Activo |
| PublishingNewForms | `src/components/admin/track/rights/PublishingNewForms.tsx` | Alta de writer/publisher | Activo |
| MasterTable | `src/components/admin/track/rights/MasterTable.tsx` | Tabla desktop master shares | Activo |
| MasterCards | `src/components/admin/track/rights/MasterCards.tsx` | Cards mobile master shares | Activo |
| MasterNewForm | `src/components/admin/track/rights/MasterNewForm.tsx` | Alta de titular master | Activo |
| RightsToggles | `src/components/admin/track/rights/RightsToggles.tsx` | Toggles de derechos y flags | Activo |

### 5) Componentes admin reutilizables (licensing/workflow)
| Componente | Ruta | Uso principal | Estado |
|---|---|---|---|
| AnalyzeActions | `src/components/admin/AnalyzeActions.tsx` | Acciones de análisis de solicitudes | Activo |
| AssigneePicker | `src/components/admin/AssigneePicker.tsx` | Asignación de responsable | Activo |
| FollowUpPicker | `src/components/admin/FollowUpPicker.tsx` | Programación de seguimiento | Activo |
| InternalNotesEditor | `src/components/admin/InternalNotesEditor.tsx` | Notas internas con autosave | Activo |
| PriorityPicker | `src/components/admin/PriorityPicker.tsx` | Prioridad del caso | Activo |
| QuickAdminActions | `src/components/admin/QuickAdminActions.tsx` | Acciones rápidas de workflow | Activo |
| ReplyTemplates | `src/components/admin/ReplyTemplates.tsx` | Plantillas de respuesta | Activo |
| StatusPicker | `src/components/admin/StatusPicker.tsx` | Estado del caso/licencia | Activo |

### 6) Catálogo y vista pública reutilizable
| Componente | Ruta | Uso principal | Estado |
|---|---|---|---|
| CatalogView | `src/components/catalog/CatalogView.tsx` | Vista principal de catálogo | Activo |
| TrackTags | `src/components/catalog/TrackTags.tsx` | Render de tags en catálogo | Activo |
| CardView | `src/components/catalog/views/CardView.tsx` | Modo cards de catálogo | Activo |
| SplitView | `src/components/catalog/views/SplitView.tsx` | Modo split de catálogo | Activo |
| TableView | `src/components/catalog/views/TableView.tsx` | Modo tabla de catálogo | Activo |
| CatalogFilterBar | `src/components/public/CatalogFilterBar.tsx` | Barra de filtros públicos | Activo |
| TrackCard | `src/components/public/TrackCard.tsx` | Card pública de track | Activo |
| TrackCardWave | `src/components/public/TrackCardWave.tsx` | Card con waveform | Activo |
| TrackCardWavePlayer | `src/components/public/TrackCardWavePlayer.tsx` | Card + reproductor integrado | Activo |
| TrackMetadataTable | `src/components/public/TrackMetadataTable.tsx` | Tabla metadata pública | Activo |
| PublicPlayer | `src/components/public/PublicPlayer.tsx` | Reproductor público principal | Activo |
| PublicAudioBar | `src/components/public/PublicAudioBar.tsx` | Barra de progreso/audio pública | Activo |
| WaveformScrubber | `src/components/public/WaveformScrubber.tsx` | Scrubber de waveform | Activo |
| CopyLinkButton | `src/components/public/CopyLinkButton.tsx` | Copiar URL de track/catálogo | Activo |
| LicensingDialog | `src/components/public/LicensingDialog.tsx` | Diálogo de licenciamiento | Activo |
| PublicLicenseForm | `src/components/public/PublicLicenseForm.tsx` | Formulario público de licensing | Activo |
| SimilarTracks | `src/components/public/SimilarTracks.tsx` | Tracks relacionados | Activo |

### 7) Audio reutilizable
| Componente | Ruta | Uso principal | Estado |
|---|---|---|---|
| LinkedWaveform | `src/components/audio/LinkedWaveform.tsx` | Waveform sincronizado con player | Activo |
| QualityBadges | `src/components/audio/QualityBadges.tsx` | Badges de calidad/formatos | Activo |
| Sparkline | `src/components/audio/Sparkline.tsx` | Visual mini de waveform | Activo |

### 8) Comunes y layout reutilizable
| Componente | Ruta | Uso principal | Estado |
|---|---|---|---|
| ClientOnly | `src/components/common/ClientOnly.tsx` | Render sólo en cliente | Activo |
| ScrollToSectionButton | `src/components/common/ScrollToSectionButton.tsx` | Navegación por secciones | Activo |
| SmoothScroll | `src/components/common/SmoothScroll.tsx` | Scroll suave global | Activo |
| ThemeToggle (common) | `src/components/common/ThemeToggle.tsx` | Cambio de tema | Activo |
| Navbar | `src/components/layout/Navbar.tsx` | Barra superior principal | Activo |
| Footer | `src/components/layout/Footer.tsx` | Pie de página | Activo |
| ThemeProvider | `src/components/providers/ThemeProvider.tsx` | Provider de tema | Activo |
| FrontendShell | `src/components/site/FrontendShell.tsx` | Shell del frontend | Activo |
| SiteHeader | `src/components/site/SiteHeader.tsx` | Header del sitio | Activo |
| ThemeToggle (site) | `src/components/site/ThemeToggle.tsx` | Toggle tema en site shell | Activo |
| SaveButton | `src/components/forms/SaveButton.tsx` | Botón reutilizable de guardado | Activo |
| copyable | `src/components/copyable.tsx` | Wrapper para copiar contenido | Activo |
| whitelist-dialog | `src/components/whitelist-dialog.tsx` | Dialog de whitelist | Activo |

## Inventario operativo actualizado (vigente)

Nota:
- Esta sección es la referencia vigente para trabajo de mantenimiento fino.
- Si hay diferencias con listas anteriores del documento, usar esta sección.
- Regla de estado: solo el usuario marca `[x]`; por defecto todo queda en `[ ]`.

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

### 2) Inventario completo de `/admin/track/[id]/edit` (módulos + campos internos)

Estado de ruta:
- [ ] Ruta revisada/validada por usuario

#### A. Formulario orquestador (`TrackEditForm`)
- [ ] Hidden input: `id`
- [ ] Barra global: mensaje de estado (`status.message`)
- [ ] Botón global: `Guardar todo`

#### B. Sección `Metadata creativa & identificadores`

##### B1. Módulo `Creativo` (`CreativeForm`)
- [ ] Input: `title`
- [ ] Input: `artist`

##### B2. Módulo `Moods` (`MoodChips` + `TagChips`)
- [ ] Badge estado módulo (`SaveStateBadge`)
- [ ] Lista: `Moods asignados`
- [ ] Campo búsqueda: `Buscar mood`
- [ ] Botón: `Añadir`
- [ ] Lista: sugerencias catálogo
- [ ] Acción sugerido: agregar a asignados
- [ ] Acción sugerido: eliminar de catálogo (`X` + confirmación)
- [ ] Acción asignado: quitar de asignados (`X`)
- [ ] Botón: `Guardar Moods`
- [ ] Hidden input: `moods`

##### B3. Módulo `Usos previstos` (`UseChips` + `TagChips`)
- [ ] Badge estado módulo (`SaveStateBadge`)
- [ ] Lista: `Usos asignados`
- [ ] Campo búsqueda: `Buscar uso`
- [ ] Botón: `Añadir`
- [ ] Lista: sugerencias catálogo
- [ ] Acción sugerido: agregar a asignados
- [ ] Acción sugerido: eliminar de catálogo (`X` + confirmación)
- [ ] Acción asignado: quitar de asignados (`X`)
- [ ] Botón: `Guardar Usos`
- [ ] Hidden input: `uses`

##### B4. Módulo `Categorías` (`CategoryChips` + `TagChips`)
- [ ] Badge estado módulo (`SaveStateBadge`)
- [ ] Lista: `Categorías asignadas`
- [ ] Campo búsqueda: `Buscar categoría`
- [ ] Botón: `Añadir`
- [ ] Lista: sugerencias catálogo
- [ ] Acción sugerido: agregar a asignadas
- [ ] Acción sugerido: eliminar de catálogo (`X` + confirmación)
- [ ] Acción asignado: quitar de asignadas (`X`)
- [ ] Botón: `Guardar Categorías`
- [ ] Hidden input: `catalogTags`

##### B5. Módulo `Identificadores` (`IdsForm`)
- [ ] Input: `isrc`
- [ ] Input: `iswc`
- [ ] Input: `upc`

##### B6. Módulo `Derechos & explotación` (`RightsFormClient`)
- [ ] Hidden input: `publishingShares`
- [ ] Hidden input: `masterShares`

###### B6.1 Lista de `WRITER` (`PublishingTable` / `PublishingCards`)
- [ ] Campo por item: `name` (`EditableIconInput`)
- [ ] Campo por item: `sortOrder` (`NumericSelectInput`, mover por posición)
- [ ] Acción por item: flecha arriba/abajo (click)
- [ ] Acción por item: `Shift + Arrow` (salto 3)
- [ ] Acción por item: long-press (`Ir al inicio / Ir al final`)
- [ ] Campo por item: `sharePct` (`NumericSelectInput`, autosave blur/enter)
- [ ] Campo por item: `pro` (`select ASCAP/BMI/SCD`, autosave al cambiar)
- [ ] Campo por item: `ipiNumber` (`EditableIconInput`)
- [ ] Campo por item: `caeNumber` (`EditableIconInput`)
- [ ] Acción por item: eliminar

###### B6.2 Form alta `WRITER` (`PublishingNewForms`)
- [ ] Campo: `newWriter.name` (requerido)
- [ ] Campo: `newWriter.sharePct`
- [ ] Campo: `newWriter.ipiNumber`
- [ ] Campo: `newWriter.pro` (select)
- [ ] Campo: `newWriter.caeNumber`
- [ ] Acción: botón `Añadir writer`

###### B6.3 Lista de `PUBLISHER` (`PublishingTable` / `PublishingCards`)
- [ ] Campo por item: `name` (`EditableIconInput`)
- [ ] Campo por item: `sortOrder` (`NumericSelectInput`, mover por posición)
- [ ] Acción por item: flecha arriba/abajo (click)
- [ ] Acción por item: `Shift + Arrow` (salto 3)
- [ ] Acción por item: long-press (`Ir al inicio / Ir al final`)
- [ ] Campo por item: `sharePct` (`NumericSelectInput`, autosave blur/enter)
- [ ] Campo por item: `pro` (`select ASCAP/BMI/SCD`, autosave al cambiar)
- [ ] Campo por item: `ipiNumber` (`EditableIconInput`)
- [ ] Campo por item: `caeNumber` (`EditableIconInput`)
- [ ] Acción por item: eliminar

###### B6.4 Form alta `PUBLISHER` (`PublishingNewForms`)
- [ ] Campo: `newPublisher.name` (requerido)
- [ ] Campo: `newPublisher.sharePct`
- [ ] Campo: `newPublisher.ipiNumber`
- [ ] Campo: `newPublisher.pro` (select)
- [ ] Campo: `newPublisher.caeNumber`
- [ ] Acción: botón `Añadir publisher`

###### B6.5 Lista de `MASTER` (`MasterTable` / `MasterCards`)
- [ ] Campo por item: `name` (`EditableIconInput`)
- [ ] Campo por item: `sortOrder` (`NumericSelectInput`, mover por posición)
- [ ] Acción por item: flecha arriba/abajo (click)
- [ ] Acción por item: `Shift + Arrow` (salto 3)
- [ ] Acción por item: long-press (`Ir al inicio / Ir al final`)
- [ ] Campo por item: `sharePct` (`NumericSelectInput`, autosave blur/enter)
- [ ] Campo por item: `contact` (`EditableIconInput`)
- [ ] Campo por item: `notes` (`EditableIconInput`)
- [ ] Acción por item: eliminar

###### B6.6 Form alta `MASTER` (`MasterNewForm`)
- [ ] Campo: `newMaster.name` (requerido)
- [ ] Campo: `newMaster.sharePct`
- [ ] Campo: `newMaster.contact`
- [ ] Campo: `newMaster.notes`
- [ ] Acción: botón `Añadir master`

###### B6.7 Submódulo `RightsToggles`
- [ ] Toggle: `mfn`
- [ ] Toggle: `oneStop`
- [ ] Toggle: `clearedForSync`
- [ ] Toggle: `contentIdEnrolled`
- [ ] Input: `contentIdAdmin`
- [ ] Textarea: `contentIdWhitelist`
- [ ] Input: `master` (titular único)
- [ ] Textarea: `restrictions`

###### B6.8 Modal de confirmación eliminación (`RightsFormClient`)
- [ ] Botón: `Cancelar`
- [ ] Botón: `Eliminar`

#### C. Sección `Metadata sync & entregables`

##### C1. Módulo `Metadata sync` (`SyncMetaForm`)
- [ ] Input: `bpm`
- [ ] Input: `key` (con datalist)
- [ ] Select + hidden: `trackType`
- [ ] Textarea: `genres`
- [ ] Textarea: `subgenres`
- [ ] Select + hidden: `licenseType`
- [ ] Input: `exclusiveTermMonths`
- [ ] Input: `mediaBuy`
- [ ] Textarea: `exclusiveTerritories`
- [ ] Textarea: `restrictedTerritories`
- [ ] Textarea: `restrictedIndustries`
- [ ] Textarea: `restrictedPlatforms`
- [ ] Textarea: `restrictedBrands`
- [ ] Textarea: `restrictions`
- [ ] Select + hidden: `pricingTier`
- [ ] Input: `budgetMin`
- [ ] Input: `budgetMax`
- [ ] Select + hidden: `budgetCurrency`

##### C2. Módulo `Entregables` (`DeliverablesForm`)
- [ ] Textarea: `versions`
- [ ] Textarea: `stems`

### 3) Plantilla de checklist para nuevas rutas

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
