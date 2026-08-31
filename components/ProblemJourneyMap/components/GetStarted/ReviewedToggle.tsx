"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface ReviewedToggleProps {
  reviewed: boolean;
  onToggle: (next: boolean) => void;
  /** Show the reviewed state but don't allow toggling (Examples pages). */
  readOnly?: boolean;
}

/**
 * The "Reviewed" affordance used across Get Started cards — a green check pill
 * when reviewed, a hollow circle otherwise. Toggles both ways.
 */
export function ReviewedToggle({ reviewed, onToggle, readOnly = false }: ReviewedToggleProps) {
  return (
    <button
      type="button"
      disabled={readOnly}
      onClick={() => onToggle(!reviewed)}
      className="flex shrink-0 items-center gap-1.5 text-sm font-medium disabled:cursor-default"
    >
      <span
        className={cn(
          "flex size-4 items-center justify-center rounded-full border transition-colors",
          reviewed
            ? "border-[#2F9E63] bg-[#2F9E63] text-white"
            : "border-[#9CA3AF] bg-white text-transparent",
        )}
      >
        <Check className="size-3" strokeWidth={3} />
      </span>
      <span className={reviewed ? "text-[#2F9E63]" : "text-[#4E5566]"}>
        Completed
      </span>
    </button>
  );
}
