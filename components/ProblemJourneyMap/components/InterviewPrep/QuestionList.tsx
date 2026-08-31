"use client";

import { useState, type ReactNode } from "react";
import { Plus } from "lucide-react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { DragHandle } from "./DragHandle";
import { QuestionForm } from "./QuestionForm";
import { QuestionView } from "./QuestionView";
import { useSortableSensors } from "./useSortableSensors";
import type { InterviewQuestion, InterviewQuestionDraft } from "./types";

interface QuestionListProps {
  questions: InterviewQuestion[];
  onCreate: (value: InterviewQuestionDraft) => Promise<void>;
  onUpdate: (id: string, value: InterviewQuestionDraft) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  /** Receives this hypothesis's question ids in their new order. */
  onReorder: (orderedIds: string[]) => Promise<void>;
  readOnly?: boolean;
}

export function QuestionList({
  questions,
  onCreate,
  onUpdate,
  onDelete,
  onReorder,
  readOnly = false,
}: QuestionListProps) {
  const sensors = useSortableSensors();
  const [editingId, setEditingId] = useState<string | null>(null);
  // Local keys only — a draft becomes a real question (with a row id) on save.
  const [draftKeys, setDraftKeys] = useState<string[]>([]);
  const [pendingDelete, setPendingDelete] = useState<InterviewQuestion | null>(
    null,
  );

  // A hypothesis with nothing saved opens straight into a blank form, so the common
  // case — write the question you just decided on — takes no extra click. There is
  // nothing to cancel back to, hence no Cancel on this one. Deliberately independent
  // of `draftKeys`: adding a second draft must not unmount this one from under
  // whatever the user has already typed into it.
  const showAutoDraft = !readOnly && questions.length === 0;

  const addDraft = () =>
    setDraftKeys((prev) => [...prev, crypto.randomUUID()]);

  const removeDraft = (key: string) =>
    setDraftKeys((prev) => prev.filter((k) => k !== key));

  const handleDraftSave = async (
    key: string | null,
    value: InterviewQuestionDraft,
  ) => {
    await onCreate(value);
    if (key) removeDraft(key);
  };

  const handleEditSave = async (
    id: string,
    value: InterviewQuestionDraft,
  ) => {
    await onUpdate(id, value);
    setEditingId(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    await onDelete(pendingDelete.id);
    setPendingDelete(null);
  };

  const questionIds = questions.map((q) => q.id);
  // A lone question has nowhere to move to, so the handle would only be clutter.
  // Counts saved questions only — an open draft form isn't sortable.
  const isSortable = !readOnly && questions.length > 1;

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = questionIds.indexOf(String(active.id));
    const to = questionIds.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    void onReorder(arrayMove(questionIds, from, to));
  };

  if (readOnly && questions.length === 0) {
    return <p className="text-base text-[#6E7689]">No question yet</p>;
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Scoped to this hypothesis, so a question can never be dropped onto another. */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext
          items={questionIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-5">
            {questions.map((question) => (
              <SortableQuestion
                key={question.id}
                question={question}
                // An open form must not be dragged out from under the cursor.
                disabled={!isSortable || editingId === question.id}
                sortable={isSortable}
              >
                {(dragHandle) =>
                  editingId === question.id ? (
                    <QuestionForm
                      initial={{
                        title: question.title,
                        responseType: question.responseType,
                        options: question.options,
                      }}
                      onSave={(value) => handleEditSave(question.id, value)}
                      onCancel={() => setEditingId(null)}
                    />
                  ) : (
                    <QuestionView
                      question={question}
                      readOnly={readOnly}
                      dragHandle={dragHandle}
                      onEdit={() => setEditingId(question.id)}
                      onDelete={() => setPendingDelete(question)}
                    />
                  )
                }
              </SortableQuestion>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {showAutoDraft && <QuestionForm onSave={(v) => handleDraftSave(null, v)} />}

      {draftKeys.map((key) => (
        <QuestionForm
          key={key}
          onSave={(value) => handleDraftSave(key, value)}
          onCancel={() => removeDraft(key)}
        />
      ))}

      {!readOnly && (
        <button
          type="button"
          onClick={addDraft}
          className="inline-flex w-fit items-center gap-1 text-base font-semibold text-[#6A35FF] hover:underline"
        >
          <Plus className="h-4 w-4" />
          Add custom question
        </button>
      )}

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Are you sure you want to delete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              question, along with every answer participants have already given
              to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface SortableQuestionProps {
  question: InterviewQuestion;
  disabled: boolean;
  /** False when there is nothing to reorder — the handle is left out entirely. */
  sortable: boolean;
  /** Receives the handle to render, or nothing when dragging isn't available. */
  children: (dragHandle: ReactNode) => ReactNode;
}

/**
 * Owns the sortable wiring and hands the handle back to the caller, so the question can
 * render as either a view or a form without either of them knowing about dnd-kit.
 */
function SortableQuestion({
  question,
  disabled,
  sortable,
  children,
}: SortableQuestionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id, disabled });

  return (
    <div
      ref={setNodeRef}
      // Translate, not Transform: questions vary in height (a dropdown lists its
      // options), and Transform's scale would stretch the dragged one to match
      // whichever question it is currently over.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={isDragging ? "relative z-10 rounded-md bg-white shadow-md" : undefined}
    >
      {children(
        sortable ? (
          <DragHandle
            attributes={attributes}
            listeners={listeners}
            label="Reorder question"
          />
        ) : null,
      )}
    </div>
  );
}
