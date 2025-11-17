// src/components/admin/ui/FormField.tsx
"use client";

/**
 * FormField
 *
 * Peras y manzanas:
 * - Componente de UI para campos de formulario en el admin.
 * - Dibuja:
 *    • Label (título del campo)
 *    • Descripción opcional (texto pequeño debajo del label)
 *    • El contenido del campo (input / textarea / select) como children.
 * - No maneja estado ni lógica de formularios.
 * - Solo organiza el layout y las clases Tailwind.
 */

import * as React from "react";

type FormFieldProps = {
  label: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClass?: string;
  htmlFor?: string;
  descriptionPosition?: "above" | "below";
};

export default function FormField({
  label,
  description,
  titleClass,
  children,
  className,
  htmlFor,
  descriptionPosition = "above",
}: FormFieldProps) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label
        htmlFor={htmlFor}
        className={`block ${titleClass ?? "text-xs font-medium text-zinc-200"}`}
      >
        {label}
      </label>

      {description && descriptionPosition === "above" && (
        <p className="text-[11px] text-zinc-500">{description}</p>
      )}

      {children}

      {description && descriptionPosition === "below" && (
        <p className="text-[11px] text-zinc-500">{description}</p>
      )}
    </div>
  );
}
