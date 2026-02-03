PARA /admin/track/[id]/edit

Quiero implementar en Moods un sistema de ingreso de TAGS, para luego poder filtrar tracks por mood.
El problema de un input de texto libre es que puedes poner cualquier cosa, o escribir mal el nombre de un mood, o problemas de ese tipo que impiden tener un sistema consistente y filtrable a futuro.
¿Qué opciones me propones para solucionar esto?
Dame un máximo de 5 opciones.

Opciones:
1) Dropdown de catálogo controlado (single/multi): lista cerrada de moods predefinidos, con búsqueda typeahead y selección múltiple; solo se pueden elegir ítems existentes.
2) Chips con autocompletar + alta guiada: autocompletar desde catálogo; si no existe, botón “proponer nuevo mood” que abre modal con validación y revisa duplicados antes de crear.
3) Jerarquía / grupos (mood → submood): selector en dos niveles (categoría y variante). Reduce ambigüedad y mejora filtros por familia.
4) Etiquetado rápido por presets: botones preconfigurados (Happy, Dark, Epic, etc.) con posibilidad de activar varios; evita escritura manual.
5) Restricción por vocabulario controlado + sugerencias similares: al teclear, si no coincide con catálogo, se muestran sugerencias cercanas y se bloquea el guardado hasta elegir una opción válida o crearla vía flujo aprobado.



Plan para Opción 2 (chips + autocompletar + alta guiada)

Objetivo: permitir elegir moods existentes como chips con autocompletar y crear nuevos moods solo mediante un flujo guiado que evite duplicados/errores.

Pasos (prompts copiable/pegable):

Paso 1 · Modelo/datos
[x] Agrega tabla/colección `Mood` (id, name UNIQUE, slug UNIQUE, category opcional, createdAt/updatedAt). Si ya existe, documenta campos y constraints de unicidad (case-insensitive).
[x] Crea seed breve de moods base (Happy, Dark, Epic, Chill, Dramatic, Romantic, Aggressive, Uplifting, Tension, Minimal).

Paso 2 · API catálogo
[x] Endpoint GET `/api/moods?query=...` con búsqueda por substring case-insensitive, límite 20, orden alfabético.
[x] Endpoint POST `/api/moods` para alta guiada: valida longitud, normaliza slug, rechaza duplicados cercanos (usar comparación case-insensitive y maybe distance <=1 para evitar “Happi”). Devuelve 409 con sugerencias si ya existe uno parecido.

Paso 3 · UI chips en `/admin/track/[id]/edit`
[x] Sustituye input libre de moods por componente `MoodChips`: input con autocompletar (debounce 200ms) que muestra sugerencias; Enter/Click añade chip; Backspace elimina último.
[x] Al no encontrar resultados, mostrar CTA “Proponer nuevo mood” que abre modal.

Paso 4 · Modal “Proponer mood”
[x] Form: nombre (required), categoría (select opcional), checkbox “crear y asignar a este track”.
[x] Al enviar: POST `/api/moods`; si 409, muestra lista de sugerencias y botón “usar este existente”.
[x] Si creación ok y checkbox marcado, añade el nuevo mood como chip al track.

Paso 5 · Persistencia en track
[x] Guarda array de mood IDs en el track (tabla pivote `TrackMood` o campo json según schema actual).
[x] Validación: un track no debe tener duplicados; máximo 10 moods por track.

Paso 6 · QA rápido
[ ] Autocompletar lista solo opciones existentes; añadir/eliminar chips funciona.
[ ] Crear nuevo mood con nombre similar a existente debe advertir y ofrecer reutilizar.
[ ] Crear mood y asignar en el mismo flujo funciona; no se agregan duplicados.
[ ] Guardar track persiste selección; recarga muestra chips correctos.
