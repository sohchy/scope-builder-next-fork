"use client";

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
import { BANK_QUESTIONS } from "../questionBank";
import type { JourneyNodeType } from "../JourneyContext";
import type { Problem } from "./ActionNodeSheet";

const TYPE_LABELS: Record<JourneyNodeType, string> = {
  trigger: "Trigger / Motivation",
  action: "Action",
  split_route: "Scenarios",
};

// A stored answer is either a single value or the selections of a multi-choice
// question. Blank in both shapes means the user never answered it.
function formatAnswer(answer: string | string[]): string | null {
  const text = Array.isArray(answer)
    ? answer.filter((a) => a.trim()).join(", ")
    : answer;
  return text.trim() ? text : null;
}

interface DeleteNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Type of the card being deleted, for the heading. */
  nodeType: JourneyNodeType | null;
  /** The card's own text, shown so the user can tell which one this is. */
  nodeContent: string;
  /** Problems on the card, each listed with the market questions answered for it. */
  problems: Problem[];
  /** How many cards hang directly off this one. They aren't deleted — they move
   * up to this card's parent — so the dialog says so rather than staying silent
   * about a change to the shape of the map. */
  childCount: number;
  /** False while Milestone 2 is locked — the problem list is then left out
   * entirely rather than shown, matching how the canvas hides locked content. */
  showProblems: boolean;
  onConfirm: () => void;
}

export function DeleteNodeDialog({
  open,
  onOpenChange,
  nodeType,
  nodeContent,
  problems,
  childCount,
  showProblems,
  onConfirm,
}: DeleteNodeDialogProps) {
  const typeLabel = nodeType ? TYPE_LABELS[nodeType] : "card";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this {typeLabel} card?</AlertDialogTitle>
          <AlertDialogDescription>
            The card will be deleted from your journey map along with everything else on it. For example, if you have selected any market questions and answered any meta questions, etc.
            {childCount > 0 && (
              <>
                {" "}
                The {childCount === 1 ? "card" : `${childCount} cards`} that
                {childCount === 1 ? " follows" : " follow"} it
                {childCount === 1 ? " stays" : " stay"} on the map and
                {childCount === 1 ? " connects" : " connect"} to the card before
                it instead.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[50vh] overflow-y-auto">
          <div className="rounded-lg bg-[#F3F3F6] p-3">
            <p className="text-sm font-semibold text-gray-700">{typeLabel}</p>
            <p className="text-base text-gray-800 mt-0.5">
              {nodeContent.trim() || (
                <span className="text-gray-500 italic">No text yet</span>
              )}
            </p>
          </div>

          {showProblems &&
            (problems.length === 0 ? (
              <p className="mt-3 text-sm text-gray-600">
                This card has no problems attached.
              </p>
            ) : (
              <div className="mt-4 flex flex-col gap-4">
                {problems.map((problem) => {
                  // A question whose bank id no longer resolves has nothing to
                  // show the user, so it is left out of the summary.
                  const questions = problem.questions.flatMap((q) => {
                    const bank = BANK_QUESTIONS.find(
                      (b) => b.id === q.bankQuestionId,
                    );
                    if (!bank) return [];
                    return [{ text: bank.text, answer: formatAnswer(q.answer) }];
                  });

                  return (
                    <div key={problem.id}>
                      <p className="text-sm text-gray-600">
                        What is the problem/pain?
                      </p>
                      <p className="text-base text-gray-800 mt-0.5">
                        {problem.description.trim() || (
                          <span className="text-gray-500 italic">
                            No description yet
                          </span>
                        )}
                      </p>

                      <p className="mt-2 text-sm font-semibold text-gray-700">
                        Market questions
                      </p>
                      {questions.length === 0 ? (
                        <p className="text-sm text-gray-600">
                          No market questions answered yet.
                        </p>
                      ) : (
                        <ul className="mt-1 flex flex-col gap-2">
                          {questions.map((q, i) => (
                            <li key={i} className="text-sm">
                              <p className="text-gray-700">{q.text}</p>
                              <p className="text-gray-800">
                                {q.answer ?? (
                                  <span className="text-gray-500 italic">
                                    Not answered yet
                                  </span>
                                )}
                              </p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete card
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
