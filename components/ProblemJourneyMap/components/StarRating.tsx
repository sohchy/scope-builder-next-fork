"use client";

import { StarIcon } from "lucide-react";

interface StarRatingProps {
  value: number;
  /** Omit for a display-only rating. */
  onChange?: (value: number) => void;
  readOnly?: boolean;
  /** Greyed out because the control is locked — as opposed to `readOnly`, which
   * shows the rating at full strength and only blocks editing. */
  disabled?: boolean;
  /** `sm` for tight rows where the rating sits inline with label text. */
  size?: "sm" | "md";
}

/** 5-star confidence rating. Shared by the problem sheet (editable) and the
 * interview-prep hypothesis rows (display-only). */
export function StarRating({
  value,
  onChange,
  readOnly = false,
  disabled = false,
  size = "md",
}: StarRatingProps) {
  const interactive = Boolean(onChange) && !readOnly && !disabled;
  const starSize = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  // The button is the hit target and it hugs the icon, so the star's own size is
  // the whole target. `md` is the editable rating, so it gets padding on top of
  // the larger icon to clear the 24px WCAG minimum — 20px of star would still
  // have been under it. Padding is unconditional rather than tied to
  // `interactive` so the row keeps its width as the gates open and close.
  //
  // `sm` is display-only (the hypothesis rows pass no `onChange`) and shares a
  // `whitespace-nowrap` line with the source label, which the extra width would
  // break — nothing to fix there, so it stays as it was.
  const hitArea = size === "sm" ? "" : "p-0.5";

  return (
    <div
      className={`flex items-center gap-0.5 ${disabled ? "opacity-50" : ""}`}
    >
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(i === value ? 0 : i)}
          className={`shrink-0 ${hitArea} text-[#6A35FF] focus:outline-none disabled:cursor-default`}
          aria-label={`${i} star${i !== 1 ? "s" : ""}`}
        >
          <StarIcon
            className={`${starSize} ${
              i <= value
                ? "fill-[#6A35FF] text-[#6A35FF]"
                : "fill-none text-gray-400"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
