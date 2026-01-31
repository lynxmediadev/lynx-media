# Plan: Mejora de asignación de tags en admin (UX 3 columnas en desktop / 1 columna en mobile)

Instrucciones: copia y pega cada prompt en orden. Cada paso asume que el anterior ya se completó.

---
## Paso 1 · Diseño de columnas y layout responsive
**Prompt a pegar:**
```
Objetivo: Rediseñar la sección de tags en /admin/track/[id]/edit a 3 columnas en desktop.
Tareas:
- Columnas (desktop ≥ md): 1) Tags asignados, 2) Tags disponibles (no asignados), 3) Agregar nuevo.
- En mobile: stack de 3 bloques (una columna cada uno).
- Mantener copy contextual: “Estas categorías alimentan el filtro público de /catalog”.
```

---
## Paso 2 · Interacción: mover tags entre listas
**Prompt a pegar:**
```
Objetivo: Permitir mover tags haciendo click (toggle) entre Asignados y Disponibles.
Tareas:
- Al hacer click en un tag de Disponibles → pasa a Asignados; click en Asignados → vuelve a Disponibles.
- Etiquetas visuales (pill/badge) con estados hover/focus y aria-pressed.
- Mantener lista ordenada por nombre o slug.
```

---
## Paso 3 · Persistencia sin depender de “Guardar todo”
**Prompt a pegar:**
```
Objetivo: Guardar asignación/desasignación sin esperar el botón “Guardar todo”.
Tareas:
- Añadir server action dedicada (updateTrackCatalogTags) que reciba trackId + slugs seleccionados.
- Al togglear, mandar request (debounce/optimistic UI) y mostrar feedback “Guardado / Error”.
- Revalidar la página de edición tras éxito para mantener coherencia.
```

---
## Paso 4 · Crear/eliminar tags desde la misma vista
**Prompt a pegar:**
```
Objetivo: Integrar alta/baja en el layout de 3 columnas.
Tareas:
- Columna 3: input + botón “Agregar” (slugify en server); mostrar éxito/error.
- Eliminar por slug con confirmación (campo + botón) en esa misma columna.
- Tras alta/baja, refrescar las listas sin recargar la página (optimistic).
```

---
## Paso 5 · Accesibilidad y detalles visuales
**Prompt a pegar:**
```
Objetivo: Asegurar accesibilidad y consistencia.
Tareas:
- Roles/aria para listas (list) y items (button con aria-pressed).
- Focus ring consistente con tokens; contraste en hover/active.
- Tooltips opcionales para aclarar “Click para asignar/quitar”.
```

---
## Paso 6 · QA y docs
**Prompt a pegar:**
```
Objetivo: Verificar y documentar.
Tareas:
- QA desktop/mobile: toggles, alta/baja, feedback de guardado, estados vacíos.
- Actualizar RESUMEN.md y AI_CONTEXT.md con el nuevo flujo de tags.
```
