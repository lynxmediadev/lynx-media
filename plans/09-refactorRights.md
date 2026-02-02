# 09 · Refactor RightsFormClient en submódulos (prompts para copiar/pegar)

Objetivo: dividir `src/components/admin/track/RightsFormClient.tsx` sin romper funcionalidad (flechas ±1/±3, long-press, inputs, validaciones, altas/borrados, loading/error) para depurar más fácil.

## Prompts paso a paso (marca `[ ]` → `[x]`)

**Prompt 1 — Base**  
- Crear/asegurar carpeta `src/components/admin/track/rights/`.  
- Añadir/usar `rights/types.ts` (Share, MasterShare) y `rights/utils.ts` (sortByOrder, applyRoleSortOrders, applyMasterOrders, clamp).  
- [x] Carpeta creada  
- [x] types.ts listo  
- [x] utils.ts listo  
- [x] tsc dirigido (opcional)

**Prompt 2 — Hook publishing**  
- Crear `rights/usePublishingShares.ts` con: estado shares, shareError/roleErrors, newWriter/newPublisher, saving flags, move/moveTo/moveTop/Bottom (clamp), save (updatePublishingShares), delete, add, validaciones, shift±3, long-press, “Moviendo…”.  
- Exportar API para UI.  
- [x] Archivo creado  
- [x] Funciones move/save/delete/add  
- [x] Validaciones/errores  
- [x] Loading/shift/long-press  
- [x] tsc dirigido

**Prompt 3 — UI publishing**  
- `rights/PublishingTable.tsx` (desktop) con handlers.  
- `rights/PublishingCards.tsx` (mobile) con expandibles.  
- `rights/PublishingNewForms.tsx` (alta writer/publisher) con Enter/btn y saving.  
- [x] PublishingTable  
- [x] PublishingCards  
- [x] PublishingNewForms  
- [x] tsc dirigido

**Prompt 4 — Hook master**  
- Crear `rights/useMasterShares.ts` con estado masterShares, masterError, newMaster, saving, move/moveTo/moveTop/Bottom (clamp), save (updateMasterShares), delete, add, validar 100%, “Moviendo…”.  
- [x] Archivo creado  
- [x] Funciones move/save/delete/add  
- [x] Validación 100%  
- [x] Loading/errores  
- [x] tsc dirigido

**Prompt 5 — UI master**  
- `rights/MasterTable.tsx` (desktop) y `rights/MasterCards.tsx` (mobile) con expandibles.  
- `rights/MasterNewForm.tsx` (alta master) con Enter/btn y saving.  
- [x] MasterTable  
- [x] MasterCards  
- [x] MasterNewForm  
- [x] tsc dirigido

**Prompt 6 — Toggles/metadatos**  
- Crear `rights/RightsToggles.tsx` para MFN, OneStop, Cleared, ContentID, ContentIdAdmin/Whitelist, master único, restrictions.  
- [x] RightsToggles  
- [x] tsc dirigido

**Prompt 7 — Orquestador**  
- Reescribir `RightsFormClient.tsx` importando hooks/subcomponentes; quitar dnd-kit y copys de “arrastrar”.  
- Mantener: flechas ±1/±3 (click/shift), long-press, inputs pos blur/Enter, validaciones, “Moviendo…”, control de Enter.  
- [x] Orquestador actualizado  
- [x] dnd eliminado  
- [x] tsc dirigido

**Prompt 8 — Pruebas**  
- `npx tsc --noEmit` general o dirigido.  
- Smoke en `/admin/track/[id]/edit`: mover ±1/±3, long-press, blur/Enter pos válido/ inválido, añadir/borrar writer/publisher/master, shift+click, datos persisten.  
- [x] tsc ok  
- [ ] Smoke desktop/mobile ok

**Prompt 9 — Documentos**  
- Actualizar `docs/debug/terminal.md` si hubo errores.  
- Marcar avances en `plans/08-list-arrows.md`, `plans/09-refactorRights.md`, y `07-QA-responsive.md` si aplica.  
- [x] terminal.md actualizado  
- [x] planes marcados  
- [ ] QA checklist (si aplica)
