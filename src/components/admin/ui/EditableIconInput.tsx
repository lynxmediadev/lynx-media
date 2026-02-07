"use client";

import * as React from "react";
import { SquarePen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EditableIconInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  inputClassName?: string;
  lockOnInit?: boolean;
  iconAriaLabel?: string;
};

export default function EditableIconInput({
  value,
  onChange,
  placeholder = "-",
  disabled = false,
  inputClassName = "h-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground/90 placeholder:opacity-100 placeholder:italic",
  lockOnInit = true,
  iconAriaLabel = "Editar campo",
}: EditableIconInputProps) {
  const [editable, setEditable] = React.useState(!lockOnInit);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const hasValue = value.trim().length > 0;
  const isLocked = !editable;

  const unlockAndFocus = () => {
    if (disabled) return;
    setEditable(true);
    requestAnimationFrame(() => {
      if (!inputRef.current) return;
      inputRef.current.focus();
      const len = inputRef.current.value.length;
      if (len > 0) {
        inputRef.current.setSelectionRange(0, len);
      }
    });
  };

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        readOnly={isLocked}
        className={cn(
          inputClassName,
          isLocked && hasValue && "text-foreground",
          isLocked && !hasValue && "text-muted-foreground/80",
        )}
        placeholder={placeholder}
      />
      <button
        type="button"
        aria-label={iconAriaLabel}
        disabled={disabled}
        onClick={unlockAndFocus}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-60"
      >
        <SquarePen className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
