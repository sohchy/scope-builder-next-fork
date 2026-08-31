"use client";

import { useEffect, useMemo, useState } from "react";

import { PageTabs } from "@/components/PageTabs";
import { InterviewPrep } from "@/components/ProblemJourneyMap/components/InterviewPrep/InterviewPrep";
import { useSubStepProgress } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import { INTERVIEW_PREP_SUB_STEP, isSubStepUnlocked } from "@/lib/milestones";
import { InterviewSummary } from "./InterviewSummary/InterviewSummary";
import ParticipantsKanbanView from "./ParticipantsKanbanView";

// Its own key, not the journey map's `pjm-active-tab` — the two pages remember
// their tab independently.
const STORAGE_KEY = "interviews-active-tab";

type TabValue = "interviewees" | "interview-prep" | "interview-summary";

const TABS: { value: TabValue; label: string }[] = [
  { value: "interviewees", label: "Interviewees" },
  { value: "interview-prep", label: "Interview Prep." },
  { value: "interview-summary", label: "Interview Summary" },
];

const TAB_VALUES = TABS.map((t) => t.value);

const DEFAULT_TAB: TabValue = "interviewees";

interface InterviewsTabsProps {
  tags: string[];
  jobTitles: string[];
  /** Instructors — puts a Review button on cards pending review. */
  canReview?: boolean;
  /** Render every tab as a read-only viewer (Examples pages). */
  readOnly?: boolean;
  /** When set, tabs read example set N's data instead of the active org's. */
  exampleNumber?: number;
  /**
   * Milestone numbers the startup has unlocked, gating the Interview Prep tab's
   * *content* the same way it's gated on /user-journey-map — the tab itself
   * always opens, and the locked section renders greyed behind its own badge.
   *
   * Omit to lock nothing at all — same convention as `JourneyMapTabs`.
   */
  availableMilestones?: number[];
}

export function InterviewsTabs({
  tags,
  jobTitles,
  canReview = false,
  readOnly = false,
  exampleNumber,
  availableMilestones,
}: InterviewsTabsProps) {
  const [value, setValue] = useState<TabValue>(DEFAULT_TAB);

  // No list at all means "gate nothing", which is what the /examples mirrors pass.
  const unlockedMilestones = useMemo(
    () => (availableMilestones ? new Set(availableMilestones) : null),
    [availableMilestones],
  );
  const { progress } = useSubStepProgress();

  const interviewPrepLocked = !isSubStepUnlocked(
    INTERVIEW_PREP_SUB_STEP,
    progress,
    unlockedMilestones,
  );

  // Restore the last-used tab on mount (kept out of the initial state to avoid an
  // SSR/hydration mismatch). Falls back to the default when nothing is stored.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && TAB_VALUES.includes(stored as TabValue)) {
      setValue(stored as TabValue);
    }
  }, []);

  const select = (next: TabValue) => {
    setValue(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* No lock icons and no Milestone Steps shortcut here — the milestone strip
          sits right above this bar on both pages that render it. */}
      <PageTabs tabs={TABS} value={value} onValueChange={select} />

      {/* Content — matches the active folder tab colour so they read as connected. */}
      <div className="min-h-0 flex-1 bg-[#EFF0F4]">
        {value === "interviewees" ? (
          // The Kanban has no scroller of its own, so the padding lives here
          // rather than on the page — which keeps the tab bar full-bleed.
          <div className="h-full px-8 py-4">
            <ParticipantsKanbanView
              tags={tags}
              jobTitles={jobTitles}
              canReview={canReview}
              readOnly={readOnly}
              exampleNumber={exampleNumber}
            />
          </div>
        ) : value === "interview-prep" ? (
          // Same component the journey map renders. Both pages read and write the
          // same org-scoped records, so an edit here shows up there on next mount.
          <InterviewPrep
            readOnly={readOnly}
            exampleNumber={exampleNumber}
            locked={interviewPrepLocked}
          />
        ) : (
          // Ungated for now — the summary is only useful once interviews have been
          // conducted, but which sub-step should open it isn't settled. To gate it,
          // follow `interviewPrepLocked` above plus a LockedRegion inside the tab.
          <InterviewSummary readOnly={readOnly} exampleNumber={exampleNumber} />
        )}
      </div>
    </div>
  );
}
