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
  trigger: "Trigger / Motivation / Jobs to be Done",
  action: "Action / Activity",
  split_route: "Scenarios",
  // Never reached — a Startup Idea card has no delete affordance — but the map
  // is exhaustive over the node types.
  startup_idea: "Startup Idea",
};

// A stored answer is either a single value or the selections of a multi-choice
// question. Blank in both shapes means the user never answered it.
function formatAnswer(answer: string | string[]): string | null {
  const text = Array.isArray(answer)
    ? answer.filter((a) => a.trim()).join(", ")
    : answer;
  return text.trim() ? text : null;
}

/** One card in the pending delete, as the dialog needs to describe it. */
export interface DeletingCard {
  id: string;
  type: JourneyNodeType;
  /** The card's own text, shown so the user can tell which one this is. */
  content: string;
  /** Problems on the card, listed with the market questions answered for each. */
  problems: Problem[];
}

interface DeleteNodeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The cards going. One when the delete came from a card's own trash button,
   * several when it came from a multi-selection. */
  cards: DeletingCard[];
  /** Problems across all of them, for the multi-card summary. */
  problemCount: number;
  /** Solutions across all of them, for the multi-card summary. */
  solutionCount: number;
  /** How many cards hang off the ones going without going themselves. They
   * aren't deleted — they move up — so the dialog says so rather than staying
   * silent about a change to the shape of the map. */
  survivingChildCount: number;
  /** False while Milestone 2 is locked — the problem list is then left out
   * entirely rather than shown, matching how the canvas hides locked content. */
  showProblems: boolean;
  onConfirm: () => void;
}

/** "The 2 cards that follow them stay on the map and connect to…".
 *
 * With one card going, its children move onto the card before it. With several,
 * that card may be going too, so they move onto the nearest one that stays — which
 * is why the multi-card wording doesn't promise a specific card. */
function SurvivingChildren({
  count,
  isMulti,
}: {
  count: number;
  isMulti: boolean;
}) {
  if (count === 0) return null;
  return (
    <>
      {" "}
      The {count === 1 ? "card" : `${count} cards`} that
      {count === 1 ? " follows" : " follow"} {isMulti ? "them" : "it"}
      {count === 1 ? " stays" : " stay"} on the map and
      {count === 1 ? " connects" : " connect"} to{" "}
      {isMulti ? "the nearest card above instead" : "the card before it instead"}
      .
    </>
  );
}

/** The card's text in the grey chip, or the placeholder when it has none. */
function CardChip({ card }: { card: DeletingCard }) {
  return (
    <div className="rounded-lg bg-[#F3F3F6] p-3">
      <p className="text-sm font-semibold text-gray-700">
        {TYPE_LABELS[card.type]}
      </p>
      <p className="text-base text-gray-800 mt-0.5">
        {card.content.trim() || (
          <span className="text-gray-500 italic">No text yet</span>
        )}
      </p>
    </div>
  );
}

/** The full breakdown for a single card: every problem on it with the market
 * questions answered for it. Unchanged from when this dialog only ever described
 * one card — deleting one card should still show the user everything they'd lose. */
function SingleCardBody({
  card,
  showProblems,
}: {
  card: DeletingCard;
  showProblems: boolean;
}) {
  return (
    <>
      <CardChip card={card} />

      {showProblems &&
        (card.problems.length === 0 ? (
          <p className="mt-3 text-sm text-gray-600">
            This card has no problems attached.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-4">
            {card.problems.map((problem) => {
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
    </>
  );
}

/** "8 problems and 3 solutions will be deleted with them." Each half drops out at
 * zero, and the whole line drops out when there's nothing to report. */
function AttachedWorkTotals({
  problemCount,
  solutionCount,
}: {
  problemCount: number;
  solutionCount: number;
}) {
  if (problemCount === 0 && solutionCount === 0) return null;
  const parts: string[] = [];
  if (problemCount > 0)
    parts.push(`${problemCount} ${problemCount === 1 ? "problem" : "problems"}`);
  if (solutionCount > 0)
    parts.push(
      `${solutionCount} ${solutionCount === 1 ? "solution" : "solutions"}`,
    );
  return (
    <p className="mt-4 text-sm text-gray-700">
      {parts.join(" and ")} attached to them will be deleted as well.
    </p>
  );
}

export function DeleteNodeDialog({
  open,
  onOpenChange,
  cards,
  problemCount,
  solutionCount,
  survivingChildCount,
  showProblems,
  onConfirm,
}: DeleteNodeDialogProps) {
  const isMulti = cards.length > 1;
  const typeLabel = cards[0] ? TYPE_LABELS[cards[0].type] : "card";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isMulti
              ? `Delete these ${cards.length} cards?`
              : `Delete this ${typeLabel} card?`}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isMulti
              ? "The cards will be deleted from your journey map along with everything else on them. For example, if you have selected any market questions and answered any meta questions, etc."
              : "The card will be deleted from your journey map along with everything else on it. For example, if you have selected any market questions and answered any meta questions, etc."}
            <SurvivingChildren count={survivingChildCount} isMulti={isMulti} />
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="max-h-[50vh] overflow-y-auto">
          {isMulti ? (
            <>
              <div className="flex flex-col gap-2">
                {cards.map((card) => (
                  <CardChip key={card.id} card={card} />
                ))}
              </div>
              {showProblems && (
                <AttachedWorkTotals
                  problemCount={problemCount}
                  solutionCount={solutionCount}
                />
              )}
            </>
          ) : cards[0] ? (
            <SingleCardBody card={cards[0]} showProblems={showProblems} />
          ) : null}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {isMulti ? `Delete ${cards.length} cards` : "Delete card"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
