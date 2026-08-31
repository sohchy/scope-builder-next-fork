"use client";

import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { ActionLabel } from "./ActionLabel";
import { DragHandle } from "./DragHandle";
import { HypothesisRow } from "./HypothesisRow";
import { useSortableSensors } from "./useSortableSensors";
import type { Hypothesis, InterviewQuestionDraft, ProblemBlock } from "./types";

interface ProblemCardProps {
  block: ProblemBlock;
  onQuestionCreate: (
    hypothesisId: string,
    value: InterviewQuestionDraft,
  ) => Promise<void>;
  onQuestionUpdate: (
    hypothesisId: string,
    id: string,
    value: InterviewQuestionDraft,
  ) => Promise<void>;
  onQuestionDelete: (hypothesisId: string, id: string) => Promise<void>;
  onQuestionReorder: (
    hypothesisId: string,
    orderedIds: string[],
  ) => Promise<void>;
  /** Receives the block's hypothesis ids in their new order. */
  onHypothesisReorder: (orderedIds: string[]) => Promise<void>;
  readOnly?: boolean;
}

export function ProblemCard({
  block,
  onQuestionCreate,
  onQuestionUpdate,
  onQuestionDelete,
  onQuestionReorder,
  onHypothesisReorder,
  readOnly = false,
}: ProblemCardProps) {
  const sensors = useSortableSensors();
  const hypothesisIds = block.hypotheses.map((h) => h.id);
  // A lone hypothesis has nowhere to move to, so the handle would only be clutter.
  const isSortable = !readOnly && block.hypotheses.length > 1;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = hypothesisIds.indexOf(String(active.id));
    const to = hypothesisIds.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    void onHypothesisReorder(arrayMove(hypothesisIds, from, to));
  };

  return (
    <div className="rounded-2xl bg-white shadow-sm">
      <div className="flex">
        {/* Left column — the problem summary (read-only). */}
        <aside className="flex w-[260px] shrink-0 flex-col gap-4 border-r border-[#CFD3E0] px-6 py-6">
          {/* The action this problem hangs off — context only, so it sits above
              the pill rather than competing with the problem itself. */}
          <ActionLabel action={block.action} className="-mb-2" />
          <span className="inline-flex w-fit items-center rounded-full border border-[#E0CDA1] bg-[#FBF3DE] px-2.5 py-0.5 text-sm font-medium text-[#6F5615]">
            {block.label}
          </span>
          <p className="text-base text-[#1F2430]">{block.description}</p>
          {block.tags.length > 0 && (
            <ul className="flex flex-wrap items-center gap-2">
              {block.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full bg-[#F1ECFF] px-2.5 py-0.5 text-sm font-medium text-[#6A35FF]"
                >
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Right area — hypothesis / interview-question rows. */}
        <div className="min-w-0 flex-1">
          {/* Column headers. */}
          <div className="grid grid-cols-2 border-b border-[#CFD3E0]">
            <span className="border-r border-[#CFD3E0] px-6 py-3 text-base text-[#4E5566]">
              Hypothesis
            </span>
            <span className="px-6 py-3 text-right text-base text-[#4E5566]">
              Interview question
            </span>
          </div>

          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <SortableContext
              items={hypothesisIds}
              strategy={verticalListSortingStrategy}
            >
              {block.hypotheses.map((hypothesis, i) => (
                <SortableHypothesis
                  key={hypothesis.id}
                  hypothesis={hypothesis}
                  isLast={i === block.hypotheses.length - 1}
                  readOnly={readOnly}
                  sortable={isSortable}
                  onQuestionCreate={(value) =>
                    onQuestionCreate(hypothesis.id, value)
                  }
                  onQuestionUpdate={(id, value) =>
                    onQuestionUpdate(hypothesis.id, id, value)
                  }
                  onQuestionDelete={(id) =>
                    onQuestionDelete(hypothesis.id, id)
                  }
                  onQuestionReorder={(orderedIds) =>
                    onQuestionReorder(hypothesis.id, orderedIds)
                  }
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </div>
    </div>
  );
}

interface SortableHypothesisProps {
  hypothesis: Hypothesis;
  isLast: boolean;
  /** False when there is nothing to reorder — the handle is left out entirely. */
  sortable: boolean;
  onQuestionCreate: (value: InterviewQuestionDraft) => Promise<void>;
  onQuestionUpdate: (id: string, value: InterviewQuestionDraft) => Promise<void>;
  onQuestionDelete: (id: string) => Promise<void>;
  onQuestionReorder: (orderedIds: string[]) => Promise<void>;
  readOnly?: boolean;
}

/**
 * Owns the sortable wiring so `HypothesisRow` stays a plain presentational row that
 * doesn't need to know it's inside a `SortableContext`.
 */
function SortableHypothesis({
  hypothesis,
  isLast,
  sortable,
  readOnly = false,
  ...handlers
}: SortableHypothesisProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: hypothesis.id, disabled: !sortable });

  return (
    <div
      ref={setNodeRef}
      // Translate, not Transform: rows vary in height with their question count, and
      // Transform bakes in a scale of (hovered height / own height), which visibly
      // stretches the dragged row to the size of whatever it is passing over.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={[
        !isLast ? "border-b border-[#CFD3E0]" : "",
        // Lifted above its neighbours so the row being dragged isn't clipped by the
        // next one's border.
        isDragging ? "relative z-10 bg-white shadow-md" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <HypothesisRow
        hypothesis={hypothesis}
        readOnly={readOnly}
        dragHandle={
          sortable && (
            <DragHandle
              attributes={attributes}
              listeners={listeners}
              label="Reorder hypothesis"
            />
          )
        }
        {...handlers}
      />
    </div>
  );
}
