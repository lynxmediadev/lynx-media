"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
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
  X,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";

const VOLUME_PRESETS_DB = [-20, -12, -5, 0] as const;
const DEFAULT_VOLUME_DB = -5;
const DEBUG_STICKY_SUCCESS_TOAST = false;
const SERVICE_OPTIONS = [
  {
    value: "music-original",
    label: "Música Original para Audiovisual",
    icon: Music2,
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
    value: "music-production",
    label: "Mix & Master",
    icon: SlidersHorizontal,
  },
  {
    value: "music-composition",
    label: "Custom Beats | Ghost Writting",
    icon: Disc3,
  },
  {
    value: "live-sound",
    label: "Amplificación de eventos corporativos",
    icon: Volume2,
  },
  {
    value: "live-sound-wedding",
    label: "Amplificación e Instrumentación de Ceremonia de Matrimonio",
    icon: Volume2,
  },
  {
    value: "debug-long-option",
    label:
      "Botón debug: Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
    icon: Volume2,
  },
] as const;
const VISIBLE_SERVICE_OPTIONS = SERVICE_OPTIONS.filter((option) =>
  option.value !== "debug-long-option"
);
const SERVICE_OPTION_GROUP_DEFINITIONS = [
  {
    id: "audiovisual",
    title: "Audiovisual",
    values: ["music-original", "post-audio", "location-sound"],
  },
  {
    id: "music",
    title: "Musica",
    values: ["music-production", "music-composition"],
  },
  {
    id: "live-sound",
    title: "Sonido en vivo",
    values: ["live-sound", "live-sound-wedding"],
  },
] as const;
const SERVICE_OPTION_GROUPS = SERVICE_OPTION_GROUP_DEFINITIONS
  .map((group) => ({
    ...group,
    options: group.values
      .map((value) => VISIBLE_SERVICE_OPTIONS.find((option) => option.value === value))
      .filter((option): option is (typeof VISIBLE_SERVICE_OPTIONS)[number] => Boolean(option)),
  }))
  .filter((group) => group.options.length > 0);

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
  const formRef = useRef<HTMLFormElement | null>(null);
  const detailsFocusTimersRef = useRef<number[]>([]);
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
  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [activeInfo, setActiveInfo] = useState<{
    title: string;
    text: string;
  } | null>(null);
  const [mobileServicePickerOpen, setMobileServicePickerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [detailsFocused, setDetailsFocused] = useState(false);
  const [mobileKeyboardInset, setMobileKeyboardInset] = useState(0);
  const [overlayPortalRoot, setOverlayPortalRoot] = useState<HTMLElement | null>(null);
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
  const shouldShowSuccessToast = successToastOpen || DEBUG_STICKY_SUCCESS_TOAST;

  function isMobileViewport() {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 639px)").matches;
  }

  function clearDetailsFocusTimers() {
    if (typeof window === "undefined") return;
    detailsFocusTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    detailsFocusTimersRef.current = [];
  }

  function getMobileKeyboardInset() {
    if (typeof window === "undefined") return 0;
    const viewport = window.visualViewport;
    if (!viewport) return 0;
    return Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
  }

  const updateMobileKeyboardInset = useCallback(() => {
    setMobileKeyboardInset(getMobileKeyboardInset());
  }, []);

  const scrollDialogToBottom = useCallback(() => {
    if (!open || !isMobileViewport() || hasTransientOverlayOpen) return;
    const dialogNode = document.querySelector<HTMLElement>("[data-landing-contact-dialog='true']");
    if (!dialogNode) return;
    dialogNode.scrollTo({ top: dialogNode.scrollHeight, behavior: "auto" });
  }, [open, hasTransientOverlayOpen]);

  function handleDetailsFocus() {
    if (!isMobileViewport()) return;
    setDetailsFocused(true);
    updateMobileKeyboardInset();
    clearDetailsFocusTimers();
    scrollDialogToBottom();
    detailsFocusTimersRef.current = [
      window.setTimeout(scrollDialogToBottom, 100),
      window.setTimeout(scrollDialogToBottom, 260),
      window.setTimeout(scrollDialogToBottom, 520),
    ];
  }

  function handleDetailsBlur() {
    setDetailsFocused(false);
    setMobileKeyboardInset(0);
    clearDetailsFocusTimers();
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
      setSubmitMessage("");
      setName("");
      setEmail("");
      setServiceType("");
      setDetails("");
      setDeadline("");
      setUrgency([3]);
      setActiveInfo(null);
      setMobileServicePickerOpen(false);
      setCalendarOpen(false);
      setSuccessToastOpen(true);
      handleOpenChange(false);
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
      setDetailsFocused(false);
      setMobileKeyboardInset(0);
      clearDetailsFocusTimers();
      return;
    }
    if (nextOpen) {
      setSubmitStatus("idle");
      setSubmitMessage("");
    }
  }

  function closeTransientOverlays() {
    setActiveInfo(null);
    setMobileServicePickerOpen(false);
    setCalendarOpen(false);
  }

  function isFromTransientOverlay(target: EventTarget | null) {
    if (!(target instanceof Element)) return false;
    return Boolean(target.closest("[data-landing-transient-overlay='true']"));
  }

  useEffect(() => {
    if (!open || !isMobileViewport()) return;
    const root = document.documentElement;
    const body = document.body;
    root.classList.add("landing-no-overscroll");
    body.classList.add("landing-no-overscroll");
    return () => {
      root.classList.remove("landing-no-overscroll");
      body.classList.remove("landing-no-overscroll");
    };
  }, [open]);

  useEffect(() => {
    if (!open || !isMobileViewport()) return;
    const dialogNode = document.querySelector<HTMLElement>("[data-landing-contact-dialog='true']");
    if (!dialogNode) return;

    if (hasTransientOverlayOpen) {
      dialogNode.classList.add("landing-dialog-lock-scroll");
      return () => {
        dialogNode.classList.remove("landing-dialog-lock-scroll");
      };
    }
    dialogNode.classList.remove("landing-dialog-lock-scroll");

    let touchStartY = 0;
    const onTouchStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      touchStartY = event.touches[0]?.clientY ?? 0;
    };

    const onTouchMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;

      const currentY = event.touches[0]?.clientY ?? 0;
      const deltaY = currentY - touchStartY;
      const maxScrollTop = dialogNode.scrollHeight - dialogNode.clientHeight;

      if (maxScrollTop <= 0) {
        event.preventDefault();
        return;
      }

      const isAtTop = dialogNode.scrollTop <= 0;
      const isAtBottom = dialogNode.scrollTop >= maxScrollTop - 1;
      if ((isAtTop && deltaY > 0) || (isAtBottom && deltaY < 0)) {
        event.preventDefault();
      }
    };

    dialogNode.addEventListener("touchstart", onTouchStart, { passive: true });
    dialogNode.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      dialogNode.classList.remove("landing-dialog-lock-scroll");
      dialogNode.removeEventListener("touchstart", onTouchStart);
      dialogNode.removeEventListener("touchmove", onTouchMove);
    };
  }, [open, hasTransientOverlayOpen]);

  useEffect(() => {
    if (!open || !detailsFocused || !isMobileViewport()) return;
    const viewport = window.visualViewport;
    const handleViewportChange = () => {
      updateMobileKeyboardInset();
      scrollDialogToBottom();
    };
    handleViewportChange();
    viewport?.addEventListener("resize", handleViewportChange);
    viewport?.addEventListener("scroll", handleViewportChange);
    return () => {
      viewport?.removeEventListener("resize", handleViewportChange);
      viewport?.removeEventListener("scroll", handleViewportChange);
    };
  }, [open, detailsFocused, hasTransientOverlayOpen, scrollDialogToBottom, updateMobileKeyboardInset]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    setOverlayPortalRoot(document.body);
  }, []);

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
      setDetailsFocused(false);
      setMobileKeyboardInset(0);
      clearDetailsFocusTimers();
      setOpen(false);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    return () => {
      clearDetailsFocusTimers();
    };
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

  useEffect(() => {
    if (DEBUG_STICKY_SUCCESS_TOAST) return;
    if (!successToastOpen) return;
    const timeoutId = window.setTimeout(() => {
      setSuccessToastOpen(false);
    }, 4200);
    return () => window.clearTimeout(timeoutId);
  }, [successToastOpen]);

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
          src="/images/logo/lynx-logo-1.svg"
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

        <div className="relative mx-auto mt-8 w-full sm:w-auto">
          <Dialog open={open} onOpenChange={handleOpenChange} modal={false}>
            <DialogTrigger asChild>
              <Button
                size="lg"
                className="h-14 w-full gap-3 border border-foreground/80 bg-foreground/95 text-base font-semibold text-background shadow-sm transition-transform hover:scale-[1.005] hover:bg-foreground sm:w-auto sm:px-10"
              >
                <Mail className="h-5 w-5" />
                Contactar proyecto
              </Button>
            </DialogTrigger>

            <DialogContent
              data-landing-contact-dialog="true"
              className={[
                "landing-dialog-scroll !left-0 !top-0 !h-[100svh] !max-h-[100svh] !w-screen !max-w-none !translate-x-0 !translate-y-0",
                "!transform-none overflow-y-auto !rounded-none !border-0 !p-0 data-[state=open]:!animate-none data-[state=closed]:!animate-none",
                "[&>[data-slot='dialog-close']]:hidden sm:[&>[data-slot='dialog-close']]:inline-flex",
                "sm:!left-[50%] sm:!top-[50%] sm:!h-auto sm:!max-h-[85vh] sm:!w-full sm:!max-w-3xl sm:!-translate-x-1/2 sm:!-translate-y-1/2",
                "sm:overflow-y-auto sm:!rounded-2xl sm:!border sm:!p-6",
              ].join(" ")}
              onPointerDownOutside={(event) => {
                if (isFromTransientOverlay(event.detail.originalEvent.target)) {
                  event.preventDefault();
                  return;
                }
                if (!hasTransientOverlayOpen) return;
                event.preventDefault();
                closeTransientOverlays();
              }}
              onFocusOutside={(event) => {
                if (isFromTransientOverlay(event.target)) {
                  event.preventDefault();
                  return;
                }
                if (!hasTransientOverlayOpen) return;
                event.preventDefault();
                closeTransientOverlays();
              }}
              onInteractOutside={(event) => {
                if (isFromTransientOverlay(event.target)) {
                  event.preventDefault();
                  return;
                }
                if (!hasTransientOverlayOpen) return;
                // Si hay un popup activo, cerrar solo ese popup y no el formulario base.
                event.preventDefault();
                closeTransientOverlays();
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
            <div className="flex flex-col">
              <DialogHeader className="px-4 pt-[calc(env(safe-area-inset-top)+0.9rem)] text-left sm:px-0 sm:pt-0">
                <div className="mb-3 flex justify-center">
                  <Image
                    src="/images/logo/lynx-logo-2.svg"
                    alt="Lynx Media"
                    width={1124}
                    height={328}
                    className="h-auto w-15 object-contain md:w-[60px]"
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <DialogTitle className="inline-flex items-center gap-2 uppercase">
                      <Mail
                        className="h-[18px] w-[18px] text-muted-foreground"
                        strokeWidth={2.35}
                        aria-hidden="true"
                      />
                      <span>Formulario de contacto</span>
                    </DialogTitle>
                    <DialogDescription className="mt-0 pt-0">
                      Completa los datos para entender el alcance y el timing del
                      proyecto. Te respondemos con los proximos pasos.
                    </DialogDescription>
                  </div>
                  <DialogClose asChild>
                    <button
                      type="button"
                      className={[
                        "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors sm:hidden",
                        "hover:bg-secondary hover:text-foreground",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                      ].join(" ")}
                      aria-label="Cerrar formulario"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </DialogClose>
                </div>
              </DialogHeader>

              <form
                ref={formRef}
                className={[
                  "landing-form-scroll grid content-start gap-6 px-4",
                  "pb-[calc(env(safe-area-inset-bottom)+1rem)] pt-4 sm:px-0 sm:pb-0 sm:pt-6",
                ].join(" ")}
                onSubmit={handleSubmit}
              >
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="landing-form-section grid gap-1.5">
                  <Label htmlFor="contact-name" className="uppercase">
                    Nombre
                  </Label>
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
                <div className="landing-form-section grid gap-1.5">
                  <Label htmlFor="contact-email" className="uppercase">
                    Email
                  </Label>
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
                <div className="landing-form-section grid gap-1.5">
                  <div className="flex items-center gap-[3px] sm:gap-2">
                    <Label htmlFor="contact-service" className="uppercase">
                      Tipo de servicio
                    </Label>
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
                  <Button
                    type="button"
                    id="contact-service"
                    variant="outline"
                    onClick={() => {
                      setActiveInfo(null);
                      setCalendarOpen(false);
                      setMobileServicePickerOpen(true);
                    }}
                    className="h-auto min-h-9 w-full items-start justify-between gap-2 border-input bg-transparent px-3 py-2 text-sm font-normal text-foreground hover:bg-secondary/80 hover:text-foreground"
                  >
                    <span className="inline-flex min-w-0 items-start gap-2 text-left">
                      {selectedServiceOption ? (
                        <selectedServiceOption.icon className="mt-0.5 h-4 w-4 shrink-0" />
                      ) : (
                        <SlidersHorizontal className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span
                        className={
                          selectedServiceOption
                            ? "whitespace-normal break-words leading-snug"
                            : "whitespace-normal break-words leading-snug text-muted-foreground"
                        }
                      >
                        {selectedServiceOption?.label ?? "Selecciona un servicio"}
                      </span>
                    </span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Button>
                </div>

                <div className="landing-form-section grid gap-1.5">
                  <div className="flex items-center gap-[3px] sm:gap-2">
                    <Label htmlFor="contact-deadline" className="uppercase">
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

              <div className="landing-form-section grid gap-1.5">
                <div className="flex items-center gap-[3px] sm:gap-2">
                  <Label htmlFor="contact-details" className="uppercase">
                    Explicacion del proyecto
                  </Label>
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
                  onFocus={handleDetailsFocus}
                  onBlur={handleDetailsBlur}
                  onTouchStart={(event) => event.stopPropagation()}
                  onTouchMove={(event) => event.stopPropagation()}
                  className="landing-textarea-fixed h-[160px] min-h-[160px] max-h-[160px] resize-none overflow-y-auto touch-auto select-text [field-sizing:fixed] focus-visible:border-foreground focus-visible:ring-foreground/40"
                />
              </div>

              <div className="hidden landing-form-section grid gap-2">
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
                    "text-destructive",
                    submitStatus === "error" && submitMessage ? "block" : "hidden",
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

          {overlayPortalRoot
            ? createPortal(
              <>
                {calendarOpen ? (
                  <div
                    data-landing-transient-overlay="true"
                    className="pointer-events-auto fixed inset-0 z-[66] flex items-center justify-center bg-background/85 px-4 py-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-sm"
                    onClick={closeDeadlineCalendar}
                  >
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label="Seleccionar fecha de entrega"
                      className="max-h-[86dvh] w-full max-w-sm overflow-y-auto rounded-xl border border-border/90 bg-background p-4 text-left shadow-2xl"
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
                ) : null}

                {mobileServicePickerOpen ? (
                  <div
                    data-landing-transient-overlay="true"
                    className="pointer-events-auto fixed inset-0 z-[65] flex items-center justify-center bg-background/85 px-4 py-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-sm"
                    onClick={() => setMobileServicePickerOpen(false)}
                  >
                    <div
                      role="dialog"
                      aria-modal="true"
                      aria-label="Selecciona tipo de servicio"
                      className="flex max-h-[86dvh] w-full max-w-sm flex-col rounded-xl border border-border/90 bg-background p-4 text-left shadow-2xl sm:max-w-md"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <h4 className="text-sm font-semibold text-foreground">Tipo de servicio</h4>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Elige la opción que mejor represente tu proyecto.
                      </p>
                      <div className="mt-4 grid gap-3 overflow-y-auto overflow-x-hidden overscroll-y-contain pr-0.5">
                        {SERVICE_OPTION_GROUPS.map((group) => (
                          <section
                            key={group.id}
                            className="rounded-lg border border-border/65 bg-card/35 p-2"
                            aria-label={`Grupo ${group.title}`}
                          >
                            <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/85">
                              {group.title}
                            </p>
                            <div className="grid gap-2">
                              {group.options.map(({ value, label, icon: Icon }) => {
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
                                      "inline-flex w-full items-start justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors",
                                      isSelected
                                        ? "border-foreground/60 bg-secondary text-foreground"
                                        : "border-border bg-background text-foreground hover:bg-secondary/70",
                                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 focus-visible:ring-offset-background",
                                    ].join(" ")}
                                  >
                                    <span className="inline-flex min-w-0 items-start gap-2">
                                      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                                      <span className="whitespace-normal break-words leading-snug">{label}</span>
                                    </span>
                                    {isSelected ? <Check className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                                  </button>
                                );
                              })}
                            </div>
                          </section>
                        ))}
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
                ) : null}

                {activeInfo ? (
                  <div
                    data-landing-transient-overlay="true"
                    className="pointer-events-auto fixed inset-0 z-[70] flex items-center justify-center bg-background/85 px-4 py-[calc(env(safe-area-inset-top)+0.75rem)] backdrop-blur-sm"
                    onClick={() => setActiveInfo(null)}
                  >
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
                ) : null}
              </>,
              overlayPortalRoot,
            )
            : null}

          {open && detailsFocused && !hasTransientOverlayOpen ? (
            <div
              className="pointer-events-none fixed inset-x-0 z-[64] px-4 sm:hidden"
              style={{
                bottom: `calc(env(safe-area-inset-bottom) + ${mobileKeyboardInset}px + 0.5rem)`,
              }}
            >
              <div className="mx-auto w-full max-w-3xl">
                <Button
                  type="button"
                  onClick={() => formRef.current?.requestSubmit()}
                  className="pointer-events-auto w-full border border-foreground/80 bg-foreground text-background shadow-xl hover:bg-foreground/90"
                  disabled={submitStatus === "submitting"}
                >
                  {submitStatus === "submitting" ? "Enviando..." : "Enviar solicitud"}
                </Button>
              </div>
            </div>
          ) : null}

          {shouldShowSuccessToast ? (
            <div
              className="pointer-events-none absolute inset-0 z-20 sm:hidden"
              role="status"
              aria-live="polite"
            >
              <div
                className={[
                  "flex h-full w-full items-center gap-2 rounded-md border border-success/35",
                  "bg-card/95 px-4 text-foreground shadow-2xl backdrop-blur-md",
                  "animate-in fade-in-0 zoom-in-95 duration-200",
                ].join(" ")}
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                  <Check className="h-4 w-4" />
                </span>
                <p className="min-w-0 flex-1 truncate text-left text-sm">
                  Solicitud enviada exitosamente.
                </p>
              </div>
            </div>
          ) : null}
        </div>
        {shouldShowSuccessToast ? (
          <div className="mt-4 hidden justify-center sm:flex" role="status" aria-live="polite">
            <div
              className={[
                "pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-xl border border-success/35",
                "bg-card/95 px-4 py-3 text-foreground shadow-2xl backdrop-blur-md",
                "animate-in fade-in-0 slide-in-from-top-2 duration-200",
              ].join(" ")}
            >
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success/20 text-success">
                <Check className="h-4 w-4" />
              </span>
              <p className="min-w-0 flex-1 text-sm leading-tight">
                Solicitud enviada exitosamente. Te contactaremos pronto.
              </p>
              {!DEBUG_STICKY_SUCCESS_TOAST ? (
                <button
                  type="button"
                  onClick={() => setSuccessToastOpen(false)}
                  className={[
                    "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors",
                    "hover:bg-secondary hover:text-foreground",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  ].join(" ")}
                  aria-label="Cerrar confirmacion"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
