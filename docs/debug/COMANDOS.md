# COMANDOS ÚTILES (rights)

- **Truncar shares (reset global)**  
  ```bash
  printf 'TRUNCATE "PublishingShare", "MasterShare" RESTART IDENTITY;' \
  | npx prisma db execute --stdin --schema prisma/schema.prisma
  ```
  Qué hace: vacía todas las filas de `PublishingShare` y `MasterShare` y reinicia los IDs.  
  Impacto: se borran todos los writers/publishers/master de todos los tracks; hay que reingresar shares luego en `/admin/track/[id]/edit`. Úsalo solo cuando quieras un slate limpio.
