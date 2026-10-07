"use client";

import { HypothesisSummaryRows } from "./HypothesisSummaryRows";
import { SummaryAccordionCard } from "./SummaryAccordionCard";
import type { AnswerOrder, SummaryHypothesis } from "./types";

interface ImportedSummaryCardProps {
  hypothesis: SummaryHypothesis;
  readOnly?: boolean;
  showQuestions: boolean;
  orderBy: AnswerOrder;
}

/**
 * One hypothesis brought in by CSV import, merged across interviewees, as its own
 * collapsible card — the imported counterpart of a problem card. It belongs to no
 * journey-map problem, so the band names the hypothesis itself, and the row beneath
 * doesn't repeat it.
 */
export function ImportedSummaryCard({
  hypothesis,
  readOnly = false,
  showQuestions,
  orderBy,
}: ImportedSummaryCardProps) {
  return (
    <SummaryAccordionCard
      value={hypothesis.id}
      header={
        <div className="flex items-baseline gap-2 bg-[#F5F5F8] px-5 py-4">
          <p className="min-w-0 whitespace-pre-wrap text-sm font-medium text-[#1F2430]">
            {hypothesis.prompt}
          </p>
          <span className="inline-flex shrink-0 items-center rounded-full bg-[#F4F0FF] px-2.5 py-0.5 text-xs font-medium text-[#6A35FF]">
            Hypothesis
          </span>
        </div>
      }
    >
      <HypothesisSummaryRows
        hypotheses={[hypothesis]}
        readOnly={readOnly}
        showQuestions={showQuestions}
        orderBy={orderBy}
        showPrompt={false}
      />
    </SummaryAccordionCard>
  );
}
