"use client";

import React from "react";
import { Lock } from "lucide-react";

import { cn } from "@/lib/utils";

export interface PageTab<T extends string> {
  value: T;
  label: string;
  /** Renders a lock icon before the label — "nothing here is open yet". */
  locked?: boolean;
}

interface PageTabsProps<T extends string> {
  tabs: PageTab<T>[];
  value: T;
  onValueChange: (next: T) => void;
  /** Right-aligned slot — the journey map puts its Milestone Steps button here. */
  actions?: React.ReactNode;
}

/**
 * The folder-tab bar shared by the top-level page tabs. Chrome only: the tab
 * list, the active tab, gating and the content switch all stay with the caller.
 *
 * A lock is a label, never a barrier — a locked tab still opens, and the section
 * inside it is what renders greyed and read-only, so a team can see what's coming.
 */
export function PageTabs<T extends string>({
  tabs,
  value,
  onValueChange,
  actions,
}: PageTabsProps<T>) {
  return (
    // Tab bar — a darker grey band than the content area below it.
    <div className="flex w-full items-end gap-1 bg-[#E2E4EA] px-4 pt-2  border-[#CDCFDE]">
      {tabs.map((tab) => {
        const active = value === tab.value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onValueChange(tab.value)}
            className={cn(
              // Wide enough that the longest label plus its lock icon stays
              // on one line — a wrapped tab is taller than its neighbours.
              "flex cursor-pointer flex-col items-center w-[135px] gap-1.5 rounded-t-lg pt-1 pb-2 text-[12px] font-semibold transition-colors",
              active
                ? "bg-[#EFF0F4] text-[#6A35FF] border border-[#CDCFDE] border-b-[#EFF0F4]"
                : "text-[#697288] hover:text-[#4B4560]",
            )}
          >
            <span className="flex items-center gap-1 whitespace-nowrap">
              {tab.locked && (
                <Lock aria-label="Locked" className="size-3 shrink-0" />
              )}
              {tab.label}
            </span>
            <span
              className={cn(
                "h-1 w-6 rounded-full transition-colors",
                active ? "bg-[#6A35FF]" : "bg-[#C4C5D0]",
              )}
            />
          </button>
        );
      })}

      {actions && <div className="mb-2 ml-auto">{actions}</div>}
    </div>
  );
}

/**
 * Placeholder for a tab whose content isn't built yet. Distinct from a *locked*
 * tab, which renders its real content greyed behind a lock badge.
 */
export function EmptyTab() {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <div className="flex w-[300px] flex-col items-center gap-3 rounded-2xl bg-white px-8 py-10 text-center shadow-sm">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#F1ECFF]">
          <Lock className="h-6 w-6 text-[#6A35FF]" />
        </div>
        <h3 className="text-base font-semibold text-[#1F2430]">
          This step will be available soon
        </h3>
        <p className="text-xs text-[#697288]">
          This page will get available once the prior steps are completed.
        </p>
      </div>
    </div>
  );
}
