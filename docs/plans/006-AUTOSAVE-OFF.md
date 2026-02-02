## 06 · Apagar autosave y volver a “Guardar todo”

### Objetivo
Eliminar guardados automáticos (onBlur, drag/drop, debounce) en Derechos & explotación (writers/publishers + master shares) y cualquier otro autosave relacionado, para que todo se persista únicamente con el botón “Guardar todo” del formulario /admin/track/[id]/edit. Mejorar la UX (sin lag ni rebotes) y mantener coherencia de estado hasta el submit.

---
## Pasos

### Paso 1 · Inventario de autosaves
**Prompt a pegar:**
```
Haz un inventario en RightsFormClient de todos los puntos que disparan guardado: onBlur de inputs, dragEnd, add/delete (publish/master), timers debounce. Lista handlers y llamadas a updatePublishingShares/updateMasterShares.
```

### Paso 2 · Desacoplar server actions inmediatas
**Prompt a pegar:**
```
Elimina llamadas directas a updatePublishingShares y updateMasterShares desde RightsFormClient. Quita timers (shareTimer/masterTimer) y estados “Guardando/Pendiente”. Conserva solo estado local (useState) y cálculos de total para UI.
```

### Paso 3 · Mantener estado local y orden
**Prompt a pegar:**
```
Ajusta RightsFormClient para:
- Seguir permitiendo drag & drop (dnd-kit) pero solo actualizando el estado local (sin persistir).
- add/delete/edit de filas actualiza estado local.
- Mantén sortOrder en estado para que se envíe en el submit global (aplicar applyRoleSortOrders/applyMasterOrders al generar el payload final).
```

### Paso 4 · Propagar datos al submit global
**Prompt a pegar:**
```
Asegura que los <input type="hidden"> de publishingShares y masterShares en RightsFormClient se llenen con el estado local actual (JSON string) en cada render, sin side effects. No uses onBlur para guardar.
```

### Paso 5 · Botón “Guardar todo” como único guardado
**Prompt a pegar:**
```
Verifica que update-all (updateTrackAll) ya recibe publishingShares/masterShares del form. No hagas cambios si ya funciona; solo confirma que no quedan otras rutas de guardado parcial. Si hay acciones/menús “Guardar” locales, elimínalos o deshabilítalos.
```

### Paso 6 · Limpieza de UI/estados
**Prompt a pegar:**
```
Quita etiquetas de estado “Pendiente/Guardando/Guardado” ligadas a autosave. Mantén mensajes de validación de suma 100% (oneStop) pero ejecútalos solo en el submit global (o mostrar warning en pantalla sin bloquear la edición).
```

### Paso 7 · QA manual
**Prompt a pegar:**
```
QA rápido:
- Editar porcentajes/nombres, no debería llamar server; no hay flicker.
- Drag & drop reordena en UI; tras “Guardar todo” recargar y el orden persiste.
- Add/delete funciona y persiste solo al guardar.
- One-Stop: si sumas ≠100/100, el submit debe bloquear y mostrar error del server (update-all).
```

### Paso 8 · Documentar
**Prompt a pegar:**
```
Documenta en docs/debug/terminal.md o RESUMEN.md el cambio de flujo: sin autosave, solo guardado global. Añade nota breve en AI_CONTEXT si aplica.
```

### Paso 9 · Commit
**Prompt a pegar:**
```
Haz commit con mensaje alusivo: “Desactivar autosave en derechos; guardar solo con botón principal”.
```

---
## Consideraciones
- Mantén dnd-kit pero solo para reordenar estado local.
- No toques otras secciones (creative, IDs, sync) salvo que tengan autosave (no deberían).
- Validación de sumas 100/100 puede quedarse en update-all; opcional mostrar warning en UI local sin llamar al server.
