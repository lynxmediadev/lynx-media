# Watermark de audio (pendiente)

## Objetivo
Implementar un sistema de watermark para los previews públicos de los tracks, con el fin de proteger el master, reducir riesgos de uso no autorizado y mantener una experiencia de escucha aceptable para evaluación.

## Opcion recomendada (Opcion 1: preview pre-renderizado)
Generar una version "preview" con watermark y servir solo esa version en el sitio publico.

Ventajas:
- Mejor rendimiento y menor carga en runtime.
- No expone el master.
- Resultado consistente y control total del watermark.

Desventajas:
- Requiere pipeline de procesamiento y almacenamiento extra.
- Se debe regenerar si cambia el watermark.

Implementacion (idea):
- Usar FFmpeg para mezclar el track con un watermark (voz/logo/tono).
- Guardar el archivo resultante como asset separado (previewUrl).
- En frontend publico, reproducir previewUrl y nunca el master.

## Otras opciones

### Opcion 2: watermark dinamico en servidor (on-the-fly)
Mezclar en tiempo real cuando se solicita el audio.

Ventajas:
- No duplicas archivos.
- Posibilidad de watermark personalizado por usuario/sesion.

Desventajas:
- Mayor costo de CPU y latencia.
- Requiere infraestructura de streaming/colas.

### Opcion 3: watermark en cliente (Web Audio API)
Mezclar watermark y audio en el navegador.

Ventajas:
- Rapida de prototipar.
- Menos infraestructura.

Desventajas:
- Menor control y seguridad.
- UX peor en dispositivos limitados.
- El master puede quedar expuesto si no hay control estricto.

## Tipos de watermark a considerar
- Voz ("audio tag") intermitente cada X segundos.
- Sonic logo o breve jingle.
- Tono sutil o ruido de baja amplitud (menos recomendable).
- Watermark personalizado por cliente (si se usa Opcion 2).

## Proteccion de masters (pendiente)
Separar claramente:
- Master (solo accesible por admin o licenciatarios).
- Preview con watermark (publico).

Para el master:
- Usar URLs firmadas (signed URLs) con expiracion corta.
- Evitar URLs publicas permanentes.
- Controlar descargas y registrar accesos.
