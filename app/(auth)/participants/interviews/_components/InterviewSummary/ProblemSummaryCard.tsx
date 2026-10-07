"use client";

import { ProblemHeaderBand } from "../ProblemHeaderBand";
import { HypothesisSummaryRows } from "./HypothesisSummaryRows";
import { SummaryAccordionCard } from "./SummaryAccordionCard";
import type { AnswerOrder, SummaryProblem } from "./types";

interface ProblemSummaryCardProps {
  problem: SummaryProblem;
  readOnly?: boolean;
  /** View state owned by the tab, applied to every hypothesis on the page. */
  showQuestions: boolean;
  orderBy: AnswerOrder;
}

/**
 * One problem as a single collapsible card: its grey header band across the top, then
 * one row per hypothesis, each row pairing the answers with the summary written about
 * them.
 */
export function ProblemSummaryCard({
  problem,
  readOnly = false,
  showQuestions,
  orderBy,
}: ProblemSummaryCardProps) {
  return (
    <SummaryAccordionCard
      value={problem.id}
      header={
        <ProblemHeaderBand
          action={problem.action}
          label={problem.label}
          description={problem.description}
          tags={problem.tags}
        />
      }
    >
      <HypothesisSummaryRows
        hypotheses={problem.hypotheses}
        readOnly={readOnly}
        showQuestions={showQuestions}
        orderBy={orderBy}
      />
    </SummaryAccordionCard>
  );
}
