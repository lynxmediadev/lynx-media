# 08 · Reemplazo drag & drop por flechas + input de posición (writers/publishers/master)

Objetivo: eliminar dnd-kit y usar controles de flechas con guardado inmediato (o debounce corto) para reordenar writers/publishers/master en `/admin/track/[id]/edit`. Soportar atajos Shift+↑/↓ (desktop) y long‑press en flechas para “Ir al inicio/Ir al final”. Añadir input de posición con validación visual (borde rojo) y guardado onBlur/Enter.

### Contexto de bloqueo actual (pendiente al cambiar de chat)
- El archivo `src/components/admin/track/RightsFormClient.tsx` quedó con JSX desbalanceado en la sección de **Publishing shares** antes de “Titulares de master”. El `tsc --noEmit` arroja errores: falta un cierre de `<div>` y tokens inesperados en la zona ~líneas 592–1085; también marca errores al final del archivo por ese desbalance.
- Conteo rápido: hay 65 `<div>` y 64 `</div>`; falta un cierre justo antes del bloque “Titulares de master (múltiples)”.
- Plan para destrabar:
  1) Reescribir completo el bloque “Master & publishing” / “Publishing shares (Writer/Publisher)” asegurando cierres correctos y manteniendo UI de flechas, input Pos, long-press, Shift+Arrow, borrar, mobile cards.
  2) Volver a correr `npx tsc --noEmit src/components/admin/track/RightsFormClient.tsx` hasta quedar limpio.
  3) Luego implementar pendientes de Paso 5/6: estados de loading/error en flechas, cleanup dnd restos, actualizar terminal.md a “OK”.
- Archivos tocados sin commit: `RightsFormClient.tsx`, `docs/debug/terminal.md` (sigue con error reportado), `plans/08-list-arrows.md` (este plan).

## Paso 0 · Limpieza y dependencias
- [x] Remover import y uso de dnd-kit en `RightsFormClient.tsx` (DndContext, SortableContext, useSortable, modifiers, etc.).
- [x] Eliminar componentes auxiliares de sortable (SortableRow/SortableCard) y estilos asociados.
- [x] Verificar que no queden referencias a `dndDescId*`.

## Paso 1 · Helpers de reordenamiento
- [x] Implementar utilidades en `RightsFormClient.tsx`:
  - `moveShare(idx, delta)` dentro del mismo rol (writer/publisher).
  - `moveShareTo(idx, pos)`, `moveShareTop`, `moveShareBottom`.
  - Equivalentes para master: `moveMaster`, `moveMasterTo`, `moveMasterTop/Bottom`.
  - `saveShares(list)` y `saveMasterShares(list)` con persistencia inmediata (updatePublishingShares / updateMasterShares) y validación existente.
- [x] Mantener validaciones de totales y mensajes actuales.

## Paso 2 · UI desktop (tablas)
- [x] En tablas desktop de writers/publishers/master:
  - Columnas: (handle icon estático “::”), Nombre, Posición (input numérico), Mover (flechas ↑/↓ con long‑press), %, IPI/PRO/CAE (o Contact/Notas), Acciones (borrar).
  - Input Posición: valida rango; si inválido -> borde rojo; guarda onBlur y Enter; Shift+↑/↓ mueve ±3.
  - Flechas: click mueve ±1; Shift+click (desktop) mueve ±3; long‑press abre acciones rápidas “Ir al inicio/Ir al final”.
  - Menú de long‑press: pequeño popover inline debajo de las flechas con dos botones.

## Paso 3 · UI mobile (cards)
- [x] Cartas por ítem con:
  - Encabezado: nombre + % + acciones (flechas, eye para expandir campos, borrar).
  - Bloque Posición: input numérico con misma validación y onBlur/Enter.
  - Long‑press en flechas igual que desktop para ir a inicio/final.
  - Campos completos en layout de una columna cuando está expandido.

## Paso 4 · Accesibilidad y atajos
- [x] Atajos teclado desktop: Shift+ArrowUp/Down en input de posición o flechas aplica delta 3.
- [x] Botones con `aria-label` claros; mantener focus visible.
- [x] Estados de loading: deshabilitar flechas/botones mientras guarda; mostrar mensaje “Moviendo…” opcional en estado local.

## Paso 5 · Guardado y feedback
- [x] Persistencia inmediata por acción; si falla, mostrar mensaje de error reutilizando `setShareError` / `setMasterError`.
- [x] Si la validación local bloquea (posición inválida), no llamar API y marcar borde rojo.

## Paso 6 · Limpieza final
- [x] Quitar restos de estilos o clases de dnd.
- [x] Actualizar `docs/debug/terminal.md` a “OK” tras build local.
- [ ] Marcar checklist de 07-QA-responsive si corresponde al cambio.
- [ ] Probar flujo desktop/mobile: mover 1 paso, mover 3 pasos (Shift), ir a inicio/final (long‑press), input posición inválido, input válido (blur/Enter), borrar y agregar siguen funcionando.

---
