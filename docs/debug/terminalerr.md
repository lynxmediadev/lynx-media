ddfer@DESKTOP-8TCFJ8A:~/projects/lynx-media$ npm run dev -- --hostname 0.0.0.0 --port 3000

> lynx-media@0.1.0 dev
> next dev --hostname 0.0.0.0 --port 3000

   ▲ Next.js 15.5.9
   - Local:        http://localhost:3000
   - Network:      http://0.0.0.0:3000
   - Environments: .env.local, .env

 ✓ Starting...
 ✓ Ready in 1905ms
 ✓ Compiled /middleware in 496ms (114 modules)
 ○ Compiling /admin/users/roles ...
 ✓ Compiled /admin/users/roles in 4.6s (901 modules)
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: "/admin", icon: {$$typeof: ..., render: ...}, section: ..., exact: ...}
                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: "account", label: "Account", href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: "tracks", label: "Tracks", href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: "uploads", label: "Uploads", href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function House}
                          ^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '452832222'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function CircleUserRound}
                          ^^^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '2704188798'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Music2}
                          ^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '800145598'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function SlidersHorizontal}
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '333754462'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Library}
                          ^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '1637429054'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function FolderKanban}
                          ^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '3937969982'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function BriefcaseBusiness}
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '2132700766'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function ClipboardList}
                          ^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '439169374'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Gavel}
                          ^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '3187618558'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function ScrollText}
                          ^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '198992030'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Shield}
                          ^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '179034814'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Settings}
                          ^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '302790334'
}
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
 GET /admin/users/roles 500 in 8200ms
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."UserSession"."id", "public"."UserSession"."userId" FROM "public"."UserSession" WHERE ("public"."UserSession"."id" = $1 AND "public"."UserSession"."userId" = $2 AND "public"."UserSession"."sessionTokenHash" = $3 AND "public"."UserSession"."expiresAt" > $4) LIMIT $5 OFFSET $6
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
prisma:query SELECT "public"."User"."id", "public"."User"."email", "public"."User"."name", "public"."User"."role"::text, "public"."User"."status"::text FROM "public"."User" WHERE "public"."User"."id" IN ($1) OFFSET $2
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: "/admin", icon: {$$typeof: ..., render: ...}, section: ..., exact: ...}
                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: "account", label: "Account", href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: "tracks", label: "Tracks", href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                                   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: "uploads", label: "Uploads", href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                                     ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: ..., icon: {$$typeof: ..., render: ...}, section: ...}
                                         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function House}
                          ^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '452832222'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function CircleUserRound}
                          ^^^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '2704188798'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Music2}
                          ^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '800145598'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function SlidersHorizontal}
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '333754462'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Library}
                          ^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '1637429054'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function FolderKanban}
                          ^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '3937969982'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function BriefcaseBusiness}
                          ^^^^^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '2132700766'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function ClipboardList}
                          ^^^^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '439169374'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Gavel}
                          ^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '3187618558'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function ScrollText}
                          ^^^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '198992030'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Shield}
                          ^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '179034814'
}
 ⨯ Error: Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with "use server". Or maybe you meant to call this function rather than return it.
  {$$typeof: ..., render: function Settings}
                          ^^^^^^^^^^^^^^^^^
    at stringify (<anonymous>) {
  digest: '302790334'
}
 GET /admin/users/roles 500 in 1990ms













___________________________



## Error Type
Console Error

## Error Message
Only plain objects can be passed to Client Components from Server Components. Classes or other objects with methods are not supported.
  {id: ..., label: ..., href: "/admin", icon: {$$typeof: ..., render: ...}, section: ..., exact: ...}
                                              ^^^^^^^^^^^^^^^^^^^^^^^^^^^^


    at stringify (<anonymous>:1:18)
    at AdminLayout (src/app/admin/layout.tsx:23:10)

## Code Frame
  21 |     ? getAdminDashboardSectionsForRole(user.role)
  22 |     : adminDashboardSections;
> 23 |   return <AdminDashboardLayoutClient sections={sections}>{children}</AdminDashboardLayoutClient>;
     |          ^
  24 | }
  25 |

Next.js version: 15.5.9 (Webpack)
