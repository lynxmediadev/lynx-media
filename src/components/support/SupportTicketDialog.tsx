"use client";

import { type FormEvent, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, Wrench } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type TicketSource = "NOT_FOUND" | "ERROR_PAGE" | "MANUAL";
type TicketSeverity = "LOW" | "MEDIUM" | "HIGH";

type SubmitState =
  | { type: "idle" }
  | { type: "saving" }
  | { type: "success"; message: string }
  | { type: "error"; message: string };

const severityOptions: Array<{ value: TicketSeverity; label: string }> = [
  { value: "LOW", label: "Baja" },
  { value: "MEDIUM", label: "Media" },
  { value: "HIGH", label: "Alta" },
];

export function SupportTicketDialog({
  source,
  pageUrl,
  errorDigest,
  triggerLabel = "contactar soporte",
  className,
}: {
  source: TicketSource;
  pageUrl?: string;
  errorDigest?: string | null;
  triggerLabel?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState("");
  const [details, setDetails] = useState("");
  const [email, setEmail] = useState("");
  const [severity, setSeverity] = useState<TicketSeverity>("MEDIUM");
  const [website, setWebsite] = useState("");
  const [submitState, setSubmitState] = useState<SubmitState>({ type: "idle" });
  const startedAtRef = useRef<number>(Date.now());

  const resolvedPageUrl = useMemo(() => {
    if (pageUrl && pageUrl.trim()) return pageUrl.trim();
    if (typeof window !== "undefined") {
      return `${window.location.origin}${window.location.pathname}${window.location.search}`;
    }
    return "";
  }, [pageUrl]);

  const suggestedSummary = useMemo(() => {
    if (!resolvedPageUrl) return source === "ERROR_PAGE" ? "Error en pagina" : "Incidencia tecnica";
    try {
      const url = new URL(resolvedPageUrl);
      if (source === "NOT_FOUND") return `404 en ${url.pathname}`;
      if (source === "ERROR_PAGE") return `Error en ${url.pathname}`;
      return `Incidencia en ${url.pathname}`;
    } catch {
      if (source === "NOT_FOUND") return `404 en ${resolvedPageUrl}`;
      if (source === "ERROR_PAGE") return `Error en ${resolvedPageUrl}`;
      return `Incidencia en ${resolvedPageUrl}`;
    }
  }, [resolvedPageUrl, source]);

  function resetFormState() {
    setSummary("");
    setDetails("");
    setEmail("");
    setSeverity("MEDIUM");
    setWebsite("");
    setSubmitState({ type: "idle" });
    startedAtRef.current = Date.now();
  }

  async function submitTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitState.type === "saving") return;

    setSubmitState({ type: "saving" });

    try {
      const response = await fetch("/api/support-tickets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          source,
          pageUrl: resolvedPageUrl,
          summary,
          details,
          email,
          severity,
          website,
          startedAt: startedAtRef.current,
          errorDigest: errorDigest ?? undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; retryAfterSec?: number }
        | null;

      if (!response.ok || !payload?.ok) {
        if (payload?.error === "rate_limited") {
          setSubmitState({
            type: "error",
            message: `Demasiados intentos. Reintenta en ${payload.retryAfterSec ?? 60}s.`,
          });
          return;
        }

        setSubmitState({
          type: "error",
          message: "No se pudo enviar el ticket. Revisa los campos e intenta otra vez.",
        });
        return;
      }

      setSubmitState({
        type: "success",
        message: "Ticket enviado. El equipo tecnico lo revisara.",
      });
      window.setTimeout(() => {
        setOpen(false);
        resetFormState();
      }, 900);
    } catch {
      setSubmitState({
        type: "error",
        message: "No se pudo enviar el ticket. Revisa tu conexion e intenta otra vez.",
      });
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          startedAtRef.current = Date.now();
          setSubmitState({ type: "idle" });
          setSummary((current) => current || suggestedSummary);
        }
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-sm underline decoration-dotted underline-offset-4 transition-colors",
            className,
          )}
        >
          <Wrench className="h-3.5 w-3.5" aria-hidden="true" />
          {triggerLabel}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-xl border-border/70 bg-background/95 backdrop-blur">
        <DialogHeader>
          <DialogTitle className="text-base">Reportar problema tecnico</DialogTitle>
          <DialogDescription>
            Envia un ticket corto con lo que paso. Lo recibe el equipo de soporte interno.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-3" onSubmit={submitTicket}>
          <div className="space-y-1.5">
            <Label htmlFor="ticket-summary">Resumen</Label>
            <Input
              id="ticket-summary"
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              minLength={8}
              maxLength={140}
              required
              placeholder="Ej: Error 404 al abrir un track"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ticket-details">Detalle</Label>
            <Textarea
              id="ticket-details"
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              minLength={16}
              maxLength={4000}
              required
              rows={4}
              placeholder="Cuenta los pasos para reproducirlo y lo que esperabas que ocurriera."
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ticket-email">Email de contacto (opcional)</Label>
              <Input
                id="ticket-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                maxLength={255}
                placeholder="tu@email.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-severity">Severidad</Label>
              <select
                id="ticket-severity"
                value={severity}
                onChange={(event) => setSeverity(event.target.value as TicketSeverity)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              >
                {severityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <input
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
            className="hidden"
            aria-hidden="true"
          />

          {resolvedPageUrl ? (
            <p className="text-muted-foreground break-all text-xs">URL: {resolvedPageUrl}</p>
          ) : null}

          {submitState.type === "error" ? (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 px-2 py-1 text-xs text-destructive">
              {submitState.message}
            </p>
          ) : null}

          {submitState.type === "success" ? (
            <p className="rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
              {submitState.message}
            </p>
          ) : null}

          {errorDigest ? (
            <p className="text-muted-foreground inline-flex items-center gap-1 text-[11px]">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
              Error digest: {errorDigest}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setOpen(false);
              }}
              disabled={submitState.type === "saving"}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitState.type === "saving"}>
              {submitState.type === "saving" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar ticket"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
