export type ResponseType = "text" | "scale" | "dropdown";

export interface DropdownOption {
  id: string;
  label: string;
}

export interface InterviewQuestion {
  /** ProblemInterviewQuestion row id — every rendered question is already persisted. */
  id: string;
  /** The interview question the user is authoring. Empty string = not yet written. */
  title: string;
  responseType: ResponseType;
  /** Only meaningful when responseType === "dropdown". */
  options: DropdownOption[];
}

/** A question being written but not yet saved, so it has no row id yet. */
export type InterviewQuestionDraft = Omit<InterviewQuestion, "id">;

export interface Hypothesis {
  id: string;
  /** Identifies which question of the problem's bank this row came from. */
  bankQuestionId: string;
  /** 1-based position shown in the UI ("1.", "2.", ...). */
  index: number;
  /** The problem-statement prompt, taken from the question bank. */
  prompt: string;
  /** The user's answer to the prompt, as captured on the canvas. */
  answer: string;
  /** Where the answer came from, e.g. "Shared personally". */
  source: string;
  /** Confidence out of 5. Display-only. */
  confidence: number;
  /** Ordered; may be empty — the row itself comes from the canvas, not the DB. */
  questions: InterviewQuestion[];
}

export interface ProblemBlock {
  id: string;
  /** The action node the problem hangs off; needed to address the interview question. */
  nodeId: string;
  /** The action card's text, as typed on the canvas. "" = never filled in. */
  action: string;
  /** Pill label, e.g. "Problem". */
  label: string;
  description: string;
  /** Classification tags, e.g. ["Functional", "Pain"]. */
  tags: string[];
  hypotheses: Hypothesis[];
}
