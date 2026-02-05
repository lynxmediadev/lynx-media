# 019 · Modules Fix · Log de acciones

## 2026-02-05
- A2 BD check: CATALOG=15, GENERIC=2, TrackTag=3, slugs duplicados=[] (consulta Prisma).
- A3 No se ejecutaron resets/seed adicionales; sólo lectura de estado.
- Paridad chips: se migró Moods/Usos/Categorías a TagModule + TagChips; Moods con botón Guardar. Usos/Categorías con save manual.
- Categorías: normalización a MAYÚSCULAS, slugify consistente, rehidratado inicial desde GET `/api/tracks/:id/categories` y refresco con payload de POST para reducir lag.
- Ajuste 17: se salta rehidratado inicial si viene `initialCategories` (SSR) para eliminar parpadeo y mostrar asignados de inmediato.
