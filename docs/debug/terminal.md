ddfer@DESKTOP-8TCFJ8A:~/projects/lynx-media$ rm -rf .next
ddfer@DESKTOP-8TCFJ8A:~/projects/lynx-media$ npm run dev -- --hostname 0.0.0.0 --port 3000

> lynx-media@0.1.0 dev
> next dev --hostname 0.0.0.0 --port 3000

   ▲ Next.js 15.5.9
   - Local:        http://localhost:3000
   - Network:      http://0.0.0.0:3000
   - Environments: .env.local, .env

 ✓ Starting...
 ✓ Ready in 1484ms
 ✓ Compiled /middleware in 461ms (114 modules)
 ○ Compiling /admin/track/[id]/edit ...
 ✓ Compiled /admin/track/[id]/edit in 5s (1115 modules)
prisma:query SELECT "public"."Track"."id", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."bpm", "public"."Track"."key", "public"."Track"."trackType"::text, "public"."Track"."genres", "public"."Track"."subgenres", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."assetKey", "public"."Track"."assetMime", "public"."Track"."assetSize", "public"."Track"."durationSec", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."analysisAt", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."master", "public"."Track"."licenseType", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."oneStop", "public"."Track"."clearedForSync", "public"."Track"."exclusiveTerritories", "public"."Track"."exclusiveTermMonths", "public"."Track"."restrictedTerritories", "public"."Track"."restrictedIndustries", "public"."Track"."restrictedPlatforms", "public"."Track"."restrictedBrands", "public"."Track"."pricingTier"::text, "public"."Track"."budgetMin", "public"."Track"."budgetMax", "public"."Track"."budgetCurrency"::text, "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."restrictions" FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."PublishingShare"."id", "public"."PublishingShare"."role"::text, "public"."PublishingShare"."name", "public"."PublishingShare"."ipiNumber", "public"."PublishingShare"."pro", "public"."PublishingShare"."caeNumber", "public"."PublishingShare"."sharePct", "public"."PublishingShare"."sortOrder", "public"."PublishingShare"."trackId" FROM "public"."PublishingShare" WHERE "public"."PublishingShare"."trackId" IN ($1) ORDER BY "public"."PublishingShare"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."MasterShare"."id", "public"."MasterShare"."name", "public"."MasterShare"."sharePct", "public"."MasterShare"."contact", "public"."MasterShare"."notes", "public"."MasterShare"."sortOrder", "public"."MasterShare"."trackId" FROM "public"."MasterShare" WHERE "public"."MasterShare"."trackId" IN ($1) ORDER BY "public"."MasterShare"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."TrackVersion"."id", "public"."TrackVersion"."label", "public"."TrackVersion"."durationSec", "public"."TrackVersion"."kind"::text, "public"."TrackVersion"."sortOrder", "public"."TrackVersion"."trackId" FROM "public"."TrackVersion" WHERE "public"."TrackVersion"."trackId" IN ($1) ORDER BY "public"."TrackVersion"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."TrackStem"."id", "public"."TrackStem"."name", "public"."TrackStem"."group"::text, "public"."TrackStem"."durationSec", "public"."TrackStem"."sortOrder", "public"."TrackStem"."trackId" FROM "public"."TrackStem" WHERE "public"."TrackStem"."trackId" IN ($1) ORDER BY "public"."TrackStem"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."TrackTag"."trackId", "public"."TrackTag"."tagId", "public"."TrackTag"."assignedAt" FROM "public"."TrackTag" WHERE "public"."TrackTag"."trackId" IN ($1) ORDER BY "public"."TrackTag"."assignedAt" ASC OFFSET $2
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."slug", "public"."Tag"."name", "public"."Tag"."type"::text FROM "public"."Tag" WHERE "public"."Tag"."id" IN ($1,$2,$3,$4,$5) OFFSET $6
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."slug", "public"."Tag"."name" FROM "public"."Tag" WHERE "public"."Tag"."type" = CAST($1::text AS "public"."TagType") ORDER BY "public"."Tag"."name" ASC OFFSET $2
 GET /admin/track/cmkx1ed3f000duq9glemziy2b/edit 200 in 8166ms
 ○ Compiling /api/tracks/[id]/categories ...
 ✓ Compiled /api/tracks/[id]/categories in 536ms (1091 modules)
prisma:query SELECT "public"."Track"."id", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."bpm", "public"."Track"."key", "public"."Track"."trackType"::text, "public"."Track"."genres", "public"."Track"."subgenres", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."assetKey", "public"."Track"."assetMime", "public"."Track"."assetSize", "public"."Track"."durationSec", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."analysisAt", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."master", "public"."Track"."licenseType", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."oneStop", "public"."Track"."clearedForSync", "public"."Track"."exclusiveTerritories", "public"."Track"."exclusiveTermMonths", "public"."Track"."restrictedTerritories", "public"."Track"."restrictedIndustries", "public"."Track"."restrictedPlatforms", "public"."Track"."restrictedBrands", "public"."Track"."pricingTier"::text, "public"."Track"."budgetMin", "public"."Track"."budgetMax", "public"."Track"."budgetCurrency"::text, "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."restrictions" FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."PublishingShare"."id", "public"."PublishingShare"."role"::text, "public"."PublishingShare"."name", "public"."PublishingShare"."ipiNumber", "public"."PublishingShare"."pro", "public"."PublishingShare"."caeNumber", "public"."PublishingShare"."sharePct", "public"."PublishingShare"."sortOrder", "public"."PublishingShare"."trackId" FROM "public"."PublishingShare" WHERE "public"."PublishingShare"."trackId" IN ($1) ORDER BY "public"."PublishingShare"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."MasterShare"."id", "public"."MasterShare"."name", "public"."MasterShare"."sharePct", "public"."MasterShare"."contact", "public"."MasterShare"."notes", "public"."MasterShare"."sortOrder", "public"."MasterShare"."trackId" FROM "public"."MasterShare" WHERE "public"."MasterShare"."trackId" IN ($1) ORDER BY "public"."MasterShare"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."TrackVersion"."id", "public"."TrackVersion"."label", "public"."TrackVersion"."durationSec", "public"."TrackVersion"."kind"::text, "public"."TrackVersion"."sortOrder", "public"."TrackVersion"."trackId" FROM "public"."TrackVersion" WHERE "public"."TrackVersion"."trackId" IN ($1) ORDER BY "public"."TrackVersion"."sortOrder" ASC OFFSET $2
[POST /api/tracks/:id/categories] incoming {
  id: 'cmkx1ed3f000duq9glemziy2b',
  slugs: [ 'advertising', 'cinematic', 'documental', 'sync' ]
}
prisma:query SELECT "public"."TrackStem"."id", "public"."TrackStem"."name", "public"."TrackStem"."group"::text, "public"."TrackStem"."durationSec", "public"."TrackStem"."sortOrder", "public"."TrackStem"."trackId" FROM "public"."TrackStem" WHERE "public"."TrackStem"."trackId" IN ($1) ORDER BY "public"."TrackStem"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."TrackTag"."trackId", "public"."TrackTag"."tagId", "public"."TrackTag"."assignedAt" FROM "public"."TrackTag" WHERE "public"."TrackTag"."trackId" IN ($1) ORDER BY "public"."TrackTag"."assignedAt" ASC OFFSET $2
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."slug", "public"."Tag"."name", "public"."Tag"."type"::text FROM "public"."Tag" WHERE "public"."Tag"."id" IN ($1,$2,$3,$4,$5) OFFSET $6
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."slug", "public"."Tag"."name" FROM "public"."Tag" WHERE "public"."Tag"."type" = CAST($1::text AS "public"."TagType") ORDER BY "public"."Tag"."name" ASC OFFSET $2
 GET /admin/track/cmkx1ed3f000duq9glemziy2b/edit 200 in 626ms
prisma:query BEGIN
prisma:query INSERT INTO "public"."Tag" ("id","createdAt","updatedAt","slug","name","type") VALUES ($1,$2,$3,$4,$5,CAST($6::text AS "public"."TagType")) ON CONFLICT ("slug") DO UPDATE SET "type" = CAST($7::text AS "public"."TagType"), "name" = $8, "updatedAt" = $9 WHERE ("public"."Tag"."slug" = $10 AND 1=1) RETURNING "public"."Tag"."id", "public"."Tag"."createdAt", "public"."Tag"."updatedAt", "public"."Tag"."slug", "public"."Tag"."name", "public"."Tag"."type"::text
prisma:query INSERT INTO "public"."Tag" ("id","createdAt","updatedAt","slug","name","type") VALUES ($1,$2,$3,$4,$5,CAST($6::text AS "public"."TagType")) ON CONFLICT ("slug") DO UPDATE SET "type" = CAST($7::text AS "public"."TagType"), "name" = $8, "updatedAt" = $9 WHERE ("public"."Tag"."slug" = $10 AND 1=1) RETURNING "public"."Tag"."id", "public"."Tag"."createdAt", "public"."Tag"."updatedAt", "public"."Tag"."slug", "public"."Tag"."name", "public"."Tag"."type"::text
prisma:query INSERT INTO "public"."Tag" ("id","createdAt","updatedAt","slug","name","type") VALUES ($1,$2,$3,$4,$5,CAST($6::text AS "public"."TagType")) ON CONFLICT ("slug") DO UPDATE SET "type" = CAST($7::text AS "public"."TagType"), "name" = $8, "updatedAt" = $9 WHERE ("public"."Tag"."slug" = $10 AND 1=1) RETURNING "public"."Tag"."id", "public"."Tag"."createdAt", "public"."Tag"."updatedAt", "public"."Tag"."slug", "public"."Tag"."name", "public"."Tag"."type"::text
prisma:query INSERT INTO "public"."Tag" ("id","createdAt","updatedAt","slug","name","type") VALUES ($1,$2,$3,$4,$5,CAST($6::text AS "public"."TagType")) ON CONFLICT ("slug") DO UPDATE SET "type" = CAST($7::text AS "public"."TagType"), "name" = $8, "updatedAt" = $9 WHERE ("public"."Tag"."slug" = $10 AND 1=1) RETURNING "public"."Tag"."id", "public"."Tag"."createdAt", "public"."Tag"."updatedAt", "public"."Tag"."slug", "public"."Tag"."name", "public"."Tag"."type"::text
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."slug", "public"."Tag"."name" FROM "public"."Tag" WHERE ("public"."Tag"."type" = CAST($1::text AS "public"."TagType") AND "public"."Tag"."slug" IN ($2,$3,$4,$5)) OFFSET $6
prisma:query DELETE FROM "public"."TrackTag" WHERE ("public"."TrackTag"."trackId" = $1 AND EXISTS(SELECT "t0"."id" FROM "public"."Tag" AS "t0" WHERE ("t0"."type" = CAST($2::text AS "public"."TagType") AND ("public"."TrackTag"."tagId") = ("t0"."id") AND "t0"."id" IS NOT NULL)))
prisma:query INSERT INTO "public"."TrackTag" ("trackId","tagId","assignedAt") VALUES ($1,$2,$3), ($4,$5,$6), ($7,$8,$9), ($10,$11,$12) ON CONFLICT DO NOTHING
prisma:query COMMIT
prisma:query SELECT "public"."TrackTag"."trackId", "public"."TrackTag"."tagId" FROM "public"."TrackTag" LEFT JOIN "public"."Tag" AS "j0" ON ("j0"."id") = ("public"."TrackTag"."tagId") WHERE ("public"."TrackTag"."trackId" = $1 AND ("j0"."type" = CAST($2::text AS "public"."TagType") AND ("j0"."id" IS NOT NULL))) ORDER BY "public"."TrackTag"."assignedAt" ASC OFFSET $3
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."slug", "public"."Tag"."name" FROM "public"."Tag" WHERE "public"."Tag"."id" IN ($1,$2,$3,$4) OFFSET $5
[POST /api/tracks/:id/categories] saved {
  trackId: 'cmkx1ed3f000duq9glemziy2b',
  assigned: [ 'advertising', 'cinematic', 'documental', 'sync' ]
}
 POST /api/tracks/cmkx1ed3f000duq9glemziy2b/categories 200 in 2625ms
prisma:query SELECT "public"."Track"."id", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."bpm", "public"."Track"."key", "public"."Track"."trackType"::text, "public"."Track"."genres", "public"."Track"."subgenres", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."assetKey", "public"."Track"."assetMime", "public"."Track"."assetSize", "public"."Track"."durationSec", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."analysisAt", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."master", "public"."Track"."licenseType", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."oneStop", "public"."Track"."clearedForSync", "public"."Track"."exclusiveTerritories", "public"."Track"."exclusiveTermMonths", "public"."Track"."restrictedTerritories", "public"."Track"."restrictedIndustries", "public"."Track"."restrictedPlatforms", "public"."Track"."restrictedBrands", "public"."Track"."pricingTier"::text, "public"."Track"."budgetMin", "public"."Track"."budgetMax", "public"."Track"."budgetCurrency"::text, "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."restrictions" FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."PublishingShare"."id", "public"."PublishingShare"."role"::text, "public"."PublishingShare"."name", "public"."PublishingShare"."ipiNumber", "public"."PublishingShare"."pro", "public"."PublishingShare"."caeNumber", "public"."PublishingShare"."sharePct", "public"."PublishingShare"."sortOrder", "public"."PublishingShare"."trackId" FROM "public"."PublishingShare" WHERE "public"."PublishingShare"."trackId" IN ($1) ORDER BY "public"."PublishingShare"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."MasterShare"."id", "public"."MasterShare"."name", "public"."MasterShare"."sharePct", "public"."MasterShare"."contact", "public"."MasterShare"."notes", "public"."MasterShare"."sortOrder", "public"."MasterShare"."trackId" FROM "public"."MasterShare" WHERE "public"."MasterShare"."trackId" IN ($1) ORDER BY "public"."MasterShare"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."TrackVersion"."id", "public"."TrackVersion"."label", "public"."TrackVersion"."durationSec", "public"."TrackVersion"."kind"::text, "public"."TrackVersion"."sortOrder", "public"."TrackVersion"."trackId" FROM "public"."TrackVersion" WHERE "public"."TrackVersion"."trackId" IN ($1) ORDER BY "public"."TrackVersion"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."TrackStem"."id", "public"."TrackStem"."name", "public"."TrackStem"."group"::text, "public"."TrackStem"."durationSec", "public"."TrackStem"."sortOrder", "public"."TrackStem"."trackId" FROM "public"."TrackStem" WHERE "public"."TrackStem"."trackId" IN ($1) ORDER BY "public"."TrackStem"."sortOrder" ASC OFFSET $2
prisma:query SELECT "public"."TrackTag"."trackId", "public"."TrackTag"."tagId", "public"."TrackTag"."assignedAt" FROM "public"."TrackTag" WHERE "public"."TrackTag"."trackId" IN ($1) ORDER BY "public"."TrackTag"."assignedAt" ASC OFFSET $2
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."slug", "public"."Tag"."name", "public"."Tag"."type"::text FROM "public"."Tag" WHERE "public"."Tag"."id" IN ($1,$2,$3,$4,$5,$6) OFFSET $7
prisma:query SELECT "public"."Tag"."id", "public"."Tag"."slug", "public"."Tag"."name" FROM "public"."Tag" WHERE "public"."Tag"."type" = CAST($1::text AS "public"."TagType") ORDER BY "public"."Tag"."name" ASC OFFSET $2
 GET /admin/track/cmkx1ed3f000duq9glemziy2b/edit 200 in 1404ms

## BASELINE 021 - /edit (medicion inicial)

- Fecha de muestra: 2026-02-06
- Track de prueba fijo: `cmkx1ed3f000duq9glemziy2b`
- Flujo probado:
  1. GET `/admin/track/[id]/edit`
  2. Asignar categoria y POST `/api/tracks/[id]/categories`
  3. Hard reload de `/edit`

### Resultados

- GET inicial `/edit`: `8166ms`
- Queries Prisma previas al GET inicial: `8`
- POST guardar categorias: `2625ms`
- Queries Prisma durante POST categorias (tramo medido): `11`
- GET `/edit` posterior (hot path): `626ms`
- GET `/edit` tras hard reload final: `1404ms`

### Nota de cobertura

- Esta muestra contiene medicion completa para `Categorias`.
- Muestras adicionales de `Moods` y `Uses` (corrida controlada API-only) agregadas abajo.

### Muestra adicional API-only (moods/uses)

- Metodo:
  - levantar `next dev` temporal en puerto `3101`,
  - ejecutar POST directo de `moods` y `uses` para el track fijo,
  - capturar tiempos y queries Prisma del log.

- POST `/api/tracks/cmkx1ed3f000duq9glemziy2b/moods`:
  - tiempo: `3185ms`
  - queries Prisma: `8`

- POST `/api/tracks/cmkx1ed3f000duq9glemziy2b/uses`:
  - tiempo: `1235ms`
  - queries Prisma: `8`

## MEDICION AFTER (optimizacion aplicada)

- Fecha de muestra: 2026-02-06
- Track de prueba fijo: `cmkx1ed3f000duq9glemziy2b`
- Metodo:
  - levantar `next dev` temporal en puerto `3103`,
  - intentar GET `/admin/track/[id]/edit`,
  - ejecutar POST de moods/uses/categories.

Resultados:
- GET `/admin/track/[id]/edit`: `303` (redireccion por auth en esta corrida, sin tiempo util de benchmark).
- POST moods: `2510ms` (`8` queries Prisma)
- POST uses: `1042ms` (`8` queries Prisma)
- POST categories: `1239ms` (`8` queries Prisma en esta corrida)

Comparacion API-only vs baseline:
- Moods: `3185ms -> 2510ms` (mejora)
- Uses: `1235ms -> 1042ms` (mejora)
- Categories: `2625ms -> 1239ms` (mejora significativa en esta corrida)

## SMOKE 021 - QA tecnico final (2026-02-06)

Track fijo:
- `cmkx1ed3f000duq9glemziy2b`

Smoke automatizado ejecutado en `next dev` puerto `3222`:
- `GET /admin/track/[id]/edit` OK (`200`)
- Roundtrip `moods` OK:
  - `GET /api/tracks/[id]/moods`
  - `POST /api/tracks/[id]/moods` (assign temporal)
  - `POST /api/tracks/[id]/moods` (restore original)
- Roundtrip `uses` OK:
  - `GET /api/tracks/[id]/uses`
  - `POST /api/tracks/[id]/uses` (assign temporal)
  - `POST /api/tracks/[id]/uses` (restore original)
- Roundtrip `categories` OK:
  - `GET /api/tracks/[id]/categories`
  - `POST /api/tracks/[id]/categories` (assign temporal)
  - `POST /api/tracks/[id]/categories` (restore original)
- Publishing route smoke OK:
  - `GET /api/tracks/[id]`
  - `PATCH /api/tracks/[id]` con `publishingShares` normalizados

Resultado:
- `{\"ok\":true,\"steps\":[\"edit-get\",\"moods\",\"uses\",\"categories\",\"publishing-patch\"]}`

Fix adicional aplicado durante QA:
- `src/app/api/uses/route.ts`
  - `POST`: normalizacion a mayusculas (`USE` consistente con UI).
  - `DELETE`: correccion de filtro `TagType.GENERIC -> TagType.USE`.

Validacion puntual del fix `/api/uses` (puerto `3233`):
- `POST /api/uses 201`
- `DELETE /api/uses 200`
- Resultado: `{\"ok\":true,\"deleted\":true}`
