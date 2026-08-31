"use client";

import { useCallback, useEffect, useState } from "react";

import { Loader } from "@/components/ui/loader";
import {
  createProblemInterviewQuestion,
  deleteProblemInterviewQuestion,
  getInterviewPrepData,
  getExampleInterviewPrepData,
  reorderProblemHypotheses,
  reorderProblemInterviewQuestions,
  updateProblemInterviewQuestion,
} from "@/services/interviewPrep";

import { INTERVIEW_PREP_SUB_STEP } from "@/lib/milestones";
import { LockedRegion, SubStepLockBadge } from "../LockedRegion";
import { ProblemCard } from "./ProblemCard";
import type {
  InterviewQuestion,
  InterviewQuestionDraft,
  ProblemBlock,
} from "./types";

interface InterviewPrepProps {
  readOnly?: boolean;
  exampleNumber?: number;
  /** Not reached in the curriculum yet: greyed, inert and read-only, but still
   *  rendered so the team can see what the tab will hold. */
  locked?: boolean;
}

export function InterviewPrep({
  readOnly = false,
  exampleNumber,
  locked = false,
}: InterviewPrepProps) {
  // A locked tab is a read-only tab as far as every field and write below is
  // concerned — the greying on top of it is `LockedRegion`'s job.
  const isReadOnly = readOnly || locked;
  const [blocks, setBlocks] = useState<ProblemBlock[] | null>(null);

  // Problems come from the journey-map canvas, which is org-wide, so load once on mount.
  useEffect(() => {
    let active = true;
    const load =
      exampleNumber != null
        ? getExampleInterviewPrepData(exampleNumber)
        : getInterviewPrepData();
    load.then((result) => {
      if (active) setBlocks(result);
    });
    return () => {
      active = false;
    };
  }, [exampleNumber]);

  // Rewrites one hypothesis's question list in place. Every mutation below is a
  // whole-list replacement, so they all funnel through here.
  const patchQuestions = useCallback(
    (
      blockId: string,
      hypothesisId: string,
      update: (questions: InterviewQuestion[]) => InterviewQuestion[],
    ) => {
      setBlocks((prev) =>
        (prev ?? []).map((block) =>
          block.id !== blockId
            ? block
            : {
                ...block,
                hypotheses: block.hypotheses.map((hyp) =>
                  hyp.id !== hypothesisId
                    ? hyp
                    : { ...hyp, questions: update(hyp.questions) },
                ),
              },
        ),
      );
    },
    [],
  );

  const handleQuestionCreate = useCallback(
    async (
      blockId: string,
      hypothesisId: string,
      value: InterviewQuestionDraft,
    ) => {
      if (isReadOnly) return;
      const block = blocks?.find((b) => b.id === blockId);
      const hypothesis = block?.hypotheses.find((h) => h.id === hypothesisId);
      if (!block || !hypothesis) return;

      // Awaited rather than optimistic: the row id only exists once the server has
      // written it, and every later edit addresses the question by that id.
      const created = await createProblemInterviewQuestion({
        nodeId: block.nodeId,
        problemId: block.id,
        bankQuestionId: hypothesis.bankQuestionId,
        ...value,
      });

      patchQuestions(blockId, hypothesisId, (questions) => [
        ...questions,
        created,
      ]);
    },
    [blocks, isReadOnly, patchQuestions],
  );

  const handleQuestionUpdate = useCallback(
    async (
      blockId: string,
      hypothesisId: string,
      id: string,
      value: InterviewQuestionDraft,
    ) => {
      if (isReadOnly) return;
      patchQuestions(blockId, hypothesisId, (questions) =>
        questions.map((q) => (q.id === id ? { ...q, ...value } : q)),
      );
      await updateProblemInterviewQuestion({ id, ...value });
    },
    [isReadOnly, patchQuestions],
  );

  const handleQuestionDelete = useCallback(
    async (blockId: string, hypothesisId: string, id: string) => {
      if (isReadOnly) return;
      await deleteProblemInterviewQuestion(id);
      patchQuestions(blockId, hypothesisId, (questions) =>
        questions.filter((q) => q.id !== id),
      );
    },
    [isReadOnly, patchQuestions],
  );

  // Both reorders apply locally first: the drop has already told us the final order, so
  // there is nothing to wait for the server to tell us.
  const handleQuestionReorder = useCallback(
    async (blockId: string, hypothesisId: string, orderedIds: string[]) => {
      if (isReadOnly) return;
      patchQuestions(blockId, hypothesisId, (questions) =>
        orderedIds.flatMap((id) => questions.find((q) => q.id === id) ?? []),
      );
      await reorderProblemInterviewQuestions(orderedIds);
    },
    [isReadOnly, patchQuestions],
  );

  const handleHypothesisReorder = useCallback(
    async (blockId: string, orderedIds: string[]) => {
      if (isReadOnly) return;
      const block = blocks?.find((b) => b.id === blockId);
      if (!block) return;

      const reordered = orderedIds.flatMap(
        (id) => block.hypotheses.find((h) => h.id === id) ?? [],
      );
      // `index` is the number shown on the row, so it has to follow the drag.
      const renumbered = reordered.map((h, i) => ({ ...h, index: i + 1 }));

      setBlocks((prev) =>
        (prev ?? []).map((b) =>
          b.id !== blockId ? b : { ...b, hypotheses: renumbered },
        ),
      );

      await reorderProblemHypotheses({
        nodeId: block.nodeId,
        problemId: block.id,
        bankQuestionIds: renumbered.map((h) => h.bankQuestionId),
      });
    },
    [blocks, isReadOnly],
  );

  if (!blocks) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-6 px-6 py-8">
        {/* Outside the dimmed region below, so it stays legible. */}
        {locked && <SubStepLockBadge subStep={INTERVIEW_PREP_SUB_STEP} />}
        <LockedRegion locked={locked} className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-[#1F2430]">
              What you will ask
            </h2>
            <p className="max-w-3xl text-sm text-[#4E5566]">
              You have your answers to the problem statement questions that
              should be validated through user testing. Transform them into
              actual interview questions that will help determine whether your
              assumptions are valid.
            </p>
          </header>

          {blocks.length === 0 ? (
            <div className="rounded-2xl bg-white px-8 py-12 text-center shadow-sm">
              <h3 className="text-base font-semibold text-[#1F2430]">
                Nothing to prepare yet
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm text-[#4E5566]">
                Open an action card on the Canvas, describe its problem, then
                mark the questions you want to validate as hypotheses. They will
                show up here.
              </p>
            </div>
          ) : (
            blocks.map((block) => (
              <ProblemCard
                key={block.id}
                block={block}
                readOnly={isReadOnly}
                onQuestionCreate={(hypothesisId, value) =>
                  handleQuestionCreate(block.id, hypothesisId, value)
                }
                onQuestionUpdate={(hypothesisId, id, value) =>
                  handleQuestionUpdate(block.id, hypothesisId, id, value)
                }
                onQuestionDelete={(hypothesisId, id) =>
                  handleQuestionDelete(block.id, hypothesisId, id)
                }
                onQuestionReorder={(hypothesisId, orderedIds) =>
                  handleQuestionReorder(block.id, hypothesisId, orderedIds)
                }
                onHypothesisReorder={(orderedIds) =>
                  handleHypothesisReorder(block.id, orderedIds)
                }
              />
            ))
          )}
        </LockedRegion>
      </div>
    </div>
  );
}
