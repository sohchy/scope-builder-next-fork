"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

import { getSubStepProgress } from "@/services/getStarted";
import { getExampleSubStepProgress } from "@/services/examples";

interface SubStepProgressValue {
  /** Reviewed state keyed by sub-step key ("1.1", "1.2"…). Missing = not done. */
  progress: Record<string, boolean>;
  /** Optimistic local update — the server write is the caller's business. */
  setSubStepReviewed: (key: string, reviewed: boolean) => void;
  /** Merge a freshly loaded slice (e.g. one milestone's cards) into the map. */
  mergeSubStepProgress: (next: Record<string, boolean>) => void;
}

const EMPTY: Record<string, boolean> = {};

// Null-object default: the header renders "nothing done" instead of throwing if
// it's ever mounted without a provider.
const SubStepProgressContext = createContext<SubStepProgressValue>({
  progress: EMPTY,
  setSubStepReviewed: () => {},
  mergeSubStepProgress: () => {},
});

export function useSubStepProgress() {
  return useContext(SubStepProgressContext);
}

/**
 * Shares sub-step completion between the milestone header and the Instructions
 * tab, which are siblings on the same page — toggling "Reviewed" on the steps
 * card marks the sub-step Done in the header without a round trip.
 */
export function SubStepProgressProvider({
  exampleNumber,
  initialProgress,
  children,
}: {
  /** Set on the read-only /examples pages: read example set N instead of the org. */
  exampleNumber?: number;
  /**
   * Progress resolved server-side by the page. Worth passing wherever sub-steps
   * *gate* something rather than merely display it — the canvas reads this to
   * decide which parts of the problem sheet exist, and without a seed it would
   * mount fully locked and expand a moment later. The effect below still runs
   * and refreshes it.
   */
  initialProgress?: Record<string, boolean>;
  children: React.ReactNode;
}) {
  const [progress, setProgress] = useState<Record<string, boolean>>(
    initialProgress ?? EMPTY,
  );

  useEffect(() => {
    let active = true;

    const load =
      exampleNumber != null
        ? getExampleSubStepProgress(exampleNumber)
        : getSubStepProgress();

    load.then((result) => {
      if (active) setProgress(result);
    });

    return () => {
      active = false;
    };
  }, [exampleNumber]);

  const setSubStepReviewed = useCallback((key: string, reviewed: boolean) => {
    setProgress((prev) => ({ ...prev, [key]: reviewed }));
  }, []);

  const mergeSubStepProgress = useCallback((next: Record<string, boolean>) => {
    setProgress((prev) => ({ ...prev, ...next }));
  }, []);

  return (
    <SubStepProgressContext.Provider
      value={{ progress, setSubStepReviewed, mergeSubStepProgress }}
    >
      {children}
    </SubStepProgressContext.Provider>
  );
}
