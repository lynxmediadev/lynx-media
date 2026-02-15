 GET /admin/users/cmll1qt710000uqmleda5gh2b 200 in 1476ms
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."createdAt", "public"."User"."lastLoginAt" FROM "public"."User" WHERE 1=1 ORDER BY "public"."User"."role" ASC, "public"."User"."createdAt" DESC LIMIT $1 OFFSET $2
prisma:query SELECT "public"."InviteToken"."id", "public"."InviteToken"."email", "public"."InviteToken"."createdAt", "public"."InviteToken"."expiresAt", "public"."InviteToken"."userId" FROM "public"."InviteToken" WHERE ("public"."InviteToken"."usedAt" IS NULL AND "public"."InviteToken"."expiresAt" > $1) ORDER BY "public"."InviteToken"."createdAt" DESC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."role"::text, "public"."User"."status"::text FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
 GET /admin/users 200 in 395ms
 ✓ Compiled /admin/users/invite in 420ms (1050 modules)
prisma:query SELECT 1
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query INSERT INTO "public"."User" ("id","createdAt","updatedAt","email","passwordHash","name","role","status") VALUES ($1,$2,$3,$4,$5,$6,CAST($7::text AS "public"."UserRole"),CAST($8::text AS "public"."UserStatus")) ON CONFLICT ("email") DO UPDATE SET "role" = CAST($9::text AS "public"."UserRole"), "status" = CAST($10::text AS "public"."UserStatus"), "emailVerifiedAt" = $11, "updatedAt" = $12 WHERE ("public"."User"."email" = $13 AND 1=1) RETURNING "public"."User"."id", "public"."User"."email", "public"."User"."role"::text
prisma:query INSERT INTO "public"."InviteToken" ("id","createdAt","userId","email","tokenHash","expiresAt") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "public"."InviteToken"."id", "public"."InviteToken"."createdAt", "public"."InviteToken"."userId", "public"."InviteToken"."email", "public"."InviteToken"."tokenHash", "public"."InviteToken"."expiresAt", "public"."InviteToken"."usedAt"
[auth:email:console] {
  ts: '2026-02-14T19:54:45.158Z',
  kind: 'invite',
  to: 'ddfernandezcid@gmail.com',
  subject: 'Invitación de acceso · Lynx Media',
  messageId: 'console-invite-1771098885158',
  previewText: 'Invitación de acceso · Lynx Media\n' +
    '\n' +
    'Recibiste una invitación para crear tu cuenta (CREATOR) en Lynx Media.\n' +
    'Rol asignado: CREATOR\n' +
    'Expira: 21-02-2026, 4:54 p. m.\n' +
    '\n' +
    'Crear cuenta: http://localhost:3000/auth/register?token=[redacted]\n' +
    '\n' +
    'Si no solici'
}
[auth:email] email_invite_sent {
  provider: 'console',
  to: 'ddfernandezcid@gmail.com',
  role: 'CREATOR',
  messageId: 'console-invite-1771098885158'
}
 POST /admin/users/invite 303 in 1016ms
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."createdAt", "public"."User"."lastLoginAt" FROM "public"."User" WHERE 1=1 ORDER BY "public"."User"."role" ASC, "public"."User"."createdAt" DESC LIMIT $1 OFFSET $2
prisma:query SELECT "public"."InviteToken"."id", "public"."InviteToken"."email", "public"."InviteToken"."createdAt", "public"."InviteToken"."expiresAt", "public"."InviteToken"."userId" FROM "public"."InviteToken" WHERE ("public"."InviteToken"."usedAt" IS NULL AND "public"."InviteToken"."expiresAt" > $1) ORDER BY "public"."InviteToken"."createdAt" DESC LIMIT $2 OFFSET $3
prisma:query SELECT "public"."User"."id", "public"."User"."role"::text, "public"."User"."status"::text FROM "public"."User" WHERE "public"."User"."id" IN ($1,$2) OFFSET $3
 GET /admin/users?ok=invite_created&email=ddfernandezcid%40gmail.com&link=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fregister%3Ftoken%3DziURkn1Zgjv7LvvuWhxsxODO1EWkR_kx 200 in 670ms
 ○ Compiling /auth/register ...
 ✓ Compiled /auth/register in 621ms (1066 modules)
prisma:query SELECT 1
prisma:query SELECT "public"."InviteToken"."id", "public"."InviteToken"."email" FROM "public"."InviteToken" WHERE ("public"."InviteToken"."tokenHash" = $1 AND "public"."InviteToken"."usedAt" IS NULL AND "public"."InviteToken"."expiresAt" > $2) LIMIT $3 OFFSET $4
 GET /auth/register?token=ziURkn1Zgjv7LvvuWhxsxODO1EWkR_kx 200 in 1154ms
prisma:query SELECT 1
prisma:query SELECT "public"."InviteToken"."id", "public"."InviteToken"."email" FROM "public"."InviteToken" WHERE ("public"."InviteToken"."tokenHash" = $1 AND "public"."InviteToken"."usedAt" IS NULL AND "public"."InviteToken"."expiresAt" > $2) LIMIT $3 OFFSET $4
 GET /auth/register?token=ziURkn1Zgjv7LvvuWhxsxODO1EWkR_kx 200 in 189ms
 ○ Compiling /auth/register/submit ...
 ✓ Compiled /auth/register/submit in 525ms (1041 modules)
prisma:query SELECT "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil" FROM "public"."AuthRateLimit" WHERE ("public"."AuthRateLimit"."key" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query INSERT INTO "public"."AuthRateLimit" ("key","createdAt","updatedAt","action","windowStart","count") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil"
prisma:query SELECT "public"."InviteToken"."id", "public"."InviteToken"."email", "public"."InviteToken"."userId" FROM "public"."InviteToken" WHERE ("public"."InviteToken"."tokenHash" = $1 AND "public"."InviteToken"."usedAt" IS NULL AND "public"."InviteToken"."expiresAt" > $2) LIMIT $3 OFFSET $4
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."status"::text, "public"."User"."role"::text FROM "public"."User" WHERE ("public"."User"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query UPDATE "public"."User" SET "name" = $1, "passwordHash" = $2, "status" = CAST($3::text AS "public"."UserStatus"), "emailVerifiedAt" = $4, "updatedAt" = $5 WHERE ("public"."User"."id" = $6 AND 1=1) RETURNING "public"."User"."id", "public"."User"."role"::text
prisma:query UPDATE "public"."InviteToken" SET "usedAt" = $1 WHERE ("public"."InviteToken"."id" = $2 AND 1=1) RETURNING "public"."InviteToken"."id", "public"."InviteToken"."createdAt", "public"."InviteToken"."userId", "public"."InviteToken"."email", "public"."InviteToken"."tokenHash", "public"."InviteToken"."expiresAt", "public"."InviteToken"."usedAt"
prisma:query INSERT INTO "public"."UserSession" ("id","createdAt","updatedAt","userId","sessionTokenHash","expiresAt","ip","userAgent") VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING "public"."UserSession"."id", "public"."UserSession"."expiresAt"
prisma:query UPDATE "public"."User" SET "lastLoginAt" = $1, "updatedAt" = $2 WHERE ("public"."User"."id" = $3 AND 1=1) RETURNING "public"."User"."id", "public"."User"."createdAt", "public"."User"."updatedAt", "public"."User"."email", "public"."User"."passwordHash", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt", "public"."User"."lastLoginAt"
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE ("public"."User"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query INSERT INTO "public"."EmailVerificationToken" ("id","createdAt","userId","tokenHash","expiresAt","requestedIp") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "public"."EmailVerificationToken"."id", "public"."EmailVerificationToken"."createdAt", "public"."EmailVerificationToken"."userId", "public"."EmailVerificationToken"."tokenHash", "public"."EmailVerificationToken"."expiresAt", "public"."EmailVerificationToken"."usedAt", "public"."EmailVerificationToken"."requestedIp"
[auth:email:console] {
  ts: '2026-02-14T19:56:01.258Z',
  kind: 'verify_email',
  to: 'ddfernandezcid@gmail.com',
  subject: 'Verifica tu email · Lynx Media',
  messageId: 'console-verify_email-1771098961258',
  previewText: 'Verifica tu email · Lynx Media\n' +
    '\n' +
    'Confirma tu email para completar la seguridad de tu cuenta.\n' +
    'Este enlace expira: 15-02-2026, 4:56 p. m.\n' +
    '\n' +
    'Verificar email: http://localhost:3000/auth/verify-email/confirm?token=[redacted]\n' +
    '\n' +
    'Si no solicitaste est'
}
[auth:email] email_verify_sent {
  provider: 'console',
  to: 'ddfernandezcid@gmail.com',
  messageId: 'console-verify_email-1771098961258'
}
 POST /auth/register/submit 303 in 1904ms
 ✓ Compiled /auth/verify-email in 279ms (1043 modules)
 GET /auth/verify-email?ok=sent&debugLink=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fverify-email%2Fconfirm%3Ftoken%3Dhn8aG9uH9EreN733p6TH7t5eRk6e9v-ysQmbq_Yia64 200 in 502ms
 ✓ Compiled /auth/verify-email/send in 384ms (1045 modules)
prisma:query SELECT 1
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil" FROM "public"."AuthRateLimit" WHERE ("public"."AuthRateLimit"."key" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query INSERT INTO "public"."AuthRateLimit" ("key","createdAt","updatedAt","action","windowStart","count") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil"
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE ("public"."User"."id" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query INSERT INTO "public"."EmailVerificationToken" ("id","createdAt","userId","tokenHash","expiresAt","requestedIp") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "public"."EmailVerificationToken"."id", "public"."EmailVerificationToken"."createdAt", "public"."EmailVerificationToken"."userId", "public"."EmailVerificationToken"."tokenHash", "public"."EmailVerificationToken"."expiresAt", "public"."EmailVerificationToken"."usedAt", "public"."EmailVerificationToken"."requestedIp"
[auth:email:console] {
  ts: '2026-02-14T19:56:43.075Z',
  kind: 'verify_email',
  to: 'ddfernandezcid@gmail.com',
  subject: 'Verifica tu email · Lynx Media',
  messageId: 'console-verify_email-1771099003075',
  previewText: 'Verifica tu email · Lynx Media\n' +
    '\n' +
    'Confirma tu email para completar la seguridad de tu cuenta.\n' +
    'Este enlace expira: 15-02-2026, 4:56 p. m.\n' +
    '\n' +
    'Verificar email: http://localhost:3000/auth/verify-email/confirm?token=[redacted]\n' +
    '\n' +
    'Si no solicitaste est'
}
[auth:email] email_verify_sent {
  provider: 'console',
  to: 'ddfernandezcid@gmail.com',
  messageId: 'console-verify_email-1771099003075'
}
 POST /auth/verify-email/send 303 in 857ms
 GET /auth/verify-email?ok=verify_sent&debugLink=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fverify-email%2Fconfirm%3Ftoken%3DuO_OZKnawADsHIbBBZvajWp51QFHyvP9HP6jgV2WnP0 200 in 178ms
