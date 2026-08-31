"use client";

import { useEffect, useState } from "react";

import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  getExampleInterviewSummaryData,
  getInterviewSummaryData,
} from "@/services/interviewPrep";

import { ProblemSummaryCard } from "./ProblemSummaryCard";
import type { AnswerOrder, SummaryProblem } from "./types";

interface InterviewSummaryProps {
  readOnly?: boolean;
  exampleNumber?: number;
}

/**
 * What the interviews said, problem by problem: every interviewee's answers to the
 * questions written against a hypothesis, read side by side so the team can write down
 * what they add up to and rate how far the hypothesis was validated.
 */
export function InterviewSummary({
  readOnly = false,
  exampleNumber,
}: InterviewSummaryProps) {
  const [problems, setProblems] = useState<SummaryProblem[] | null>(null);
  // How the answers read, page-wide rather than per problem: this is a way of looking at
  // the board, not something one problem should differ on. Deliberately not persisted —
  // showing the questions is a thing you do to check one answer, then turn back off.
  const [showQuestions, setShowQuestions] = useState(false);
  const [orderBy, setOrderBy] = useState<AnswerOrder>("interviewee");

  // Everything here is org-wide and read-only apart from the panels, which write straight
  // to the server — so load once on mount, same as the prep tab.
  useEffect(() => {
    let active = true;
    const load =
      exampleNumber != null
        ? getExampleInterviewSummaryData(exampleNumber)
        : getInterviewSummaryData();
    load.then((result) => {
      if (active) setProblems(result);
    });
    return () => {
      active = false;
    };
  }, [exampleNumber]);

  if (!problems) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      {/* Much wider than the prep tab's column: a card here carries the answers and the
          summary written about them side by side, and the answers want the room. */}
      <div className="mx-auto flex max-w-[1920px] flex-col gap-6 px-6 py-8">
        {/* Controls sit against the top of the block rather than centred on it: the
            subcopy is three lines tall and would otherwise drag them down the page. */}
        <header className="flex items-start justify-between gap-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-[#1F2430]">
              What you learned
            </h2>
            <p className="max-w-3xl text-sm text-[#4E5566]">
              Every interviewee&apos;s answers to the questions you prepared, grouped by
              the hypothesis they were written for. Read them together, write down what
              they tell you, and decide how far each hypothesis has actually been
              validated.
            </p>
          </div>

          {/* Both are view state, so they stay live on the read-only example board. */}
          <div className="flex shrink-0 items-center gap-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#4E5566]">
              <Switch checked={showQuestions} onCheckedChange={setShowQuestions} />
              Show questions
            </label>

            <Select
              value={orderBy}
              onValueChange={(value) => setOrderBy(value as AnswerOrder)}
            >
              <SelectTrigger size="sm" className="bg-white text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interviewee">By interviewee</SelectItem>
                <SelectItem value="date">By interview date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </header>

        {problems.length === 0 ? (
          <div className="rounded-2xl bg-white px-8 py-12 text-center shadow-sm">
            <h3 className="text-base font-semibold text-[#1F2430]">
              Nothing to summarize yet
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#4E5566]">
              Write your interview questions on the Interview Prep. tab, then record an
              interviewee&apos;s answers from their card on the Interviewees board. Their
              answers will show up here.
            </p>
          </div>
        ) : (
          problems.map((problem) => (
            <ProblemSummaryCard
              key={problem.id}
              problem={problem}
              readOnly={readOnly}
              showQuestions={showQuestions}
              orderBy={orderBy}
            />
          ))
        )}
      </div>
    </div>
  );
}
