"use client";

import { format } from "date-fns";
import { useMemo } from "react";

import type { AnswerOrder, SummaryHypothesis } from "./types";

/** One thing somebody said, lifted out of the question it was said against. */
interface AnswerEntry {
  key: string;
  questionIndex: number;
  questionTitle: string;
  participantId: string;
  participantName: string;
  /** ISO, or null when the interviewee has no date set. */
  interviewDate: string | null;
  value: string;
}

interface HypothesisSummaryBlockProps {
  hypothesis: SummaryHypothesis;
  /** Print the question above each answer. Page-wide, off by default. */
  showQuestions: boolean;
  orderBy: AnswerOrder;
  /** Off when the card's own header already names the hypothesis. */
  showPrompt?: boolean;
}

/**
 * One hypothesis of a problem and everything the interviews turned up about it, read as a
 * single run of answers rather than question by question: which question an answer came
 * from is secondary to what it says, so it is shown only on request.
 */
export function HypothesisSummaryBlock({
  hypothesis,
  showQuestions,
  orderBy,
  showPrompt = true,
}: HypothesisSummaryBlockProps) {
  const { questions } = hypothesis;

  const entries = useMemo(() => {
    const flattened: AnswerEntry[] = questions.flatMap((question) =>
      question.answers.map((answer) => ({
        key: `${question.questionId}:${answer.participantId}`,
        questionIndex: question.index,
        questionTitle: question.title,
        participantId: answer.participantId,
        participantName: answer.participantName,
        interviewDate: answer.interviewDate,
        value: answer.value,
      })),
    );

    // Both orders fall back to the question index so one person's several answers keep
    // the order they were asked in rather than an arbitrary one.
    const byName = (a: AnswerEntry, b: AnswerEntry) =>
      a.participantName.localeCompare(b.participantName) ||
      a.questionIndex - b.questionIndex;

    flattened.sort((a, b) => {
      if (orderBy === "interviewee") return byName(a, b);

      // Oldest interview first, so the answers read in the order they were gathered.
      // Anyone without a date sorts to the end rather than to 1970.
      if (a.interviewDate === b.interviewDate) return byName(a, b);
      if (a.interviewDate === null) return 1;
      if (b.interviewDate === null) return -1;
      return a.interviewDate.localeCompare(b.interviewDate) || byName(a, b);
    });

    // Both orders keep one person's answers consecutive, so each run is one interviewee.
    const groups: AnswerEntry[][] = [];
    for (const entry of flattened) {
      const last = groups[groups.length - 1];
      if (last && last[0].participantId === entry.participantId) last.push(entry);
      else groups.push([entry]);
    }
    return groups;
  }, [questions, orderBy]);

  return (
    <div className="@container flex flex-col gap-4 p-5">
      <div className="flex flex-col gap-2">
        {/* Baseline-aligned rather than centred: the pill trails the prompt's first line
            even when a long prompt wraps under it. `flex-1` stays off the prompt so the
            pill hugs the text instead of being pushed to the far edge. */}
        {showPrompt && (
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-[#6A35FF]">
              {hypothesis.index}
            </span>
            <p className="min-w-0 text-sm font-medium text-[#1F2430]">
              {hypothesis.prompt}
            </p>
            <span className="inline-flex shrink-0 items-center rounded-full bg-[#F4F0FF] px-2.5 py-0.5 text-xs font-medium text-[#6A35FF]">
              Hypothesis
            </span>
          </div>
        )}

        <div className="flex gap-6 text-xs text-[#697288]">
          <span>Answered: {hypothesis.answeredCount}</span>
          <span>No answer: {hypothesis.noAnswerCount}</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm italic text-[#9AA0B0]">No answers yet</p>
      ) : (
        // One grid per interviewee, each starting on its own row, and a plain grid rather
        // than masonry: masonry drops each answer into the shortest column, so a second
        // person's answers came out right-to-left under the first person's uneven ones.
        // Container queries, not viewport ones: this grid is inset by the card's padding
        // and the summary column beside it, so the breakpoint that matters is how wide
        // this column actually is — not how wide the window is.
        <div className="flex flex-col gap-5">
          {entries.map((group) => (
            <div
              key={group[0].participantId}
              className="grid grid-cols-1 items-start gap-5 @md:grid-cols-2 @2xl:grid-cols-3 @4xl:grid-cols-4 @6xl:grid-cols-5"
            >
              {group.map((entry) => (
                // A rule under each answer instead of a card around it — with heights
                // this uneven, the boundary is all the separation the eye needs.
                <div key={entry.key} className="border-b border-[#E4E5ED] pb-3">
                  {showQuestions && (
                    <p className="mb-1.5 text-xs font-medium text-[#697288]">
                      {entry.questionIndex}. {entry.questionTitle}
                    </p>
                  )}
                  <div className="flex items-baseline gap-2">
                    <p className="min-w-0 text-sm font-semibold text-[#1F2430]">
                      {entry.participantName}
                    </p>
                    {entry.interviewDate && (
                      <span className="shrink-0 text-xs text-[#9AA0B0]">
                        {format(new Date(entry.interviewDate), "MMM d")}
                      </span>
                    )}
                  </div>
                  {/* Answers are typed in free-form, so long ones wrap rather than
                      stretching the tile past its column. */}
                  <p className="mt-0.5 text-sm break-words text-[#1F2430]">
                    {entry.value}
                  </p>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
