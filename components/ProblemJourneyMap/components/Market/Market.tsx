"use client";

import { useEffect, useState } from "react";

import { Loader } from "@/components/ui/loader";
import { getMarketData, type MarketData } from "@/services/market";
import { getExampleMarketData } from "@/services/examples";
import {
  MARKET_SEGMENTS_SUB_STEP,
  STAKEHOLDERS_SUB_STEP,
} from "@/lib/milestones";
import { LockedRegion, SubStepLockBadge } from "../LockedRegion";
import { StakeholdersSection } from "./StakeholdersSection";
import { MarketSegmentsSection } from "./MarketSegmentsSection";

interface MarketProps {
  readOnly?: boolean;
  exampleNumber?: number;
  /**
   * The two halves gate separately — they open at different points in the
   * curriculum — so each greys out on its own. Locked also forces `readOnly` on
   * the section below, since dimming alone wouldn't stop a keyboard edit.
   */
  stakeholdersLocked?: boolean;
  segmentsLocked?: boolean;
}

export function Market({
  readOnly = false,
  exampleNumber,
  stakeholdersLocked = false,
  segmentsLocked = false,
}: MarketProps) {
  const [data, setData] = useState<MarketData | null>(null);

  // Market data is org-wide (not per-milestone), so load once on mount.
  useEffect(() => {
    let active = true;
    const load =
      exampleNumber != null
        ? getExampleMarketData(exampleNumber)
        : getMarketData();
    load.then((result) => {
      if (active) setData(result);
    });
    return () => {
      active = false;
    };
  }, [exampleNumber]);

  if (!data) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-white p-6">
      {/* Stakeholders grows to fill, pushing Market Segments to the bottom. The
          badge sits outside the dimmed region so it stays legible. */}
      <div className="flex-1">
        {stakeholdersLocked && (
          <div className="mb-3">
            <SubStepLockBadge subStep={STAKEHOLDERS_SUB_STEP} />
          </div>
        )}
        <LockedRegion locked={stakeholdersLocked}>
          <StakeholdersSection
            rows={data.stakeholderRows}
            readOnly={readOnly || stakeholdersLocked}
          />
        </LockedRegion>
      </div>

      {/* Gray divider separating the two parts (matches the design). */}
      <div className="my-6 border-t border-[#BFC4D2]" />

      {segmentsLocked && (
        <div className="mb-3">
          <SubStepLockBadge subStep={MARKET_SEGMENTS_SUB_STEP} />
        </div>
      )}
      <LockedRegion locked={segmentsLocked}>
        <MarketSegmentsSection
          segments={data.segments}
          note={data.note?.content ?? ""}
          readOnly={readOnly || segmentsLocked}
        />
      </LockedRegion>
    </div>
  );
}
