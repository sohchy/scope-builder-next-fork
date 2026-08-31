import type { ResponseType } from "@/components/ProblemJourneyMap/components/InterviewPrep/types";

/** One interviewee's answer to one question, already resolved for display. */
export interface SummaryAnswer {
  participantId: string;
  participantName: string;
  /** When the interview happened, ISO. The participant's scheduled date — null when one
   *  was never set, which is common for interviews logged after the fact. */
  interviewDate: string | null;
  /** Dropdown answers arrive as the option's label, not its id. Never empty — the
   *  summary only lists people who actually answered. */
  value: string;
}

export interface SummaryQuestion {
  /** ProblemInterviewQuestion row id. */
  questionId: string;
  /** 1-based position within its hypothesis. */
  index: number;
  title: string;
  /** Kept so a tile can present a scale answer differently from free text. */
  responseType: ResponseType;
  /** Everyone who answered, by name. Empty when nobody has. */
  answers: SummaryAnswer[];
}

export interface SummaryHypothesis {
  id: string;
  /** The triple that addresses the stored summary — the hypothesis itself lives on the
   *  journey-map canvas, so there is no row id to write against. */
  nodeId: string;
  problemId: string;
  bankQuestionId: string;
  /** 1-based position shown in the UI ("1.", "2.", ...). */
  index: number;
  /** The problem-statement prompt, taken from the question bank. */
  prompt: string;
  questions: SummaryQuestion[];
  /** The team's write-up. "" = never written. */
  summary: string;
  /** 1..5, or 0 when never rated. */
  validationLevel: number;
  /** Answers actually given, counted per question rather than per person: someone who
   *  answered three of this hypothesis's questions adds three. */
  answeredCount: number;
  /** The other half of that count — one interviewee's silence on one question. Measured
   *  against everyone who was interviewed at all, so it grows with the questions asked,
   *  not just with the people asked. */
  noAnswerCount: number;
}

/** How the answers under a hypothesis are ordered. Page-wide, not per problem. */
export type AnswerOrder = "interviewee" | "date";

export interface SummaryProblem {
  id: string;
  /** The action card's text, as typed on the canvas. "" = never filled in. */
  action: string;
  /** Pill label, e.g. "Problem". */
  label: string;
  description: string;
  tags: string[];
  hypotheses: SummaryHypothesis[];
}
