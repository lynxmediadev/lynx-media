# Plan para dividir el catálogo (beats vs sync) y escalar filtros

**Estado**: Pasos 1–8 implementados (modelos/tagging, UI admin, vistas /beats /sync /games, loader embebible, rutas segmentadas y canonical). QA continuo.

Instrucciones: copia y pega cada prompt en orden. Cada paso asume que el anterior ya se completó.

---
## Paso 1 · Definir modelo de catálogo y tags
**Prompt a pegar:**
```
Objetivo: Definir la forma escalable de filtrar catálogos (beats/sync) sin depender de query params.
Tareas:
- Proponer el modelo elegido: 
  Opción recomendada: tabla Catalog (id, slug, name, description, filterJson) + Tag (id, slug, name, type) + TrackTag (trackId, tagId).
- Confirmar si usaremos tags dedicados para catálogo (type="catalog") y evitar mezclar con moods/uses.
- Definir slugs iniciales: "beats" y "sync".
- Acordar política: tracks sin tag de catálogo no aparecen en ningún catálogo.
- Confirmar que un track puede estar en múltiples catálogos (sí).
- Decidir si mantenemos /catalog como alias general (opcional, puede ser un wrapper que liste todo o un redirect).
```

---
## Paso 2 · Prisma schema + migración
**Prompt a pegar:**
```
Objetivo: Crear el schema y migración para catálogos y tags.
Tareas:
- Agregar modelos Catalog, Tag, TrackTag (many-to-many) en Prisma.
- Añadir índices útiles (tagId, trackId, catalog slug).
- Crear migración y correr `npx prisma generate`.
- Sembrar tags base: BEAT y SYNC (si se usa seed).
- Dejar preparado que un track pueda tener múltiples tags de tipo catálogo.
```

---
## Paso 3 · UI Admin para etiquetar tracks
**Prompt a pegar:**
```
Objetivo: Permitir asignar tags de catálogo a tracks.
Tareas:
- En /admin/track/[id]/edit agregar selector de tags (multi-select o checkboxes) con tags type=catalog.
- Guardar en TrackTag al guardar track.
- Mostrar claramente qué catálogo(s) tendrá el track.
- Opción: conservar /catalog como vista “all” (o alias) usando los nuevos filtros; discutir si es alias o redirect.
```

---
## Paso 4 · Componente Catalog reutilizable con filtros
**Prompt a pegar:**
```
Objetivo: Hacer el catálogo reusable y filtrable por prop.
Tareas:
- Extraer el catálogo actual a un componente reutilizable (CatalogGrid/ CatalogTable).
- Recibir prop `filter` o `catalogSlug` y construir query server-side.
- Si `catalogSlug=beats`, filtrar por tag BEAT; si `catalogSlug=sync`, por tag SYNC.
- No usar query params para lógica principal (solo para UI interna si aplica).
```

---
## Paso 5 · Rutas públicas /beats y /sync
**Prompt a pegar:**
```
Objetivo: Crear páginas públicas con catálogos separados.
Tareas:
- /beats => catálogo filtrado BEAT.
- /sync => catálogo filtrado SYNC.
- Ajustar header/nav si corresponde (sin romper /catalog actual).
```

---
## Paso 6 · Escalabilidad: catálogos embebibles
**Prompt a pegar:**
```
Objetivo: Dejar listo el sistema para catálogos embebidos por criterio.
Tareas:
- Agregar endpoint o loader que acepte filtros (ej. tags, moods, artist) desde un objeto JSON.
- Permitir renderizar catálogo en cualquier sección vía prop (sin query string).
```

---
## Paso 7 · QA y consistencia
**Prompt a pegar:**
```
Objetivo: Validar que el split funciona sin regressions.
Tareas:
- Crear 2-3 tracks con tags BEAT y SYNC.
- Verificar que /beats y /sync muestren solo los correspondientes.
- Verificar que tracks sin tag no aparecen en ningún catálogo.
- Revisar tooltips, waveform y acciones del catálogo se mantengan iguales.
```

---
## Paso 8 · Nuevo catálogo “GAMES” (videojuegos)
**Prompt a pegar:**
```
Objetivo: Crear un catálogo para música de videojuegos.
Tareas:
- Añadir tag de catálogo GAMES (slug "games", name "GAMES", type CATALOG) en seed y upsert en admin edit para que siempre exista.
- Asignar GAMES a los tracks relevantes en /admin/track/[id]/edit.
- Crear ruta pública /games usando CatalogView con catalogSlug="games".
- Verificar que /games liste solo los tracks con GAMES; los demás catálogos no se vean afectados.
```
