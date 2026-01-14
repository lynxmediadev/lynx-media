"use client";

/**
 * src/components/home/ContactSection.tsx
 * =========================================================
 * PERAS Y MANZANAS
 * - Sección 5 (Contacto).
 * - CTA con dialog y formulario completo (shadcn/ui).
 * =========================================================
 */

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

interface ContactSectionProps {
  panelStyle: { height: string };
}

export default function ContactSection({ panelStyle }: ContactSectionProps) {
  const [open, setOpen] = useState(false);
  const [urgency, setUrgency] = useState([3]);
  const [serviceType, setServiceType] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitStatus, setSubmitStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [submitMessage, setSubmitMessage] = useState<string>("");
  const urgencyValue = urgency[0] ?? 3;
  const urgencyLabels = [
    "Muy flexible",
    "Flexible",
    "Normal",
    "Urgente",
    "Muy urgente",
  ];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitStatus("submitting");
    setSubmitMessage("");

    try {
      const res = await fetch("/api/contact-request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          serviceType,
          details,
          urgency: urgency[0] ?? 3,
          deadline: deadline || null,
          pageUrl: typeof window !== "undefined" ? window.location.href : null,
        }),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        throw new Error(data.error || "Error al enviar");
      }

      setSubmitStatus("success");
      setSubmitMessage("Solicitud enviada. Te contactaremos pronto.");
      setName("");
      setEmail("");
      setServiceType("");
      setDetails("");
      setDeadline("");
      setUrgency([3]);
    } catch (err) {
      setSubmitStatus("error");
      setSubmitMessage(
        err instanceof Error ? err.message : "No se pudo enviar."
      );
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSubmitStatus("idle");
      setSubmitMessage("");
    }
  }

  return (
    <section
      id="contact"
      className="flex snap-start items-center justify-center"
      style={panelStyle}
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 text-center">
        <div>
          <h2 className="text-balance text-3xl font-semibold md:text-5xl">
            Contacto
          </h2>
          <p className="mt-4 text-pretty text-muted-foreground md:text-lg">
            Si tienes un proyecto audiovisual o musical, necesitas grabar sonido
            directo, musica original para audiovisual, buscas un beat
            para producir musica o quieres amplificar un evento pequeño,
            conversemos y armamos una propuesta clara para tu caso.
          </p>
        </div>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="h-14 w-full gap-3 border border-foreground/80 bg-foreground/95 text-background text-base font-semibold shadow-sm transition-transform hover:bg-foreground hover:scale-[1.005] sm:w-auto sm:px-10"
            >
              <Mail className="h-5 w-5" />
              Contactar proyecto
            </Button>
          </DialogTrigger>

          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Formulario de contacto</DialogTitle>
              <DialogDescription>
                Completa los datos para entender el alcance y el timing del
                proyecto. Te respondemos con los proximos pasos.
              </DialogDescription>
            </DialogHeader>

            <form className="grid gap-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contact-name">Nombre</Label>
                  <Input
                    id="contact-name"
                    name="name"
                    type="text"
                    placeholder="Tu nombre"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="focus-visible:border-foreground focus-visible:ring-foreground/40"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    name="email"
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="focus-visible:border-foreground focus-visible:ring-foreground/40"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="contact-service">Tipo de servicio</Label>
                  <Select value={serviceType} onValueChange={setServiceType}>
                    <SelectTrigger
                      id="contact-service"
                      className="w-full focus-visible:border-foreground focus-visible:ring-foreground/40"
                    >
                      <SelectValue placeholder="Selecciona un servicio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="music-original">
                        Musica original para audiovisual
                      </SelectItem>
                      <SelectItem value="music-production">
                        Produccion, mix & master musical
                      </SelectItem>
                      <SelectItem value="post-audio">
                        Post-produccion de audio audiovisual
                      </SelectItem>
                      <SelectItem value="location-sound">
                        Sonido directo y registro en terreno
                      </SelectItem>
                      <SelectItem value="beat">
                        Beat personalizado para producir musica
                      </SelectItem>
                      <SelectItem value="live-sound">
                        Amplificacion y soporte tecnico
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="contact-deadline">
                    Plazo estimado de entrega
                  </Label>
                  <Input
                    id="contact-deadline"
                    name="deadline"
                    type="date"
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                    className="focus-visible:border-foreground focus-visible:ring-foreground/40"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="contact-details">Explicacion del proyecto</Label>
                <Textarea
                  id="contact-details"
                  name="details"
                  placeholder="Brief, referencias, duracion, formato, entregables, etc."
                  value={details}
                  onChange={(event) => setDetails(event.target.value)}
                  className="min-h-[140px] focus-visible:border-foreground focus-visible:ring-foreground/40"
                />
              </div>

              <div className="grid gap-3">
                <div className="flex items-center justify-between text-sm">
                  <Label
                    htmlFor="contact-urgency"
                    className="text-xs uppercase tracking-[0.2em]"
                  >
                    Urgencia
                  </Label>
                  <span className="text-muted-foreground">
                    {urgencyLabels[urgencyValue - 1]}
                  </span>
                </div>
                <Slider
                  id="contact-urgency"
                  min={1}
                  max={5}
                  step={1}
                  value={urgency}
                  onValueChange={setUrgency}
                  className="cursor-pointer"
                  trackClassName="bg-foreground/20"
                  rangeClassName="bg-foreground"
                  thumbClassName="size-5 border-foreground bg-background ring-foreground/30 hover:ring-foreground/40 focus-visible:ring-foreground/40 cursor-pointer active:cursor-grabbing"
                />
                <div className="mt-1 flex items-center justify-between">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span
                      key={`urgency-marker-${index}`}
                      className="h-1.5 w-1.5 rounded-full bg-foreground/40"
                    />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Menos urgente</span>
                  <span>Mas urgente</span>
                </div>
              </div>

              <div className="grid gap-3">
                <Button
                  type="submit"
                  className="w-full border border-foreground/80 bg-foreground text-background hover:bg-foreground/90"
                  disabled={submitStatus === "submitting"}
                >
                  {submitStatus === "submitting"
                    ? "Enviando..."
                    : "Enviar solicitud"}
                </Button>
                <p
                  className={[
                    "text-sm",
                    submitStatus === "success"
                      ? "text-foreground"
                      : "text-destructive",
                    submitStatus === "idle" ? "hidden" : "block",
                  ].join(" ")}
                  role="status"
                  aria-live="polite"
                >
                  {submitMessage}
                </p>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
