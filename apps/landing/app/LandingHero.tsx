"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarDays, Mail, Volume1, Volume2, VolumeX } from "lucide-react";
import Image from "next/image";
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

const VOLUME_PRESETS_DB = [-20, -12, -5, 0] as const;
const DEFAULT_VOLUME_DB = -5;

function dbToLinear(db: number) {
  return Math.min(1, Math.max(0, Math.pow(10, db / 20)));
}

function FieldInfo({ text }: { text: string }) {
  return (
    <details className="relative inline-flex">
      <summary
        className={[
          "inline-flex h-[18px] w-[18px] cursor-pointer list-none items-center justify-center rounded-full",
          "border border-foreground/45 bg-background/65 text-[10px] font-bold text-foreground/90",
          "transition-colors hover:border-foreground/70 hover:bg-background/85",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "[&::-webkit-details-marker]:hidden",
        ].join(" ")}
        aria-label="Ver ayuda"
      >
        i
      </summary>
      <div
        className={[
          "absolute left-0 top-full z-30 mt-2 w-[min(18rem,calc(100vw-3rem))] rounded-lg",
          "border border-border/70 bg-popover/95 p-3 text-xs leading-relaxed text-popover-foreground shadow-xl backdrop-blur",
        ].join(" ")}
      >
        {text}
      </div>
    </details>
  );
}

export default function LandingHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const deadlineInputRef = useRef<HTMLInputElement | null>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [volumeDb, setVolumeDb] = useState(DEFAULT_VOLUME_DB);
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
      setSubmitMessage(err instanceof Error ? err.message : "No se pudo enviar.");
    }
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (nextOpen) {
      setSubmitStatus("idle");
      setSubmitMessage("");
    }
  }

  async function handleAudioToggle() {
    const nextMuted = !isMuted;
    const video = videoRef.current;
    setIsMuted(nextMuted);
    if (!video) return;
    video.muted = nextMuted;
    if (!video.paused) return;
    try {
      await video.play();
    } catch {
      // No-op: algunos navegadores bloquean play() según política de autoplay.
    }
  }

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = dbToLinear(volumeDb);
  }, [volumeDb]);

  async function handleVolumeCycle() {
    const currentIndex = VOLUME_PRESETS_DB.findIndex((db) => db === volumeDb);
    const nextIndex = currentIndex >= 0
      ? (currentIndex + 1) % VOLUME_PRESETS_DB.length
      : VOLUME_PRESETS_DB.indexOf(DEFAULT_VOLUME_DB);
    const nextDb = VOLUME_PRESETS_DB[nextIndex] ?? DEFAULT_VOLUME_DB;
    const video = videoRef.current;

    setVolumeDb(nextDb);
    if (!video) return;
    video.volume = dbToLinear(nextDb);
    if (!video.paused) return;
    try {
      await video.play();
    } catch {
      // No-op: algunos navegadores bloquean play() según política de autoplay.
    }
  }

  function openDeadlinePicker() {
    const input = deadlineInputRef.current;
    if (!input) return;
    input.focus();
    (input as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
  }

  return (
    <section className="landing-hero">
      <video
        ref={videoRef}
        className="landing-hero-video"
        autoPlay
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        aria-hidden="true"
      >
        <source src="/vid/ARMADO_2.mp4" type="video/mp4" />
      </video>
      <div className="landing-hero-overlay" aria-hidden="true" />
      <div
        className={[
          "landing-audio-controls fixed z-20 flex items-center gap-2",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={handleAudioToggle}
          className={[
            "inline-flex h-11 w-11 items-center justify-center rounded-full",
            "border border-foreground/45 bg-background/65 text-foreground backdrop-blur-md transition-colors",
            "hover:border-foreground/70 hover:bg-background/85",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          ].join(" ")}
          aria-label={isMuted ? "Activar sonido del video" : "Mutear sonido del video"}
          title={isMuted ? "Activar sonido" : "Mutear"}
        >
          {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
        </button>

        <button
          type="button"
          onClick={handleVolumeCycle}
          className={[
            "inline-flex h-11 min-w-[5rem] items-center justify-center gap-1.5 rounded-full px-3",
            "border border-foreground/45 bg-background/65 text-foreground backdrop-blur-md transition-colors",
            "hover:border-foreground/70 hover:bg-background/85",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          ].join(" ")}
          aria-label={`Cambiar volumen del video. Nivel actual ${volumeDb} decibelios`}
          title={`Volumen ${volumeDb} dB`}
        >
          {volumeDb <= -12 ? (
            <Volume1 className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          <span className="text-xs font-semibold tabular-nums">{volumeDb} dB</span>
        </button>
      </div>

      <div
        className={[
          "landing-logo-badge fixed z-20 pointer-events-none select-none",
        ].join(" ")}
        aria-hidden="true"
      >
        <Image
          src="/images/logo/lynx-logo.svg"
          alt="Lynx Media"
          width={1124}
          height={328}
          className="h-auto w-15 object-contain md:w-[60px] md:mb-5 mb-0"
        />
      </div>

      <div className="landing-hero-content">
        <h1 className="text-balance text-3xl font-semibold tracking-tight md:text-5xl">
          Creamos identidad sonora para tus proyectos audiovisuales.
        </h1>
        <p className="mt-4 text-pretty text-base text-muted-foreground md:text-lg">
          Precisión técnica, criterio estético y entrega profesional.
        </p>

        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogTrigger asChild>
            <Button
              size="lg"
              className="mt-8 h-14 w-full gap-3 border border-foreground/80 bg-foreground/95 text-base font-semibold text-background shadow-sm transition-transform hover:scale-[1.005] hover:bg-foreground sm:w-auto sm:px-10"
            >
              <Mail className="h-5 w-5" />
              Contactar proyecto
            </Button>
          </DialogTrigger>

          <DialogContent
            className={[
              "left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0",
              "overflow-hidden rounded-none border-0 p-0",
              "sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2",
              "sm:overflow-y-auto sm:rounded-2xl sm:border sm:p-6",
            ].join(" ")}
          >
            <div className="flex h-full min-h-0 flex-col">
              <DialogHeader className="shrink-0 px-4 pt-[calc(env(safe-area-inset-top)+0.25rem)] sm:px-0 sm:pt-0">
                <DialogTitle>Formulario de contacto</DialogTitle>
                <DialogDescription>
                  Completa los datos para entender el alcance y el timing del
                  proyecto. Te respondemos con los proximos pasos.
                </DialogDescription>
              </DialogHeader>

              <form
                className={[
                  "landing-form-scroll grid min-h-0 flex-1 content-start gap-6 overflow-y-auto overscroll-y-contain px-4",
                  "pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-0 sm:pb-0 sm:pt-6",
                ].join(" ")}
                onSubmit={handleSubmit}
              >
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
                    required
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
                    required
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="contact-service">Tipo de servicio</Label>
                    <FieldInfo text="Selecciona el servicio principal que más se parezca a tu necesidad actual." />
                  </div>
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
                  <div className="flex items-center gap-2">
                    <Label htmlFor="contact-deadline">
                      Plazo estimado de entrega
                    </Label>
                    <FieldInfo text="Indica una fecha tentativa. Si no tienes fecha definida, puedes dejar este campo vacío." />
                  </div>
                  <div className="relative">
                    <Input
                      ref={deadlineInputRef}
                      id="contact-deadline"
                      name="deadline"
                      type="date"
                      value={deadline}
                      onChange={(event) => setDeadline(event.target.value)}
                      className="landing-date-input pr-11 focus-visible:border-foreground focus-visible:ring-foreground/40"
                    />
                    <button
                      type="button"
                      onClick={openDeadlinePicker}
                      className={[
                        "absolute right-1.5 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md",
                        "text-muted-foreground transition-colors hover:text-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      ].join(" ")}
                      aria-label="Abrir calendario"
                      title="Abrir calendario"
                    >
                      <CalendarDays className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="contact-details">Explicacion del proyecto</Label>
                  <FieldInfo text="Describe el objetivo, referencias, formato y entregables esperados. Mientras más contexto, mejor propuesta." />
                </div>
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
                  <div className="flex items-center gap-2">
                    <Label
                      htmlFor="contact-urgency"
                      className="text-xs uppercase tracking-[0.2em]"
                    >
                      Urgencia
                    </Label>
                    <FieldInfo text="Marca qué tan ajustado está tu timing. Esto nos ayuda a priorizar y planificar tiempos de respuesta." />
                  </div>
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
                  thumbClassName="size-5 cursor-pointer border-foreground bg-background ring-foreground/30 hover:ring-foreground/40 focus-visible:ring-foreground/40 active:cursor-grabbing"
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
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
