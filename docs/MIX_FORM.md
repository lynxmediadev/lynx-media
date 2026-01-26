# En este archivo crearemos las instrucciones para que Codex pueda construir el formulario de servicios de MIX y MASTERING musical.

## VISIÓN DEL PLAN DE NEGOCIOS
Lo primero es entender la visión del plan de negocios. 
La idea principal es que el servicio de MIX/MASTER Individual dependerá principalmente de la cantidad de tracks que entregará el cliente, permitiendo así tener una opción absurdamente barata, lo que permitirá mayor recaudación de clientes en frío, romper la barrera del primer pago, y fidelización de clientes a futuro. 
Sin embargo, también habrá otro tipo de "add-ons" seleccionables que irán haciendo que el precio suba, pero que el servicio se amplíe de acuerdo a la necesidad del cliente (track outs, manual voice editing, cuantización de baterías, y otros).
En segundo lugar, existirá la opción de solicitar MIX/MASTER de un EP o Álbum, donde se solicitará una reunión para conversar, definir y aclarar el proyecto, y así poder entregar un valor/cotización por el trabajo requerido.

## SOBRE LA IMPLEMENTACIÓN EN EL PROYECTO
Quisiera que este formulario esté bajo la ruta /servicios/mix. Me interesa que sea un componente fácilmente movible, ya que aún no estoy seguro de que esta será su ruta final, o si quisiera más adelante poder integrarlo en una tarjeta (Card) tipo pop-up o algo así, que sea fácil de implementar.


## ESTRUCTURA DE LA PÁGINA DE SERVICIOS
Existirá un formulario para MIX/MASTER, que debe ser separado en pasos.
¿Por qué separarlo en pasos?
Quiero que dependiendo de lo que se elija en el paso 1, muestre un formulario diferente en el paso 2, ¿es esto posible?.
Con eso, podría filtrar las solicitudes dependiendo de si son single track o álbum.

Entonces, desarrollaremos el formulario para ambos casos:

### 1. Primer paso:
El primer paso es elegir entre:
- Single track
- EP / Álbum

### 2. Segundo paso:
La estructura de Single Track es explicada más adelante.
Si el usuario elige "EP / Álbum", entonces quisiera un formulario un poco más simple, donde el usuario indique:
- La cantidad de canciones que tendrá el álbum
- El tiempo estimado que quisieran tenerlo terminado (tal vez sería buena idea poner un tiempo mínimo como 1 mes o 2)
- Estilo del álbum
- Otra información relevante para poder calcular el precio para el proyecto en específico (sin cosas específicas como cantidad de tracks por canción, etc)
La idea principal es que si elige "EP / Álbum", pueda agendar una reunión online (por meet o algo así), para conversar sobre el proyecto directamente con el cliente y llegar a un valor por el total del proyecto en base a sus necesidades.

### 3. Tercer paso:
Datos personales, como nombre, email, y otros necesarios, para tener forma de contactar al cliente.
Botón de enviar.
A futuro me gustaría que pudieran pagar ahí mismo en la página, pero por ahora haremos un botón de enviar y que se guarde la solicitud de servicios en BD.


## ESTRUCTURA FORMULARIO "SINGLE TRACK"

### PLANES, SERVICIOS Y PRECIOS
El valor es en CLP (Pesos chilenos), pero debes agregar la opción de Dólares (USD) y Euros. Necesito un selector que permita cambiar el tipo de moneda, y que el valor del servicio se refleje en la moneda elegida. Esto significa que el factor multiplicador (explicado a continuación), debe tener un valor equivalente en dólares y euros (al valor actual).

Vamos a agregar campos, inputs, selectores, etc, de acuerdo al servicio, y lo haremos de la siguiente forma:

### A. Cantidad de Tracks de la canción
El formulario tendrá un valor inicial/base de CLP$30.000 e irá aumentando de acuerdo a lo que se vaya eligiendo.
Para poder ir haciendo pruebas, debugs e incluso dejar como método de cálculo, vamos a implementar un "factor multiplicador" del valor por cada track (que llamaremos track_price), osea que habrá un precio base (12 tracks) y de ahí en adelante se aplicará un valor por cada track añadido. El formulario debe ser capaz de hacer este cálculo.
- El precio base será de CLP$30.000 por 12 tracks.
- La opción de 12 tracks debe estar seleccionada por defecto y debe ser la opción más baja de cantidad de tracks.
- El track_price inicial será de CLP$1.200.
- No estoy seguro de si quiero que el cliente agregue la cantidad de tracks manualmente a través de un número que él escriba, o si le doy una lista (desplegable) con opciones agregando 4 tracks por opción (12, 16, 20, 24, ..., hasta 100). El problema de la lista es que sería demasiado larga, así que lo haremos con un campo de número donde el cliente pueda agregar la cantidad específica de tracks de su canción. 
- Para evitar errores, haremos que este número pueda ser máximo 72.
- Si el cliente pone 73 en adelante, le debe aparecer un mensaje diciendo que para canciones con más tracks, se agendará una reunión para cotizar el proyecto específico.
- El mensaje de 73+ tracks debes crearlo tú, debe ser claro y concreto, elegante y profesional, y debe ser visible para el cliente y legible.
- En el archivo/componente donde crearás el formulario y pondrás el track price, debes especificar explícitamente dónde está el track price en el código para poder modificarlo a gusto a futuro.

### B. Edición/Cuantización de baterías
Valor: $20.000
Este servicio incluye la batería completa.
Se cuantiza la batería, manteniendo cierto rango de dinámica y naturalidad.
Este servicio es sólo para canciones donde la batería esté demasiado desfasada o desordenada respecto al resto de instrumentos.
Aclarar que arreglar la batería, no arregla los otros instrumentos.

### C. Edición/Afinación manual de la voz 
- Valor: $20.000 por track
- Debe ser un selector que por defecto tenga la opción NO, y que tenga opciones que vayan sumando de uno en uno hasta 10 tracks. Cada track suma $20.000 al valor total.
- Escribir opciones así: 1 Track (+$20.000), 2 Tracks (+$40.000), etc.

### D. ADD-ONS
Los addons serán casillas de "check" que agregan el valor correspondiente al total.
Debes agregar los siguientes add-ons:
- Acapella (valor: $10.000)
- Instrumental ($15.000)
- Backing track for Live (para presentaciones en vivo) ($20.000)


### E. RUSH SERVICE / Entrega rápida
- Valor $35.000
- Entrega en 2 días hábiles (2 business days)


### F. Revisiones ilimitadas 
- Valor $40.000
- Revisiones por defecto = 3.


### G. NOMBRE DE ARTISTA O BANDA
### H. TÍTULO DE LA CANCIÓN


## Otras cosas a considerar
Todos los servicios deben tener un pequeño ícono, al lado del título del servicio, con una pequeña "i" en un cículo (ícono de información: https://lucide.dev/icons/info).
El ícono debe:
- Tener un tooltip con una pequeña información sobre el servicio. No sé si actualmente tenemos un control global sobre el tiempo que demora el tooltip en aparecer (a lo largo de todo el proyecto), si no existe, impleméntalo y dime dónde se implementó para poder modificarlo a gusto. Al implementarlo, mantén el valor actual de ms que tenemos configurado, ya que es un valor que me parece cómodo.
- Debe ser clickeable, y al hacer click, se abre una tarjeta(card) tipo pop-up, donde habrá un video explicativo del servicio/addon y abajo una explicación detallada del servicio. La tarjeta debe poder cerrarse con un botón de cerrar y/o haciendo click fuera de ella. Básicamente debe tener el mismo funcionamiento que las tarjetas que hemos usado en otros lugares del proyecto, como el botón de "Ver licencia" en los botones de ACTION de /catalog.