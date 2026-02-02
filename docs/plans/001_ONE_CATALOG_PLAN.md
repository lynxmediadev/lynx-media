# Plan: Unificar a un solo catálogo con filtros (SYNC/BEATS/GAMES) y URLs estables

**Estado:** Pasos 1–5 implementados. QA manual final pendiente de ejecutar en entorno.

Instrucciones: copia y pega cada prompt en orden. Cada paso asume que el anterior ya se completó.

---
## Paso 1 · Estrategia de URLs y canonical
**Prompt a pegar:**
```
Objetivo: Definir la política de URLs/canonical para un solo catálogo con filtros.
Tareas:
- Mantener `/catalog` como página única canónica.
- Decidir si /beats /sync /games serán alias/landings que aplican filtro al cargar, pero con canonical apuntando a `/catalog`.
- Eliminar/redirigir el uso de `?c=` y segmentos /slug/track cuando no sean necesarios.
- Documentar la decisión en AI_CONTEXT y RESUMEN.
 - Ruta canónica de track: /track/[id] (las alias deben redirigir o apuntar su canonical a /track/[id]).
```

---
## Paso 2 · UI de filtros en el catálogo
**Prompt a pegar:**
```
Objetivo: Agregar controles de filtro (SYNC/BEATS/GAMES) en /catalog.
Tareas:
- Añadir toggles/segmented control para categorías (usa tags de tipo CATALOG).
- Aplicar el filtro en server-side (prisma) y en el cliente (estado) para mantener UX rápida.
- Guardar el filtro en querystring `?cat=sync` solo para compartir/refresh; la canonical sigue siendo /catalog.
- Mantener estructura de tabla (colgroup 22/48/10/20), tooltips y acciones actuales.
 - Reutilizar los tags existentes (type=CATALOG); no cambiar modelo ni seed, solo asegurar que BEATS/SYNC/GAMES estén presentes.
```

---
## Paso 3 · Rutas alias opcionales (/sync, /beats, /games)
**Prompt a pegar:**
```
Objetivo: Convertir /sync, /beats, /games en landings ligeras que cargan /catalog con filtro aplicado.
Tareas:
- Renderizar el mismo componente de catálogo pero con `initialFilter` (cat=sync|beats|games).
- Establecer `<link rel="canonical" href="/catalog">` en esas landings.
- Opcional: redirigir 301 /slug/track/[id] a /track/[id] (o mantener alias pero canonical /track/[id]).
 - Quitar generación de enlaces segmentados; todos los links internos deben apuntar a /track/[id].
```

---
## Paso 4 · Limpieza de enlaces y navegación
**Prompt a pegar:**
```
Objetivo: Alinear todos los enlaces internos al nuevo esquema.
Tareas:
- En catálogo y “Piezas similares”, enlazar siempre a `/track/[id]` (sin segmento).
- Ajustar el botón back en track: si viene de ?cat=..., usar ese filtro para volver a /catalog?cat=...; si no, volver a /catalog.
- Quitar el paso intermedio de slug en Copy Link; usar siempre la URL base `/track/[id]`.
 - Asegurar que “Copy link” no incluya query ni slug; sólo /track/[id] con dominio de `NEXT_PUBLIC_SITE_URL`.
```

---
## Paso 5 · Canonical y redirecciones finales
**Prompt a pegar:**
```
Objetivo: Consolidar SEO sin duplicados.
Tareas:
- En `/track/[id]`, canonical fija a /track/[id] (sin depender de cat).
- Añadir redirect 301 desde `/slug/track/[id]` y `?c=` hacia `/track/[id]` (si se decide retirar alias).
- Asegurar `NEXT_PUBLIC_SITE_URL` definido (lynxmedia.cl) en .env de prod; en local, opcional localhost.
- Verificar que /catalog sea la única canonical para el listado (filtros no cambian canonical).
```

---
## Paso 6 · QA y docs
**Prompt a pegar:**
```
Objetivo: Verificar UX y documentar.
Tareas:
- QA: /catalog con filtros, /sync|/beats|/games (si se mantienen), /track/[id], back link, copy link.
- Actualizar RESUMEN.md, AI_CONTEXT.md, CATALOG_SPLIT_PLAN.md (o cerrar el plan anterior), y este ONE_CATALOG_PLAN.md marcando pasos completados.
```

---
## Paso 7 · Admin: tags de catálogo en edición de tracks
**Prompt a pegar:**
```
Objetivo: Asegurar que la asignación de categorías funcione con el catálogo único.
Tareas:
- Mantener el UI de tags type=CATALOG en /admin/track/[id]/edit (checkboxes BEATS/SYNC/GAMES); confirmar que los tags base existen (seed/upsert).
- Validar guardado en TrackTag sin cambios de modelo; solo limpieza de labels/dedupe.
- Añadir nota en admin UI de que estos tags alimentan el filtro del catálogo público.
```


