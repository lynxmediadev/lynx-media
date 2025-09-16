"use client";
/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Componente: InternalNotesEditor (autosave con feedback)                     │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas:                                                           │
 * │ - Textarea para `internalNotes`.                                            │
 * │ - Guarda automáticamente tras 600ms sin teclear (debounce).                 │
 * │ - Muestra estado: "Guardando…", "Guardado", "Error".                        │
 * │ - Botón "Guardar ahora" y "Limpiar" por si quieres control manual.          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */
import * as React from "react";

type Props = {
  requestId: string;
  initialValue: string;
};

export default function InternalNotesEditor({ requestId, initialValue }: Props) {
  const [value, setValue] = React.useState(initialValue);
  const [status, setStatus] = React.useState<"idle"|"saving"|"saved"|"error">("idle");
  const controllerRef = React.useRef<AbortController | null>(null);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Limpia request anterior si hay nueva edición
  React.useEffect(() => {
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  async function doSave(next: string) {
    // Cancelar request anterior si sigue viva
    if (controllerRef.current) controllerRef.current.abort();
    controllerRef.current = new AbortController();

    setStatus("saving");
    try {
      const res = await fetch(`/admin/licensing/${requestId}/internal-notes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ internalNotes: next }),
        signal: controllerRef.current.signal,
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 800);
    } catch {
      setStatus("error");
    }
  }

  // Debounce: guarda 600ms después de dejar de teclear
  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    setValue(next);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSave(next), 600);
  }

  return (
    <div className="space-y-2">
      <label className="block text-xs uppercase tracking-wide text-muted-foreground">
        Notas internas
      </label>

      <textarea
        value={value}
        onChange={onChange}
        placeholder="Resumen breve de la gestión, next steps, objeciones, etc."
        rows={6}
        className="w-full rounded-lg border border-border bg-muted px-3 py-2.5 text-[0.95rem] leading-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button
          type="button"
          className="rounded border border-border bg-card px-2 py-1 hover:bg-accent"
          onClick={() => doSave(value)}
        >
          Guardar ahora
        </button>
        <button
          type="button"
          className="rounded border border-border bg-card px-2 py-1 hover:bg-accent"
          onClick={() => { setValue(""); void doSave(""); }}
        >
          Limpiar
        </button>

        <span className="ml-auto">
          {status === "saving" && "Guardando…"}
          {status === "saved" && "Guardado"}
          {status === "error" && "Error al guardar"}
          {status === "idle" && " "}
        </span>
      </div>
    </div>
  );
}
