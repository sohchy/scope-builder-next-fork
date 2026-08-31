"use client";

import { useState } from "react";
import { Hourglass } from "lucide-react";

import { Switch } from "@/components/ui/switch";
import {
  ALWAYS_AVAILABLE_MILESTONE,
  type MilestoneReviewInput,
} from "@/lib/milestones";
import ReviewMilestoneDialog from "./ReviewMilestoneDialog";

interface MilestoneAccessCellProps {
  milestone: number;
  startupName: string;
  available: boolean;
  submittedAt: Date | null;
  reviewedAt: Date | null;
  disabled?: boolean;
  onToggle: (available: boolean) => void;
  onReview: (values: MilestoneReviewInput) => void;
}

export default function MilestoneAccessCell({
  milestone,
  startupName,
  available,
  submittedAt,
  reviewedAt,
  disabled,
  onToggle,
  onReview,
}: MilestoneAccessCellProps) {
  const locked = milestone === ALWAYS_AVAILABLE_MILESTONE;
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    // The whole table row switches the active org and navigates away on click,
    // so the cell has to swallow its own clicks — the dialog lives in here for the
    // same reason.
    <div
      className="flex flex-row items-center justify-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      <Switch
        checked={available}
        disabled={locked || disabled}
        onCheckedChange={onToggle}
        title={
          locked
            ? "Milestone 0 is always available"
            : `Milestone ${milestone} ${available ? "available" : "not available"}`
        }
      />
      <MilestoneStatusIcon
        submittedAt={submittedAt}
        reviewedAt={reviewedAt}
        onReview={() => setReviewOpen(true)}
      />
      <ReviewMilestoneDialog
        open={reviewOpen}
        onOpenChange={setReviewOpen}
        milestone={milestone}
        startupName={startupName}
        onSubmit={onReview}
      />
    </div>
  );
}

/**
 * Only a submitted milestone gets an icon. Making one available says nothing
 * about progress, so the switch alone covers that state and the instructor's eye
 * goes to the rows actually waiting on them.
 *
 * Amber hourglass = handed in, waiting on the instructor; click it to open the
 * review dialog, and it turns green once that's submitted. Signing off is one-way
 * (`reviewMilestone` returns the existing date rather than bumping it), so the
 * green icon is inert.
 */
function MilestoneStatusIcon({
  submittedAt,
  reviewedAt,
  onReview,
}: {
  submittedAt: Date | null;
  reviewedAt: Date | null;
  onReview: () => void;
}) {
  if (reviewedAt) {
    return (
      <span title="Reviewed" className="flex">
        <Hourglass className="size-5 text-[#16A34A]" />
      </span>
    );
  }

  if (submittedAt) {
    return (
      <button
        type="button"
        title="Pending Review — click to review"
        onClick={onReview}
        className="flex cursor-pointer"
      >
        <Hourglass className="size-5 text-[#CA8A04]" />
      </button>
    );
  }

  // Keeps the column width stable for rows without an icon.
  return <span className="size-5" />;
}
