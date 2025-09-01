/**
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │ Título: src/components/forms/SaveButton.tsx                                 │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Qué hace                                                                   │
 * │ - Botón submit que muestra estado "pending" con useFormStatus (Next).       │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Peras y manzanas                                                           │
 * │ - Es Client Component; se usa dentro de <form action={...}>.                │
 * └─────────────────────────────────────────────────────────────────────────────┘
 */

"use client";

import { useFormStatus } from "react-dom";

export default function SaveButton({
  children = "Guardar",
}: {
  children?: React.ReactNode;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded border px-3 py-1.5 text-sm ${
        pending
          ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
      }`}
    >
      {pending ? "Guardando…" : children}
    </button>
  );
}
