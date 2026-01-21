// src/components/admin/track/IdsForm.tsx
"use client";

import * as React from "react";
import FormField from "../ui/FormField";
import { Input } from "@/components/ui/input";

type FieldErrors = Record<string, string[]>;

// Definir estado de errores cliente:
type ClientErrors = {
  isrc?: string | null;
  iswc?: string | null;
  upc?: string | null;
};

type IdsFormProps = {
  track: {
    isrc: string | null;
    iswc: string | null;
    upc: string | null;
  };
  fieldErrors?: FieldErrors;
};

export default function IdsForm({ track, fieldErrors }: IdsFormProps) {
  const [clientErrors, setClientErrors] = React.useState<ClientErrors>({});
  const serverErrors: FieldErrors = fieldErrors ?? {};

  function validateField(
    name: keyof ClientErrors,
    value: string,
  ): string | null {
    const trimmed = value.trim();

    if (name === "isrc" && trimmed.length === 0) {
      return "El código ISRC es obligatorio.";
    }

    if (name === "iswc" && trimmed.length === 0) {
      return "El código ISWC es obligatorio.";
    }

    // if (name === "upc" && trimmed.length === 0) {
    //   return "El código UPC es obligatorio.";
    // }
    return null;
  }

  function handleBlur(
    e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target;
    if (!["isrc", "iswc", "upc"].includes(name)) return;

    const error = validateField(name as keyof ClientErrors, value);
    setClientErrors((prev) => ({ ...prev, [name]: error }));
  }

  return (
    <div className="space-y-3">
      <div className="border-b border-border pb-2">
        <h2 className="text-base font-semibold text-foreground">
          Identificadores
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          ISRC / ISWC / UPC para integraciones con distribuidoras y PROs.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {/* ISRC */}
        <FormField
          label="ISRC"
          htmlFor="isrc"
          descriptionPosition="below"
          description={
            <>
              Código de grabación internacional. Se normaliza a mayúsculas y sin
              espacios/guiones.
            </>
          }
          error={clientErrors.isrc ?? serverErrors.isrc?.[0] ?? null}
        >
          <Input
            id="isrc"
            name="isrc"
            type="text"
            defaultValue={track.isrc ?? ""}
            onBlur={handleBlur}
            className="w-full text-sm"
            placeholder="CL-XXX-24-00001"
          />
        </FormField>

        {/* ISWC */}
        <FormField
          label="ISWC"
          htmlFor="iswc"
          descriptionPosition="below"
          description={
            <>
              Código de composición (obra). Opcional si aún no se ha registrado
              en una sociedad.
            </>
          }
          error={clientErrors.iswc ?? serverErrors.iswc?.[0] ?? null}
        >
          <Input
            id="iswc"
            name="iswc"
            type="text"
            defaultValue={track.iswc ?? ""}
            onBlur={handleBlur}
            className="w-full text-sm"
            placeholder="T-123.456.789-Z"
          />
        </FormField>

        {/* UPC */}
        <FormField
          label="UPC / EAN"
          htmlFor="upc"
          descriptionPosition="below"
          description={
            <>Identificador del producto (álbum / single) si aplica.</>
          }
          error={clientErrors.upc ?? serverErrors.upc?.[0] ?? null}
        >
          <Input
            id="upc"
            name="upc"
            type="text"
            defaultValue={track.upc ?? ""}
            onBlur={handleBlur}
            className="w-full text-sm"
            placeholder="123456789012"
          />
        </FormField>
      </div>
    </div>
  );
}
