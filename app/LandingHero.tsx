"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Disc3,
  Film,
  Info,
  Mail,
  MicVocal,
  Music2,
  SlidersHorizontal,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
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
const SERVICE_OPTIONS = [
  {
    value: "music-original",
    label: "Música Original para Audiovisual",
    icon: Music2,
  },
  {
    value: "music-production",
    label: "Producción Musical (Mix & Master)",
    icon: SlidersHorizontal,
  },
  {
    value: "post-audio",
    label: "Diseño Sonoro Audiovisual",
    icon: Film,
  },
  {
    value: "location-sound",
    label: "Sonido Directo y Registro en Terreno",
    icon: MicVocal,
  },
  {
    value: "beat",
    label: "Beat Personalizado para Producción Musical",
    icon: Disc3,
  },
  {
    value: "live-sound",
    label: "Amplificación y Soporte Técnico",
    icon: Volume2,
  },
] as const;

function dbToLinear(db: number) {
  return Math.min(1, Math.max(0, Math.pow(10, db / 20)));
}

function toIsoDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateForLabel(value: string) {
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function parseIsoDate(value: string) {
  const [yearRaw, monthRaw, dayRaw] = value.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatMonthYear(date: Date, locale = "es-CL") {
  const month = new Intl.DateTimeFormat(locale, { month: "long" }).format(date);
  const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
  return `${monthCapitalized} ${date.getFullYear()}`;
}

function FieldInfo({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      className={[
        "inline-flex h-5 w-5 shrink-0 items-center justify-center p-0",
        "text-muted-foreground transition-colors hover:text-foreground",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      ].join(" ")}
      style={{ borderRadius: "9999px" }}
      aria-label="Ver ayuda"
      onClick={onOpen}
    >
      <Info className="h-4 w-4" />
    </button>
  );
}

export default function LandingHero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mobileDialogHistoryEntryActiveRef = useRef(false);
  const mobileOverlayHistoryEntryActiveRef = useRef(false);
  const suppressNextPopStateRef = useRef(false);
  const todayDate = useMemo(() => startOfDay(new Date()), []);
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
  const [activeInfo, setActiveInfo] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const [mobileServicePickerOpen, setMobileServicePickerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(startOfMonth(todayDate));
  const urgencyValue = urgency[0] ?? 3;
  const urgencyLabels = [
    "Muy flexible",
    "Flexible",
    "Normal",
    "Urgente",
    "Muy urgente",
  ];
  const selectedServiceOption = SERVICE_OPTIONS.find((option) => option.value === serviceType);
  const selectedDeadlineDate = useMemo(() => parseIsoDate(deadline), [deadline]);
  const todayIso = useMemo(() => toIsoDate(todayDate), [todayDate]);
  const hasTransientOverlayOpen = Boolean(activeInfo || mobileServicePickerOpen || calendarOpen);

  function isMobileViewport() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 639px)").matches;
  }

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
    if (!nextOpen && activeInfo) {
      setActiveInfo(null);
      return;
    }
    if (!nextOpen && mobileServicePickerOpen) {
      setMobileServicePickerOpen(false);
      return;
    }
    if (!nextOpen && calendarOpen) {
      setCalendarOpen(false);
      return;
    }
    if (!nextOpen && mobileDialogHistoryEntryActiveRef.current) {
      window.history.back();
      return;
    }

    setOpen(nextOpen);
    if (!nextOpen) {
      setActiveInfo(null);
      setMobileServicePickerOpen(false);
      setCalendarOpen(false);
      return;
    }
    if (nextOpen) {
      setSubmitStatus("idle");
      setSubmitMessage("");
    }
  }

  useEffect(() => {
    if (!open) {
      mobileDialogHistoryEntryActiveRef.current = false;
      mobileOverlayHistoryEntryActiveRef.current = false;
      return;
    }
    if (mobileDialogHistoryEntryActiveRef.current || !isMobileViewport()) return;
    window.history.pushState({ __landingContactDialog: true }, "");
    mobileDialogHistoryEntryActiveRef.current = true;
  }, [open]);

  useEffect(() => {
    if (!open || !mobileDialogHistoryEntryActiveRef.current || !isMobileViewport()) return;

    if (hasTransientOverlayOpen && !mobileOverlayHistoryEntryActiveRef.current) {
      window.history.pushState({ __landingContactOverlay: true }, "");
      mobileOverlayHistoryEntryActiveRef.current = true;
      return;
    }

    if (!hasTransientOverlayOpen && mobileOverlayHistoryEntryActiveRef.current) {
      mobileOverlayHistoryEntryActiveRef.current = false;
      suppressNextPopStateRef.current = true;
      window.history.back();
    }
  }, [open, hasTransientOverlayOpen]);

  useEffect(() => {
    const handlePopState = () => {
      if (suppressNextPopStateRef.current) {
        suppressNextPopStateRef.current = false;
        return;
      }
      if (!mobileDialogHistoryEntryActiveRef.current) return;
      if (mobileOverlayHistoryEntryActiveRef.current) {
        mobileOverlayHistoryEntryActiveRef.current = false;
        setActiveInfo(null);
        setMobileServicePickerOpen(false);
        setCalendarOpen(false);
        return;
      }

      mobileDialogHistoryEntryActiveRef.current = false;
      setActiveInfo(null);
      setMobileServicePickerOpen(false);
      setCalendarOpen(false);
      setOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    if (!activeInfo && !mobileServicePickerOpen && !calendarOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (activeInfo) {
        setActiveInfo(null);
        return;
      }
      if (mobileServicePickerOpen) {
        setMobileServicePickerOpen(false);
        return;
      }
      if (calendarOpen) setCalendarOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [activeInfo, mobileServicePickerOpen, calendarOpen]);

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

  function openDeadlineCalendar() {
    setActiveInfo(null);
    setMobileServicePickerOpen(false);
    const baseDate = selectedDeadlineDate && selectedDeadlineDate >= todayDate
      ? selectedDeadlineDate
      : todayDate;
    setCalendarMonth(startOfMonth(baseDate));
    setCalendarOpen(true);
  }

  function closeDeadlineCalendar() {
    setCalendarOpen(false);
  }

  function selectDeadlineDate(date: Date) {
    if (date < todayDate) return;
    setDeadline(toIsoDate(date));
    closeDeadlineCalendar();
  }

  function goToPreviousMonth() {
    const previousMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    const minMonth = startOfMonth(todayDate);
    if (previousMonth < minMonth) return;
    setCalendarMonth(previousMonth);
  }

  function goToNextMonth() {
    setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1));
  }

  const canGoToPreviousMonth = useMemo(() => {
    const previousMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    return previousMonth >= startOfMonth(todayDate);
  }, [calendarMonth, todayDate]);

  const calendarLabel = useMemo(() => formatMonthYear(calendarMonth), [calendarMonth]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
    const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
    const firstWeekday = (firstDayOfMonth.getDay() + 6) % 7; // lunes = 0
    const totalCells = 42;
    return Array.from({ length: totalCells }, (_, index) => {
      const dayNumber = index - firstWeekday + 1;
      if (dayNumber < 1 || dayNumber > daysInMonth) return null;
      return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), dayNumber);
    });
  }, [calendarMonth]);

  const weekdayLabels = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

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
              "fixed left-0 top-0 h-[100dvh] max-h-[100dvh] w-screen max-w-none translate-x-0 translate-y-0",
              "overflow-hidden rounded-none border-0 p-0",
              "sm:left-[50%] sm:top-[50%] sm:h-auto sm:max-h-[85vh] sm:w-full sm:max-w-3xl sm:-translate-x-1/2 sm:-translate-y-1/2",
              "sm:overflow-y-auto sm:rounded-2xl sm:border sm:p-6",
            ].join(" ")}
            onInteractOutside={(event) => {
              if (activeInfo || mobileServicePickerOpen || calendarOpen) {
                event.preventDefault();
                if (activeInfo) {
                  setActiveInfo(null);
                  return;
                }
                if (mobileServicePickerOpen) {
                  setMobileServicePickerOpen(false);
                  return;
                }
                setCalendarOpen(false);
              }
            }}
            onEscapeKeyDown={(event) => {
              if (activeInfo || mobileServicePickerOpen || calendarOpen) {
                event.preventDefault();
                if (activeInfo) {
                  setActiveInfo(null);
                  return;
                }
                if (mobileServicePickerOpen) {
                  setMobileServicePickerOpen(false);
                  return;
                }
                setCalendarOpen(false);
              }
            }}
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
                  <p className="text-xs text-muted-foreground">
                    Nombre de contacto para dirigir la propuesta.
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    Correo donde te enviaremos respuesta y seguimiento.
                  </p>
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
                  <div className="flex items-center gap-[3px] sm:gap-2">
                    <Label htmlFor="contact-service">Tipo de servicio</Label>
                    <FieldInfo
                      onOpen={() =>
                        setActiveInfo({
                          title: "Tipo de servicio",
                          text: "Selecciona el servicio principal que más se parezca a tu necesidad actual.",
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Elige la categoría que mejor describa tu requerimiento.
                  </p>
                  <div className="hidden sm:block">
                    <Select value={serviceType} onValueChange={setServiceType}>
                      <SelectTrigger
                        id="contact-service"
                        className="w-full focus-visible:border-foreground focus-visible:ring-foreground/40"
                      >
                        <SelectValue placeholder="Selecciona un servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {SERVICE_OPTIONS.map(({ value, label, icon: Icon }) => (
                          <SelectItem key={value} value={value} textValue={label}>
                            <span className="inline-flex items-center gap-2">
                              <Icon className="h-4 w-4" />
                              <span>{label}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="sm:hidden">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setActiveInfo(null);
                        setCalendarOpen(false);
                        setMobileServicePickerOpen(true);
                      }}
                      className="h-9 w-full justify-between border-input bg-transparent px-3 text-sm font-normal text-foreground hover:bg-secondary/80"
                    >
                      <span className="inline-flex items-center gap-2 truncate">
                        {selectedServiceOption ? (
                          <selectedServiceOption.icon className="h-4 w-4 shrink-0" />
                        ) : (
                          <SlidersHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
                        )}
                        <span className={selectedServiceOption ? "truncate" : "truncate text-muted-foreground"}>
                          {selectedServiceOption?.label ?? "Selecciona un servicio"}
                        </span>
                      </span>
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </Button>
                  </div>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center gap-[3px] sm:gap-2">
                    <Label htmlFor="contact-deadline">
                      Plazo estimado de entrega
                    </Label>
                    <FieldInfo
                      onOpen={() =>
                        setActiveInfo({
                          title: "Plazo estimado de entrega",
                          text: "Indica una fecha tentativa. Si no tienes fecha definida, puedes dejar este campo vacío.",
                        })
                      }
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Fecha tentativa para organizar tiempos y prioridad.
                  </p>
                  <div className="relative">
                    <Input
                      id="contact-deadline"
                      type="text"
                      readOnly
                      value={deadline ? formatDateForLabel(deadline) : ""}
                      placeholder="Selecciona una fecha"
                      onClick={openDeadlineCalendar}
                      className="pr-10 cursor-pointer focus-visible:border-foreground focus-visible:ring-foreground/40"
                    />
                    <button
                      type="button"
                      onClick={openDeadlineCalendar}
                      className={[
                        "absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md",
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
                <div className="flex items-center gap-[3px] sm:gap-2">
                  <Label htmlFor="contact-details">Explicacion del proyecto</Label>
                  <FieldInfo
                    onOpen={() =>
                      setActiveInfo({
                        title: "Explicacion del proyecto",
                        text: "Describe el objetivo, referencias, formato y entregables esperados. Mientras más contexto, mejor propuesta.",
                      })
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Brief breve: objetivo, referencias, formato y entregables.
                </p>
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
                  <div className="flex items-center gap-[3px] sm:gap-2">
                    <Label
                      htmlFor="contact-urgency"
                      className="text-xs uppercase tracking-[0.2em]"
                    >
                      Urgencia
                    </Label>
                    <FieldInfo
                      onOpen={() =>
                        setActiveInfo({
                          title: "Urgencia",
                          text: "Marca qué tan ajustado está tu timing. Esto nos ayuda a priorizar y planificar tiempos de respuesta.",
                        })
                      }
                    />
                  </div>
                  <span className="text-muted-foreground">
                    {urgencyLabels[urgencyValue - 1]}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Indica qué tan ajustado está el timing de este proyecto.
                </p>
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

              {calendarOpen ? (
                <div
                  className="absolute inset-0 z-[66] bg-background/85 px-4 backdrop-blur-sm"
                  onClick={closeDeadlineCalendar}
                >
                  <div className="flex min-h-full items-center justify-center py-8">
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label="Seleccionar fecha de entrega"
                      className="w-full max-w-sm rounded-xl border border-border/90 bg-background p-4 text-left shadow-2xl"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={goToPreviousMonth}
                          disabled={!canGoToPreviousMonth}
                          className={[
                            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors",
                            "hover:bg-secondary disabled:opacity-40 disabled:hover:bg-background",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          ].join(" ")}
                          aria-label="Mes anterior"
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <p className="text-sm font-semibold text-foreground">{calendarLabel}</p>
                        <button
                          type="button"
                          onClick={goToNextMonth}
                          className={[
                            "inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors",
                            "hover:bg-secondary",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          ].join(" ")}
                          aria-label="Mes siguiente"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-7 justify-items-center gap-x-0 gap-y-1.5 text-[11px] font-medium text-muted-foreground">
                        {weekdayLabels.map((weekday) => (
                          <span key={weekday} className="inline-flex h-6 w-10 items-center justify-center">
                            {weekday}
                          </span>
                        ))}
                      </div>

                      <div className="mt-1 grid grid-cols-7 justify-items-center gap-x-0 gap-y-1.5">
                        {calendarDays.map((day, index) => {
                          if (!day) return <div key={`empty-${index}`} className="h-10 w-10" aria-hidden="true" />;
                          const isPast = day < todayDate;
                          const isSelected = selectedDeadlineDate ? isSameDay(day, selectedDeadlineDate) : false;
                          const isToday = isSameDay(day, todayDate);

                          return (
                            <button
                              key={toIsoDate(day)}
                              type="button"
                              disabled={isPast}
                              onClick={() => selectDeadlineDate(day)}
                              className={[
                                "inline-flex h-10 w-10 items-center justify-center rounded-none border text-sm transition-colors",
                                isSelected
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border bg-background text-foreground hover:bg-secondary",
                                isPast ? "cursor-not-allowed opacity-35 hover:bg-background" : "",
                                isToday && !isSelected ? "border-foreground/60" : "",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              ].join(" ")}
                              aria-label={day.toLocaleDateString("es-CL")}
                            >
                              {day.getDate()}
                            </button>
                          );
                        })}
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setDeadline(todayIso);
                            closeDeadlineCalendar();
                          }}
                          className={[
                            "inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium",
                            "bg-secondary text-foreground transition-colors hover:bg-secondary/80",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          ].join(" ")}
                        >
                          Hoy
                        </button>

                        <div className="flex items-center gap-2">
                          {deadline ? (
                            <button
                              type="button"
                              onClick={() => setDeadline("")}
                              className={[
                                "inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium",
                                "bg-background text-foreground transition-colors hover:bg-secondary/50",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              ].join(" ")}
                            >
                              Limpiar
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={closeDeadlineCalendar}
                            className={[
                              "inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium",
                              "bg-secondary text-foreground transition-colors hover:bg-secondary/80",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                            ].join(" ")}
                          >
                            Cerrar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {mobileServicePickerOpen ? (
                <div
                  className="absolute inset-0 z-[65] bg-background/85 px-4 backdrop-blur-sm sm:hidden"
                  onClick={() => setMobileServicePickerOpen(false)}
                >
                  <div className="flex min-h-full items-center justify-center py-8">
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label="Selecciona tipo de servicio"
                      className="w-full max-w-sm rounded-xl border border-border/90 bg-background p-4 text-left shadow-2xl"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <h4 className="text-sm font-semibold text-foreground">Tipo de servicio</h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Elige la opción que mejor represente tu proyecto.
                      </p>
                      <div className="mt-4 grid gap-2">
                        {SERVICE_OPTIONS.map(({ value, label, icon: Icon }) => {
                          const isSelected = serviceType === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setServiceType(value);
                                setMobileServicePickerOpen(false);
                              }}
                              className={[
                                "inline-flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm transition-colors",
                                isSelected
                                  ? "border-foreground/60 bg-secondary text-foreground"
                                  : "border-border bg-background text-foreground hover:bg-secondary/70",
                                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                              ].join(" ")}
                            >
                              <span className="inline-flex min-w-0 items-center gap-2">
                                <Icon className="h-4 w-4 shrink-0" />
                                <span className="truncate">{label}</span>
                              </span>
                              {isSelected ? <Check className="h-4 w-4 shrink-0" /> : null}
                            </button>
                          );
                        })}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setMobileServicePickerOpen(false)}
                          className={[
                            "inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium",
                            "bg-secondary text-foreground transition-colors hover:bg-secondary/80",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          ].join(" ")}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}

              {activeInfo ? (
                <div
                  className="absolute inset-0 z-[70] bg-background/85 px-4 backdrop-blur-sm"
                  onClick={() => setActiveInfo(null)}
                >
                  <div className="flex min-h-full items-center justify-center py-10">
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label={activeInfo.title}
                      className={[
                        "w-full max-w-sm rounded-xl border border-border/90 bg-background p-4 text-left shadow-2xl",
                        "text-foreground",
                      ].join(" ")}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <h4 className="text-sm font-semibold text-foreground">{activeInfo.title}</h4>
                      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                        {activeInfo.text}
                      </p>
                      <div className="mt-4 flex justify-end">
                        <button
                          type="button"
                          onClick={() => setActiveInfo(null)}
                          className={[
                            "inline-flex items-center rounded-md border border-border px-2.5 py-1.5 text-[11px] font-medium",
                            "bg-secondary text-foreground transition-colors hover:bg-secondary/80",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                          ].join(" ")}
                        >
                          Cerrar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
}
