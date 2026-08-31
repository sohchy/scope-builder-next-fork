"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getGetStartedCards,
  setCardReviewed,
  setItemReviewed,
  type GetStartedCardWithData,
} from "@/services/getStarted";
import { getExampleGetStartedCards } from "@/services/examples";
import {
  getMilestoneSubmission,
  submitMilestone,
} from "@/services/milestoneAccess";
import { subStepKey } from "@/lib/milestones";
import { useSubStepProgress } from "./SubStepProgressContext";

interface GetStartedCardsValue {
  /** Cards per milestone. A missing entry means "not fetched yet". */
  cardsByMilestone: Record<number, GetStartedCardWithData[]>;
  /** Reviewed state keyed by card / item id — flat, ids are unique across milestones. */
  cardReviewed: Record<number, boolean>;
  itemReviewed: Record<number, boolean>;
  /** When each milestone was submitted for review; null while unsubmitted. */
  submittedByMilestone: Record<number, Date | null>;
  /** Fetches a milestone's cards the first time it's asked for; a no-op after that. */
  ensureLoaded: (milestone: number) => void;
  toggleCard: (cardId: number, next: boolean) => void;
  toggleItem: (itemId: number, next: boolean) => void;
  submit: (milestone: number) => void;
}

const GetStartedCardsContext = createContext<GetStartedCardsValue>(null!);

/**
 * A milestone's Get Started cards plus their reviewed and submitted state,
 * loaded once.
 *
 * Returns `loading` only while the milestone has never been fetched — the cache
 * lives as long as the page, so reopening the Milestone Steps dialog or coming
 * back to the Instructions tab is instant. That's safe because this provider is
 * the only writer: both surfaces toggle through it, so its copy stays
 * authoritative for the session without re-reading. (A teammate ticking a step
 * in another session isn't reflected until reload — same as the Instructions tab
 * has always behaved while it stays mounted.)
 */
export function GetStartedCardsProvider({
  exampleNumber,
  readOnly = false,
  children,
}: {
  /** Set on the read-only /examples pages: read example set N instead of the org. */
  exampleNumber?: number;
  /** Toggles are ignored (Examples pages). */
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  const { setSubStepReviewed, mergeSubStepProgress } = useSubStepProgress();

  const [cardsByMilestone, setCardsByMilestone] = useState<
    Record<number, GetStartedCardWithData[]>
  >({});
  const [cardReviewed, setCardReviewedState] = useState<Record<number, boolean>>({});
  const [itemReviewed, setItemReviewedState] = useState<Record<number, boolean>>({});
  const [submittedByMilestone, setSubmittedByMilestone] = useState<
    Record<number, Date | null>
  >({});

  // Milestones already requested, so two consumers mounting at once (or a
  // remount before the first fetch resolves) can't fire duplicate queries.
  const requested = useRef<Set<number>>(new Set());
  const requestedSubmission = useRef<Set<number>>(new Set());
  // Read by toggleItem to resolve an item's sub-step key without making the
  // callback depend on — and change identity with — the cards themselves.
  const cardsRef = useRef(cardsByMilestone);
  cardsRef.current = cardsByMilestone;
  // Same trick for `submit`, which must not re-submit an already-submitted
  // milestone but also must not change identity every time one is submitted.
  const submittedRef = useRef(submittedByMilestone);
  submittedRef.current = submittedByMilestone;

  const ensureLoaded = useCallback(
    (milestone: number) => {
      // Guarded separately from the cards below: a failed cards fetch is retried
      // by the next consumer, and that retry shouldn't re-read the submission.
      if (
        // Submission is per-org and has no example-set mirror, so the Examples
        // pages just show the button disabled and unsubmitted.
        exampleNumber == null &&
        !requestedSubmission.current.has(milestone)
      ) {
        requestedSubmission.current.add(milestone);
        getMilestoneSubmission(milestone)
          .then((result) =>
            setSubmittedByMilestone((prev) => ({ ...prev, [milestone]: result })),
          )
          .catch(() => requestedSubmission.current.delete(milestone));
      }

      if (requested.current.has(milestone)) return;
      requested.current.add(milestone);

      const load =
        exampleNumber != null
          ? getExampleGetStartedCards(milestone, exampleNumber)
          : getGetStartedCards(milestone);

      load
        .then((result) => {
          const cardMap: Record<number, boolean> = {};
          const itemMap: Record<number, boolean> = {};
          // Sub-step items of this milestone's steps card, so the header agrees
          // with what was just loaded even if it was mounted before this fetch.
          const subStepMap: Record<string, boolean> = {};
          for (const card of result) {
            for (const review of card.reviews) {
              if (review.card_id != null) cardMap[review.card_id] = review.reviewed;
            }
            for (const item of card.items) {
              for (const review of item.reviews) {
                itemMap[review.item_id!] = review.reviewed;
              }
              if (item.sub_step != null) {
                subStepMap[subStepKey(card.milestone, item.sub_step)] =
                  item.reviews.some((review) => review.reviewed);
              }
            }
          }

          // Merging rather than replacing: the maps span every loaded milestone,
          // and the incoming ids are ones no consumer could have toggled yet.
          setCardsByMilestone((prev) => ({ ...prev, [milestone]: result }));
          setCardReviewedState((prev) => ({ ...prev, ...cardMap }));
          setItemReviewedState((prev) => ({ ...prev, ...itemMap }));
          mergeSubStepProgress(subStepMap);
        })
        .catch(() => {
          // Let the next consumer retry instead of stranding it on a loader.
          requested.current.delete(milestone);
        });
    },
    [exampleNumber, mergeSubStepProgress],
  );

  const toggleCard = useCallback(
    (cardId: number, next: boolean) => {
      if (readOnly) return;
      setCardReviewedState((prev) => ({ ...prev, [cardId]: next })); // optimistic
      setCardReviewed(cardId, next).catch(() =>
        setCardReviewedState((prev) => ({ ...prev, [cardId]: !next })),
      );
    },
    [readOnly],
  );

  const toggleItem = useCallback(
    (itemId: number, next: boolean) => {
      if (readOnly) return;
      setItemReviewedState((prev) => ({ ...prev, [itemId]: next })); // optimistic

      // Items on the steps card carry a sub_step: reviewing one marks the
      // matching sub-step Done in the milestone header.
      const entry = Object.values(cardsRef.current)
        .flat()
        .flatMap((card) => card.items.map((item) => ({ card, item })))
        .find((candidate) => candidate.item.id === itemId);
      const key =
        entry && entry.item.sub_step != null
          ? subStepKey(entry.card.milestone, entry.item.sub_step)
          : null;
      if (key) setSubStepReviewed(key, next);

      setItemReviewed(itemId, next).catch(() => {
        setItemReviewedState((prev) => ({ ...prev, [itemId]: !next }));
        if (key) setSubStepReviewed(key, !next);
      });
    },
    [readOnly, setSubStepReviewed],
  );

  /**
   * Submitting is one-way and lives here rather than on the Instructions tab so
   * the tab and the Milestone Steps dialog show the same button state — either
   * can submit, and the other reflects it without a refetch.
   */
  const submit = useCallback(
    (milestone: number) => {
      if (readOnly || exampleNumber != null) return;
      if (submittedRef.current[milestone]) return;

      // Optimistic; the server timestamp wins below.
      setSubmittedByMilestone((prev) => ({ ...prev, [milestone]: new Date() }));

      submitMilestone(milestone)
        .then((submittedAt) =>
          setSubmittedByMilestone((prev) => ({
            ...prev,
            [milestone]: submittedAt,
          })),
        )
        .catch(() =>
          setSubmittedByMilestone((prev) => ({ ...prev, [milestone]: null })),
        );
    },
    [readOnly, exampleNumber],
  );

  return (
    <GetStartedCardsContext.Provider
      value={{
        cardsByMilestone,
        cardReviewed,
        itemReviewed,
        submittedByMilestone,
        ensureLoaded,
        toggleCard,
        toggleItem,
        submit,
      }}
    >
      {children}
    </GetStartedCardsContext.Provider>
  );
}

/**
 * One milestone's slice of the cache, fetching it on first use. Shared by the
 * Instructions tab and the Milestone Steps dialog so they never disagree and
 * only the first of them to ask pays for the query.
 */
export function useGetStartedCards(milestone: number) {
  const {
    cardsByMilestone,
    cardReviewed,
    itemReviewed,
    submittedByMilestone,
    ensureLoaded,
    toggleCard,
    toggleItem,
    submit,
  } = useContext(GetStartedCardsContext);

  useEffect(() => {
    ensureLoaded(milestone);
  }, [milestone, ensureLoaded]);

  const cards = cardsByMilestone[milestone];

  const submitMilestoneForReview = useCallback(
    () => submit(milestone),
    [submit, milestone],
  );

  return {
    cards: cards ?? [],
    loading: cards === undefined,
    cardReviewed,
    itemReviewed,
    submittedAt: submittedByMilestone[milestone] ?? null,
    toggleCard,
    toggleItem,
    submitMilestone: submitMilestoneForReview,
  };
}
