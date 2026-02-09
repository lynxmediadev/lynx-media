// src/components/admin/track/IdsForm.tsx
"use client";

import * as React from "react";
import FormField from "../ui/FormField";
import EditableIconInput from "@/components/admin/ui/EditableIconInput";

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
  const [isrcValue, setIsrcValue] = React.useState(track.isrc ?? "");
  const [iswcValue, setIswcValue] = React.useState(track.iswc ?? "");
  const [upcValue, setUpcValue] = React.useState(track.upc ?? "");
  const serverErrors: FieldErrors = fieldErrors ?? {};

  function validateField(
    _name: keyof ClientErrors,
    _value: string,
  ): string | null {
    // Todos opcionales por ahora; sin validación en blur
    return null;
  }

  function handleFieldBlur(name: keyof ClientErrors, value: string) {
    const error = validateField(name, value);
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
          <EditableIconInput
            id="isrc"
            name="isrc"
            value={isrcValue}
            onChange={setIsrcValue}
            onBlurValue={(value) => handleFieldBlur("isrc", value)}
            lockOnInit
            inputClassName="w-full text-sm h-9 pr-8"
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
          <EditableIconInput
            id="iswc"
            name="iswc"
            value={iswcValue}
            onChange={setIswcValue}
            onBlurValue={(value) => handleFieldBlur("iswc", value)}
            lockOnInit
            inputClassName="w-full text-sm h-9 pr-8"
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
          <EditableIconInput
            id="upc"
            name="upc"
            value={upcValue}
            onChange={setUpcValue}
            onBlurValue={(value) => handleFieldBlur("upc", value)}
            lockOnInit
            inputClassName="w-full text-sm h-9 pr-8"
            placeholder="123456789012"
          />
        </FormField>
      </div>
    </div>
  );
}
