// src/components/admin/ui/FormField2.tsx
"use client";

/**
 * FormField2
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

type FormField2Props = {
  label: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  titleClass?: string;
  htmlFor: string;
};

export default function FormField2({
  label,
  description,
  titleClass,
  children,
  className,
  htmlFor,
}: FormField2Props) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label
        htmlFor={htmlFor}
        className={`block text-xs font-medium text-zinc-200 ${titleClass ?? ""}`}
      >
        {label}
      </label>
      {children}
      {description && (
        <p className="text-[11px] text-zinc-500">{description}</p>
      )}
    </div>
  );
}
