// The question banks live here rather than next to the sheet that renders them so
// server code (services/interviewPrep.ts) can resolve a bankQuestionId to its text
// without importing the client component.

import type { ResponseType } from "./components/InterviewPrep/types";

export type AnswerType =
  | "plain_text"
  | "yes_no"
  | "scale"
  | "single_choice"
  | "multiple_choice";

/**
 * One interview question a bank question ships with, in the same terms the user
 * gets when they write one by hand on the Interview Prep tab: a title, a response
 * type, and — for a dropdown — its options.
 *
 * Options are authored as plain labels rather than { id, label }: the ids key a
 * participant's stored answer, so they are generated per seeded row instead of
 * being shared by every problem that uses the same bank question.
 */
export interface DefaultInterviewQuestion {
  /** The interview question itself, e.g. "How often does this happen?". */
  title: string;
  /** "text" | "scale" | "dropdown". */
  responseType: ResponseType;
  /** Only read when responseType is "dropdown"; order is kept. */
  options?: string[];
}

export interface BankQuestion {
  id: string;
  category: string;
  text: string;
  answerType: AnswerType;
  options?: string[];
  /**
   * Seeded onto the hypothesis the first time this question is marked as one, so
   * the Interview Prep tab opens with questions already written. They are ordinary
   * questions from that point on — the team edits, reorders and deletes them like
   * any other, and a deleted one does not come back.
   *
   * Omitted or empty = the hypothesis starts blank, as it does today.
   *
   *   defaultInterviewQuestions: [
   *     { title: "How do you handle this today?", responseType: "text" },
   *     { title: "How painful is it?", responseType: "scale" },
   *     {
   *       title: "How often does it come up?",
   *       responseType: "dropdown",
   *       options: ["Daily", "Weekly", "Monthly"],
   *     },
   *   ],
   */
  defaultInterviewQuestions?: DefaultInterviewQuestion[];
}

export const BANK_QUESTIONS: BankQuestion[] = [
  {
    id: "bq-1",
    category: "Market Status Quo",
    text: "How are they solving it today?",
    answerType: "plain_text",
    defaultInterviewQuestions: [
        { title: "How are you solving this today?", responseType: "text" },
        { title: "How did you find about this solution?", responseType: "text" },

    ]
  },
  {
    id: "bq-2",
    category: "Market Status Quo",
    text: "How do they acquire the current solution? How much do they pay for it?",
    answerType: "plain_text",
    defaultInterviewQuestions: [
        { title: "How do you go about buying this?", responseType: "text" },
        { title: "How much are you paying for it?", responseType: "text" },
        { title: "What do you think of the price? Is it reasonable or too expensive?", responseType: "text" },
    ]
  },
  {
    id: "bq-3",
    category: "Market Status Quo",
    text: "Why did they pick this current solution? What other solutions did they consider?",
    answerType: "plain_text",
    defaultInterviewQuestions: [
        { title: "Why did you pick this solution?", responseType: "text" },
        { title: "Which other solutions did you conisder?", responseType: "text" },
        { title: "Did you follow anybody's recommendation or influenced by someone? If yes, who and what was their recommendation?", responseType: "text" },
        { title: "How long did you spend considering the solution?", responseType: "text" },


    ]
  },
  {
    id: "bq-4",
    category: "Market Status Quo",
    text: "How often do they experience this problem / pain / lack-of-gain?",
    answerType: "plain_text",
    defaultInterviewQuestions: [
        { title: "How often do you experience this problem / pain?", responseType: "text" },
    ]
  },
  {
    id: "bq-5",
    category: "Market Status Quo",
    text: "What happens if this problem / pain / lack-of-gain is left unsolved?",
    answerType: "plain_text",
    defaultInterviewQuestions: [
        { title: "What happens if this problem / pain is not solved fully or partially?", responseType: "text" },
    ]
  },
  {
    id: "bq-6",
    category: "Problem Clarity",
    text: "If the Problem (Pain/Gain) is primiarly of Functional Type, what is a tangible size of the pain or gain today and what outcome would they want instead? Example: 20mins wait time",
    answerType: "plain_text",
  },
  {
    id: "bq-7",
    category: "Problem Clarity",
    text: "If the Problem (Pain/Gain) is primarily of Emotional Type, what emotions are they experiencing today and what outcome would they want instead? Example: lack of peace of mind if they will get accepted",
    answerType: "plain_text",
  },
  {
    id: "bq-8",
    category: "Problem Clarity",
    text: "If the Problem (Pain/Gain) is primarily of Social Type, what social expectations do they have today and which ones are being met or not met? Example: appear to my neighbors that I care for my environment by reducing sprinkler usage",
    answerType: "plain_text",
  },
  {
    id: "bq-9",
    category: "Market Opportunity",
    text: "Out of a pool of 100 stakeholders, how many people do you think are experiencing this?",
    answerType: "plain_text",
  },
  {
    id: "bq-10",
    category: "Market Opportunity",
    text: "Out of a pool of 100 stakeholders, on a scale of 1-5, how many would identify they are satisfied with the current solution, a 4 or higher?",
    answerType: "plain_text",
    defaultInterviewQuestions: [
        { title: "On a scale of 1-5, how would you rate your satisfaction with the current solution?", responseType: "text" },
    ]
  },
  {
    id: "bq-11",
    category: "Market Opportunity",
    text: "Out of a pool of 100 stakeholders, on a scale of 1-5, how many would identify solving this problem as important, a 4 or higher?",
    answerType: "plain_text",
    defaultInterviewQuestions: [
        { title: "On a scale of 1-5, how would you rate the importance of this problem being solved?", responseType: "text" },
    ]
  },
];

// Kept as its own literal rather than derived from BANK_QUESTIONS so the two
// banks can diverge; the distinct ids also key solution answers separately.
export const SOLUTION_BANK_QUESTIONS: BankQuestion[] = [
  {
    id: "sbq-1",
    category: "Market Size",
    text: "How many people on average are experiencing this problem?",
    answerType: "plain_text",
  },
  {
    id: "sbq-2",
    category: "Market Size",
    text: "How are they solving it today?",
    answerType: "plain_text",
  },
  {
    id: "sbq-3",
    category: "Market Size",
    text: "How significant is the problem for these people?",
    answerType: "scale",
  },
  {
    id: "sbq-4",
    category: "Significance",
    text: "Would customers pay to solve this problem?",
    answerType: "yes_no",
  },
  {
    id: "sbq-5",
    category: "Significance",
    text: "What factors make this problem significant?",
    answerType: "plain_text",
  },
  {
    id: "sbq-6",
    category: "Significance",
    text: "What is the frequency of this problem?",
    answerType: "scale",
  },
];
