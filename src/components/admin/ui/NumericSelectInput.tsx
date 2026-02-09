"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type NumericSelectInputProps = {
  id?: string;
  name?: string;
  value: string | number;
  onChange: (value: string) => void;
  onCommit?: (value: string) => void | Promise<void>;
  min?: number;
  max?: number;
  step?: number | "any";
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  commitOnEnter?: boolean;
  commitOnBlur?: boolean;
  commitIfChanged?: boolean;
};

export default function NumericSelectInput({
  id,
  name,
  value,
  onChange,
  onCommit,
  min,
  max,
  step,
  disabled = false,
  className,
  placeholder,
  onBlur,
  onKeyDown,
  commitOnEnter = true,
  commitOnBlur = true,
  commitIfChanged = true,
}: NumericSelectInputProps) {
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const skipBlurCommitRef = React.useRef(false);
  const [committing, setCommitting] = React.useState(false);
  const valueAsString = String(value ?? "");
  const editStartValueRef = React.useRef(valueAsString);

  React.useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      editStartValueRef.current = valueAsString;
    }
  }, [valueAsString]);

  const selectAll = (el: HTMLInputElement) => {
    requestAnimationFrame(() => el.select());
  };

  const commit = React.useCallback(async () => {
    if (!onCommit || disabled || committing) return;
    const currentValue = inputRef.current?.value ?? valueAsString;
    const changed = currentValue !== editStartValueRef.current;
    if (commitIfChanged && !changed) return;
    try {
      setCommitting(true);
      await onCommit(currentValue);
      editStartValueRef.current = currentValue;
    } finally {
      setCommitting(false);
    }
  }, [commitIfChanged, committing, disabled, onCommit, valueAsString]);

  return (
    <Input
      id={id}
      name={name}
      ref={inputRef}
      type="number"
      inputMode="numeric"
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-allow-enter="true"
      disabled={disabled || committing}
      onFocus={(e) => {
        editStartValueRef.current = e.currentTarget.value;
        selectAll(e.currentTarget);
      }}
      onPointerUp={(e) => {
        if (document.activeElement !== e.currentTarget) return;
        e.preventDefault();
        e.currentTarget.select();
      }}
      onBlur={(e) => {
        onBlur?.(e);
        if (!onCommit || !commitOnBlur || skipBlurCommitRef.current) {
          skipBlurCommitRef.current = false;
          return;
        }
        void commit();
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e);
        if (e.defaultPrevented || !onCommit || !commitOnEnter || e.key !== "Enter") return;
        e.preventDefault();
        e.stopPropagation();
        skipBlurCommitRef.current = true;
        void commit().finally(() => {
          inputRef.current?.blur();
        });
      }}
      className={cn(
        "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        className,
      )}
    />
  );
}
