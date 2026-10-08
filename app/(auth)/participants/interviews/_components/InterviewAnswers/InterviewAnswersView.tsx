"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, ChevronLeftIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import type { Participant } from "@/lib/generated/prisma";
import {
  getInterviewAnswersData,
  getExampleInterviewAnswersData,
  upsertProblemInterviewAnswer,
  type InterviewAnswersData,
} from "@/services/interviewPrep";
import { upsertImportedInterviewAnswer } from "@/services/importedInterview";

import { ImportCsvButton } from "./ImportCsvButton";
import { ProblemAnswerCard } from "./ProblemAnswerCard";
import type { AnswerableProblem } from "./types";

interface InterviewAnswersViewProps {
  participant: Participant;
  onBack: () => void;
  onSaved: () => void;
  readOnly?: boolean;
  // Set by the instructor review flow. Its presence is what puts the view in review
  // mode; the caller pairs it with `readOnly` so nothing here is editable.
  onCompleteReview?: () => void | Promise<void>;
  exampleNumber?: number;
}

function InterviewHeader({
  participant,
  onBack,
  onSave,
  onCompleteReview,
  completingReview = false,
  readOnly = false,
  hasImport,
  onImported,
}: {
  participant: Participant;
  onBack: () => void;
  onSave: () => void;
  onCompleteReview?: () => void;
  completingReview?: boolean;
  readOnly?: boolean;
  /** null while the answers are still loading — the import button waits for it. */
  hasImport: boolean | null;
  onImported: () => void;
}) {
  const roles =
    participant.role
      ?.split(",")
      .map((r) => r.trim())
      .filter(Boolean) ?? [];

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to interviews"
          className="flex size-[22px] shrink-0 items-center justify-center rounded-full bg-white hover:bg-gray-100"
        >
          <ChevronLeftIcon size={18} className="text-gray-500" />
        </button>
        <div className="flex min-w-0 flex-col">
          <span className="text-xs font-medium text-[#70747D]">Interview</span>
          <div className="flex items-center gap-2">
            <h1 className="truncate text-xl font-semibold text-[#111827]">
              {participant.name}
            </h1>
            {roles.map((role) =>
              // Payer is the interview this whole page counts, so it gets a green
              // "done"-style badge; other roles stay neutral.
              role.toLowerCase() === "payer" ? (
                <Badge
                  key={role}
                  className="gap-1 rounded-full bg-green-100 text-green-700"
                >
                  <Check className="size-3" />
                  {role}
                </Badge>
              ) : (
                <Badge
                  key={role}
                  className="rounded-full bg-[#EEEFF5] text-[#111827]"
                >
                  {role}
                </Badge>
              ),
            )}
          </div>
          {/* Same condition as the Import CSV button, so the hint never shows without it. */}
          {!readOnly && !onCompleteReview && (
            <p className="mt-0.5 text-xs text-[#70747D]">
              If you want to import a CSV, make sure the 3 column headers are{" "}
              <span className="font-medium text-[#111827]">
                hypothesis, question, answer
              </span>{" "}
              — all lower case and in that order.
            </p>
          )}
        </div>
      </div>

      {/* A reviewer never gets Save — the two actions are mutually exclusive. */}
      {onCompleteReview ? (
        <Button
          onClick={onCompleteReview}
          disabled={completingReview}
          className="rounded-lg bg-[#111827] px-8 text-white hover:bg-[#374151]"
        >
          Complete Review
        </Button>
      ) : (
        !readOnly && (
          <div className="flex items-center gap-3">
            {hasImport !== null && (
              <ImportCsvButton
                participantId={participant.id}
                hasImport={hasImport}
                onImported={onImported}
              />
            )}
            <Button
              onClick={onSave}
              className="rounded-lg bg-[#111827] px-8 text-white hover:bg-[#374151]"
            >
              Save
            </Button>
          </div>
        )
      )}
    </div>
  );
}

export function InterviewAnswersView({
  participant,
  onBack,
  onSaved,
  readOnly = false,
  onCompleteReview,
  exampleNumber,
}: InterviewAnswersViewProps) {
  const [problems, setProblems] = useState<AnswerableProblem[] | null>(null);
  // Which store the answers on screen came from, and so which one a commit writes to.
  const [source, setSource] = useState<InterviewAnswersData["source"] | null>(null);
  const [completingReview, setCompletingReview] = useState(false);
  // Bumped after an import so the effect below refetches.
  const [reloadKey, setReloadKey] = useState(0);

  // Mirrors `problems` so a commit always persists the latest value rather than
  // whatever the handler closed over before the last keystroke.
  const problemsRef = useRef<AnswerableProblem[] | null>(null);
  problemsRef.current = problems;

  useEffect(() => {
    let active = true;
    const load =
      exampleNumber != null
        ? getExampleInterviewAnswersData(exampleNumber, participant.id)
        : getInterviewAnswersData(participant.id);
    load.then((result) => {
      if (!active) return;
      setSource(result.source);
      setProblems(result.problems);
    });
    return () => {
      active = false;
    };
  }, [participant.id, exampleNumber, reloadKey]);

  const handleImported = useCallback(() => {
    setProblems(null);
    setSource(null);
    setReloadKey((k) => k + 1);
  }, []);

  const handleAnswerChange = useCallback(
    (problemId: string, questionId: string, value: string) => {
      setProblems((prev) =>
        (prev ?? []).map((problem) =>
          problem.id !== problemId
            ? problem
            : {
                ...problem,
                questions: problem.questions.map((question) =>
                  question.questionId !== questionId
                    ? question
                    : { ...question, answer: value },
                ),
              },
        ),
      );
    },
    [],
  );

  const handleAnswerCommit = useCallback(
    (problemId: string, questionId: string, value?: string) => {
      if (readOnly) return;
      const problem = problemsRef.current?.find((p) => p.id === problemId);
      const question = problem?.questions.find(
        (q) => q.questionId === questionId,
      );
      if (!question) return;

      // A caller that commits in the same tick as its edit hasn't re-rendered yet, so
      // the argument — not the ref — carries the new value.
      const input = {
        questionId,
        participantId: participant.id,
        value: value ?? question.answer,
      };
      void (source === "imported"
        ? upsertImportedInterviewAnswer(input)
        : upsertProblemInterviewAnswer(input));
    },
    [participant.id, readOnly, source],
  );

  // Answers already persist on blur, and clicking Save blurs the focused input first, so
  // there's nothing left to write here. Saving deliberately leaves the participant in its
  // current stage — how an interview gets moved to "documented" is still being designed.
  const handleSave = useCallback(() => {
    onSaved();
  }, [onSaved]);

  const handleCompleteReview = useCallback(() => {
    if (!onCompleteReview || completingReview) return;
    setCompletingReview(true);
    // The caller unmounts this view on success, so only the failure path needs to
    // re-enable the button.
    void Promise.resolve(onCompleteReview()).catch(() =>
      setCompletingReview(false),
    );
  }, [onCompleteReview, completingReview]);

  return (
    // Break out of the page's px-8/py-4 gutter so the white surface runs edge to edge,
    // matching the design; the +2rem height makes up for the cancelled vertical padding.
    <div className="-mx-8 -my-4 flex h-[calc(100%+2rem)] flex-col bg-white">
      <div className="shrink-0 border-b border-[#E4E5ED] px-8 py-4">
        <InterviewHeader
          participant={participant}
          onBack={onBack}
          onSave={handleSave}
          onCompleteReview={onCompleteReview ? handleCompleteReview : undefined}
          completingReview={completingReview}
          readOnly={readOnly}
          hasImport={source === null ? null : source === "imported"}
          onImported={handleImported}
        />
      </div>

      {!problems ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader />
        </div>
      ) : problems.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-8">
          <div className="max-w-md text-center">
            <h3 className="text-base font-semibold text-[#1F2430]">
              No questions to ask yet
            </h3>
            <p className="mx-auto mt-2 text-xs text-[#697288]">
              Write the interview questions for your problems on the Interview Prep
              tab of the journey map, and they will show up here ready to answer.
              {!readOnly && !onCompleteReview && (
                <> Or import a CSV of an interview you ran elsewhere.</>
              )}
            </p>
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto px-8 py-8">
          {/* Capped rather than edge-to-edge: past ~1600px the question tiles just
              keep multiplying across a row and the card stops reading as one thing. */}
          <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6">
            {problems.map((problem) => (
              <ProblemAnswerCard
                key={problem.id}
                problem={problem}
                readOnly={readOnly}
                onAnswerChange={(questionId, value) =>
                  handleAnswerChange(problem.id, questionId, value)
                }
                onAnswerCommit={(questionId, value) =>
                  handleAnswerCommit(problem.id, questionId, value)
                }
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
