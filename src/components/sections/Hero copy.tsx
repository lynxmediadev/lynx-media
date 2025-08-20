// src/components/sections/Hero.tsx

type HeroProps = {
  eyebrow?: string;
  slantLeft?: string;
  headlineMain?: string;
  slantRight?: string;
  headlineSub?: string;
  description?: string;
  projectTitle?: string;
  projectCategory?: string;
  ctaText?: string;
  ctaHref?: string;
  backgroundImageUrl?: string;
};

const DEFAULTS: Required<HeroProps> = {
  eyebrow: "SYNC LICENSING & MUSIC CATALOGUE",
  slantLeft: "the",
  headlineMain: "Sound",
  slantRight: "of",
  headlineSub: "Lynx Media",
  description:
    "Catálogo curado y servicios de música para cine, TV, publicidad y nuevos medios. Un enfoque colaborativo para lograr la mejor música en sincronización audiovisual.",
  projectTitle: "Featured Reel",
  projectCategory: "Film / TV / Ads",
  ctaText: "Explorar catálogo",
  ctaHref: "/catalog",
  backgroundImageUrl: "/images/hero/lynx-hero.jpg",
};

export default function Hero(props: HeroProps) {
  const {
    eyebrow,
    slantLeft,
    headlineMain,
    slantRight,
    headlineSub,
    description,
    projectTitle,
    projectCategory,
    ctaText,
    ctaHref,
    backgroundImageUrl,
  } = { ...DEFAULTS, ...props };

  return (
    <section
      id="hero"
      aria-label="Hero principal de Lynx Media"
      className="relative min-h-screen w-full overflow-hidden"
    >
      {/* Fondo */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${backgroundImageUrl}')` }}
      />
      {/* Overlay */}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[var(--color-dark)] opacity-40 mix-blend-multiply dark:opacity-25"
      />
      {/* Gradiente inferior */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-40"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in srgb, transparent 0%, transparent), color-mix(in srgb, var(--color-dark) 65%, transparent))",
        }}
      />

      {/* Contenido */}
      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl grid-cols-12 items-end px-6 pb-8 md:px-8 md:pb-12">
        {/* Izquierda: Reel info (pegado al borde) */}
        <div className="col-span-6 md:col-span-3 flex flex-col gap-1 justify-end text-left">
          <div className="font-ui text-sm tracking-widest text-[var(--color-light)]/90 uppercase">
            {projectTitle}
          </div>
          <div className="font-ui text-xs tracking-wider text-[var(--color-light)]/80 uppercase">
            {projectCategory}
          </div>
        </div>

        {/* Centro: Eyebrow + Títulos + Descripción */}
        <div className="col-span-12 md:col-span-6 flex flex-col items-center text-center">
          {/* Eyebrow */}
          <div className="font-ui mb-3 text-xs tracking-[0.25em] text-[var(--color-light)]/85 uppercase md:text-sm">
            {eyebrow}
          </div>

          {/* Línea 1 */}
          <div className="flex items-baseline justify-center gap-3 md:gap-4">
            <span className="font-elegant text-2xl leading-none text-[var(--color-light)]/85 italic md:text-3xl lg:text-4xl">
              {slantLeft}
            </span>
            <h1 className="font-display text-5xl leading-[0.95] text-[var(--color-light)] md:text-6xl lg:text-7xl">
              {headlineMain}
            </h1>
            <span className="font-elegant text-2xl leading-none text-[var(--color-light)]/85 italic md:text-3xl lg:text-4xl">
              {slantRight}
            </span>
          </div>

          {/* Línea 2 */}
          <h2 className="font-display mt-1 text-5xl leading-[0.95] text-[var(--color-light)] md:text-6xl lg:text-7xl">
            {headlineSub}
          </h2>

          {/* Descripción */}
          <p className="font-body mt-4 max-w-2xl text-sm leading-7 text-[var(--color-light)]/90 md:text-base">
            {description}
          </p>
        </div>

        {/* Derecha: CTA (pegado al borde) */}
        <div className="col-span-6 md:col-span-3 flex justify-end items-end">
          <a
            href={ctaHref}
            className="font-ui inline-flex items-center gap-3 rounded-md border border-[var(--color-light)] px-5 py-3 text-sm tracking-wider text-[var(--color-light)] uppercase transition hover:bg-[var(--color-light)] hover:text-[var(--color-dark)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-light)] focus-visible:ring-offset-2"
          >
            <span>{ctaText}</span>
            <svg
              aria-hidden="true"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="rotate-45 transform"
            >
              <path d="M12 2v2h6.59L3 19.59 4.41 21 20 5.41V12h2V2z"></path>
            </svg>
          </a>
        </div>
      </div>
    </section>
  );
}
