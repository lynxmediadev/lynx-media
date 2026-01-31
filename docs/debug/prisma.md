ddfer@DESKTOP-8TCFJ8A:~/projects/lynx-media$ npx prisma migrate deploy
Loaded Prisma config from prisma.config.ts.

Prisma config detected, skipping environment variable loading.
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres", schema "public" at "aws-1-sa-east-1.pooler.supabase.com:5432"

19 migrations found in prisma/migrations

Applying migration `20260201090000_add_sort_order`

The following migration(s) have been applied:

migrations/
  └─ 20260201090000_add_sort_order/
    └─ migration.sql
      
All migrations have been successfully applied.