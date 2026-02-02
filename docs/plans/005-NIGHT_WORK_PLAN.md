# Plan: Night Work 1 (bordes unificados, publishing/master UX, QA y docs)

Objetivo general: dejar radios globales consolidados, mejorar la UX de publishing/master (validaciones 100/100), hacer QA visual ligera y actualizar documentación antes de la mañana.

## Paso 1 · Bordes globales coherentes
**Prompt a pegar**
```
Objetivo: eliminar radios inline y forzar uso de --lm-radius.
Tareas:
- Buscar rounded-[2px] y radios hardcodeados en componentes recientes (RightsFormClient, tablas admin) y quitarlos para usar clases estándar.
- Confirmar que --lm-radius gobierna todo (ya definido en globals.css).
```

## Paso 2 · UX y validación de PublishingShare/MasterShare
**Prompt a pegar**
```
Objetivo: avisos claros y regla opcional de 100/100.
Tareas:
- Mostrar warnings visibles si Writer≠100 o Publisher≠100.
- Si oneStop=true, bloquear guardado de publishingShares cuando Writer/Publisher no sumen 100 (mensaje claro).
- Mantener % opcional cuando oneStop=false.
```

## Paso 3 · QA visual ligera
**Prompt a pegar**
```
Objetivo: chequear estilos sin cambiar lógica.
Tareas:
- Revisar /admin/track/[id]/edit (sección Derechos): espaciados, hover/focus, radios.
- Revisar catálogo y “Piezas similares” por bordes y z-index de menús/tooltips; ajustar con clases si es menor.
```

## Paso 4 · Documentación y planes
**Prompt a pegar**
```
Objetivo: dejar constancia.
Tareas:
- Actualizar RESUMEN.md y AI_CONTEXT.md con radios globales, publishing/master UX, y nota de migración pendiente MasterShare.
- Marcar pasos completados y pendientes en 03-WRITER_PUBLISHER-PLAN y 04-MASTER-PLAN.
- Añadir log rápido en docs/05-NIGHT_WORK_1.md (qué se hizo, qué falta).
```

## Paso 5 · Git
**Prompt a pegar**
```
Objetivo: dejar cambios listos.
Tareas:
- Staging y commit (si se autoriza) con mensaje descriptivo; caso contrario, dejar staged y anotar.
```
