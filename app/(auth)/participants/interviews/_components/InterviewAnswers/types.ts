import type {
  DropdownOption,
  ResponseType,
} from "@/components/ProblemJourneyMap/components/InterviewPrep/types";

export type { DropdownOption, ResponseType };

/**
 * An interview question as the interviewer sees it: the question itself is read-only
 * here — it was authored on the Interview Prep tab — and only `answer` is editable.
 */
export interface AnswerableQuestion {
  /** ProblemInterviewQuestion.id — what the answer row is keyed by. */
  questionId: string;
  /** 1-based position, dense over the questions actually shown. */
  index: number;
  /** Guaranteed non-empty: an unauthored question is never surfaced here. */
  title: string;
  responseType: ResponseType;
  /** Only meaningful when responseType === "dropdown". */
  options: DropdownOption[];
  /** The participant's answer. "" = unanswered. */
  answer: string;
}

export interface AnswerableProblem {
  id: string;
  /** The action card's text, as typed on the canvas. "" = never filled in. */
  action: string;
  /** Pill label, e.g. "Problem". */
  label: string;
  description: string;
  /** Classification tags, e.g. ["Functional", "Pain"]. */
  tags: string[];
  /** Never empty — a problem with no authored questions is dropped. */
  questions: AnswerableQuestion[];
}
