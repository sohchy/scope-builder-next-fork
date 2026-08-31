"use client";

import React from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";
import { milestoneLabel, subStepLabel } from "@/lib/milestones";

/** Shared by both badges below so a milestone gate and a sub-step gate are the
 *  same chip at the same size wherever they land. Sized up from text-xs: these
 *  are the one thing on a greyed section a team still has to be able to read. */
const BADGE_CLASS =
  "inline-flex items-center gap-2 rounded-full bg-[#F1ECFF] px-3 py-1.5 text-sm font-semibold text-[#6A35FF]";

/** Matched to the badge text's cap height rather than its line box, so the lock
 *  reads as the same weight as the words beside it. */
const BADGE_ICON_CLASS = "size-4 shrink-0";

/**
 * A chip announcing which milestone opens the region it sits in. Rendered beside
 * the section heading rather than over the content, so the locked section stays
 * readable underneath.
 */
export function LockBadge({ milestone }: { milestone: number }) {
  return (
    <span className={BADGE_CLASS}>
      <Lock className={BADGE_ICON_CLASS} />
      Available in Milestone {milestone}: {milestoneLabel(milestone)}
    </span>
  );
}

/**
 * Same chip for the finer gates, which hang off a sub-step rather than a whole
 * milestone. Phrased as the action the team has to take — the sub-step is one
 * of their own "Reviewed" toggles on the Instructions tab, not something an
 * instructor grants.
 */
export function SubStepLockBadge({ subStep }: { subStep: string }) {
  return (
    <span className={BADGE_CLASS}>
      <Lock className={BADGE_ICON_CLASS} />
      Complete {subStepLabel(subStep)} to unlock
    </span>
  );
}

/**
 * Wraps a region that exists but can't be worked on yet: dimmed, inert to the
 * pointer, and skipped by tab focus.
 *
 * `pointer-events-none` alone would still leave the inputs inside reachable by
 * keyboard, so every consumer *also* passes `readOnly` down to its fields — this
 * is the visual half of the gate, never the whole of it.
 */
export function LockedRegion({
  locked,
  children,
  className,
}: {
  locked: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  if (!locked) return <div className={className}>{children}</div>;

  return (
    <div
      aria-disabled
      inert
      className={cn("pointer-events-none opacity-50 grayscale", className)}
    >
      {children}
    </div>
  );
}
