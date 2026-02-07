"use client";

import * as React from "react";
import { SquarePen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type EditableIconInputProps = {
  value: string;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void | Promise<void>;
  placeholder?: string;
  disabled?: boolean;
  inputClassName?: string;
  lockOnInit?: boolean;
  iconAriaLabel?: string;
  commitOnEnter?: boolean;
  commitOnBlur?: boolean;
  relockOnCommit?: boolean;
  commitIfChanged?: boolean;
};

export default function EditableIconInput({
  value,
  onChange,
  onCommit,
  placeholder = "-",
  disabled = false,
  inputClassName = "h-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground/90 placeholder:opacity-100 placeholder:italic",
  lockOnInit = true,
  iconAriaLabel = "Editar campo",
  commitOnEnter = true,
  commitOnBlur = true,
  relockOnCommit = true,
  commitIfChanged = true,
}: EditableIconInputProps) {
  const [editable, setEditable] = React.useState(!lockOnInit);
  const [committing, setCommitting] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const skipBlurCommitRef = React.useRef(false);
  const editStartValueRef = React.useRef(value);
  const hasValue = value.trim().length > 0;
  const isLocked = !editable;

  React.useEffect(() => {
    if (isLocked) {
      editStartValueRef.current = value;
    }
  }, [isLocked, value]);

  const unlockAndFocus = () => {
    if (disabled || committing) return;
    editStartValueRef.current = value;
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

  const unlockFromInputClick = () => {
    if (disabled || committing || !isLocked) return;
    editStartValueRef.current = value;
    setEditable(true);
  };

  const commit = React.useCallback(async () => {
    if (disabled || committing) return;
    const currentValue = inputRef.current?.value ?? value;
    const changed = currentValue !== editStartValueRef.current;

    if (onCommit && (!commitIfChanged || changed)) {
      try {
        setCommitting(true);
        await onCommit(currentValue);
      } finally {
        setCommitting(false);
      }
    }

    if (relockOnCommit) {
      setEditable(false);
      editStartValueRef.current = currentValue;
    }
  }, [commitIfChanged, committing, disabled, onCommit, relockOnCommit, value]);

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-allow-enter="true"
        onPointerDown={unlockFromInputClick}
        disabled={disabled}
        readOnly={isLocked}
        className={cn(
          inputClassName,
          isLocked && hasValue && "text-foreground",
          isLocked && !hasValue && "text-muted-foreground/80",
        )}
        placeholder={placeholder}
        onKeyDown={(e) => {
          if (!commitOnEnter || e.key !== "Enter") return;
          e.preventDefault();
          e.stopPropagation();
          skipBlurCommitRef.current = true;
          void commit().finally(() => {
            inputRef.current?.blur();
          });
        }}
        onBlur={() => {
          if (!commitOnBlur) return;
          if (skipBlurCommitRef.current) {
            skipBlurCommitRef.current = false;
            return;
          }
          void commit();
        }}
      />
      <button
        type="button"
        aria-label={iconAriaLabel}
        disabled={disabled || committing}
        onClick={unlockAndFocus}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-60"
      >
        <SquarePen className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
