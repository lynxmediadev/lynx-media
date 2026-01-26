# Plan para implementar /servicios/mix (MIX/MASTER)

Instrucciones: copia y pega cada prompt en orden. Cada paso asume que los anteriores ya se completaron. Ajusta rutas/archivos si cambia la estructura.

---
## Paso 1 · Esqueleto de página y estado global
**Prompt a pegar:**
```
Objetivo: Crear la ruta /servicios/mix con un layout base y estado cliente para multistep (Single Track vs EP/Álbum).
Tareas:
- Crear página en /servicios/mix (App Router) con Server Component que solo pasa props iniciales (sin lógica de precios aún).
- Añadir Client Component para el formulario multistep con estado local (React o Zustand simple) que soporte: step actual, tipo de proyecto (single/album), moneda seleccionada, datos básicos del usuario, datos de pricing (placeholder).
- Mantener tokens: bg-background/text-foreground/bg-card/border, radios 2px, tooltips shadcn (delay 200ms).
- Añadir hero/intro breve con copy de servicio MIX/MASTER y CTA “Comenzar”.
No implementar lógica de precios ni validaciones todavía; solo estructura y navegación de pasos (1: tipo de proyecto, 2: formulario condicional, 3: datos personales).
```

---
## Paso 2 · Lógica de pricing Single Track (tracks + moneda + add-ons)
**Prompt a pegar:**
```
Objetivo: Implementar cálculo de precio para Single Track según MIX_FORM.md.
Tareas:
- En el client component, agregar estado de pricing con constantes explícitas: base_price=30000 CLP para 12 tracks, track_price=1200 CLP/track extra; máximo tracks=72. Documenta en código dónde editar base/track_price.
- Input numérico para tracks (default 12, min 12, max 72). Si >72, mostrar mensaje: “Para canciones con 73+ tracks, agenda una reunión para cotizar tu proyecto específico” y deshabilitar cálculo adicional.
- Selector de moneda (CLP/USD/EUR) con factores configurables en un objeto (ej. currencyFactors). Reflect en el total.
- Add-ons:
  - Batería cuantización: +20000 (toggle).
  - Voz manual: selector 0–10 tracks, cada track +20000; label “n Track(s) (+$X)”.
  - Checkboxes: Acapella (+10000), Instrumental (+15000), Backing track live (+20000).
  - Rush service: +35000 (2 business days).
  - Revisiones ilimitadas: +40000 (default 3 revisiones).
- Mostrar breakdown y total actualizado en tiempo real. Mantener copy sobrio y estilo 2px radios, bg-card/border.
Sin enviar datos aún.
```

---
## Paso 3 · Flujo EP/Álbum y bifurcación de pasos
**Prompt a pegar:**
```
Objetivo: Completar el flujo para EP/Álbum (paso 2 condicional).
Tareas:
- Si el usuario elige EP/Álbum en el paso 1, mostrar formulario simple:
  - Nº canciones (num, min 1).
  - Plazo deseado (selector con mínimo 1–2 meses).
  - Estilo del álbum (texto/selector).
  - Notas libres relevantes.
- En vez de cálculo automático, mostrar CTA “Agendar reunión / Solicitar cotización” y marcar el tipo de proyecto como album.
- Mantener la navegación de pasos coherente (1: tipo, 2: formulario condicional, 3: datos personales).
```

---
## Paso 4 · Datos personales y preparación de envío
**Prompt a pegar:**
```
Objetivo: Añadir paso de datos personales y preparar payload.
Tareas:
- Campos requeridos: nombre, email; opcionales: compañía, notas, teléfono.
- Validar email y requeridos en cliente (zod o lógica simple).
- Preparar payload para enviar al backend: tipo de proyecto, moneda, breakdown de precios (single) o bandera de álbum con datos de álbum, add-ons seleccionados, datos personales, URL de página.
- Añadir botón de enviar (sin implementar API todavía) y estado de loading.
```

---
## Paso 5 · Tooltips y popups con video (info icons)
**Prompt a pegar:**
```
Objetivo: Implementar íconos de información (lucide info) con tooltip y tarjeta modal con video + descripción.
Tareas:
- Añadir ícono “i” en círculo junto a cada servicio/add-on. Tooltip con delay global 200ms (usar provider existente; si no, config central).
- Al hacer click en el ícono, abrir modal/card con embed de video (src dummy) y texto descriptivo; cierre con botón y click fuera.
- Reusar estilo de modales existentes (ej. licensing/acciones). Mantener radios 2px, bg-card/border.
```

---
## Paso 6 · API y persistencia de solicitudes
**Prompt a pegar:**
```
Objetivo: Guardar la solicitud en backend.
Tareas:
- Crear endpoint (ej. /api/services/mix) que reciba el payload del paso 4, valide con zod y cree registro en BD (nuevo modelo ServicesRequest o similar; si prefieres, reaprovecha LicensingRequest extendiéndolo con campos de mix).
- Manejar tipos: single vs album; incluir breakdown de precio, moneda, add-ons, datos personales, URL, notas.
- Responder con éxito/errores y mostrar toasts/estados en cliente.
- Añadir guardas anti-spam mínimos (throttle básico o captcha placeholder).
```

---
## Paso 7 · UX final y QA
**Prompt a pegar:**
```
Objetivo: Pulir experiencia y validar flujos.
Tareas:
- Ajustar layout responsive: pasos visibles en mobile, totales accesibles; mantener tokens bg-background/bg-card/border, radios 2px.
- Revisar mensajes (tracks >72, selección de monedas, CTAs de álbum).
- QA manual: tracks=12 base; tracks=20; tracks=72 y 73; voz 0/5/10; add-ons toggles; rush; revisiones; cambio de moneda; flujo álbum; tooltips y modales; envío con payload.
- Preparar lista de pendientes para pago futuro (placeholder) sin romper UI.
```
