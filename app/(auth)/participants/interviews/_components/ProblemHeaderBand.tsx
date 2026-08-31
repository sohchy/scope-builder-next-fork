"use client";

import { ActionLabel } from "@/components/ProblemJourneyMap/components/InterviewPrep/ActionLabel";

interface ProblemHeaderBandProps {
  /** The action card's text, as typed on the canvas. "" = never filled in. */
  action: string;
  /** Pill label, e.g. "Problem". */
  label: string;
  description: string;
  tags: string[];
  /** Applied alongside the band's own padding and grey — how the caller's card frames it. */
  className?: string;
}

/**
 * A problem as its card's header: the action it hangs off, its pill, its tags and its
 * description. Read-only everywhere it appears — a problem is authored on the journey
 * map, never here. Shared by the answering view and the summary tab so the two boards
 * present the same problem identically.
 */
export function ProblemHeaderBand({
  action,
  label,
  description,
  tags,
  className,
}: ProblemHeaderBandProps) {
  return (
    <div className={["bg-[#F5F5F8] px-5 py-4", className].filter(Boolean).join(" ")}>
      {/* The action this problem hangs off — context only, so it sits above the pill
          rather than competing with the problem itself. */}
      <ActionLabel action={action} className="mb-2" />
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex w-fit shrink-0 items-center rounded-full border border-[#F0E4C9] bg-[#FBF3DE] px-2.5 py-0.5 text-xs font-medium text-[#8A6D1E]">
          {label}
        </span>
        {tags.length > 0 && (
          <ul className="flex flex-wrap items-center justify-end gap-3 text-xs text-[#4B4560]">
            {tags.map((tag) => (
              <li key={tag} className="flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-[#4B4560]" />
                <span className="font-semibold">{tag}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="mt-3 text-sm text-[#1F2430]">{description}</p>
    </div>
  );
}
