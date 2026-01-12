"use client";

/**
 * src/components/home/ServicesSection.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Sección 2 (Servicios).
 * - Desktop: grid de cards con hover sutil.
 * - Mobile: botones con "+" y modal ligero con detalle.
 * =========================================================
 */

import { useState } from "react";
import {
  Headphones,
  Mic,
  SlidersHorizontal,
  Speaker,
  Waves,
  X,
} from "lucide-react";

interface ServicesSectionProps {
  panelStyle: { height: string };
}

type ServiceItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: typeof Headphones;
};

const SERVICES: ServiceItem[] = [
  {
    id: "sync",
    title: "Música Original & Sync Licensing",
    description:
      "Composición musical, sync licensing e instrumentales listos para cine, publicidad y contenidos digitales.",
    href: "#servicios",
    icon: Headphones,
  },
  {
    id: "music-production",
    title: "Producción, Mix & Master Musical",
    description:
      "Producción musical integral, edición fina y mezcla/master para piezas discográficas y campañas.",
    href: "#servicios",
    icon: SlidersHorizontal,
  },
  {
    id: "post-audio",
    title: "Post-Producción de Audio Audiovisual",
    description:
      "Diseño sonoro, foley, edición, diálogos, ambientes, FX y restauración para proyectos audiovisuales.",
    href: "#servicios",
    icon: Waves,
  },
  {
    id: "location",
    title: "Registro Sonoro para proyectos Audiovisuales",
    description:
      "Registro en terreno de alta calidad: diálogos, ambientes y wild tracks para publicidad, documental o cine.",
    href: "#servicios",
    icon: Mic,
  },
  {
    id: "live",
    title: "Amplificación y soporte técnico",
    description:
      "Sonorización para eventos, rodajes y activaciones con monitoreo y operación en vivo.",
    href: "#servicios",
    icon: Speaker,
  },
];

export default function ServicesSection({ panelStyle }: ServicesSectionProps) {
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const activeService = SERVICES.find((service) => service.id === activeServiceId);

  return (
    <section
      id="services"
      className="flex snap-start items-center justify-center"
      style={panelStyle}
    >
      <div className="mx-auto flex w-full max-w-screen-2xl flex-col gap-10 px-6">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-semibold md:text-5xl">
            Servicios
          </h2>
          <p className="mt-4 text-muted-foreground md:text-lg">
            Audio de alto nivel para cine, marcas y contenido premium.
          </p>
        </div>

        {/* Mobile: botones con detalle en overlay */}
        <div className="flex flex-col gap-3 md:hidden">
          {SERVICES.map((service) => (
            <button
              key={service.id}
              type="button"
              onClick={() => setActiveServiceId(service.id)}
              className={[
                "flex items-center justify-between rounded-xl border border-border/60 px-4 py-4 text-left",
                "bg-background/40 text-base font-medium text-foreground",
                "transition-colors duration-200 hover:border-border hover:bg-background/60",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              ].join(" ")}
            >
              <span className="flex items-center gap-3">
                <service.icon className="h-5 w-5 text-muted-foreground" />
                <span>{service.title}</span>
              </span>
              <span className="text-lg text-muted-foreground">+</span>
            </button>
          ))}
        </div>

        {/* Desktop: cards */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-5">
          {SERVICES.map((service) => (
            <article
              key={service.id}
              className={[
                "group flex h-full flex-col rounded-2xl border border-border/60 bg-background/40 p-[22px]",
                "transition-transform duration-300 ease-out",
                "hover:-translate-y-1 hover:border-border hover:bg-background/60",
                "focus-within:-translate-y-1 focus-within:border-border focus-within:bg-background/60",
              ].join(" ")}
            >
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full border border-border/70 text-muted-foreground">
                <service.icon className="h-5 w-5" />
              </div>
              <h3 className="text-center text-lg font-semibold text-foreground">
                {service.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {service.description}
              </p>
              <div className="mt-auto pt-4">
                <a
                  href={service.href}
                  className={[
                    "inline-flex w-full items-center justify-center rounded-full",
                    "border border-border/70 px-5 py-2 text-sm font-medium text-foreground/90",
                    "transition-colors duration-200 hover:border-border hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  ].join(" ")}
                  aria-label={`Ver servicio: ${service.title}`}
                >
                  Ver mas
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>

      {activeService ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 px-6 md:hidden"
          onClick={() => setActiveServiceId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border/70 bg-background p-6 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-muted-foreground">
                  <activeService.icon className="h-4 w-4" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {activeService.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveServiceId(null)}
                className={[
                  "inline-flex h-9 w-9 items-center justify-center rounded-full",
                  "border border-border/60 text-muted-foreground",
                  "transition-colors duration-200 hover:border-border hover:text-foreground",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                ].join(" ")}
                aria-label="Cerrar tarjeta de servicio"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {activeService.description}
            </p>
            <a
              href={activeService.href}
              className={[
                "mt-8 inline-flex w-full items-center justify-center self-center rounded-full",
                "border border-border/70 px-5 py-2 text-sm font-medium text-foreground/90",
                "transition-colors duration-200 hover:border-border hover:text-foreground",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              ].join(" ")}
              aria-label={`Ver servicio: ${activeService.title}`}
            >
              Ver mas
            </a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
