"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Dependency-free on/off switch. Radix's `@radix-ui/react-switch` isn't part of
 * this project's dependencies, and this control needs no more than a styled
 * button with the right ARIA wiring.
 */
function Switch({
  checked,
  onCheckedChange,
  disabled,
  className,
  ...props
}: Omit<React.ComponentProps<"button">, "onChange" | "type"> & {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      data-slot="switch"
      aria-checked={checked}
      data-state={checked ? "checked" : "unchecked"}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "focus-visible:ring-ring/50 inline-flex h-[18px] w-8 shrink-0 cursor-pointer items-center rounded-full border border-transparent p-[2px] transition-colors outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-[#6A35FF]" : "bg-[#D5D8E2]",
        className,
      )}
      {...props}
    >
      <span
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-3.5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-[14px]" : "translate-x-0",
        )}
      />
    </button>
  );
}

export { Switch };
