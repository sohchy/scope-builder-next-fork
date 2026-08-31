"use client";

const SCALE_POINTS = [1, 2, 3, 4, 5];

interface ScalePickerProps {
  /** 1..5, or 0 for unselected. */
  value: number;
  /** Fires with the new point, or 0 when the selected one is clicked again to clear it. */
  onSelect: (next: number) => void;
  disabled?: boolean;
}

/**
 * The five-point picker used for both a scale interview answer and a hypothesis's
 * validation level. Selecting the current point clears it — there is no other way back
 * to unanswered once a point has been picked.
 */
export function ScalePicker({ value, onSelect, disabled = false }: ScalePickerProps) {
  return (
    <div className="flex gap-1.5">
      {SCALE_POINTS.map((n) => {
        const selected = value === n;
        return (
          <button
            key={n}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(selected ? 0 : n)}
            className={`h-9 w-9 rounded-lg border text-sm font-medium transition-colors disabled:cursor-default ${
              selected
                ? "border-[#6A35FF] bg-[#F4F0FF] text-[#6A35FF]"
                : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
            }`}
          >
            {n}
          </button>
        );
      })}
    </div>
  );
}
