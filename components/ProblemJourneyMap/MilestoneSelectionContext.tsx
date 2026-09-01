"use client";

import React, { createContext, useContext, useState } from "react";

interface MilestoneSelectionValue {
  /** The selected milestone *number* (0..5). Milestones start at 0 ("Program
   *  Orientation"), so this doubles as the index into MILESTONE_LABELS. */
  selectedMilestone: number;
  setSelectedMilestone: (milestone: number) => void;
}

const MilestoneSelectionContext = createContext<MilestoneSelectionValue>(null!);

export function useMilestoneSelection() {
  return useContext(MilestoneSelectionContext);
}

export function MilestoneSelectionProvider({
  // Milestone 0 — the orientation week, and the only milestone every startup can
  // reach on day one.
  defaultSelected = 0,
  children,
}: {
  defaultSelected?: number;
  children: React.ReactNode;
}) {
  const [selectedMilestone, setSelectedMilestone] = useState(defaultSelected);

  return (
    <MilestoneSelectionContext.Provider
      value={{ selectedMilestone, setSelectedMilestone }}
    >
      {children}
    </MilestoneSelectionContext.Provider>
  );
}
