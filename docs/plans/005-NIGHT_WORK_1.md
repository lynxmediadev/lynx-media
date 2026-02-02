# Night Work 1 — Radio global y UX publishing/master

## Qué se hizo
- Añadí `--lm-radius` como radio único (equiv. rounded-xs) y lo apliqué globalmente a todas las clases `rounded*` via `:is(...)` en `globals.css`.
- Eliminé radios inline (`rounded-[2px]`) en la sección de Derechos (RightsFormClient) para que todo use el radio global.
- Publishing shares ahora muestran Writer y Publisher en columnas separadas con totales 100/100 y avisos visuales (OK/incompleto/>100%). Totales también visibles junto al formulario de alta.
- Se escapó el símbolo `>100%` que causaba error de build.

## Pendientes / notas
- Regla de bloqueo cuando One-Stop=true y las sumas ≠100 no se implementó aún (solo avisos). Decidir si se bloquea en server action.
- La migración de `MasterShare` debe aplicarse en la DB (ya existe migración local).
- No se hizo commit/push todavía.

## Archivos tocados (principales)
- `src/styles/globals.css`
- `src/components/admin/track/RightsFormClient.tsx`
- `docs/AI_CONTEXT.md`, `docs/RESUMEN.md`
- Plan añadido: `docs/plans/05-NIGHT_WORK_PLAN.md`
