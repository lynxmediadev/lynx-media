# Ideas (Backlog de producto)

## Regla de uso
- **PLANES**: se guardan en `docs/plans/` (numeración continua del proyecto).
- **IDEAS**: se guardan en `docs/ideas/` (numeración propia desde `001`).

## Convención de archivos (ideas)
- `001-ideas-backlog.md` -> inventario central.
- `00N-nombre-corto.md` -> idea individual.

Ejemplo:
- `docs/ideas/002-admin-users-ui.md`
- `docs/ideas/003-track-export-v2.md`

## Flujo
1) Idea nueva -> crear archivo `00N-...md`.
2) Registrar en `001-ideas-backlog.md`.
3) Cuando pase a ejecución -> crear plan en `docs/plans/` y enlazarlo desde backlog.
4) Al terminar -> marcar estado `DONE`.

## Comandos de trabajo en chat (convención)
- Si el mensaje comienza con **`IDEA:`**:
  - se crea/actualiza archivo en `docs/ideas/`,
  - se registra/actualiza en `001-ideas-backlog.md`.
- Si el mensaje comienza con **`PLAN:`**:
  - se crea/actualiza plan en `docs/plans/` (siguiente número correlativo),
  - se vincula desde la idea correspondiente (si aplica).

## Estados recomendados
- `INBOX`
- `TRIAGED`
- `PLANNED`
- `IN_PROGRESS`
- `DONE`
- `ON_HOLD`
- `DROPPED`
