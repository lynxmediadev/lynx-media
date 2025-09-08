// src/components/admin/RowActions.tsx
"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente cliente: Acciones por fila (Listado)                             │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Objetivo (peras y manzanas):                                                │
 * │ - Acelerar el trabajo comercial sin cambiar el schema ni el backend.        │
 * │ - Acciones: responder por correo (mailto), copiar resumen, copiar email.    │
 * │ - Estética sobria, usando tokens de tu theme (bg-muted, border-border).     │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

type Props = {
  id: string;
  createdAtISO: string;
  name: string;
  email: string;
  company: string;
  projectType: string;
  media: string;
  territories: string;
  term: string;
  budgetAmount: number | null;
  budgetCurrency: string | null;
  trackTitle: string;
  trackArtist: string;
  trackId: string;
};

function money(amount: number | null, curr: string | null) {
  if (!amount || !curr) return "—";
  try {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: curr,
      maximumFractionDigits: curr === "CLP" ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount} ${curr}`;
  }
}

function Btn({
  children,
  onClick,
  as = "button",
  href,
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  as?: "button" | "a";
  href?: string;
  title?: string;
}) {
  const base =
    "inline-flex items-center justify-center rounded-md border border-border bg-muted px-2 py-1 text-xs transition-colors hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  if (as === "a" && href) {
    return (
      <a className={base} href={href} title={title}>
        {children}
      </a>
    );
  }
  return (
    <button type="button" className={base} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

export default function RowActions(props: Props) {
  // Construimos asunto/cuerpo concisos para mailto
  const subject = `Licencia — ${props.trackTitle || "Track"} (${props.projectType})`;
  const body = [
    `Hola ${props.name},`,
    ``,
    `Gracias por tu interés en licenciar "${props.trackTitle || "este track"}".`,
    `Resumen: ${props.projectType}${props.media ? ` · ${props.media}` : ""} | Territorios: ${
      props.territories || "—"
    } | Term: ${props.term || "—"} | Presupuesto: ${money(
      props.budgetAmount,
      props.budgetCurrency
    )}`,
    ``,
    `¿Te preparo una cotización formal o prefieres revisar alternativas del catálogo?`,
    ``,
    `Saludos,`,
    `Lynx Media`,
  ].join("\n");

  const mailtoHref = `mailto:${encodeURIComponent(
    props.email
  )}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  const summary = [
    `#${props.id} (${new Date(props.createdAtISO).toLocaleString()})`,
    `Solicitante: ${props.name} ${props.company ? `(${props.company})` : ""} · ${props.email}`,
    `Proyecto: ${props.projectType}${props.media ? ` · ${props.media}` : ""}`,
    `Territorios: ${props.territories || "—"} · Term: ${props.term || "—"}`,
    `Presupuesto: ${money(props.budgetAmount, props.budgetCurrency)}`,
    `Track: ${props.trackTitle || "—"} · ${props.trackArtist || "—"} · ID: ${props.trackId}`,
  ].join(" | ");

  async function copy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Silencioso; en un futuro se puede añadir un toast mínimo si lo deseas.
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      <Btn as="a" href={mailtoHref} title="Responder por correo">
        Mail
      </Btn>
      <Btn onClick={() => copy(summary)} title="Copiar resumen">
        Copiar
      </Btn>
      <Btn onClick={() => copy(props.email)} title="Copiar email">
        Email
      </Btn>
    </div>
  );
}
