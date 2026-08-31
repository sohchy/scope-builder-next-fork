/**
 * The 6 milestones and their 24 sub-steps — the single source of truth for the
 * curriculum. `MilestoneHeader.tsx` renders from here, and the seeded "steps"
 * Get Started card mirrors it (one item per sub-step, linked by position).
 *
 * Milestones are numbered from 0 ("Program Onboarding", the pre-program week),
 * which is why the arrays here are indexed by the milestone number itself rather
 * than `number - 1`. Same for `MilestoneAccessState[]` everywhere else.
 *
 * This module is deliberately data-only and free of React/lucide imports:
 * `services/milestoneAccess.ts` is a `"use server"` module (which may only export
 * async functions) and imports it, so sub-step icons live in `MilestoneHeader`.
 */

/** Inclusive bounds of a valid milestone number. Six milestones, last one is 5 —
 *  a "count" would be ambiguous here, so the bounds are named instead. */
export const FIRST_MILESTONE = 0;
export const LAST_MILESTONE = 5;

export const MILESTONE_NUMBERS = [0, 1, 2, 3, 4, 5] as const;

/** Milestone 0 ships unlocked for every startup and cannot be turned off. Every
 *  later milestone — including 1 — has to be activated by an instructor. */
export const ALWAYS_AVAILABLE_MILESTONE = 0;

/**
 * Sub-step that opens stakeholder work: the "Stakeholders" section on the Market
 * tab, and the "Stakeholders" button on a Trigger card that picks from the rows
 * entered there. Both sit behind the same gate because one feeds the other.
 *
 * Note the off-by-one that runs through the whole unlock map: finishing a
 * sub-step opens the work of the *next* one. 1.1 is "Jobs to be Done", and
 * ticking it is what lets the team start on stakeholders.
 */
export const STAKEHOLDERS_SUB_STEP = subStepKey(1, 1);

/**
 * Sub-step that opens the "Market Segments" section — the segment table, the
 * beachhead picks and the note explaining them — on the Market tab. 1.2 is
 * "Stakeholders": segmenting only makes sense once the team knows who is in the
 * journey, so the section stays greyed and read-only until that's marked done.
 */
export const MARKET_SEGMENTS_SUB_STEP = subStepKey(1, 2);

/**
 * Sub-step that opens problems on the journey canvas — the problem cards stacked
 * on an Action node, "Add a problem", and the Problem/Solution sheet they open.
 * 1.3 is "Segments & Beachhead": a problem is only worth stating once the team
 * knows whose problem it is. 1.4, the step this opens, is "Identify Pains/Gains"
 * — exactly the work these cards are for.
 *
 * Until then an Action node is its text alone. What the sheet shows *inside* is
 * then staged further by the three gates below.
 */
export const PROBLEMS_SUB_STEP = subStepKey(1, 3);

/**
 * Milestone that opens the "Market Questions" section of the Problem/Solution
 * sheet: answering the questions already on a problem, and adding more from the
 * bank. It's the one gate in the sheet an instructor grants rather than the team
 * ticking off — Milestone 2 is the whole deep-dive into the journey.
 */
export const MARKET_QUESTIONS_MILESTONE = 2;

/**
 * Milestone that opens the Solution tab of the Problem/Solution sheet — the
 * solution description, its classification, and the market questions asked about
 * it. Until then the tab is still reachable and still shows the whole editor, it
 * just renders greyed and read-only behind its badge.
 *
 * Provisional: solutions are pencilled in against Milestone 4 so the gate has a
 * real number to read, but where they land in the curriculum isn't settled. This
 * constant is the one place to change when it moves.
 */
export const SOLUTIONS_MILESTONE = 4;

/**
 * Sub-steps that open the evidence beside each answered question. Both are 2.1
 * "Expand on Pains/Gains": ticking it opens the source select, the confidence
 * stars and the hypothesis toggle in one go. They stay two constants because the
 * sheet gates the three controls separately and they need not move together.
 *
 * The break from the off-by-one that runs through the rest of the unlock map is
 * deliberate — source, confidence and hypothesis are all part of the same pass
 * over a question's answer, so splitting them across two sub-steps only made a
 * team tick a box mid-pass.
 *
 * Both sit inside `MARKET_QUESTIONS_MILESTONE` — the questions themselves are
 * locked before that, so their evidence is doubly so.
 */
export const SOURCE_CONFIDENCE_SUB_STEP = subStepKey(2, 1);
export const HYPOTHESIS_SUB_STEP = subStepKey(2, 1);

/**
 * Sub-step that opens the Interview Prep tab. 2.2 is "Hypothesis": the tab turns
 * the answers a team has flagged as beliefs into interview questions, which is
 * 2.3's work, so there's nothing to prepare until those flags exist.
 *
 * This is the last gate in the unlock map. Locked means visible but greyed and
 * read-only, so a team can see what's coming; see `JourneyMapTabs`.
 */
export const INTERVIEW_PREP_SUB_STEP = subStepKey(2, 2);

/** Payer interviews a startup has to document — the denominator the MilestoneHeader
 * counts toward. Read here rather than at each call site so the interviews board and
 * the journey map can't show different targets. */
export const MIN_PAYER_INTERVIEWS = Number(
  process.env.NEXT_PUBLIC_MIN_PAYER_INTERVIEWS ?? 8,
);

export type MilestoneAccessState = {
  milestone: number;
  available: boolean;
  submittedAt: Date | null;
  /** When an instructor signed the milestone off. One-way — never cleared. */
  reviewedAt: Date | null;
};

/** What an instructor typed and ticked in the review dialog on /startups. */
export type MilestoneReviewInput = {
  notes?: string;
  /** Also make milestone + 1 available. Ignored on the last milestone. */
  unlockNext?: boolean;
};

/** Outcome of `reviewMilestone`, so the table can reconcile its optimistic row. */
export type MilestoneReviewResult = {
  reviewedAt: Date;
  notes: string | null;
  /** Milestone number this review made available, or null if none. */
  unlockedMilestone: number | null;
};

/** Access for a startup with no rows yet: milestone 0 on, the rest off. */
export function defaultMilestoneAccess(): MilestoneAccessState[] {
  return MILESTONE_NUMBERS.map((milestone) => ({
    milestone,
    available: milestone === ALWAYS_AVAILABLE_MILESTONE,
    submittedAt: null,
    reviewedAt: null,
  }));
}

/** Milestone titles, indexed by milestone number (milestone 0 is first). */
export const MILESTONE_LABELS = [
  "Program Onboarding",
  "User, their Journey & Market",
  "Deep Dive into Journey",
  "Interview Preparation",
  "Conduct Interviews",
  "Analyze & Present Findings",
] as const;

/** Title of a milestone. Wrapped so the index-is-the-number rule lives in one
 *  place rather than at every call site. */
export function milestoneLabel(milestone: number): string {
  return MILESTONE_LABELS[milestone] ?? "";
}

export type SubStepDef = {
  /** Stable identity, `${milestone}.${position}` — e.g. "1.1". */
  key: string;
  /** 0..5. */
  milestone: number;
  /** 1-based position within the milestone. */
  position: number;
  /** Display label, numbering included — e.g. "1.1 Visualize User Journey". */
  label: string;
  /** Shown when the sub-step is expanded on the Instructions steps card. */
  description: string;
};

export function subStepKey(milestone: number, position: number) {
  return `${milestone}.${position}`;
}

/**
 * Sub-step content per milestone, indexed by milestone number — the first entry
 * is Milestone 0. A sub-step's identity is its position within its milestone, so
 * appending is safe but reordering/removing re-points existing progress.
 *
 * Descriptions are placeholder copy — they're seeded onto GetStartedItem by
 * prisma/seedSteps.ts and shown when a sub-step is expanded on the Instructions
 * steps card. Rewrite them here and re-run the seed, not in the database.
 */
const SUB_STEP_CONTENT: { label: string; description: string }[][] = [
  [
    {
      label: "Educational Content",
      description:
        "Work through the program's intro material before the first session, so the vocabulary and the method are familiar when the cohort starts.",
    },
    {
      label: "Visualize User Journey",
      description:
        "Take a first rough pass at the steps your user goes through today. It will be wrong in places — Milestone 1 is where you rebuild it properly.",
    },
    {
      label: "Schedule Interviews",
      description:
        "Line up your first conversations now. Aim for three booked before the program starts; booking always takes longer than you expect.",
    },
    {
      label: "Schedule Instructor Check-In",
      description:
        "Book your first check-in with your instructor so you begin the program with a slot already on the calendar.",
    },
  ],
  [
    {
      label: "Jobs to be Done",
      description:
        "For the journey you sketched in onboarding, name the job your user is actually hiring a solution to do at each step. Keep it to jobs you can observe today.",
    },
    {
      label: "Stakeholders",
      description:
        "List everyone who touches that journey — users, buyers, approvers, blockers — and note where each one enters and what they care about.",
    },
    {
      label: "Segments & Beachhead",
      description:
        "Group your users into segments and pick the one narrow beachhead you'll pursue first. Say out loud why the others can wait.",
    },
    {
      label: "Identify Pains/Gains",
      description:
        "Walk the journey step by step and name what your user is trying to fix at each one — what hurts today, and what a win would look like.",
    },
    {
      label: "Schedule Interviews",
      description:
        "Build a list of real people in your beachhead segment and turn it into booked calls. Names and dates, not job titles in the abstract.",
    },
  ],
  [
    {
      label: "Expand on Pains/Gains",
      description:
        "Go a level deeper on the pains and gains that matter most, answering the market questions on each one. Mark where every answer came from and how sure you are as you go — anything sourced only from your own assumptions is what interviews should target first.",
    },
    {
      label: "Hypothesis",
      description:
        "Pick out the answers you're treating as beliefs rather than facts. Those are the ones an interview can prove wrong, so they're what you'll build questions around.",
    },
    {
      label: "Interview Questions",
      description:
        "Turn each hypothesis into an open question about what people have already done, not what they would hypothetically do.",
    },
    {
      label: "Instructor Check-In",
      description:
        "Review the detailed journey and your question set with your instructor, and agree on which assumptions are the riskiest.",
    },
  ],
  [
    {
      label: "Hypotheses",
      description:
        "Write the beliefs your business depends on as testable statements, so an interview can actually prove one wrong.",
    },
    {
      label: "Interview Questions",
      description:
        "Draft open questions about what people have already done, not what they would hypothetically do. Tie each question back to a hypothesis.",
    },
    {
      label: "Instructor Check-in / Review Hypotheses & Questions",
      description:
        "Review your hypotheses and question set with your instructor before you spend real interviews on them.",
    },
    {
      label: "Practice Interview",
      description:
        "Run a full practice interview with someone outside your team. You're testing your questions, not their answers.",
    },
  ],
  [
    {
      label: "Conduct & Document 5",
      description:
        "Run your first five interviews and write each one up while it's fresh. Capture what they said, not your interpretation of it.",
    },
    {
      label: "Instructor Check-in / Review Interview Progress",
      description:
        "Share early findings with your instructor and adjust your questions before the next batch.",
    },
    {
      label: "Conduct & Document 5 more",
      description:
        "Run five more interviews with the sharpened questions, and watch for answers that repeat across people.",
    },
  ],
  [
    {
      label: "Conduct & Document 5+ more",
      description:
        "Keep interviewing until new conversations stop surprising you. Document each one the same way as the first.",
    },
    {
      label: "Instructor Check-in / Review Interview Progress",
      description:
        "Review the full body of interviews with your instructor and decide which hypotheses survived.",
    },
    {
      label: "Practice Presentation",
      description:
        "Rehearse your findings end to end. Lead with what you learned that you didn't expect.",
    },
    {
      label: "Final Presentation",
      description:
        "Present your journey, your evidence, and what you'd do next — with the interviews backing every claim.",
    },
  ],
];

/** All 24 sub-steps, milestone 0 first. */
export const SUB_STEPS: SubStepDef[] = SUB_STEP_CONTENT.flatMap(
  (subSteps, milestoneIndex) =>
    subSteps.map((subStep, subStepIndex) => {
      const milestone = milestoneIndex;
      const position = subStepIndex + 1;
      return {
        key: subStepKey(milestone, position),
        milestone,
        position,
        label: `${milestone}.${position} ${subStep.label}`,
        description: subStep.description,
      };
    }),
);

export function subStepsForMilestone(milestone: number): SubStepDef[] {
  return SUB_STEPS.filter((subStep) => subStep.milestone === milestone);
}

const SUB_STEP_BY_KEY = new Map(
  SUB_STEPS.map((subStep) => [subStep.key, subStep]),
);

/** The sub-step a key names, or null if it names none. */
export function subStepDef(key: string): SubStepDef | null {
  return SUB_STEP_BY_KEY.get(key) ?? null;
}

/** Numbered display label of a sub-step — e.g. "1.1 Jobs to be Done". Falls back
 *  to the bare key so a stale gate constant reads as itself rather than blank. */
export function subStepLabel(key: string): string {
  return subStepDef(key)?.label ?? key;
}

/**
 * Whether a sub-step gate is open. Two conditions, both required:
 *
 * 1. an instructor has activated the sub-step's milestone, and
 * 2. the team has ticked that sub-step's "Reviewed" toggle on the Instructions tab.
 *
 * The second alone isn't enough: the steps card for a milestone is readable
 * before the instructor opens it, so a team could otherwise tick 1.1 early and
 * unlock stakeholder work ahead of the cohort.
 *
 * `availableMilestones` of null/undefined means "gate nothing" — the convention
 * `JourneyMapTabs` and `MilestoneHeader` use for callers that show the strip
 * without gating on it. The /examples journey mirror is NOT one of them: it
 * passes the viewer's own access so its locks match the viewer's real page, and
 * only the sub-step half of the gate is example-scoped.
 */
export function isSubStepUnlocked(
  key: string,
  progress: Record<string, boolean>,
  availableMilestones: Set<number> | null | undefined,
): boolean {
  if (!availableMilestones) return true;

  const milestone = subStepDef(key)?.milestone;
  if (milestone == null || !availableMilestones.has(milestone)) return false;

  return progress[key] ?? false;
}
