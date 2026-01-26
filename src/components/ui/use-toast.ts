type ToastVariant = "default" | "destructive";

type ToastOptions = {
  title?: string;
  description?: string;
  variant?: ToastVariant;
};

/**
 * Hook mínimo de toast para evitar dependencias adicionales.
 * Reemplaza con implementación real de shadcn si se requiere UI persistente.
 */
export function useToast() {
  function toast(opts: ToastOptions) {
    if (typeof window === "undefined") return;
    const msg = opts.title || opts.description || "";
    if (!msg) return;
    if (opts.variant === "destructive") {
      console.error(msg);
    } else {
      console.log(msg);
    }
  }
  return { toast };
}
