"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { milestoneLabel } from "@/lib/milestones";
import { useMilestoneSelection } from "../MilestoneSelectionContext";
import { useGetStartedCards } from "../GetStartedCardsContext";
import { GetStartedCard } from "./GetStarted/GetStartedCard";

interface MilestoneStepsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The Instructions tab's steps card, reachable from the journey tab bar.
 *
 * Startups kept bouncing to Instructions to tick a sub-step off and back again —
 * and ticking is what unlocks parts of the tab they came from. Toggling here
 * writes through the same context the header and canvas read, so those unlock in
 * place. Narrower than the Instructions tab in that it shows the steps card
 * alone, but that card is the whole thing: sub-steps and Submit for Review, with
 * submission state shared with the tab so the two never disagree.
 */
export function MilestoneStepsDialog({
  open,
  onOpenChange,
}: MilestoneStepsDialogProps) {
  const { selectedMilestone: milestone } = useMilestoneSelection();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] w-[95vw] max-w-[720px] gap-0 overflow-hidden p-0 sm:max-w-[720px]">
        <DialogHeader className="border-b border-[#E5E7EB] p-6">
          {/* The card renders its own "Milestone Steps" heading, so the dialog
              titles the milestone instead of repeating it. */}
          <DialogTitle>
            Milestone {milestone} — {milestoneLabel(milestone)}
          </DialogTitle>
          <DialogDescription>
            Read a step and mark it completed without leaving the tab you were
            working in.
          </DialogDescription>
        </DialogHeader>

        {/* Split out so nothing is requested until the dialog is opened — this
            sits inside DialogContent, which Radix unmounts on close. The cards
            themselves are cached page-wide, so only the first open pays for a
            query and later ones render straight from the cache. */}
        <StepsCardBody milestone={milestone} />
      </DialogContent>
    </Dialog>
  );
}

function StepsCardBody({ milestone }: { milestone: number }) {
  const {
    cards,
    loading,
    itemReviewed,
    submittedAt,
    toggleCard,
    toggleItem,
    submitMilestone,
  } = useGetStartedCards(milestone);

  const stepsCard = cards.find((card) => card.type === "steps");

  return (
    <div className="max-h-[65vh] overflow-y-auto bg-[#F7F8FA] p-6">
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader />
        </div>
      ) : stepsCard ? (
        <GetStartedCard
          card={stepsCard}
          cardReviewed={false}
          itemReviewed={itemReviewed}
          onToggleCard={toggleCard}
          onToggleItem={toggleItem}
          milestoneSubmittedAt={submittedAt}
          onSubmitMilestone={submitMilestone}
        />
      ) : (
        <p className="py-8 text-center text-base text-[#4E5566]">
          No steps for this milestone yet.
        </p>
      )}
    </div>
  );
}
