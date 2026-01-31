# Plan: Master ownership múltiple (MasterShares) en Derechos & explotación

Objetivo: permitir varios titulares de master con porcentajes y datos básicos, similar a PublishingShare, en `/admin/track/[id]/edit` y mantener consistencia en acciones y validaciones.

## Paso 1 · Modelo y migración
**Prompt a pegar**
```
Objetivo: agregar MasterShare en Prisma.
Tareas:
- Añadir modelo MasterShare { id, trackId, name, sharePct?, contact?, notes? (opcional), createdAt/updatedAt } relacionado a Track onDelete: Cascade.
- Índices por trackId.
- Crear migración y `prisma generate` (dejaremos lista, ejecutar cuando corresponda).
```

## Paso 2 · Validación y server actions
**Prompt a pegar**
```
Objetivo: manejar masterShares en el payload de Derechos.
Tareas:
- En rightsFormSchema agregar campo masterShares (string JSON) y parsearlo a array [{name, sharePct?, contact?, notes?}].
- Nueva server action updateMasterShares (trackId + shares) o reutilizar update-rights/update-all para borrar/crear MasterShare.
- Validar sharePct 0–100; name requerido.
```

## Paso 3 · UI admin
**Prompt a pegar**
```
Objetivo: UI editable para Master ownership.
Tareas:
- En RightsFormClient añadir tabla “Master shares” (similar a publishing shares) con columnas: Nombre, %, Contacto, Notas, Acciones.
- Botón “Añadir share”, editar en línea, borrar, guardado inmediato (server action masterShares).
- Mostrar suma % total; warning si ≠100.
- Hidden input masterShares para el submit global.
```

## Paso 4 · Integración en update-all
**Prompt a pegar**
```
Objetivo: coherencia con el botón “Guardar todo”.
Tareas:
- update-all debe tomar masterShares parseados y reemplazar MasterShare del track.
- Revalidar rutas admin tras guardar.
```

## Paso 5 · QA y docs
**Prompt a pegar**
```
Objetivo: verificar y documentar.
Tareas:
- QA desktop/mobile: agregar, editar, borrar master shares; sumatoria; estados vacíos.
- Actualizar RESUMEN.md y AI_CONTEXT.md indicando que master ahora admite múltiples titulares.
```
