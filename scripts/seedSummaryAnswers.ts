/**
 * Dev only: fill an org's interview answers with realistically uneven text so the
 * Interview Summary tab can be judged with something other than a wall of "test".
 *
 *   npx tsx --env-file=.env scripts/seedSummaryAnswers.ts            # lists orgs
 *   npx tsx --env-file=.env scripts/seedSummaryAnswers.ts <orgId>
 *
 * Overwrites, on purpose:
 *   - every ProblemInterviewAnswer value for the org — the whole point is that the
 *     answers vary in length, which is what the masonry layout is judged on
 *   - every Participant.scheduled_date for the org — spread over the past weeks so
 *     the "By interview date" sort and the date beside each name have something to
 *     show
 *
 * Never touches example sets (`example_number` is always null here), and never
 * touches questions, hypotheses or the summaries the team has written.
 *
 * Re-runnable: each run reshuffles from a fresh seed, so run it again to get a
 * different spread of lengths.
 */
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

/** Share of question/interviewee pairs deliberately left unanswered, so the
 *  "No answer" count is not always zero. */
const UNANSWERED_SHARE = 0.15;

/** Answer texts by rough size, so a column mixes one-word replies with paragraphs —
 *  the case the pinterest layout exists for. */
const SHORT = [
  "Yes",
  "No",
  "Sometimes",
  "Not really",
  "Every day",
  "Absolutely",
  "Rarely",
  "Twice a week",
];

const MEDIUM = [
  "Yes, this happens fairly often — usually first thing in the morning.",
  "I agree with this, though it is not the biggest problem we have.",
  "We worked around it by keeping a second tab open all day.",
  "It costs me maybe ten minutes a day, which adds up over a week.",
  "Honestly I had stopped noticing it until you asked.",
  "My team complains about this more than I do.",
];

const LONG = [
  "This is the single thing that slows us down most. We have three people on the team who each keep their own spreadsheet because nobody trusts the one in the app, and reconciling them on Friday takes the better part of an afternoon. I have raised it twice with our account manager.",
  "I would not say it stops us working, but it definitely shapes how we work. We batch everything into one sitting on Monday rather than doing it as it comes in, because the cost of getting back into the tool is high enough that dipping in and out is not worth it. If that friction went away I think the habit would change on its own.",
  "The icon thing is real — I have absolutely clicked into the wrong app more than once, usually when I am moving quickly between meetings. It is a small thing but it happens often enough that I now keep the app pinned in a different position on my dock just to avoid it, which feels like the wrong fix.",
  "We evaluated two competitors last quarter, largely because of this. Neither was better overall, so we stayed, but the fact that it got as far as a formal comparison should tell you how much it bothers the people who use it daily.",
];

/** Weighted so most answers are short-to-medium and long ones are the exception —
 *  a board where every card is a paragraph does not test the packing either. */
function pickAnswerText(random: () => number): string {
  const roll = random();
  const pool = roll < 0.45 ? SHORT : roll < 0.8 ? MEDIUM : LONG;
  return pool[Math.floor(random() * pool.length)];
}

/** Small deterministic-per-run PRNG so a single run is self-consistent while
 *  successive runs differ. Math.random would do, but this prints its seed. */
function makeRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

async function listOrgs() {
  const groups = await prisma.participant.groupBy({
    by: ["org_id"],
    where: { example_number: null },
    _count: { _all: true },
  });

  if (groups.length === 0) {
    console.log("No participants found in any org.");
    return;
  }

  console.log("Pass one of these org ids:\n");
  for (const group of groups) {
    console.log(`  ${group.org_id}  (${group._count._all} interviewees)`);
  }
}

async function main() {
  const orgId = process.argv[2];
  if (!orgId) {
    await listOrgs();
    return;
  }

  const seed = Date.now();
  const random = makeRandom(seed);

  const [participants, questions] = await Promise.all([
    prisma.participant.findMany({
      where: { org_id: orgId, example_number: null },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.problemInterviewQuestion.findMany({
      where: { org_id: orgId, example_number: null, title: { not: "" } },
      select: { id: true, response_type: true, options: true },
    }),
  ]);

  if (participants.length === 0 || questions.length === 0) {
    console.log(
      `Nothing to seed for ${orgId}: ${participants.length} interviewees, ${questions.length} authored questions.`,
    );
    return;
  }

  // Interview dates walk backwards from yesterday, one every couple of days, so the
  // date sort has a clear order and the labels span more than one month.
  const now = Date.now();
  const DAY = 24 * 60 * 60 * 1000;
  await Promise.all(
    participants.map((participant, i) =>
      prisma.participant.update({
        where: { id: participant.id },
        data: { scheduled_date: new Date(now - (i * 2 + 1) * DAY) },
      }),
    ),
  );

  let written = 0;
  let skipped = 0;

  for (const question of questions) {
    for (const participant of participants) {
      // A missing answer is a deleted row, not an empty one: the summary counts
      // non-empty answers, and an empty row would read the same but linger.
      if (random() < UNANSWERED_SHARE) {
        await prisma.problemInterviewAnswer.deleteMany({
          where: { question_id: question.id, participant_id: participant.id },
        });
        skipped += 1;
        continue;
      }

      let value: string;
      if (question.response_type === "scale") {
        value = String(1 + Math.floor(random() * 5));
      } else if (question.response_type === "dropdown") {
        // Stored as the option's id; the summary resolves it back to the label.
        const options = (question.options ?? []) as unknown as {
          id: string;
          label: string;
        }[];
        if (options.length === 0) {
          skipped += 1;
          continue;
        }
        value = options[Math.floor(random() * options.length)].id;
      } else {
        value = pickAnswerText(random);
      }

      await prisma.problemInterviewAnswer.upsert({
        where: {
          question_id_participant_id: {
            question_id: question.id,
            participant_id: participant.id,
          },
        },
        create: {
          org_id: orgId,
          question_id: question.id,
          participant_id: participant.id,
          value,
        },
        update: { value },
      });
      written += 1;
    }
  }

  console.log(
    `Seeded ${orgId} (seed ${seed}): ${participants.length} interviewees x ${questions.length} questions ` +
      `-> ${written} answers written, ${skipped} left unanswered.`,
  );
  console.log(`Stamped ${participants.length} interview dates.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
