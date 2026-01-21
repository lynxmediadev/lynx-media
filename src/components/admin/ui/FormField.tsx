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
import clsx from "clsx";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  htmlFor?: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  descriptionPosition?: "above" | "below";
  className?: string;
  titleClass?: string;
  children: React.ReactNode;
  error?: string | null; // NUEVO: mensaje de error por campo
};

export default function FormField({
  label,
  description,
  titleClass,
  children,
  className,
  htmlFor,
  descriptionPosition = "above",
  error,
}: FormFieldProps) {
  const rootClassName = clsx("space-y-1", className);

  return (
    <div className={rootClassName}>
      <Label
        htmlFor={htmlFor}
        className="text-[11px] font-medium text-foreground/80"
      >
        {label}
      </Label>

      {description && descriptionPosition === "above" && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}

      {children}

      {/* Mensaje de error, si existe */}
      {error && <p className="mt-1 text-[11px] text-destructive">{error}</p>}

      {description && descriptionPosition === "below" && (
        <p className="text-[11px] text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
