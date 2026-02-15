# 031 - Ticket system (404 + error + admin list)

## Objetivo
Implementar un flujo de reporte tecnico simple desde paginas 404 y error, con anti-spam y bandeja interna para ADMIN/STAFF usando List Kit.

## Alcance implementado
- [x] Modelo de datos `SupportTicket` en Prisma.
- [x] API publica `POST /api/support-tickets` para crear tickets.
- [x] Barreras anti-spam: honeypot + minimo de tiempo + rate limit por huella (IP/UA).
- [x] Pagina `not-found` custom con CTA subrayado `contactar soporte`.
- [x] Pagina `error` y `global-error` con CTA subrayado `contactar soporte`.
- [x] Popup/modal simple de ticket tecnico (`SupportTicketDialog`).
- [x] Ruta `/admin/tickets` con List Kit (filtros + acciones masivas + tabla).
- [x] Ruta detalle `/admin/tickets/[id]`.
- [x] API admin bulk `POST /api/admin/tickets/bulk` (cambiar estado / eliminar).
- [x] Entrada `Tickets` agregada al dashboard admin/staff.

## Migracion de datos
- [x] Migracion creada y aplicada: `20260214193000_support_tickets`.

## Checklist smoke rapido
- [ ] Abrir URL inexistente y validar render de 404 custom.
- [ ] Desde 404, enviar ticket y validar respuesta de exito.
- [ ] Forzar `error.tsx` (error controlado) y enviar ticket.
- [ ] Validar rate-limit (`rate_limited`) con envios repetidos.
- [ ] Ir a `/admin/tickets` como ADMIN y revisar ticket creado.
- [ ] Ir a `/admin/tickets` como STAFF y revisar acceso.
- [ ] Confirmar que CREATOR no tenga acceso a `/admin/tickets`.
- [ ] Probar bulk action: `set_status` y `delete`.

## Pendientes v2 (no bloqueantes)
- [ ] Notificacion por email/Slack cuando entra ticket nuevo.
- [ ] Adjuntos (captura de pantalla/log) en ticket.
- [ ] SLA y asignacion de owner interno por ticket.
- [ ] Historial de cambios de estado (audit trail) por ticket.
