 ✓ Compiled /auth/register/submit in 623ms (615 modules)
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
  ts: '2026-02-14T21:33:01.778Z',
  kind: 'verify_email',
  to: 'q@q.cl',
  subject: 'Verifica tu email · Lynx Media',
  messageId: 'console-verify_email-1771104781778',
  previewText: 'Verifica tu email · Lynx Media\n' +
    '\n' +
    'Confirma tu email para completar la seguridad de tu cuenta.\n' +
    'Este enlace expira: 15-02-2026, 6:33 p. m.\n' +
    '\n' +
    'Verificar email: http://localhost:3000/auth/verify-email/confirm?token=[redacted]\n' +
    '\n' +
    'Si no solicitaste est'
}
[auth:email] email_verify_sent {
  provider: 'console',
  to: 'q@q.cl',
  messageId: 'console-verify_email-1771104781778'
}
 POST /auth/register/submit 303 in 2005ms
 ○ Compiling /auth/verify-email ...
 ✓ Compiled /auth/verify-email in 752ms (617 modules)
 GET /auth/verify-email?ok=sent&debugLink=http%3A%2F%2Flocalhost%3A3000%2Fauth%2Fverify-email%2Fconfirm%3Ftoken%3DKe-B3aT1rqcQVPpOmulHbgUgXfQ1o7Nh4V_GCsdk72I 200 in 1120ms
 ○ Compiling /auth/verify-email/send ...
 ✓ Compiled /auth/verify-email/send in 695ms (619 modules)
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT 1
prisma:query SELECT 1
prisma:query SELECT 1
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil" FROM "public"."AuthRateLimit" WHERE ("public"."AuthRateLimit"."key" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text, "public"."User"."emailVerifiedAt" FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
 POST /auth/verify-email/send 200 in 42ms
prisma:query SELECT "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil" FROM "public"."AuthRateLimit" WHERE ("public"."AuthRateLimit"."key" = $1 AND 1=1) LIMIT $2 OFFSET $3
 POST /auth/verify-email/send 200 in 19ms
prisma:query SELECT "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil" FROM "public"."AuthRateLimit" WHERE ("public"."AuthRateLimit"."key" = $1 AND 1=1) LIMIT $2 OFFSET $3
prisma:query INSERT INTO "public"."AuthRateLimit" ("key","createdAt","updatedAt","action","windowStart","count") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil"
prisma:query INSERT INTO "public"."AuthRateLimit" ("key","createdAt","updatedAt","action","windowStart","count") VALUES ($1,$2,$3,$4,$5,$6) RETURNING "public"."AuthRateLimit"."key", "public"."AuthRateLimit"."createdAt", "public"."AuthRateLimit"."updatedAt", "public"."AuthRateLimit"."action", "public"."AuthRateLimit"."windowStart", "public"."AuthRateLimit"."count", "public"."AuthRateLimit"."blockedUntil"
prisma:error 
Invalid `prisma.authRateLimit.create()` invocation:


Unique constraint failed on the fields: (`key`)
Error [PrismaClientKnownRequestError]: 
Invalid `prisma.authRateLimit.create()` invocation:


Unique constraint failed on the fields: (`key`)
    at async consumeRateLimit (src/lib/account-auth/rate-limit.ts:34:5)
    at async POST (src/app/auth/verify-email/send/route.ts:37:20)
  32 |   const current = await prisma.authRateLimit.findUnique({ where: { key } });
  33 |   if (!current) {
> 34 |     await prisma.authRateLimit.create({
     |     ^
  35 |       data: {
  36 |         key,
  37 |         action: input.action, {
  code: 'P2002',
  meta: [Object],
  clientVersion: '6.19.2'
}