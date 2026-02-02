# Plan: Writers & Publishers múltiples en Derechos & explotación

Objetivo: migrar la sección “Derechos & explotación” en `/admin/track/[id]/edit` para soportar **múltiples shares de Writer y Publisher** usando el modelo `PublishingShare` (role=WRITER|PUBLISHER), con UI editable (agregar/eliminar) y guardado en server actions.

## Paso 1 · Confirmar modelo y datos actuales
**Prompt a pegar**
```
Objetivo: verificar que Prisma ya tenga `PublishingShare` y cómo se usa.
Tareas:
- Revisar prisma/schema.prisma para confirmar modelo PublishingShare (role, name, sharePct, ipiNumber, pro, caeNumber, trackId).
- Ver cómo se leen en /track/[id] (pública) y admin (page.tsx) para no romper consumo.
- Anotar si hay datos legacy en campos únicos (writerName, writerSharePct, publisherName, etc.) que deban migrarse o mostrarse como fallback.
```

## Paso 2 · Definir payload y server action única
**Prompt a pegar**
```
Objetivo: diseñar el payload para reemplazar las shares de un track.
Tareas:
- Crear/actualizar server action (p.ej. updatePublishingShares) que reciba trackId y un array de shares [{role, name, sharePct, ipiNumber, pro, caeNumber}].
- Validar: sharePct numérico 0–100; name requerido; role en {WRITER, PUBLISHER}; opcional ipi/pro/cae.
- Estrategia de persistencia: deleteMany trackId + createMany nuevas (o upsert por id si decides conservar ids), retornando estado y errores de campo.
```

## Paso 3 · UI editable en admin
**Prompt a pegar**
```
Objetivo: rediseñar la sección de publishing en RightsFormClient.
Tareas:
- Reemplazar los inputs únicos de Writer/Publisher por una tabla/lista editable de shares.
- Lista muestra: Role, Nombre, %, IPI, PRO, CAE + botón borrar fila.
- Formulario de “Agregar share” con selector Role (Writer/Publisher) y mismos campos; al agregar, se añade a lista local.
- Botón “Guardar shares” o guardado inmediato (elige: preferible guardado inmediato con estado “Guardando…” y toasts).
- Mostrar sumatoria de % por rol; warning si la suma no es ~100%.
```

## Paso 4 · Integrar con guardado global
**Prompt a pegar**
```
Objetivo: mantener coherencia con el botón “Guardar todo”.
Tareas:
- Si usas guardado inmediato, añade hidden inputs con el estado serializado para que el submit global siga funcionando; o dispara la server action propia y revalida datos.
- Asegura que fieldErrors de la action de shares se mapeen a la UI.
```

## Paso 5 · Migración y fallback
**Prompt a pegar**
```
Objetivo: no perder datos legacy.
Tareas:
- Si existen valores legacy (writerName/SharePct, publisherName/SharePct) y no hay PublishingShares, pre-sembrar una fila por role al cargar el form.
- Dejar nota en RESUMEN/AI_CONTEXT sobre la nueva fuente de verdad (PublishingShare) y que los campos legacy quedan deprecated.
```

## Paso 6 · QA y copy
**Prompt a pegar**
```
Objetivo: asegurar UX y claridad.
Tareas:
- QA desktop/mobile: agregar, borrar, validar % fuera de rango, suma ≠100, guardado, estados vacíos.
- Copy: aclarar que “Shares” son composición (publishing) y que master se sigue editando aparte.
- Actualizar RESUMEN.md y AI_CONTEXT.md; si hace falta, TO_DO.md para pendientes.
```
