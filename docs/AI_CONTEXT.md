# PROMPT RAPIDO (COPIAR/PEGAR)
Lee `docs/AI_CONTEXT.md` en este repo y trabaja estrictamente bajo sus reglas. Pide confirmacion antes de ejecutar comandos y manten cambios acotados. No expongas secretos. Prioriza UX cinematografica, minimalista y accesible.

# Contexto de Lynx Media

## Que es Lynx Media
- Plataforma y estudio orientado a clientes audiovisuales y marcas.
- Servicios principales:
  - Musica original para contenido audiovisual (sync licensing, composicion a medida, instrumentales, stems, alt mixes, cutdowns).
  - Produccion y postproduccion de audio: mezcla, masterizacion, edicion, restauracion, diseno sonoro, foley.
  - Sonido directo y registro en terreno (field recording / location sound).
  - Amplificacion/sonorizacion y soporte tecnico de audio para eventos/rodajes (segun oferta).
- Objetivo del sitio: transmitir estetica cinematografica y confiable, y permitir que un cliente encuentre, escuche y licencie musica o solicite servicios de audio sin friccion.

## Producto y arquitectura (alto nivel)
- Sitio publico: home, servicios, catalogo de musica (sync) y contacto.
- Catalogo sync: exploracion, escucha y licenciamiento de tracks.
- Back-office/admin: ingestion de tracks, metadata tecnica, gestion de catalogo, assets y licencias.

## Stack tecnico
- Next.js (App Router) + TypeScript.
- Tailwind CSS v4.
- Prisma + Postgres (Supabase).
- Assets de audio y waveforms en Cloudflare R2.
- Entorno recomendado: Node 20 LTS en WSL.

## Reglas estrictas para cambios
- No exponer secretos: nunca pegar valores de `DATABASE_URL`, API keys, tokens, etc. Solo listar nombres y ubicacion (.env.local).
- Cambios acotados: evitar refactors masivos sin justificar. Respeta estructura y estilos existentes.
- No reestructurar carpetas sin motivo claro.
- Mantener tipado estricto y validaciones coherentes.
- Accesibilidad obligatoria: labels, focus states, roles, y contraste adecuado.

## Convenciones de trabajo con Codex
- Rama de trabajo: `codex1`.
- Commits por bloques de trabajo (cuando se solicite).
- Comandos tipicos permitidos (previa confirmacion):
  - `npm run dev`
  - `npm run build`
  - `npx prisma generate` (cuando se toque Prisma)
  - `npm run test` si aplica
- Validacion minima esperada:
  - `npm run dev`
  - `npm run build` si aplica
  - `npx prisma generate` si hay cambios en Prisma

## Buenas practicas de UX
- Estetica cinematografica, elegante, minimalista, dark-by-default.
- Alto contraste y jerarquia tipografica clara.
- Copy sobrio y tecnico cuando corresponda; evitar clutter.
- Performance y accesibilidad como prioridades.
