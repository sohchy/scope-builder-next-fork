"use client";

import { HypothesisSummaryBlock } from "./HypothesisSummaryBlock";
import { HypothesisSummaryPanel } from "./HypothesisSummaryPanel";
import type { AnswerOrder, SummaryHypothesis } from "./types";

/** Width of the summary column. Fixed, so the answers take whatever is left. */
const PANEL_WIDTH = "340px";

interface HypothesisSummaryRowsProps {
  hypotheses: SummaryHypothesis[];
  readOnly?: boolean;
  showQuestions: boolean;
  orderBy: AnswerOrder;
  /** Passed to each block — off when the card's header already names the hypothesis. */
  showPrompt?: boolean;
}

/**
 * The body of a summary card: one row per hypothesis, pairing its answers with the
 * summary written about them.
 *
 * The summary sits inside the card rather than in a gutter beside it — a summary belongs
 * to the hypothesis it is about, so a rule between the two is the whole separation it
 * needs. `items-stretch` is what makes that rule run the full height of the row however
 * lopsided the two sides are.
 */
export function HypothesisSummaryRows({
  hypotheses,
  readOnly = false,
  showQuestions,
  orderBy,
  showPrompt = true,
}: HypothesisSummaryRowsProps) {
  return hypotheses.map((hypothesis, i) => (
    <div
      key={hypothesis.id}
      className={`flex items-stretch ${i > 0 ? "border-t border-[#E4E5ED]" : ""}`}
    >
      <div className="min-w-0 flex-1">
        <HypothesisSummaryBlock
          hypothesis={hypothesis}
          showQuestions={showQuestions}
          orderBy={orderBy}
          showPrompt={showPrompt}
        />
      </div>
      <div className="shrink-0 border-l border-[#E4E5ED]" style={{ width: PANEL_WIDTH }}>
        <HypothesisSummaryPanel hypothesis={hypothesis} readOnly={readOnly} />
      </div>
    </div>
  ));
}
