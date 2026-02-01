TODO EL PROYECTO:
## MOBILE

### Ancho de contenido
Quiero que en mobile, el ancho del contenido sea casi completo, tal vez un 95% o algo parecido (lo que sea más sencillo de modificar). Por ejemplo /admin/requests está usando un buen ancho en mobile, replica ese ancho para todo el proyecto donde no esté aplicado.
De todas formas te indicaré a continuación las rutas en las que no se cumple el ancho deseado para que no tengas que buscarlo.
- /admin/track/id/edit
- 
- 
- 
- 
- 
- 
- 
- 
- 

___________________________________


/admin/track/id/edit

## DESKTOP
Los elementos de las listas de WRITER, PUBLISHER Y MASTER no están usando todo el ancho del contenedor.

## MOBILE

### Sección "Audio & Análisis Técnico":
- Quiero que el botón de play y el timer estén en la misma fila
- Quiero que el waveform ocupe una segunda fila completa, abajo del botón de play y el timer

### El "menú sticky" con el botón de "Guardar todo"
Al bajar, el botón de Guardar todo no queda sobre la pantalla, no baja, lo que obliga a volver a subir para guardar cambios.
Observando bien, si baja, pero queda debajo del menú principal de la página.

### Listas de WRITER, PUBLISHER Y MASTER
A. En las 3 listas, de elementos ya agregados, la lista tiene "scrolleo horizontal", osea que aparece un scroller abajo y uno se puede mover hacia el lado, pero no quiero que sea así, se supone que estamos en formato vertical y eso es incómodo, yo lo haría de la siguiente forma:
- Dejar sólo 3 columnas:
-- El ícono del drag and drop, para poder mover de lugar el elemento
-- Nombre
-- ACCIONES. Agregar un botón de "Abrir titular", pero que no sea con texto, si no que sea un ícono (https://lucide.dev/icons/eye). Al hacer click en este ícono, se abre una tarjeta con todos los datos del titular/share editables de la lista, ocupando todos los inputs el espacio horizontal completo y una sola propiedad por línea (uno sobre el otro). Este botón de "Abrir titular" sólo debe mostrarse en versión Mobile, no en DESKTOP.

(Con el ajuste general de ocupar mayor espacio horizontal de pantalla, esto debería verse bien)

B. Otro ajuste que quiero hacer, tanto en las listas como en los formularios para agregar titulares, es que los inputs usen todo el espacio horizontal, para que no se vean unos más anchos que otros.

## DESKTOP Y MOBILE
Otra cosa que quisiera en /admin/track/id/edit, es que el botón de Guardar todo quede sticky, pero en la parte inferior de la página, no en la parte superior.



___________________________________

/admin/

## DESKTOP


## MOBILE


___________________________________

/admin/

## DESKTOP


## MOBILE


___________________________________