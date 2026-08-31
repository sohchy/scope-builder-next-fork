"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  LAST_MILESTONE,
  milestoneLabel,
  type MilestoneReviewInput,
} from "@/lib/milestones";

interface ReviewMilestoneDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  milestone: number;
  startupName: string;
  onSubmit: (values: MilestoneReviewInput) => void;
}

/**
 * Signing a milestone off from the Startups table. Notes stay on the instructor's
 * side (they're saved to `MilestoneAccess.review_notes`, not emailed); the unlock
 * checkbox is what the startup actually feels, so it's on by default.
 *
 * The write is optimistic upstream, so this closes as soon as it's submitted.
 */
export default function ReviewMilestoneDialog({
  open,
  onOpenChange,
  milestone,
  startupName,
  onSubmit,
}: ReviewMilestoneDialogProps) {
  const [notes, setNotes] = useState("");
  const [unlockNext, setUnlockNext] = useState(true);

  // Milestone 5 has no successor, so there is nothing to offer unlocking.
  const nextMilestone = milestone < LAST_MILESTONE ? milestone + 1 : null;

  // Each open is a fresh review — an abandoned draft shouldn't leak into the next one.
  useEffect(() => {
    if (open) {
      setNotes("");
      setUnlockNext(true);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ notes, unlockNext: !!nextMilestone && unlockNext });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Review Milestone {milestone}</DialogTitle>
          <DialogDescription>
            {milestoneLabel(milestone)} · {startupName}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="review-notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Textarea
              id="review-notes"
              placeholder="What did you cover in the review?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-24"
              autoFocus
            />
          </div>

          {nextMilestone && (
            <div className="flex flex-row items-center gap-2">
              <Checkbox
                id="unlock-next"
                checked={unlockNext}
                onCheckedChange={(value) => setUnlockNext(value === true)}
              />
              <label
                htmlFor="unlock-next"
                className="text-sm font-medium cursor-pointer"
              >
                Unlock Milestone {nextMilestone} (
                {milestoneLabel(nextMilestone)})
              </label>
            </div>
          )}

          <DialogFooter>
            {/* Named for the side effect — submitting mails the whole startup team. */}
            <Button type="submit" className="bg-[#162A4F] cursor-pointer">
              Mark Complete &amp; Notify
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
