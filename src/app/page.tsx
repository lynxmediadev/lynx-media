import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type SimpleService = {
  title: string;
  description: string;
};

type DetailedService = {
  id: number;
  title: string;
  description: string;
  category: "Audiovisual" | "Musical" | "Sync";
};

type ProcessStep = {
  id: number;
  title: string;
  description: string;
};

type ProjectType = {
  label: string;
  title: string;
  description: string;
};

type BlogPost = {
  category: string;
  title: string;
  excerpt: string;
};

const AUDIOVISUAL_SERVICES: SimpleService[] = [
  {
    title: "Audio directo en locación",
    description:
      "Captura de sonido en set para comerciales, documentales, cortometrajes, series y piezas digitales.",
  },
  {
    title: "Postproducción de sonido",
    description:
      "Edición, limpieza, restauración, mezcla y master según estándares broadcast y plataformas.",
  },
  {
    title: "Diseño sonoro y Foley",
    description:
      "Creación de ambientes, FX y Foley originales para potenciar la narrativa y el lenguaje visual.",
  },
  {
    title: "Composición musical para imagen",
    description:
      "Música original alineada al ritmo de montaje, tono emocional y objetivos del proyecto.",
  },
];

const MUSIC_SERVICES: SimpleService[] = [
  {
    title: "Mezcla y masterización",
    description:
      "Mix y master profesionales para singles y álbumes listos para distribución digital y físico.",
  },
  {
    title: "Grabación en calidad estudio",
    description:
      "Sesiones de grabación para voces e instrumentos con cadena profesional de estudio.",
  },
  {
    title: "Beats e instrumentales originales",
    description:
      "Creación de beats y bases exclusivas para artistas, sellos y proyectos de sync.",
  },
  {
    title: "Producción completa de proyectos",
    description:
      "Acompañamiento integral: preproducción, grabación, edición, mezcla y entrega final.",
  },
];

const DETAILED_SERVICES: DetailedService[] = [
  {
    id: 1,
    title: "Producción de sonido para Audiovisual",
    description:
      "Desde el audio directo hasta la mezcla final. Un pipeline completo para cine, TV, publicidad y contenido digital.",
    category: "Audiovisual",
  },
  {
    id: 2,
    title: "Postproducción, diseño sonoro y Foley",
    description:
      "Edición detallada, FX, ambientes y Foley diseñados a medida para construir mundos sonoros sólidos.",
    category: "Audiovisual",
  },
  {
    id: 3,
    title: "Producción y mezcla musical",
    description:
      "Producción artística, mezcla y master para lanzamientos discográficos y piezas musicales para sincronización.",
    category: "Musical",
  },
  {
    id: 4,
    title: "Catálogo y Sync Licensing",
    description:
      "Catálogo propio de obras listas para sincronizar, con gestión de metadata y derechos desde Lynx Media.",
    category: "Sync",
  },
  {
    id: 5,
    title: "Contenido para marcas y redes",
    description:
      "Producción de audio y video para campañas, reels, podcast y activaciones digitales.",
    category: "Audiovisual",
  },
  {
    id: 6,
    title: "Proyectos a medida",
    description:
      "Soluciones específicas para proyectos híbridos de arte, instalación, experiencias inmersivas y más.",
    category: "Sync",
  },
];

const PROCESS_STEPS: ProcessStep[] = [
  {
    id: 1,
    title: "Brief y diagnóstico",
    description:
      "Escuchamos el proyecto, definimos objetivos, contexto de exhibición y alcances técnicos y creativos.",
  },
  {
    id: 2,
    title: "Diseño y planificación",
    description:
      "Levantamos necesidades de sonido, música y producción, proponiendo un plan de trabajo claro y ordenado.",
  },
  {
    id: 3,
    title: "Producción y postproducción",
    description:
      "Ejecutamos grabaciones, diseño sonoro, mezcla, master y entregas técnicas según especificaciones.",
  },
  {
    id: 4,
    title: "Entrega y seguimiento",
    description:
      "Entregamos los masters finales, stems y documentación técnica, acompañando los ajustes finales del proyecto.",
  },
];

const PROJECT_TYPES: ProjectType[] = [
  {
    label: "Comerciales & Branded Content",
    title: "Campañas para TV, cine y redes",
    description:
      "Spots, piezas para redes, campañas integradas y contenido de marca que requieren sonido y música alineados a la identidad.",
  },
  {
    label: "Cine, Documental & Series",
    title: "Narrativas long form",
    description:
      "Largometrajes, cortos y series donde el diseño sonoro, los diálogos y la música cuentan la historia junto a la imagen.",
  },
  {
    label: "Videojuegos & Experiencias",
    title: "Interactividad y diseño inmersivo",
    description:
      "Diseño sonoro y música adaptativa para juegos, instalaciones interactivas y experiencias inmersivas.",
  },
  {
    label: "Música & Catálogo",
    title: "Lanzamientos y obras para sync",
    description:
      "Producción musical y catálogo de obras enfocadas en sincronización, listas para licenciamiento.",
  },
];

const BLOG_POSTS: BlogPost[] = [
  {
    category: "Notas de estudio",
    title: "Cómo pensar el sonido en un spot de 15 segundos",
    excerpt:
      "Timing, ritmo y claridad: claves para que la pieza funcione igual de bien con y sin imagen.",
  },
  {
    category: "Sync & Industria",
    title: "Elementos básicos de un buen master para sincronización",
    excerpt:
      "Loudness, headroom, stems y metadata: aspectos que facilitan el trabajo de supervisores y postproductoras.",
  },
  {
    category: "Procesos creativos",
    title: "Diseño sonoro como narrativa, no solo como efecto",
    excerpt:
      "Cómo construir ambientes y transiciones sonoras que acompañen el montaje y la historia.",
  },
];

function SectionShell({ children }: { children: ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-6xl px-4 py-16 lg:px-6 lg:py-20">
      {children}
    </section>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--lm-page-bg)] text-[var(--lm-text-main)]">
      {/* HERO PRINCIPAL – inspirado en hero de Antra */}
      <section className="relative isolate overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/images/home/hero-lynx.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col justify-center px-4 py-24 lg:px-6">
          <div className="max-w-xl space-y-5">
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-200">
              <span className="h-1 w-1 rounded-full bg-[var(--lm-accent)]" />
              Estudio de sonido · Música · Imagen
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Diseñamos el sonido
              <br />
              que sostiene tu imagen.
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-slate-200 sm:text-base">
              Lynx Media integra producción sonora, postproducción, diseño sonoro y música original
              para proyectos audiovisuales, contenido de marca y lanzamientos musicales.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-full bg-[var(--lm-accent)] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.02] hover:bg-[var(--lm-accent-alt)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--lm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                Explorar catálogo para Sync
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="#services"
                className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/15"
              >
                Ver servicios
              </Link>
            </div>
          </div>

          <div className="mt-16 flex items-center">
            <a
              href="#services"
              className="group inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white hover:bg-white/20"
            >
              <span className="translate-y-0.5 text-lg group-hover:translate-y-1 transition-transform">
                ↓
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* SECCIÓN: QUÉ HACEMOS – tarjetas de servicios principales (4 + 4) */}
      <SectionShell>
        <div id="services" className="space-y-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-text-muted)]">
                Quiénes somos
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Experiencia en audio{" "}
                <span className="text-[var(--lm-accent)]">para imagen y música</span>.
              </h2>
              <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
                Lynx Media es un estudio dedicado a la producción y postproducción de sonido, diseño
                sonoro, composición musical y catálogo para sincronización. Trabajamos con
                productoras, agencias, directores, artistas y sellos que necesitan un aliado técnico
                y creativo en audio.
              </p>
            </div>
            <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
              Cubrimos todo el flujo de audio: desde la captura en set hasta el master final y la
              gestión de metadata para sync. Nuestro foco está en construir una capa sonora que
              traduzca bien en distintos formatos y plataformas, respetando el lenguaje de cada
              proyecto.
            </p>
          </div>

          {/* Tarjetas tipo Antra – primera fila Audiovisual */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {AUDIOVISUAL_SERVICES.map((service) => (
              <article
                key={service.title}
                className="flex h-full flex-col justify-between rounded-3xl border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] px-5 py-6 shadow-sm"
              >
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">{service.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                    {service.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--lm-text-muted)]">
                  <span>Audiovisual</span>
                  <span className="h-7 w-7 rounded-full border border-[var(--lm-accent-soft)] bg-[var(--lm-accent-soft)]" />
                </div>
              </article>
            ))}
          </div>

          {/* Segunda fila – Musical */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {MUSIC_SERVICES.map((service) => (
              <article
                key={service.title}
                className="flex h-full flex-col justify-between rounded-3xl border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] px-5 py-6 shadow-sm"
              >
                <div className="space-y-3">
                  <h3 className="text-base font-semibold">{service.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                    {service.description}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--lm-text-muted)]">
                  <span>Musical</span>
                  <span className="h-7 w-7 rounded-full border border-[var(--lm-surface-border)]" />
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* BLOQUE OSCURO PARTIDO – “estudio” + imagen (inspirado en tercer screenshot) */}
      <section className="bg-[var(--lm-text-main)] text-white">
        <SectionShell>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] lg:items-center">
            <div className="space-y-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-accent)]">
                Estudio · Lynx Media
              </p>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Donde el sonido, la música y la imagen{" "}
                <span className="text-[var(--lm-accent)]">se encuentran</span>.
              </h2>
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <ul className="space-y-2 text-slate-100">
                  <li>• Producción y post de audio para audiovisuales.</li>
                  <li>• Diseño sonoro, Foley y ambientes originales.</li>
                  <li>• Composición musical original y catálogo propio.</li>
                </ul>
                <ul className="space-y-2 text-slate-100">
                  <li>• Estándares técnicos alineados a la industria.</li>
                  <li>• Entregas en stems, masters y versiones alternativas.</li>
                  <li>• Acompañamiento desde el rodaje hasta el estreno.</li>
                </ul>
              </div>
              <p className="text-xs text-slate-300">
                Cada proyecto se aborda combinando criterio artístico, precisión técnica y una
                comunicación clara con el equipo creativo y de postproducción.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--lm-accent)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--lm-accent-alt)]"
                >
                  Ver catálogo para Sync
                </Link>
                <a
                  href="#process"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
                >
                  Ver proceso de trabajo
                </a>
              </div>
            </div>
            <div className="relative h-72 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 sm:h-80 lg:h-96">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('/images/home/studio-lynx.jpg')" }}
              />
              <div className="absolute inset-0 bg-black/25" />
            </div>
          </div>
        </SectionShell>
      </section>

      {/* SERVICIOS DETALLADOS – imagen + lista numerada */}
      <SectionShell>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-text-muted)]">
              Servicios
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Explora nuestros servicios{" "}
              <span className="text-[var(--lm-accent)]">para audiovisual y música</span>.
            </h2>
            <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
              Diseñamos soluciones completas de audio para proyectos con necesidades específicas de
              grabación, postproducción, música original, licenciamiento y contenido para marcas.
            </p>
            <div className="relative mt-6 overflow-hidden rounded-[1.75rem] border border-[var(--lm-surface-border)] bg-black/5">
              <div
                className="aspect-[16/10] w-full bg-cover bg-center"
                style={{ backgroundImage: "url('/images/home/services-audio.jpg')" }}
              />
              <div className="absolute bottom-4 left-4 right-4 rounded-2xl bg-black/65 px-4 py-3 text-xs text-slate-100 backdrop-blur">
                Audio directo, diseño sonoro, música y catálogo integrados a una única casa de
                producción.
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-3xl border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] p-4 sm:p-5">
            {DETAILED_SERVICES.map((service) => (
              <div
                key={service.id}
                className="flex items-start gap-4 rounded-2xl px-3 py-3 hover:bg-[var(--lm-accent-soft)]/60"
              >
                <div className="mt-1 text-xs font-semibold text-[var(--lm-text-muted)]">
                  {String(service.id).padStart(2, "0")}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold">{service.title}</h3>
                    <span className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--lm-accent)]">
                      {service.category}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* PROCESO – tarjetas numeradas (inspirado en sección HOW WE WORK) */}
      <SectionShell>
        <div id="process" className="space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-text-muted)]">
              Cómo trabajamos
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Un proceso claro{" "}
              <span className="text-[var(--lm-accent)]">para proyectos complejos</span>.
            </h2>
            <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
              Nuestro flujo acompaña al equipo creativo y técnico desde la definición del proyecto
              hasta la entrega final, cuidando tiempos, estándares y comunicación.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {PROCESS_STEPS.map((step) => (
              <article
                key={step.id}
                className="flex h-full flex-col justify-between rounded-3xl border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] p-5 shadow-sm"
              >
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--lm-accent)]">
                    {String(step.id).padStart(2, "0")}.
                  </p>
                  <h3 className="text-sm font-semibold">{step.title}</h3>
                  <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                    {step.description}
                  </p>
                </div>
                <p className="mt-4 text-right text-4xl font-semibold text-[var(--lm-surface-border)]">
                  {String(step.id).padStart(2, "0")}
                </p>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* PROYECTOS / TIPOS DE TRABAJO – cards grandes (inspirado en OUR PROJECTS) */}
      <SectionShell>
        <div className="space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-text-muted)]">
              Proyectos
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Tipos de proyectos{" "}
              <span className="text-[var(--lm-accent)]">que trabajamos habitualmente</span>.
            </h2>
            <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
              Cada categoría tiene exigencias distintas en términos de timing, narrativa y
              especificaciones técnicas. Adaptamos nuestro flujo a cada una.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {PROJECT_TYPES.slice(0, 3).map((project) => (
              <article
                key={project.title}
                className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] shadow-sm"
              >
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center"
                  style={{ backgroundImage: "url('/images/home/project-generic.jpg')" }}
                />
                <div className="flex flex-1 flex-col justify-between px-5 pb-5 pt-4">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full bg-[var(--lm-accent-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--lm-accent)]">
                      {project.label}
                    </span>
                    <h3 className="text-base font-semibold">{project.title}</h3>
                    <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                      {project.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* EQUIPO / SOBRE LYNX – layout tipo Antra “Meet the experts” */}
      <SectionShell>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)] lg:items-center">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-text-muted)]">
              Estudio Lynx
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Un estudio pequeño{" "}
              <span className="text-[var(--lm-accent)]">con mentalidad de casa de post</span>.
            </h2>
            <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
              Lynx Media nace desde la ingeniería en sonido, la producción musical y la experiencia
              trabajando junto a productoras, artistas y equipos de postproducción. El foco está en
              resolver proyectos con detalle y comunicación clara.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-[var(--lm-text-main)]">
              <li>01 · Dirección de sonido y mezcla final.</li>
              <li>02 · Diseño sonoro, Foley y ambientes.</li>
              <li>03 · Producción musical para artistas y sync.</li>
              <li>04 · Coordinación técnica y entrega a postproductoras.</li>
            </ul>
          </div>
          <div className="flex flex-col gap-4 rounded-3xl border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] p-5 shadow-sm sm:flex-row sm:items-center">
            <div className="h-40 w-40 flex-shrink-0 overflow-hidden rounded-2xl bg-black/10 sm:h-48 sm:w-48">
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: "url('/images/home/team-diego.jpg')" }}
              />
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-accent)]">
                  Dirección
                </p>
                <p className="text-base font-semibold">Diego Fernández · Lynx Media</p>
                <p className="text-xs text-[var(--lm-text-muted)]">
                  Ingeniería en sonido, mezcla, diseño sonoro y producción musical.
                </p>
              </div>
              <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                Para proyectos de mayor escala trabajamos con una red de colaboradores en cámara,
                diseño, animación, música y postproducción, conformando equipos a la medida según
                cada proyecto.
              </p>
            </div>
          </div>
        </div>
      </SectionShell>

      {/* BLOG / NOTAS – cards (placeholder, inspirado en sección blog) */}
      <SectionShell>
        <div className="space-y-10">
          <div className="max-w-3xl space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-text-muted)]">
              Notas y recursos
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Miradas sobre sonido,{" "}
              <span className="text-[var(--lm-accent)]">música y sincronización</span>.
            </h2>
            <p className="text-sm leading-relaxed text-[var(--lm-text-muted)]">
              Una selección de ideas, aprendizajes de proyectos y conceptos técnicos explicados de
              forma clara para equipos creativos y de producción.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {BLOG_POSTS.map((post) => (
              <article
                key={post.title}
                className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] shadow-sm"
              >
                <div
                  className="aspect-[4/3] w-full bg-cover bg-center"
                  style={{ backgroundImage: "url('/images/home/blog-placeholder.jpg')" }}
                />
                <div className="flex flex-1 flex-col justify-between px-5 pb-5 pt-4">
                  <div className="space-y-2">
                    <span className="inline-flex rounded-full bg-[var(--lm-accent-soft)] px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-[var(--lm-accent)]">
                      {post.category}
                    </span>
                    <h3 className="text-base font-semibold">{post.title}</h3>
                    <p className="text-xs leading-relaxed text-[var(--lm-text-muted)]">
                      {post.excerpt}
                    </p>
                  </div>
                  <p className="mt-4 text-xs font-medium text-[var(--lm-accent)]">
                    Próximamente · Blog de Lynx Media
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </SectionShell>

      {/* CTA NEWSLETTER / CONTACTO – inspirado en “Join our newsletter” */}
      <SectionShell>
        <div className="space-y-6 rounded-3xl border border-[var(--lm-surface-border)] bg-[var(--lm-surface-bg)] px-6 py-10 text-center shadow-sm md:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-text-muted)]">
            Mantente al tanto
          </p>
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Únete a las novedades de{" "}
            <span className="text-[var(--lm-accent)]">Lynx Media</span>.
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--lm-text-muted)]">
            Próximamente compartiremos notas técnicas, publicaciones de catálogo y convocatorias
            para colaboraciones. Mientras tanto, puedes escribirnos directamente para hablar de tu
            proyecto.
          </p>
          <div className="flex flex-col items-center justify-center gap-3 pt-2 sm:flex-row">
            <Link
              href="mailto:contacto@lynxmedia.cl"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--lm-accent)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--lm-accent-alt)]"
            >
              Escribir a Lynx Media
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-xs text-[var(--lm-text-muted)]">
              También podemos coordinar una reunión para revisar tu proyecto en detalle.
            </p>
          </div>
        </div>
      </SectionShell>

      {/* FOOTER OSCURO – inspirado en footer de Antra */}
      <footer className="border-t border-black/40 bg-black text-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 text-sm lg:flex-row lg:justify-between lg:px-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lm-accent)]">
              Lynx Media
            </p>
            <p className="max-w-sm text-sm text-slate-200">
              Estudio de audio, diseño sonoro, música original y catálogo para sincronización en
              cine, TV, publicidad, videojuegos y proyectos musicales.
            </p>
            <p className="text-xs text-slate-400">
              Santiago de Chile · Trabajo remoto y presencial según proyecto.
            </p>
          </div>
          <div className="grid gap-8 text-xs sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <p className="font-semibold text-slate-100">Servicios</p>
              <ul className="space-y-1 text-slate-300">
                <li>Audio directo y postproducción</li>
                <li>Diseño sonoro y Foley</li>
                <li>Composición y producción musical</li>
                <li>Catálogo y Sync Licensing</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-100">Enlaces</p>
              <ul className="space-y-1 text-slate-300">
                <li>
                  <Link href="/catalog" className="hover:text-white">
                    Catálogo público
                  </Link>
                </li>
                <li>Servicios para audiovisual</li>
                <li>Servicios para música</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-100">Contacto</p>
              <ul className="space-y-1 text-slate-300">
                <li>
                  <a href="mailto:contacto@lynxmedia.cl" className="hover:text-white">
                    contacto@lynxmedia.cl
                  </a>
                </li>
                <li>Redes · Próximamente</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-4 text-[0.7rem] text-slate-500 sm:flex-row lg:px-6">
            <p>© {new Date().getFullYear()} Lynx Media. Todos los derechos reservados.</p>
            <p>Audio · Música · Imagen · Sync Licensing.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
