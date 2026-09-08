// The question banks live here rather than next to the sheet that renders them so
// server code (services/interviewPrep.ts) can resolve a bankQuestionId to its text
// without importing the client component.

export type AnswerType =
  | "plain_text"
  | "yes_no"
  | "scale"
  | "single_choice"
  | "multiple_choice";

export interface BankQuestion {
  id: string;
  category: string;
  text: string;
  answerType: AnswerType;
  options?: string[];
}

export const BANK_QUESTIONS: BankQuestion[] = [
  {
    id: "bq-1",
    category: "Market Opportunity",
    text: "Out of a pool of 100 stakeholders, how many people do you think are experiencing this?",
    answerType: "plain_text",
  },
  {
    id: "bq-2",
    category: "Market Opportunity",
    text: "Out of a pool of 100 stakeholders, on a scale of 1-5, how many would identify they are satisfied with the current solution, a 4 or higher?",
    answerType: "plain_text",
  },
  {
    id: "bq-3",
    category: "Market Opportunity",
    text: "Out of a pool of 100 stakeholders, on a scale of 1-5, how many would identify solving this problem as important, a 4 or higher?",
    answerType: "plain_text",
  },
  {
    id: "bq-4",
    category: "Market Status Quo",
    text: "How are they solving it today?",
    answerType: "plain_text",
  },
  {
    id: "bq-5",
    category: "Market Status Quo",
    text: "How do they acquire the current solution? How much do they pay for it?",
    answerType: "plain_text",
  },
  {
    id: "bq-7",
    category: "Market Status Quo",
    text: "Why did they pick this current solution? What other solutions did they consider?",
    answerType: "plain_text",
  },
  {
    id: "bq-8",
    category: "Market Status Quo",
    text: "How often do they experience this problem / pain / lack-of-gain?",
    answerType: "plain_text",
  },
  {
    id: "bq-9",
    category: "Market Status Quo",
    text: "What happens if this problem / pain / lack-of-gain is left unsolved?",
    answerType: "plain_text",
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
