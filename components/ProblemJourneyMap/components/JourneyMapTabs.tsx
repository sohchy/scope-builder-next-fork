"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ListChecks } from "lucide-react";

import { EmptyTab, PageTabs } from "@/components/PageTabs";
import {
  INTERVIEW_PREP_SUB_STEP,
  isSubStepUnlocked,
  MARKET_SEGMENTS_SUB_STEP,
  STAKEHOLDERS_SUB_STEP,
} from "@/lib/milestones";
import { GetStartedCardsProvider } from "../GetStartedCardsContext";
import { useSubStepProgress } from "../SubStepProgressContext";
import { InterviewPrep } from "./InterviewPrep/InterviewPrep";
import { GetStarted } from "./GetStarted/GetStarted";
import { Market } from "./Market/Market";
import { MilestoneStepsDialog } from "./MilestoneStepsDialog";

const STORAGE_KEY = "pjm-active-tab";

type TabValue = "get-started" | "canvas" | "market" | "interview-prep";

const TABS: { value: TabValue; label: string }[] = [
  { value: "get-started", label: "Instructions" },
  { value: "canvas", label: "Canvas" },
  { value: "market", label: "Market" },
  { value: "interview-prep", label: "Interview Prep." },
];

const TAB_VALUES = TABS.map((t) => t.value);

const DEFAULT_TAB: TabValue = "canvas";

interface JourneyMapTabsProps {
  /** The live journey-map canvas. Rendered only while the Canvas tab is active. */
  canvas: React.ReactNode;
  /** Render every tab as a read-only viewer (Examples pages). */
  readOnly?: boolean;
  /** When set, tabs read example set N's data instead of the active org's. */
  exampleNumber?: number;
  /**
   * Milestone numbers the startup has unlocked. Every section below gates on a
   * sub-step, which needs both this *and* the team's own "Reviewed" toggle — see
   * `isSubStepUnlocked`. A locked section renders greyed and read-only behind its
   * own badge, and a tab with nothing open yet gets a lock icon; the tab itself
   * still opens either way, so a team can see what's coming.
   *
   * Omit to lock nothing at all — same convention as `MilestoneHeader`. The
   * /examples journey mirror does pass it (the viewer's own access), so a
   * showcase locks the same sections the viewer's own page does; `readOnly` is
   * what makes it a viewer, not the absence of gates.
   */
  availableMilestones?: number[];
}

export function JourneyMapTabs({
  canvas,
  readOnly = false,
  exampleNumber,
  availableMilestones,
}: JourneyMapTabsProps) {
  const [value, setValue] = useState<TabValue>(DEFAULT_TAB);
  const [stepsOpen, setStepsOpen] = useState(false);

  // No list at all means "gate nothing", which is what the /examples mirrors pass.
  const unlockedMilestones = useMemo(
    () => (availableMilestones ? new Set(availableMilestones) : null),
    [availableMilestones],
  );
  // The team's own "Reviewed" toggles, which every gate here reads on top of the
  // instructor-granted milestones above.
  const { progress } = useSubStepProgress();

  const stakeholdersLocked = !isSubStepUnlocked(
    STAKEHOLDERS_SUB_STEP,
    progress,
    unlockedMilestones,
  );
  const segmentsLocked = !isSubStepUnlocked(
    MARKET_SEGMENTS_SUB_STEP,
    progress,
    unlockedMilestones,
  );
  const interviewPrepLocked = !isSubStepUnlocked(
    INTERVIEW_PREP_SUB_STEP,
    progress,
    unlockedMilestones,
  );

  // The tab's lock icon means "nothing here is open yet". A tab with one section
  // unlocked loses it, and the still-locked section keeps its own badge — the two
  // halves of Market open at different points in the curriculum.
  const lockedTabs: Partial<Record<TabValue, boolean>> = {
    market: stakeholdersLocked && segmentsLocked,
    "interview-prep": interviewPrepLocked,
  };

  const tabs = TABS.map((tab) => ({ ...tab, locked: lockedTabs[tab.value] }));

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
    // Get Started cards are cached here rather than fetched per consumer: the
    // Instructions tab and the Milestone Steps dialog show the same cards and
    // both mount and unmount often.
    <GetStartedCardsProvider exampleNumber={exampleNumber} readOnly={readOnly}>
      <div className="flex min-h-0 flex-1 flex-col">
        <PageTabs
          tabs={tabs}
          value={value}
          onValueChange={select}
          actions={
            /* Shortcut to this milestone's checklist, so a step can be read and
              ticked off without leaving the current tab. Redundant on Instructions
              (the card is right there), and `readOnly` is what the Examples mirror
              passes, where there is nothing to tick. */
            value !== "get-started" && !readOnly ? (
              <button
                type="button"
                onClick={() => setStepsOpen(true)}
                className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#CDCFDE] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4B4560] transition-colors hover:text-[#6A35FF]"
              >
                <ListChecks className="size-3.5" />
                Milestone Steps
              </button>
            ) : null
          }
        />

        <MilestoneStepsDialog open={stepsOpen} onOpenChange={setStepsOpen} />

        {/* Content — matches the active folder tab colour so they read as connected. */}
        <div className="min-h-0 flex-1 bg-[#EFF0F4]">
          {value === "canvas" ? (
            canvas
          ) : value === "get-started" ? (
            <GetStarted readOnly={readOnly} />
          ) : value === "market" ? (
            <Market
              readOnly={readOnly}
              exampleNumber={exampleNumber}
              stakeholdersLocked={stakeholdersLocked}
              segmentsLocked={segmentsLocked}
            />
          ) : value === "interview-prep" ? (
            <InterviewPrep
              readOnly={readOnly}
              exampleNumber={exampleNumber}
              locked={interviewPrepLocked}
            />
          ) : (
            <EmptyTab />
          )}
        </div>
      </div>
    </GetStartedCardsProvider>
  );
}
