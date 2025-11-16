PS C:\Lynx Media\WEB\NOV2025\lynx-media> npm run dev

> lynx-media@0.1.0 dev
> next dev

   ▲ Next.js 15.5.6
   - Local:        http://localhost:3000
   - Network:      http://192.168.100.5:3000
   - Environments: .env.local, .env

 ✓ Starting...
 ✓ Ready in 1908ms
 ✓ Compiled /middleware in 150ms (114 modules)
 ○ Compiling /admin/uploads ...
 ✓ Compiled /admin/uploads in 909ms (552 modules)
 GET /admin/uploads 200 in 1306ms
 ○ Compiling /api/uploads/sign ...
 ✓ Compiled /api/uploads/sign in 922ms (990 modules)
 POST /api/uploads/sign 200 in 1336ms
 ✓ Compiled /api/tracks in 435ms (997 modules)
prisma:query INSERT INTO "public"."Track" ("id","createdAt","updatedAt","title","artist","audioUrl","coverUrl","moods","uses","restrictions","assetKey","assetMime","assetSize","waveform") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING "public"."Track"."id", "public"."Track"."createdAt", "public"."Track"."updatedAt", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."moods", "public"."Track"."uses", "public"."Track"."master", "public"."Track"."publishingSplit", "public"."Track"."writerName", "public"."Track"."writerSharePct", "public"."Track"."publisherName", "public"."Track"."publisherSharePct", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."licenseType", "public"."Track"."territories", "public"."Track"."term", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."restrictions", "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."assetKey", "public"."Track"."assetMime", "public"."Track"."assetSize", "public"."Track"."durationSec", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."analysisAt"
 POST /api/tracks 201 in 1206ms
 ✓ Compiled /admin/analyze in 502ms (1063 modules)
prisma:query SELECT "public"."Track"."id", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."createdAt", "public"."Track"."updatedAt", "public"."Track"."analysisAt", "public"."Track"."assetKey", "public"."Track"."audioUrl", "public"."Track"."durationSec", "public"."Track"."sampleRateHz", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."truePeakDbfs" FROM "public"."Track" WHERE 1=1 ORDER BY "public"."Track"."createdAt" DESC OFFSET $1
 GET /admin/analyze 200 in 884ms
 ○ Compiling /admin/track/[id]/edit ...
 ✓ Compiled /admin/track/[id]/edit in 622ms (1203 modules)
prisma:query SELECT "public"."Track"."id", "public"."Track"."createdAt", "public"."Track"."updatedAt", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."moods", "public"."Track"."uses", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."assetKey", "public"."Track"."durationSec", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."analysisAt", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."master", "public"."Track"."licenseType", "public"."Track"."territories", "public"."Track"."term", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."restrictions", "public"."Track"."publishingSplit" FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
 GET /admin/track/cmi2c0v9v0000uqn05kzgfe5o/edit 200 in 1947ms
 ✓ Compiled /api/tracks/[id]/analyze in 392ms (808 modules)
prisma:query SELECT "public"."Track"."id", "public"."Track"."createdAt", "public"."Track"."updatedAt", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."moods", "public"."Track"."uses", "public"."Track"."master", "public"."Track"."publishingSplit", "public"."Track"."writerName", "public"."Track"."writerSharePct", "public"."Track"."publisherName", "public"."Track"."publisherSharePct", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."licenseType", "public"."Track"."territories", "public"."Track"."term", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."restrictions", "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."assetKey", "public"."Track"."assetMime", "public"."Track"."assetSize", "public"."Track"."durationSec", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."analysisAt" FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query UPDATE "public"."Track" SET "analysisAt" = $1, "durationSec" = $2, "sampleRateHz" = $3, "channels" = $4, "bitrateKbps" = $5, "loudnessLufs" = $6, "loudnessRangeLu" = $7, "lraLowLufs" = $8, "lraHighLufs" = $9, "truePeakDbfs" = $10, "waveform" = $11, "updatedAt" = $12 WHERE ("public"."Track"."id" = $13 AND 1=1) RETURNING "public"."Track"."id", "public"."Track"."durationSec", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."analysisAt"
 POST /api/tracks/cmi2c0v9v0000uqn05kzgfe5o/analyze 200 in 2032ms
prisma:query SELECT "public"."Track"."id", "public"."Track"."createdAt", "public"."Track"."updatedAt", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."moods", "public"."Track"."uses", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."assetKey", "public"."Track"."durationSec", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."analysisAt", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."master", "public"."Track"."licenseType", "public"."Track"."territories", "public"."Track"."term", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."restrictions", "public"."Track"."publishingSplit" FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
 GET /admin/track/cmi2c0v9v0000uqn05kzgfe5o/edit 200 in 175ms
prisma:query SELECT 1
prisma:query DELETE FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) RETURNING "public"."Track"."id", "public"."Track"."createdAt", "public"."Track"."updatedAt", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."moods", "public"."Track"."uses", "public"."Track"."master", "public"."Track"."publishingSplit", "public"."Track"."writerName", "public"."Track"."writerSharePct", "public"."Track"."publisherName", "public"."Track"."publisherSharePct", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."licenseType", "public"."Track"."territories", "public"."Track"."term", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."restrictions", "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."assetKey", "public"."Track"."assetMime", "public"."Track"."assetSize", "public"."Track"."durationSec", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."analysisAt"    
[storage:delete-object] Borrado en S3/R2: {
  bucket: 'lynx-media-dev',
  key: 'audio/2025/11/16/12f5cf1b-0c9a-47ca-b62a-2f2c179992c7-b-svdd-epic-dark-shorts-1.mp3'
}
[track:edit:deleteTrackAction] deleteObjectFromS3 {
  assetKey: 'audio/2025/11/16/12f5cf1b-0c9a-47ca-b62a-2f2c179992c7-b-svdd-epic-dark-shorts-1.mp3',
  coverUrl: null,
  result: 'ok'
}
[track:edit:deleteTrackAction] fatal: Error: NEXT_REDIRECT
    at getRedirectError (..\..\..\src\client\components\redirect.ts:21:17)
    at redirect (..\..\..\src\client\components\redirect.ts:47:9)
    at deleteTrackAction (src\app\admin\track\[id]\edit\page.tsx:302:15)
  19 |   statusCode: RedirectStatusCode = RedirectStatusCode.TemporaryRedirect
  20 | ): RedirectError {
> 21 |   const error = new Error(REDIRECT_ERROR_CODE) as RedirectError
     |                 ^
  22 |   error.digest = `${REDIRECT_ERROR_CODE};${type};${url};${statusCode};`
  23 |   return error
  24 | } {
  digest: 'NEXT_REDIRECT;push;/admin/analyze;307;'
} {
  idFromForm: 'cmi2c0v9v0000uqn05kzgfe5o',
  assetKey: 'audio/2025/11/16/12f5cf1b-0c9a-47ca-b62a-2f2c179992c7-b-svdd-epic-dark-shorts-1.mp3',
  coverUrl: null
}
prisma:query SELECT "public"."Track"."id", "public"."Track"."createdAt", "public"."Track"."updatedAt", "public"."Track"."title", "public"."Track"."artist", "public"."Track"."moods", "public"."Track"."uses", "public"."Track"."audioUrl", "public"."Track"."coverUrl", "public"."Track"."assetKey", "public"."Track"."durationSec", "public"."Track"."sampleRateHz", "public"."Track"."channels", "public"."Track"."bitrateKbps", "public"."Track"."loudnessLufs", "public"."Track"."loudnessRangeLu", "public"."Track"."lraLowLufs", "public"."Track"."lraHighLufs", "public"."Track"."truePeakDbfs", "public"."Track"."waveform", "public"."Track"."analysisAt", "public"."Track"."isrc", "public"."Track"."iswc", "public"."Track"."upc", "public"."Track"."master", "public"."Track"."licenseType", "public"."Track"."territories", "public"."Track"."term", "public"."Track"."mediaBuy", "public"."Track"."mfn", "public"."Track"."contentIdEnrolled", "public"."Track"."contentIdAdmin", "public"."Track"."contentIdWhitelist", "public"."Track"."restrictions", "public"."Track"."publishingSplit" FROM "public"."Track" WHERE ("public"."Track"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
 POST /admin/track/cmi2c0v9v0000uqn05kzgfe5o/edit 200 in 829ms
