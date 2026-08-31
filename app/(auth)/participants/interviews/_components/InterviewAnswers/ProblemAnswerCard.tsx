"use client";

import { ProblemHeaderBand } from "../ProblemHeaderBand";
import { AnswerInput } from "./AnswerInput";
import type { AnswerableProblem } from "./types";

/**
 * Narrowest a question tile is allowed to get. `auto-fill` packs as many of these
 * as the card's own width allows — so the column count follows the card rather
 * than the viewport, and survives a sidebar opening beside it.
 */
const QUESTION_MIN_WIDTH = "17rem";

interface ProblemAnswerCardProps {
  problem: AnswerableProblem;
  onAnswerChange: (questionId: string, value: string) => void;
  onAnswerCommit: (questionId: string, value?: string) => void;
  readOnly?: boolean;
}

/**
 * One problem as a single card: a grey summary band across the top, and every
 * question for that problem tiled beneath it in a responsive grid.
 */
export function ProblemAnswerCard({
  problem,
  onAnswerChange,
  onAnswerCommit,
  readOnly = false,
}: ProblemAnswerCardProps) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-[#E4E5ED] bg-white">
      {/* Full-bleed so the band reads as the card's header rather than a nested block. */}
      <ProblemHeaderBand
        action={problem.action}
        label={problem.label}
        description={problem.description}
        tags={problem.tags}
      />

      <div
        className="grid gap-4 p-5"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(min(${QUESTION_MIN_WIDTH}, 100%), 1fr))`,
        }}
      >
        {problem.questions.map((question) => (
          <div
            key={question.questionId}
            className="flex flex-col gap-3 rounded-lg bg-[#F5F5F8] p-4"
          >
            <div className="flex gap-2">
              <span className="text-sm font-medium text-[#6A35FF]">
                {question.index}
              </span>
              <p className="min-w-0 flex-1 text-sm font-medium text-[#1F2430]">
                {question.title}
              </p>
            </div>
            {/* Grid cells stretch to the tallest tile in their row, so pushing the
                input down keeps every answer in a row on the same line even when
                the questions above them wrap to different heights. */}
            <div className="mt-auto">
              <AnswerInput
                question={question}
                value={question.answer}
                readOnly={readOnly}
                onChange={(value) => onAnswerChange(question.questionId, value)}
                onCommit={(value) => onAnswerCommit(question.questionId, value)}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
