"use client";

import { ProblemHeaderBand } from "../ProblemHeaderBand";
import { HypothesisSummaryBlock } from "./HypothesisSummaryBlock";
import { HypothesisSummaryPanel } from "./HypothesisSummaryPanel";
import type { AnswerOrder, SummaryProblem } from "./types";

/** Width of the summary column. Fixed, so the answers take whatever is left. */
const PANEL_WIDTH = "340px";

interface ProblemSummaryCardProps {
  problem: SummaryProblem;
  readOnly?: boolean;
  /** View state owned by the tab, applied to every hypothesis on the page. */
  showQuestions: boolean;
  orderBy: AnswerOrder;
}

/**
 * One problem as a single card: its grey header band across the top, then one row per
 * hypothesis, each row pairing the answers with the summary written about them.
 *
 * The summary sits inside the card rather than in a gutter beside it — a summary belongs
 * to the hypothesis it is about, so a rule between the two is the whole separation it
 * needs. `items-stretch` is what makes that rule run the full height of the row however
 * lopsided the two sides are.
 */
export function ProblemSummaryCard({
  problem,
  readOnly = false,
  showQuestions,
  orderBy,
}: ProblemSummaryCardProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#E4E5ED] bg-white">
      <ProblemHeaderBand
        action={problem.action}
        label={problem.label}
        description={problem.description}
        tags={problem.tags}
      />

      {problem.hypotheses.map((hypothesis, i) => (
        <div
          key={hypothesis.id}
          className={`flex items-stretch ${i > 0 ? "border-t border-[#E4E5ED]" : ""}`}
        >
          <div className="min-w-0 flex-1">
            <HypothesisSummaryBlock
              hypothesis={hypothesis}
              showQuestions={showQuestions}
              orderBy={orderBy}
            />
          </div>
          <div
            className="shrink-0 border-l border-[#E4E5ED]"
            style={{ width: PANEL_WIDTH }}
          >
            <HypothesisSummaryPanel hypothesis={hypothesis} readOnly={readOnly} />
          </div>
        </div>
      ))}
    </div>
  );
}
