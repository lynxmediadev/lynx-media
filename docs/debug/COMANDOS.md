# Comandos de debug y mantenimiento

## Reset + reseed de tags (MOOD / USE / CATALOG)

Que hace:
- Borra asignaciones `TrackTag` de tipos `MOOD`, `USE`, `CATALOG`.
- Borra esos tags del catalogo.
- Crea un catalogo base limpio y coherente.
- Reasigna un set base por track (3 moods, 2 uses, 2 categorias).

Que afecta:
- Solo tablas `Tag` y `TrackTag` para esos 3 tipos.
- No toca `PublishingShare`, `MasterShare`, `LicensingRequest`, ni otros modulos.

> Ejecutar desde la raiz del repo: `/home/ddfer/projects/lynx-media`

```bash
node - <<'NODE'
const { PrismaClient, TagType } = require('@prisma/client');
const db = new PrismaClient();

const MOODS = [
  'AGGRESSIVE','ATMOSPHERIC','CHILL','DARK','DRAMATIC','EMOTIONAL',
  'EPIC','HOPEFUL','MELANCHOLIC','MINIMAL','MOTIVATIONAL','ROMANTIC',
  'TENSE','UPLIFTING','WARM',
];

const USES = [
  'ADVERTISEMENT','BRAND_CAMPAIGN','CORPORATE','DOCUMENTARY','FILM',
  'PODCAST','SERIES','SOCIAL_MEDIA','TRAILER','TV','VIDEO_GAME',
];

const CATEGORIES = [
  'ACOUSTIC','AMBIENT','CINEMATIC','CORPORATE_MUSIC','ELECTRONIC',
  'HYBRID','ORCHESTRAL','PIANO','ROCK','TENSION','URBAN',
];

const presets = {
  'seed-001': { moods: ['uplifting','hopeful','warm'], uses: ['advertisement','corporate'], categories: ['cinematic','corporate-music'] },
  'seed-002': { moods: ['motivational','epic','dramatic'], uses: ['trailer','film'], categories: ['hybrid','orchestral'] },
  'seed-003': { moods: ['tense','minimal','atmospheric'], uses: ['series','social-media'], categories: ['tension','ambient'] },
  'seed-004': { moods: ['melancholic','emotional','dark'], uses: ['film','documentary'], categories: ['piano','ambient'] },
  'seed-005': { moods: ['chill','uplifting','atmospheric'], uses: ['tv','brand-campaign'], categories: ['acoustic','electronic'] },
  'cmklsl9p80000k8os115um9v7': { moods: ['aggressive','epic','tense'], uses: ['video-game','trailer'], categories: ['urban','hybrid'] },
  'cmkx1ed3f000duq9glemziy2b': { moods: ['dramatic','uplifting','warm'], uses: ['film','series'], categories: ['cinematic','rock'] },
};

const slugify = (input) => input
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')
  .slice(0, 60);

(async () => {
  await db.$transaction(async (tx) => {
    await tx.trackTag.deleteMany({
      where: { tag: { type: { in: [TagType.MOOD, TagType.USE, TagType.CATALOG] } } },
    });

    await tx.tag.deleteMany({
      where: { type: { in: [TagType.MOOD, TagType.USE, TagType.CATALOG] } },
    });

    const payload = [
      ...MOODS.map((name) => ({ name, slug: slugify(name), type: TagType.MOOD })),
      ...USES.map((name) => ({ name, slug: slugify(name), type: TagType.USE })),
      ...CATEGORIES.map((name) => ({ name, slug: slugify(name), type: TagType.CATALOG })),
    ];

    await tx.tag.createMany({ data: payload, skipDuplicates: true });

    const tags = await tx.tag.findMany({
      where: { type: { in: [TagType.MOOD, TagType.USE, TagType.CATALOG] } },
      select: { id: true, slug: true, type: true },
    });

    const byTypeSlug = new Map(tags.map((t) => [`${t.type}:${t.slug}`, t.id]));
    const rows = [];

    for (const [trackId, set] of Object.entries(presets)) {
      for (const slug of set.moods) {
        const tagId = byTypeSlug.get(`MOOD:${slug}`);
        if (tagId) rows.push({ trackId, tagId });
      }
      for (const slug of set.uses) {
        const tagId = byTypeSlug.get(`USE:${slug}`);
        if (tagId) rows.push({ trackId, tagId });
      }
      for (const slug of set.categories) {
        const tagId = byTypeSlug.get(`CATALOG:${slug}`);
        if (tagId) rows.push({ trackId, tagId });
      }
    }

    if (rows.length) {
      await tx.trackTag.createMany({ data: rows, skipDuplicates: true });
    }
  });

  const [moods, uses, categories, links] = await Promise.all([
    db.tag.count({ where: { type: TagType.MOOD } }),
    db.tag.count({ where: { type: TagType.USE } }),
    db.tag.count({ where: { type: TagType.CATALOG } }),
    db.trackTag.count({ where: { tag: { type: { in: [TagType.MOOD, TagType.USE, TagType.CATALOG] } } } }),
  ]);

  console.log({ moods, uses, categories, links });
  await db.$disconnect();
})();
NODE
```

Resultado esperado:
- `moods: 15`
- `uses: 11`
- `categories: 11`
- `links: 49`

## Verificar asignaciones por track

```bash
node - <<'NODE'
const { PrismaClient, TagType } = require('@prisma/client');
const db = new PrismaClient();

(async () => {
  const tracks = await db.track.findMany({
    select: {
      id: true,
      title: true,
      tags: {
        where: { tag: { type: { in: [TagType.MOOD, TagType.USE, TagType.CATALOG] } } },
        select: { tag: { select: { type: true, name: true } } },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  for (const t of tracks) {
    const moods = t.tags.filter((x) => x.tag.type === 'MOOD').map((x) => x.tag.name);
    const uses = t.tags.filter((x) => x.tag.type === 'USE').map((x) => x.tag.name);
    const cats = t.tags.filter((x) => x.tag.type === 'CATALOG').map((x) => x.tag.name);
    console.log(`\\n${t.id} | ${t.title}`);
    console.log(' moods:', moods.join(', '));
    console.log(' uses :', uses.join(', '));
    console.log(' cats :', cats.join(', '));
  }

  await db.$disconnect();
})();
NODE
```

## Auth email provider (local)

Config mínima para probar en local sin producción:

```bash
# .env.local (o .env)
AUTH_EMAIL_PROVIDER=console
AUTH_EMAIL_FROM=noreply@lynx.local
AUTH_EMAIL_DEBUG_LINKS=1
AUTH_ENFORCE_VERIFIED_EMAIL=0
TURNSTILE_ENABLED=0
```

Preflight rápido de configuración auth/email:

```bash
npm run auth:preflight
```

Para probar provider real Brevo en local:

```bash
AUTH_EMAIL_PROVIDER=brevo \
AUTH_EMAIL_FROM=noreply@tu-dominio.com \
BREVO_API_KEY=TU_API_KEY \
APP_BASE_URL=http://localhost:3000 \
npm run auth:preflight
```

Probar creación de invitación:

```bash
INVITE_EMAIL=test_creator@example.com INVITE_ROLE=CREATOR APP_BASE_URL=http://localhost:3000 npm run db:create:invite
```

Bootstrap admin auth:

```bash
AUTH_BOOTSTRAP_ADMIN_EMAIL=admin@lynx.local AUTH_BOOTSTRAP_ADMIN_PASSWORD=TuClaveSegura123! npm run db:bootstrap:auth
```
