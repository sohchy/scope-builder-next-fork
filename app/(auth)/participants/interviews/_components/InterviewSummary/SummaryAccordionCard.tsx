"use client";

import type { ReactNode } from "react";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SummaryAccordionCardProps {
  /** Accordion item value — unique among the cards on the tab. */
  value: string;
  /** The card's grey band. The whole band is the toggle; the chevron sits at its right. */
  header: ReactNode;
  children: ReactNode;
}

/**
 * A summary card that collapses to its header band. The tab can run long, so the user
 * opens only the problems they want to read rather than scrolling past every one.
 */
export function SummaryAccordionCard({ value, header, children }: SummaryAccordionCardProps) {
  return (
    <AccordionItem
      value={value}
      // `last:border-b-0` from the primitive would drop the last card's bottom edge.
      className="overflow-hidden rounded-xl border border-[#E4E5ED] bg-white last:border-b"
    >
      {/* The primitive's trigger is styled as a text link; here it is the band itself,
          so its padding, underline and weight are taken off and the band supplies them. */}
      <AccordionTrigger className="items-center gap-0 rounded-none bg-[#F5F5F8] py-0 pr-5 font-normal hover:no-underline">
        <div className="min-w-0 flex-1">{header}</div>
      </AccordionTrigger>
      {/* Kept mounted while collapsed: the summary panels hold what was typed in local
          state, seeded from the data the tab loaded, so remounting on reopen would show
          the text from before the edit. A force-mounted Radix panel is never given the
          `hidden` attribute, so the body hides itself off the panel's closed state. */}
      <AccordionContent forceMount className="p-0 [[data-state=closed]>&]:hidden">
        {children}
      </AccordionContent>
    </AccordionItem>
  );
}
