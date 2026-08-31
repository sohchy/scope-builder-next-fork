"use client";

import { Fragment } from "react";

import { cn } from "@/lib/utils";

const LEVELS: { value: number; label: string }[] = [
  { value: 1, label: "Unvalidated" },
  { value: 2, label: "Weak signal" },
  { value: 3, label: "Some evidence" },
  { value: 4, label: "Strong evidence" },
  { value: 5, label: "Fully validated" },
];

interface ValidationLevelSliderProps {
  /** 1..5, or 0 for unselected. */
  value: number;
  /** Fires with the new level, or 0 when the selected one is clicked again to clear it. */
  onSelect: (next: number) => void;
  disabled?: boolean;
}

/**
 * Five circles joined by short connectors, each labelled with what that level of
 * validation means. Selecting the current level clears it, matching ScalePicker's
 * toggle-to-clear behavior — there is no other way back to unrated once picked.
 */
export function ValidationLevelSlider({
  value,
  onSelect,
  disabled = false,
}: ValidationLevelSliderProps) {
  return (
    <div className="flex w-full items-start">
      {LEVELS.map(({ value: n, label }, i) => {
        const selected = value === n;
        const reached = value > 0 && value >= n;
        return (
          <Fragment key={n}>
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
              <button
                type="button"
                disabled={disabled}
                aria-pressed={selected}
                aria-label={`Validation level ${n}: ${label}`}
                onClick={() => onSelect(selected ? 0 : n)}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm font-medium transition-colors disabled:cursor-default",
                  reached
                    ? "border-[#6A35FF] bg-[#6A35FF] text-white"
                    : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
                )}
              >
                {n}
              </button>
              <span className="max-w-[72px] text-center text-[10px] leading-tight text-gray-500">
                {label}
              </span>
            </div>
            {i < LEVELS.length - 1 && (
              <div
                className={cn(
                  "mt-[15px] h-0.5 w-6 shrink-0",
                  value > n ? "bg-[#6A35FF]" : "bg-gray-200",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}
