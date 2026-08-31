"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { Loader } from "@/components/ui/loader";
import { MasonryGrid } from "@/components/ui/masonry-grid";
import { useMilestoneSelection } from "../../MilestoneSelectionContext";
import { useGetStartedCards } from "../../GetStartedCardsContext";
import { GetStartedCard } from "./GetStartedCard";

// Mirrors the shared transition used in MilestoneHeader.tsx so milestone
// changes feel consistent across the header and its content.
const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const;
const INSTANT = { duration: 0 } as const;

interface GetStartedProps {
  readOnly?: boolean;
}

// The example set is no longer read here: cards and submission both come from
// GetStartedCardsProvider, which is the one that knows about /examples.
export function GetStarted({ readOnly = false }: GetStartedProps) {
  const { selectedMilestone: milestone } = useMilestoneSelection();
  const prefersReducedMotion = useReducedMotion();
  const transition = prefersReducedMotion ? INSTANT : TRANSITION;

  // Cached page-wide and shared with MilestoneStepsDialog, which renders this
  // milestone's steps card — submission included — from the journey tab bar.
  // Leaving and returning to this tab doesn't re-query.
  const {
    cards,
    loading,
    cardReviewed,
    itemReviewed,
    submittedAt,
    toggleCard,
    toggleItem,
    submitMilestone,
  } = useGetStartedCards(milestone);

  return (
    <AnimatePresence mode="wait">
      {loading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="flex h-full w-full items-center justify-center"
        >
          <Loader />
        </motion.div>
      ) : cards.length === 0 ? (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="flex h-full w-full items-center justify-center p-8"
        >
          <p className="text-base text-[#4E5566]">
            No Get Started content for this milestone yet.
          </p>
        </motion.div>
      ) : (
        <motion.div
          key={`cards-${milestone}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className="h-full overflow-y-auto p-6"
        >
          <MasonryGrid>
            {cards.map((card) => (
              <GetStartedCard
                key={card.id}
                card={card}
                cardReviewed={!!cardReviewed[card.id]}
                itemReviewed={itemReviewed}
                onToggleCard={toggleCard}
                onToggleItem={toggleItem}
                milestoneSubmittedAt={submittedAt}
                onSubmitMilestone={submitMilestone}
                readOnly={readOnly}
              />
            ))}
          </MasonryGrid>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
