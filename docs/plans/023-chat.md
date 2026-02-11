# 023 · Chat interno (plan de implementación)

## Prompt maestro para ejecución futura (usar al iniciar implementación)

```txt
Implementa este plan de chat en orden, sin saltar pasos.
Reglas:
1) Completa 1 paso principal a la vez.
2) Marca [x] cada subtarea terminada.
3) No cambies alcance sin documentar tradeoff.
4) Si aparece bloqueo técnico, documenta causa y workaround en este archivo.
5) Prioriza MVP interno funcional y luego hardening.
6) Antes de cada paso, indica archivos a tocar y criterio de éxito.
```

---

## Objetivo

- Crear un chat interno funcional, testeable en entorno local (`npm run dev`), sin despliegue a producción.
- Dejar base mantenible y escalable para evolucionar a un chat de producción.
- Integrar con arquitectura actual (Next.js + Prisma + Postgres) minimizando deuda técnica.

## Decisiones base (propuestas)

- Alcance inicial: chat 1:1 + salas internas simples.
- Transporte realtime: WebSocket (recomendado) o fallback polling corto para MVP.
- Persistencia: Postgres (Prisma).
- Auth: usar sesión/login actual de admin para identidad real (`userId`), evitar “guest” en versión seria.
- Estado de lectura: por conversación (último mensaje leído por usuario).

## Fuera de alcance (v1)

- Adjuntos binarios pesados (audio/video/documentos).
- Mensajes editables/eliminables con historial completo.
- Push notifications móviles.
- E2E encryption.

---

## Arquitectura sugerida (v1)

### Backend
- API para:
  - crear/listar conversaciones
  - enviar/listar mensajes
  - marcar leído
- Canal realtime para eventos:
  - `message:new`
  - `conversation:read`
  - `presence:update` (opcional v1.1)

### Datos (Prisma)
- `User` (si ya existe, reutilizar; si no, mapear admin básico).
- `Conversation`
- `ConversationParticipant`
- `Message`
- `ReadReceipt` (o `lastReadMessageId` en participant)

### Frontend
- Layout de chat:
  - sidebar de conversaciones
  - panel principal de mensajes
  - composer (input + enviar)
- Estados:
  - loading
  - empty state
  - error state
  - reconexión realtime

---

## Plan detallado (paso a paso)

### Paso 0 · Descubrimiento y baseline técnico
- [ ] Inventariar cómo está hoy auth/session en `/admin`.
- [ ] Identificar si ya existe modelo `User` reutilizable.
- [ ] Confirmar limitaciones de entorno local (puerto, CORS, red local).
- [ ] Definir estrategia realtime final para v1 (WS o polling).
- [ ] Dejar no-regresión inicial en este plan.

Criterio de éxito:
- Quedan documentadas decisiones técnicas bloqueantes antes de escribir código.

---

### Paso 1 · Modelo de datos y migración
- [ ] Definir esquema Prisma para:
  - [ ] `Conversation`
  - [ ] `ConversationParticipant`
  - [ ] `Message`
  - [ ] `ReadState` (o campo equivalente)
- [ ] Crear índices clave:
  - [ ] por `conversationId + createdAt` en mensajes
  - [ ] por `participant userId`
- [ ] Migración con rollback seguro.
- [ ] Seed mínimo de conversaciones para pruebas.

Criterio de éxito:
- `prisma migrate` OK + datos semilla consultables.

---

### Paso 2 · Contratos API
- [ ] Definir DTOs Zod para requests/responses.
- [ ] Endpoints:
  - [ ] `GET /api/chat/conversations`
  - [ ] `POST /api/chat/conversations`
  - [ ] `GET /api/chat/conversations/:id/messages?cursor=...`
  - [ ] `POST /api/chat/conversations/:id/messages`
  - [ ] `POST /api/chat/conversations/:id/read`
- [ ] Validación auth por endpoint.
- [ ] Manejo de errores homogéneo (400/401/403/404/409/500).

Criterio de éxito:
- API contract estable y tipado extremo a extremo.

---

### Paso 3 · Realtime
- [ ] Implementar canal realtime (WS recomendado).
- [ ] Broadcast de eventos por conversación.
- [ ] Suscripción por usuario autenticado.
- [ ] Heartbeat/reconnect básico.
- [ ] Fallback polling (si WS falla en dev).

Criterio de éxito:
- En dos sesiones del navegador, mensaje aparece sin recargar.

---

### Paso 4 · UI base de chat
- [ ] Crear módulo UI reusable:
  - [ ] `ChatShell`
  - [ ] `ConversationList`
  - [ ] `MessageList`
  - [ ] `MessageComposer`
  - [ ] `ReadIndicator`
- [ ] Diseñar desktop + mobile desde inicio.
- [ ] Empty states y skeletons.
- [ ] Scroll inteligente al último mensaje.

Criterio de éxito:
- Navegación fluida entre conversaciones y envío estable.

---

### Paso 5 · Integración auth y permisos
- [ ] Vincular identidad de sesión con `userId`.
- [ ] Evitar acceso a conversaciones sin participación.
- [ ] Validar ownership en `POST message` y `mark read`.
- [ ] Auditoría básica de intentos denegados.

Criterio de éxito:
- No se puede leer/escribir fuera de conversaciones permitidas.

---

### Paso 6 · UX y confiabilidad
- [ ] Optimistic UI para envío.
- [ ] Confirmación de entrega (`sending/sent/failed`).
- [ ] Reintento manual en fallo.
- [ ] Manejo de duplicados por `clientMessageId`.
- [ ] Estado “escribiendo…” opcional (v1.1).

Criterio de éxito:
- UX consistente incluso con latencia/errores intermitentes.

---

### Paso 7 · QA funcional
- [ ] Pruebas manuales:
  - [ ] crear conversación
  - [ ] enviar/recibir realtime en 2 sesiones
  - [ ] marcar leído
  - [ ] reconectar tras perder conexión
  - [ ] permisos cruzados
- [ ] Smoke mobile/desktop.
- [ ] Registrar logs relevantes en `docs/debug/terminal.md`.

Criterio de éxito:
- Flujo completo sin bloqueos críticos en entorno local.

---

### Paso 8 · Hardening mínimo antes de “usable interno”
- [ ] Rate limit por usuario en envío de mensajes.
- [ ] Sanitización y límites de payload (longitud, caracteres).
- [ ] Observabilidad básica (errores y latencia por endpoint).
- [ ] Estrategia de cleanup de mensajes de prueba.

Criterio de éxito:
- Chat usable internamente con riesgo controlado.

---

### Paso 9 · Documentación y handoff
- [ ] Actualizar `docs/PROJECT_GENERAL_CONTEXT.md` con:
  - [ ] componentes chat reutilizables
  - [ ] rutas API chat
  - [ ] decisiones arquitectónicas
- [ ] Crear guía de operación local (arranque + prueba 2 sesiones).
- [ ] Listar backlog v2 con prioridades.

Criterio de éxito:
- Cualquier dev puede levantar, probar y extender el chat sin contexto oral.

---

## Backlog v2 (no implementar aún)

- [ ] Adjuntos (S3/R2) con pre-signed upload.
- [ ] Búsqueda full-text en mensajes.
- [ ] Threads/respuestas por mensaje.
- [ ] Editar/eliminar con historial.
- [ ] Notificaciones push/email.
- [ ] Roles avanzados y moderación.
- [ ] Analítica de uso (conversaciones activas, tiempo de respuesta).

---

## Estimación (orientativa)

- MVP interno funcional: 5 a 8 días.
- Hardening mínimo: +2 a 4 días.
- Versión producción base: 2 a 4 semanas total.

## Estado

- [x] Plan creado.
- [ ] Implementación iniciada.
