"use client";

import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

import { StarRating } from "../StarRating";
import { QuestionList } from "./QuestionList";
import type { Hypothesis, InterviewQuestionDraft } from "./types";

interface HypothesisRowProps {
  hypothesis: Hypothesis;
  onQuestionCreate: (value: InterviewQuestionDraft) => Promise<void>;
  onQuestionUpdate: (id: string, value: InterviewQuestionDraft) => Promise<void>;
  onQuestionDelete: (id: string) => Promise<void>;
  onQuestionReorder: (orderedIds: string[]) => Promise<void>;
  /** Supplied by the sortable wrapper; absent in read-only mode. */
  dragHandle?: ReactNode;
  readOnly?: boolean;
}

export function HypothesisRow({
  hypothesis,
  onQuestionCreate,
  onQuestionUpdate,
  onQuestionDelete,
  onQuestionReorder,
  dragHandle,
  readOnly = false,
}: HypothesisRowProps) {
  return (
    <div className="relative grid grid-cols-2">
      {/* Left: the hypothesis (read-only). */}
      <div className="flex gap-3 border-r border-[#CFD3E0] px-6 py-6">
        {/* Pulled into the column's left padding so the number stays the row's
            leftmost text and the rows don't shift when the handle is absent. */}
        {dragHandle && <div className="-ml-4 -mt-1 shrink-0">{dragHandle}</div>}
        <span className="text-base font-bold text-[#1F2430]">
          {hypothesis.index}.
        </span>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <p className="text-base text-[#4E5566]">{hypothesis.prompt}</p>
            <p className="text-base font-semibold text-[#1F2430]">
              {hypothesis.answer}
            </p>
          </div>
          {/* Source and confidence share one line — nowrap plus the smaller star
              size keeps them there in the narrow hypothesis column. */}
          <div className="flex flex-nowrap items-center gap-x-4 whitespace-nowrap text-xs text-[#4E5566]">
            <span>
              Source:{" "}
              <span className="font-semibold text-[#4B4560]">
                {hypothesis.source}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              Your confidence:
              <StarRating value={hypothesis.confidence} size="sm" />
            </span>
          </div>
        </div>
      </div>

      {/* Right: the interview questions authored against this hypothesis. */}
      <div className="px-6 py-6 pl-10">
        <QuestionList
          questions={hypothesis.questions}
          onCreate={onQuestionCreate}
          onUpdate={onQuestionUpdate}
          onDelete={onQuestionDelete}
          onReorder={onQuestionReorder}
          readOnly={readOnly}
        />
      </div>

      {/* Center connector — green circular arrow straddling the divider. */}
      <div className="pointer-events-none absolute left-1/2 top-8 -translate-x-1/2">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 text-green-800">
          <ArrowRight className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
