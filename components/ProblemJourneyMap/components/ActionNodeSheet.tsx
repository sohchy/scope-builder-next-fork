"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  PlusIcon,
  CheckIcon,
  LockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XIcon,
} from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { HelpPopover } from "@/components/ui/help-popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  MARKET_QUESTIONS_MILESTONE,
  SOLUTIONS_MILESTONE,
} from "@/lib/milestones";
import { type HelpKey } from "@/lib/helpContent";
import { LockBadge, LockedRegion } from "./LockedRegion";
import { StarRating } from "./StarRating";
import {
  BANK_QUESTIONS,
  SOLUTION_BANK_QUESTIONS,
  type BankQuestion,
} from "../questionBank";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProblemQuestionAnswer {
  bankQuestionId: string;
  answer: string | string[];
  source: string;
  confidence: number;
  isHypothesis: boolean;
}

export type PainOrGain = "pain" | "gain";

export interface Problem {
  id: string;
  description: string;
  type: string;
  painOrGain: PainOrGain;
  questions: ProblemQuestionAnswer[];
}

export interface SolutionQuestionAnswer {
  bankQuestionId: string;
  answer: string | string[];
  source: string;
  confidence: number;
}

export type RelieverOrCreator = "reliever" | "creator";

export interface Solution {
  id: string;
  /** The problem this solution belongs to. Absent on legacy node-scoped solutions. */
  problemId?: string;
  description: string;
  type: string;
  relieverOrCreator: RelieverOrCreator;
  questions: SolutionQuestionAnswer[];
}

export type ConclusionStatus = "testing" | "validated" | "invalidated";

export interface NodeConclusion {
  id: string;
  status: ConclusionStatus;
  content: string;
}

// ─── Problem metadata options ─────────────────────────────────────────────────

const PROBLEM_TYPES = ["Functional", "Emotional", "Social"] as const;

const PAIN_OR_GAIN_OPTIONS: { value: PainOrGain; label: string }[] = [
  { value: "pain", label: "Pain" },
  { value: "gain", label: "Gain" },
];

// ─── Solution metadata options ────────────────────────────────────────────────

const SOLUTION_TYPES = ["Functional", "Emotional", "Social"] as const;

const RELIEVER_OR_CREATOR_OPTIONS: {
  value: RelieverOrCreator;
  label: string;
}[] = [
  { value: "reliever", label: "Reliever" },
  { value: "creator", label: "Creator" },
];

const SOURCE_OPTIONS = [
  "Shared personally",
  "Interview",
  "Observed",
  "Assumption",
] as const;

// ─── Props ───────────────────────────────────────────────────────────────────

/** Which editor the sheet is showing. Controlled by the canvas so a click on the
 * card can decide which one to land on. */
export type ActionSheetTab = "problem" | "solution";

interface ActionNodeSheetProps {
  /** Pure viewer: inputs disabled, Save hidden, bank-of-questions hidden. */
  readOnly?: boolean;
  /**
   * The three gates that stage the sheet below its description. Each locked
   * section renders greyed and read-only rather than disappearing, so the team
   * can see what the sheet will hold; see `ProblemJourneyCanvas` for where they
   * come from.
   *
   * The description and the classification column beside it have no flag of
   * their own — they open with the sheet itself at `PROBLEMS_SUB_STEP`, and
   * nothing can open the sheet before that.
   */
  /** `MARKET_QUESTIONS_MILESTONE`: the questions and the bank they're added from. */
  questionsUnlocked: boolean;
  /** `SOURCE_CONFIDENCE_SUB_STEP`: each answer's source and confidence rating. */
  sourceConfidenceUnlocked: boolean;
  /** `HYPOTHESIS_SUB_STEP`: the hypothesis toggle (problems only). */
  hypothesisUnlocked: boolean;
  /**
   * `SOLUTIONS_MILESTONE`: the whole Solution tab — description, classification,
   * questions and bank alike. Unlike the three gates above, which stage the
   * Problem tab section by section, this one covers a tab in full: it renders
   * greyed and read-only behind a single badge, and the two gates it overlaps
   * with (questions, source & confidence) stay silent underneath since this one
   * opens later than either.
   */
  solutionsUnlocked: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: ActionSheetTab;
  onActiveTabChange: (tab: ActionSheetTab) => void;
  nodeId: string | null;
  problemId: string | null;
  problem: Problem | null;
  /**
   * The Action card's own text, edited from the sheet header. It writes straight
   * through to the node as you type — the card's textarea does the same — so the
   * two stay in sync and the Save button has no say over it.
   */
  actionTitle: string;
  onActionTitleChange: (content: string) => void;
  /**
   * Every problem on the same Action card, in the order they're stacked on it.
   * The header arrows walk this list, so the sheet can move between a card's
   * problems without going back to the canvas. It never crosses to another card.
   */
  problems: Problem[];
  /** Switch the sheet to another problem on the same card. */
  onSelectProblem: (problemId: string) => void;
  onSaveProblem: (
    description: string,
    type: string,
    painOrGain: PainOrGain,
    questions: ProblemQuestionAnswer[],
  ) => void;
  solution: Solution | null;
  onSaveSolution: (
    description: string,
    type: string,
    relieverOrCreator: RelieverOrCreator,
    questions: SolutionQuestionAnswer[],
  ) => void;
}

const TABS: { value: ActionSheetTab; label: string }[] = [
  { value: "problem", label: "Problem" },
  { value: "solution", label: "Solution" },
];

// ─── Answer input ─────────────────────────────────────────────────────────────

interface AnswerInputProps {
  question: BankQuestion;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  readOnly?: boolean;
}

function AnswerInput({
  question,
  value,
  onChange,
  readOnly = false,
}: AnswerInputProps) {
  if (question.answerType === "plain_text") {
    return (
      <Input
        className="text-base bg-white"
        placeholder="Answer..."
        value={(value as string) ?? ""}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }

  if (question.answerType === "yes_no") {
    const strValue = (value as string) ?? "";
    return (
      <div className="flex gap-2">
        {["Yes", "No"].map((opt) => {
          const selected = strValue === opt;
          return (
            <button
              key={opt}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(selected ? "" : opt)}
              className={`h-9 px-5 rounded-lg border text-base font-medium transition-colors disabled:cursor-default ${
                selected
                  ? "border-[#6A35FF] bg-[#F4F0FF] text-[#6A35FF]"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.answerType === "scale") {
    const numValue = value ? Number(value) : 0;
    return (
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map((n) => {
          const selected = numValue === n;
          return (
            <button
              key={n}
              type="button"
              disabled={readOnly}
              onClick={() => onChange(selected ? "" : String(n))}
              className={`h-9 w-9 rounded-lg border text-base font-medium transition-colors disabled:cursor-default ${
                selected
                  ? "border-[#6A35FF] bg-[#F4F0FF] text-[#6A35FF]"
                  : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
              }`}
            >
              {n}
            </button>
          );
        })}
      </div>
    );
  }

  if (question.answerType === "single_choice") {
    const strValue = (value as string) ?? "";
    return (
      <RadioGroup
        value={strValue}
        onValueChange={(v) => onChange(v)}
        disabled={readOnly}
        className="bg-white rounded-xl overflow-hidden border border-gray-300 p-1.5"
      >
        {question.options?.map((opt) => (
          <div
            key={opt}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors rounded-[5px] ${
              strValue === opt ? "bg-[#F4F0FF]" : ""
            }`}
          >
            <RadioGroupItem
              value={opt}
              id={`${question.id}-${opt}`}
              className="text-[#6A35FF] data-[state=checked]:border-[#6A35FF]"
            />
            <Label
              htmlFor={`${question.id}-${opt}`}
              className={`text-base cursor-pointer ${
                strValue === opt
                  ? "text-[#6A35FF] font-medium"
                  : "text-gray-800"
              }`}
            >
              {opt}
            </Label>
          </div>
        ))}
      </RadioGroup>
    );
  }

  // multiple_choice
  const arrValue = (value as string[]) ?? [];
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-300 p-1.5">
      {question.options?.map((opt) => {
        const checked = arrValue.includes(opt);
        return (
          <div
            key={opt}
            className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors rounded-[5px] ${
              checked ? "bg-[#F4F0FF]" : ""
            }`}
          >
            <Checkbox
              id={`${question.id}-${opt}`}
              checked={checked}
              disabled={readOnly}
              className="data-[state=checked]:bg-[#6A35FF] data-[state=checked]:border-[#6A35FF]"
              onCheckedChange={(c) => {
                if (c) {
                  onChange([...arrValue, opt]);
                } else {
                  onChange(arrValue.filter((v) => v !== opt));
                }
              }}
            />
            <Label
              htmlFor={`${question.id}-${opt}`}
              className={`text-base cursor-pointer leading-snug ${
                checked ? "text-[#6A35FF] font-medium" : "text-gray-800"
              }`}
            >
              {opt}
            </Label>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

/** Shared by every section header and its content so the title bar lines up with
 * what sits under it. */
const SECTION_PADDING = "px-6";

/**
 * Full-bleed grey title bar. The section's content sits on white beneath it.
 *
 * `badge` is where a locked section's `LockBadge` goes — pushed to the far end of
 * the bar, which is outside the dimmed region so it stays legible.
 */
function SectionHeader({
  title,
  badge,
  helpKey,
}: {
  title: string;
  badge?: React.ReactNode;
  /**
   * Names this section's help copy in `HELP_CONTENT`, which owns the text. With
   * a key the question mark opens a popover; without one it is decoration.
   */
  helpKey?: HelpKey;
}) {
  return (
    <div
      className={`flex items-center gap-1.5 bg-[#F3F3F6] ${SECTION_PADDING} py-2.5`}
    >
      <HelpPopover helpKey={helpKey} label={title} />
      <span className="text-base font-semibold text-gray-800">{title}</span>
      {badge && <span className="ml-auto shrink-0">{badge}</span>}
    </div>
  );
}

// ─── Question row (question | [H] | Source | confidence) ──────────────────────

interface QuestionRowProps {
  index: number;
  question: BankQuestion;
  value: string | string[];
  onChange: (value: string | string[]) => void;
  source: string;
  confidence: number;
  onSourceChange: (source: string) => void;
  onConfidenceChange: (confidence: number) => void;
  /** When provided, render the hypothesis toggle (problems only). */
  isHypothesis?: boolean;
  onToggleHypothesis?: (isHypothesis: boolean) => void;
  readOnly?: boolean;
  /** Whether `SOURCE_CONFIDENCE_SUB_STEP` is reviewed. Until then the source
   * select and the stars render greyed and inert. */
  sourceConfidenceUnlocked?: boolean;
  /** Whether `HYPOTHESIS_SUB_STEP` is reviewed. Same treatment for the toggle. */
  hypothesisUnlocked?: boolean;
}

function QuestionRow({
  index,
  question,
  value,
  onChange,
  source,
  confidence,
  onSourceChange,
  onConfidenceChange,
  isHypothesis,
  onToggleHypothesis,
  readOnly = false,
  sourceConfidenceUnlocked = false,
  hypothesisUnlocked = false,
}: QuestionRowProps) {
  // The question and its answer take the width; the evidence — hypothesis toggle,
  // source, confidence — stacks in a fixed column beside them. The column is
  // sized for the longest source option ("Shared personally") at the larger text
  // size; narrower and the select truncates it.
  //
  // The whole column is always present, so the row keeps its shape as the gates
  // open one by one. Only solutions have no hypothesis toggle at all.
  const hasHypothesis = Boolean(onToggleHypothesis);

  return (
    <div className="flex items-start gap-6 py-4 border-t border-gray-300 first:border-t-0">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <p className="text-base font-semibold text-gray-900">
          <span className="text-[#6A35FF] mr-1.5">{index}.</span>
          {question.text}
        </p>

        <AnswerInput
          question={question}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
        />
      </div>

      <div className="flex w-[200px] shrink-0 flex-col gap-3">
        {hasHypothesis && (
          <LockedRegion locked={!hypothesisUnlocked}>
            <button
              type="button"
              disabled={readOnly || !hypothesisUnlocked}
              onClick={() => onToggleHypothesis?.(!isHypothesis)}
              aria-pressed={isHypothesis}
              title={
                isHypothesis ? "Marked as hypothesis" : "Mark as hypothesis"
              }
              className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-sm font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                isHypothesis
                  ? "border-[#6A35FF] text-[#6A35FF] bg-[#F4F0FF]"
                  : "border-gray-400 text-gray-600 hover:border-[#6A35FF] hover:text-[#6A35FF]"
              }`}
            >
              Hypothesis
            </button>
          </LockedRegion>
        )}

        <LockedRegion
          locked={!sourceConfidenceUnlocked}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Source:</span>
            <Select
              value={source ?? ""}
              onValueChange={onSourceChange}
              disabled={readOnly || !sourceConfidenceUnlocked}
            >
              <SelectTrigger className="h-9 w-full text-base bg-white">
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {SOURCE_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">
              Your confidence:
            </span>
            <div className="flex h-9 items-center">
              <StarRating
                value={confidence ?? 0}
                onChange={onConfidenceChange}
                readOnly={readOnly || !sourceConfidenceUnlocked}
              />
            </div>
          </div>
        </LockedRegion>
      </div>
    </div>
  );
}

// ─── Bank of Questions ────────────────────────────────────────────────────────

interface BankOfQuestionsProps {
  questions: BankQuestion[];
  activeQuestionIds: string[];
  onAdd: (questionId: string) => void;
  title?: string;
}

function BankOfQuestions({
  questions: bankQuestions,
  activeQuestionIds,
  onAdd,
  title = "Bank of questions",
}: BankOfQuestionsProps) {
  const activeSet = new Set(activeQuestionIds);
  const categories = Array.from(new Set(bankQuestions.map((q) => q.category)));

  return (
    <>
      <SectionHeader title={title} />

      <div className={`${SECTION_PADDING} py-4`}>
        {categories.map((cat) => {
          const questions = bankQuestions.filter((q) => q.category === cat);
          return (
            <div key={cat} className="mb-4 last:mb-0">
              <p className="text-sm font-semibold text-gray-700 mb-2">{cat}</p>
              {/* Boxed so the category's questions read as one group under its label. */}
              <div className="rounded-xl border border-gray-300">
                {questions.map((q, idx) => {
                  const added = activeSet.has(q.id);
                  return (
                    <div
                      key={q.id}
                      className={`flex items-center justify-between gap-3 px-4 py-3 ${
                        idx > 0 ? "border-t border-gray-300" : ""
                      }`}
                    >
                      <span className="text-base text-gray-800 pr-2">
                        {q.text}
                      </span>
                      {added ? (
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#6A35FF] flex items-center justify-center text-white">
                          <CheckIcon className="w-3.5 h-3.5" />
                        </span>
                      ) : (
                        <button
                          onClick={() => onAdd(q.id)}
                          className="flex-shrink-0 w-6 h-6 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-[#6A35FF] hover:text-[#6A35FF] transition-colors"
                        >
                          <PlusIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ─── Sheet header (navigation + Action title) ─────────────────────────────────

interface SheetHeaderBarProps {
  actionTitle: string;
  onActionTitleChange: (content: string) => void;
  /** 0-based position of the open problem in `total`. -1 while none resolves. */
  index: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  readOnly?: boolean;
}

/**
 * Sits above the tabs: which Action card you're in, and a way to step through
 * that card's problems from here.
 *
 * The arrows stop at the ends rather than wrapping, and stay mounted-but-
 * disabled on a single-problem card so the bar keeps its shape whichever card
 * the sheet was opened from.
 */
function SheetHeaderBar({
  actionTitle,
  onActionTitleChange,
  index,
  total,
  onPrev,
  onNext,
  onClose,
  readOnly = false,
}: SheetHeaderBarProps) {
  const arrowClass =
    "shrink-0 w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-700 transition-colors hover:border-[#6A35FF] hover:text-[#6A35FF] disabled:opacity-40 disabled:pointer-events-none";

  return (
    <div className="shrink-0 border-b border-gray-200 px-4 pt-4 pb-3">
      {/* Names the panel. The row below is the Action's own text — it reads as a
          heading, which left nothing saying what kind of thing is open. */}
      <p className="mb-2 text-sm font-semibold text-[#697288]">Action</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrev}
          disabled={index <= 0}
          title="Previous problem"
          className={`${arrowClass} mt-0.5`}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {/* The Action's text is the header's title *and* its editor — the same
            field the card shows, so a fix typed here lands on the card. */}
        <Textarea
          className="nodrag min-h-0 flex-1 resize-none border-transparent bg-transparent px-2 py-1 text-lg font-semibold text-[#111827] shadow-none placeholder-gray-500 md:text-lg hover:border-gray-300 focus-visible:border-[#6A35FF] focus-visible:ring-0"
          rows={1}
          placeholder="Type your action..."
          value={actionTitle}
          readOnly={readOnly}
          onChange={(e) => onActionTitleChange(e.target.value)}
        />

        {/* Reads as the label for the arrow it sits beside. `shrink-0` and
            `whitespace-nowrap` keep "Problem 1 of 12" on one line — the Action
            textarea beside it is `flex-1` and would otherwise win the space. */}
        {total > 0 && index >= 0 && (
          <p className="mt-0.5 shrink-0 whitespace-nowrap text-sm text-gray-600">
            Problem {index + 1} of {total}
          </p>
        )}

        <button
          type="button"
          onClick={onNext}
          disabled={index < 0 || index >= total - 1}
          title="Next problem"
          className={`${arrowClass} mt-0.5`}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="shrink-0 mt-0.5 ml-1 w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
        >
          <XIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main sheet ───────────────────────────────────────────────────────────────

export function ActionNodeSheet({
  readOnly = false,
  questionsUnlocked,
  sourceConfidenceUnlocked,
  hypothesisUnlocked,
  solutionsUnlocked,
  open,
  onOpenChange,
  activeTab,
  onActiveTabChange,
  nodeId,
  problemId,
  problem,
  actionTitle,
  onActionTitleChange,
  problems,
  onSelectProblem,
  onSaveProblem,
  solution,
  onSaveSolution,
}: ActionNodeSheetProps) {
  // The Solution tab is read-only whenever the whole sheet is (Examples pages) or
  // while the Solutions milestone is still locked.
  const solutionsLocked = !solutionsUnlocked;
  const solutionReadOnly = readOnly || solutionsLocked;

  // A locked question can't be answered either, so the gate folds into the
  // read-only flag the inputs already take rather than being checked twice.
  const questionsReadOnly = readOnly || !questionsUnlocked;
  const solutionQuestionsReadOnly = solutionReadOnly || !questionsUnlocked;

  // ── Problem editor state (single problem, inline) ──
  const [problemDraft, setProblemDraft] = useState("");
  const [problemType, setProblemType] = useState("");
  const [problemPainGain, setProblemPainGain] = useState<PainOrGain>("pain");
  const [activeQuestionIds, setActiveQuestionIds] = useState<string[]>([]);
  const [questionAnswers, setQuestionAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [questionSources, setQuestionSources] = useState<
    Record<string, string>
  >({});
  const [questionConfidence, setQuestionConfidence] = useState<
    Record<string, number>
  >({});
  const [questionHypothesis, setQuestionHypothesis] = useState<
    Record<string, boolean>
  >({});

  // ── Solution editor state (single solution, inline) ──
  const [solutionDraft, setSolutionDraft] = useState("");
  const [solutionType, setSolutionType] = useState("");
  const [solutionRelieverCreator, setSolutionRelieverCreator] =
    useState<RelieverOrCreator>("reliever");
  const [activeSolutionQuestionIds, setActiveSolutionQuestionIds] = useState<
    string[]
  >([]);
  const [solutionQuestionAnswers, setSolutionQuestionAnswers] = useState<
    Record<string, string | string[]>
  >({});
  const [solutionQuestionSources, setSolutionQuestionSources] = useState<
    Record<string, string>
  >({});
  const [solutionQuestionConfidence, setSolutionQuestionConfidence] = useState<
    Record<string, number>
  >({});

  // Hydrate the problem editor whenever the sheet opens or the selected node
  // changes. Not keyed on `problem` so remote/round-trip updates don't clobber
  // in-progress edits — this editor is the writer.
  useEffect(() => {
    if (!open) return;
    setProblemDraft(problem?.description ?? "");
    setProblemType(problem?.type ?? "");
    setProblemPainGain(problem?.painOrGain ?? "pain");
    const ids = problem?.questions.map((q) => q.bankQuestionId) ?? [];
    setActiveQuestionIds(ids);
    const answers: Record<string, string | string[]> = {};
    const sources: Record<string, string> = {};
    const conf: Record<string, number> = {};
    const hyp: Record<string, boolean> = {};
    for (const q of problem?.questions ?? []) {
      answers[q.bankQuestionId] = q.answer;
      sources[q.bankQuestionId] = q.source ?? "";
      conf[q.bankQuestionId] = q.confidence ?? 0;
      hyp[q.bankQuestionId] = q.isHypothesis ?? false;
    }
    setQuestionAnswers(answers);
    setQuestionSources(sources);
    setQuestionConfidence(conf);
    setQuestionHypothesis(hyp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId, problemId]);

  // Hydrate the solution editor on the same terms as the problem editor above.
  useEffect(() => {
    if (!open) return;
    setSolutionDraft(solution?.description ?? "");
    setSolutionType(solution?.type ?? "");
    setSolutionRelieverCreator(solution?.relieverOrCreator ?? "reliever");
    const ids = solution?.questions.map((q) => q.bankQuestionId) ?? [];
    setActiveSolutionQuestionIds(ids);
    const answers: Record<string, string | string[]> = {};
    const sources: Record<string, string> = {};
    const conf: Record<string, number> = {};
    for (const q of solution?.questions ?? []) {
      answers[q.bankQuestionId] = q.answer;
      sources[q.bankQuestionId] = q.source ?? "";
      conf[q.bankQuestionId] = q.confidence ?? 0;
    }
    setSolutionQuestionAnswers(answers);
    setSolutionQuestionSources(sources);
    setSolutionQuestionConfidence(conf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, nodeId, problemId]);

  // The bank is dimmed and `inert` before Milestone 2, so these can't normally be
  // reached — but adding a question is the one gated action that *writes*, so it
  // checks the gate itself rather than trusting the wrapper above it.
  function handleAddBankQuestion(questionId: string) {
    if (!questionsUnlocked) return;
    if (activeQuestionIds.includes(questionId)) return;
    const bq = BANK_QUESTIONS.find((q) => q.id === questionId);
    const defaultAnswer: string | string[] =
      bq?.answerType === "multiple_choice" ? [] : "";
    setActiveQuestionIds((prev) => [...prev, questionId]);
    setQuestionAnswers((prev) => ({ ...prev, [questionId]: defaultAnswer }));
    setQuestionSources((prev) => ({ ...prev, [questionId]: "" }));
    setQuestionConfidence((prev) => ({ ...prev, [questionId]: 0 }));
    setQuestionHypothesis((prev) => ({ ...prev, [questionId]: false }));
  }

  function handleAddSolutionBankQuestion(questionId: string) {
    if (!questionsUnlocked || solutionsLocked) return;
    if (activeSolutionQuestionIds.includes(questionId)) return;
    const bq = SOLUTION_BANK_QUESTIONS.find((q) => q.id === questionId);
    const defaultAnswer: string | string[] =
      bq?.answerType === "multiple_choice" ? [] : "";
    setActiveSolutionQuestionIds((prev) => [...prev, questionId]);
    setSolutionQuestionAnswers((prev) => ({
      ...prev,
      [questionId]: defaultAnswer,
    }));
    setSolutionQuestionSources((prev) => ({ ...prev, [questionId]: "" }));
    setSolutionQuestionConfidence((prev) => ({ ...prev, [questionId]: 0 }));
  }

  function collectProblemAnswers(): ProblemQuestionAnswer[] {
    return activeQuestionIds.map((id) => ({
      bankQuestionId: id,
      answer: questionAnswers[id] ?? "",
      source: questionSources[id] ?? "",
      confidence: questionConfidence[id] ?? 0,
      isHypothesis: questionHypothesis[id] ?? false,
    }));
  }

  function collectSolutionAnswers(): SolutionQuestionAnswer[] {
    return activeSolutionQuestionIds.map((id) => ({
      bankQuestionId: id,
      answer: solutionQuestionAnswers[id] ?? "",
      source: solutionQuestionSources[id] ?? "",
      confidence: solutionQuestionConfidence[id] ?? 0,
    }));
  }

  // Where the open problem sits on its card. Switching problems only moves this
  // index: the hydration effects above are keyed on `problemId`, so both editors
  // refill from the problem you land on and an unsaved draft is dropped — the
  // arrows navigate, they don't save.
  const problemIndex = problemId
    ? problems.findIndex((p) => p.id === problemId)
    : -1;

  function goToProblem(offset: number) {
    const target = problems[problemIndex + offset];
    if (target) onSelectProblem(target.id);
  }

  function handleSaveProblem() {
    const trimmed = problemDraft.trim();
    if (!trimmed) {
      toast.error("Add a description before saving the problem.");
      return;
    }
    onSaveProblem(
      trimmed,
      problemType,
      problemPainGain,
      collectProblemAnswers(),
    );
    toast.success(
      problem?.description?.trim() ? "Problem updated" : "Problem saved",
    );
    onOpenChange(false);
  }

  function handleSaveSolution() {
    const trimmed = solutionDraft.trim();
    if (!trimmed) {
      toast.error("Add a description before saving the solution.");
      return;
    }
    onSaveSolution(
      trimmed,
      solutionType,
      solutionRelieverCreator,
      collectSolutionAnswers(),
    );
    toast.success(
      solution?.description?.trim() ? "Solution updated" : "Solution saved",
    );
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[820px] sm:max-w-[820px] flex flex-col p-0 gap-0 [&>button:last-of-type]:hidden"
      >
        {/* The visible title is the editable Action field below, which can't
            double as the dialog's accessible name. */}
        <SheetTitle className="sr-only">
          {actionTitle?.trim() || "Action"}
        </SheetTitle>

        <SheetHeaderBar
          actionTitle={actionTitle}
          onActionTitleChange={onActionTitleChange}
          index={problemIndex}
          total={problems.length}
          onPrev={() => goToProblem(-1)}
          onNext={() => goToProblem(1)}
          onClose={() => onOpenChange(false)}
          readOnly={readOnly}
        />

        <Tabs
          value={activeTab}
          onValueChange={(v) => onActiveTabChange(v as ActionSheetTab)}
          className="w-full flex flex-col flex-1 min-h-0"
        >
          <TabsList className="w-80 bg-white border-1 rounded-lg m-2 shrink-0">
            {TABS.map(({ value, label }) => (
              <TabsTrigger
                key={value}
                value={value}
                className="group text-sm rounded-sm"
              >
                <span className="flex items-center gap-1.5">
                  {value === "solution" && solutionsLocked && (
                    // Purple on the light inactive tab, white on the purple active one.
                    <LockIcon className="w-3 h-3 text-[#6A35FF] group-data-[state=active]:text-white" />
                  )}
                  {label}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {/* ── Problem tab ── */}
            <TabsContent value="problem" className="p-0">
              <div>
                {/* What the problem? */}
                <SectionHeader
                  title="What is the pain/gain you intend to address?"
                  helpKey="problem.painGain"
                />
                <div className={`${SECTION_PADDING} py-4`}>
                  <span className="inline-block mb-2 text-sm font-semibold bg-[#F5E7D0] text-[#7A5C33] rounded-full px-2.5 py-0.5">
                    Problem
                  </span>
                  <div className="flex gap-4 items-start">
                    <textarea
                      className="flex-1 self-stretch bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-[#6A35FF] leading-snug"
                      rows={3}
                      placeholder="Don't focus on the solution. Focus on what is it they are not able to do well or at all currently."
                      value={problemDraft}
                      readOnly={readOnly}
                      onChange={(e) => setProblemDraft(e.target.value)}
                    />
                    {/* One column beside the description: each classification is
                        its label with its dropdown underneath. Opens with the
                        description itself — see `PROBLEMS_SUB_STEP`. */}
                    <div className="flex flex-col gap-3 w-[200px] shrink-0">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                          Type of problem
                        </span>
                        <Select
                          value={problemType}
                          onValueChange={setProblemType}
                          disabled={readOnly}
                        >
                          <SelectTrigger className="h-9 w-full text-base bg-white">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            {PROBLEM_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">
                          Is it pain or gain?
                        </span>
                        <Select
                          value={problemPainGain}
                          onValueChange={(v) =>
                            setProblemPainGain(v as PainOrGain)
                          }
                          disabled={readOnly}
                        >
                          <SelectTrigger className="h-9 w-full text-base bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PAIN_OR_GAIN_OPTIONS.map((o) => (
                              <SelectItem key={o.value} value={o.value}>
                                {o.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Market Questions */}
                <SectionHeader
                  title="Market Questions"
                  badge={
                    !questionsUnlocked && (
                      <LockBadge milestone={MARKET_QUESTIONS_MILESTONE} />
                    )
                  }
                />

                <LockedRegion locked={!questionsUnlocked}>
                  <div className={SECTION_PADDING}>
                    {activeQuestionIds.map((qId, i) => {
                      const bq = BANK_QUESTIONS.find((q) => q.id === qId);
                      if (!bq) return null;
                      return (
                        <QuestionRow
                          key={qId}
                          index={i + 1}
                          question={bq}
                          value={
                            questionAnswers[qId] ??
                            (bq.answerType === "multiple_choice" ? [] : "")
                          }
                          onChange={(val) =>
                            setQuestionAnswers((prev) => ({
                              ...prev,
                              [qId]: val,
                            }))
                          }
                          source={questionSources[qId] ?? ""}
                          confidence={questionConfidence[qId] ?? 0}
                          isHypothesis={questionHypothesis[qId] ?? false}
                          onSourceChange={(val) =>
                            setQuestionSources((prev) => ({
                              ...prev,
                              [qId]: val,
                            }))
                          }
                          onConfidenceChange={(val) =>
                            setQuestionConfidence((prev) => ({
                              ...prev,
                              [qId]: val,
                            }))
                          }
                          onToggleHypothesis={(val) =>
                            setQuestionHypothesis((prev) => ({
                              ...prev,
                              [qId]: val,
                            }))
                          }
                          readOnly={questionsReadOnly}
                          sourceConfidenceUnlocked={sourceConfidenceUnlocked}
                          hypothesisUnlocked={hypothesisUnlocked}
                        />
                      );
                    })}
                  </div>

                  {!readOnly && (
                    <BankOfQuestions
                      questions={BANK_QUESTIONS}
                      activeQuestionIds={activeQuestionIds}
                      onAdd={handleAddBankQuestion}
                      title="Bank of market questions"
                    />
                  )}
                </LockedRegion>
              </div>
            </TabsContent>

            {/* ── Solution tab ── The gate here covers the tab rather than one
                section of it, so it reads the way a locked section of the Problem
                tab does: one badge on the first header bar, everything below it
                greyed and inert. */}
            <TabsContent value="solution" className="p-0">
              <div>
                {/* What the solution? */}
                <SectionHeader
                  title="What the solution?"
                  helpKey="solution.description"
                  badge={
                    solutionsLocked && (
                      <LockBadge milestone={SOLUTIONS_MILESTONE} />
                    )
                  }
                />
                <LockedRegion locked={solutionsLocked}>
                  <div className={`${SECTION_PADDING} py-4`}>
                    <span className="inline-block mb-2 text-sm font-semibold bg-[#2F9E63] text-white rounded-full px-2.5 py-0.5">
                      Solution
                    </span>
                    <div className="flex gap-4 items-start">
                      <textarea
                        className="flex-1 self-stretch bg-white border border-gray-300 rounded-lg p-3 text-base text-gray-800 placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-[#6A35FF] leading-snug"
                        rows={3}
                        placeholder="Describe your solution..."
                        value={solutionDraft}
                        readOnly={solutionReadOnly}
                        onChange={(e) => setSolutionDraft(e.target.value)}
                      />
                      {/* Same stacked column as the Problem tab above. */}
                      <div className="flex flex-col gap-3 w-[200px] shrink-0">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">
                            Type of solution
                          </span>
                          <Select
                            value={solutionType}
                            onValueChange={setSolutionType}
                            disabled={solutionReadOnly}
                          >
                            <SelectTrigger className="h-9 w-full text-base bg-white">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              {SOLUTION_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">
                            Is it reliever or creator?
                          </span>
                          <Select
                            value={solutionRelieverCreator}
                            onValueChange={(v) =>
                              setSolutionRelieverCreator(v as RelieverOrCreator)
                            }
                            disabled={solutionReadOnly}
                          >
                            <SelectTrigger className="h-9 w-full text-base bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RELIEVER_OR_CREATOR_OPTIONS.map((o) => (
                                <SelectItem key={o.value} value={o.value}>
                                  {o.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                </LockedRegion>

                {/* Market Questions */}
                <SectionHeader title="Market Questions" />

                <LockedRegion locked={solutionsLocked || !questionsUnlocked}>
                  <div className={SECTION_PADDING}>
                    {activeSolutionQuestionIds.map((qId, i) => {
                      const bq = SOLUTION_BANK_QUESTIONS.find(
                        (q) => q.id === qId,
                      );
                      if (!bq) return null;
                      return (
                        <QuestionRow
                          key={qId}
                          index={i + 1}
                          question={bq}
                          value={
                            solutionQuestionAnswers[qId] ??
                            (bq.answerType === "multiple_choice" ? [] : "")
                          }
                          onChange={(val) =>
                            setSolutionQuestionAnswers((prev) => ({
                              ...prev,
                              [qId]: val,
                            }))
                          }
                          source={solutionQuestionSources[qId] ?? ""}
                          confidence={solutionQuestionConfidence[qId] ?? 0}
                          onSourceChange={(val) =>
                            setSolutionQuestionSources((prev) => ({
                              ...prev,
                              [qId]: val,
                            }))
                          }
                          onConfidenceChange={(val) =>
                            setSolutionQuestionConfidence((prev) => ({
                              ...prev,
                              [qId]: val,
                            }))
                          }
                          readOnly={solutionQuestionsReadOnly}
                          sourceConfidenceUnlocked={sourceConfidenceUnlocked}
                        />
                      );
                    })}
                  </div>

                  {!readOnly && (
                    <BankOfQuestions
                      questions={SOLUTION_BANK_QUESTIONS}
                      activeQuestionIds={activeSolutionQuestionIds}
                      onAdd={handleAddSolutionBankQuestion}
                      title="Bank of market questions"
                    />
                  )}
                </LockedRegion>
              </div>
            </TabsContent>
          </div>

          {!readOnly && !(activeTab === "solution" && solutionsLocked) && (
            <div className="shrink-0 border-t p-2 flex items-center justify-center">
              {activeTab === "problem" ? (
                <Button
                  onClick={handleSaveProblem}
                  className="text-base font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors rounded-full"
                >
                  Save problem
                </Button>
              ) : (
                <Button
                  onClick={handleSaveSolution}
                  className=" text-base font-medium text-white bg-gray-900 hover:bg-gray-700 transition-colors rounded-full"
                >
                  Save solution
                </Button>
              )}
            </div>
          )}
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
