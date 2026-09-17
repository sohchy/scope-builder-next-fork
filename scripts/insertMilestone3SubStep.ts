/**
 * One-off: open position 2 of Milestone 3 for the new "3.2 Ad-Lib Value Prop" by
 * pushing the rest of the milestone down one, carrying every startup's progress
 * with them.
 *
 *   npx tsx --env-file=.env scripts/insertMilestone3SubStep.ts
 *
 * Run this BEFORE `prisma/seedSteps.ts`. The seed matches items on `sub_step`
 * and rewrites their title/description in place, so on its own it would leave
 * each review attached to whatever now sits at that position — a team that had
 * ticked "3.2 Interview Questions" would read as having ticked the new "3.2
 * Ad-Lib Value Prop", and so on down the milestone.
 *
 * Reviews hang off `item_id`, not off the position, so moving `sub_step` on the
 * item rows is what carries progress: 3.2 Interview Questions keeps its reviews
 * as it becomes 3.3. Nothing is created here — the seed creates the new item,
 * because position 2 no longer matches anything.
 *
 * `order` is left alone: `seedStepsCards` rewrites it from the curriculum order
 * for every item it matches.
 *
 * Mirror of scripts/shiftMilestone2SubSteps.ts, which removes a sub-step instead
 * of inserting one — which is why that one walks the items ascending and this
 * one walks them descending.
 *
 * Idempotent, and safe in the window between this script and the seed: a card is
 * shifted only while position 2 is still the sub-step being displaced. Once it
 * is empty (shifted, not yet seeded) or already holds the new sub-step (shifted
 * and seeded), the card is skipped. Guarding on what is being *moved* rather
 * than on what is being inserted is what makes the intermediate state safe —
 * guarding on the new title alone would shift a second time before the seed ran.
 *
 * That same guard catches the ordering mistake this script exists to prevent: if
 * the seed runs first it renames position 2 in place, so the displaced title is
 * gone and every card is skipped with a warning rather than silently shifted on
 * top of already-wrong data.
 */
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

const INSERTED_POSITION = 2;

/** Title fragment identifying the sub-step being inserted. */
const INSERTED_TITLE_FRAGMENT = "Ad-Lib Value Prop";

/** Title fragment of the sub-step currently at `INSERTED_POSITION` — the one the
 *  insert displaces, and the only state from which shifting is correct. */
const DISPLACED_TITLE_FRAGMENT = "Interview Questions";

async function main() {
  const cards = await prisma.getStartedCard.findMany({
    where: { milestone: 3, type: "steps" },
    include: { items: true },
  });

  for (const card of cards) {
    const displaced = card.items.find(
      (item) => item.sub_step === INSERTED_POSITION,
    );

    if (!displaced?.title.includes(DISPLACED_TITLE_FRAGMENT)) {
      const state = !displaced
        ? `position ${INSERTED_POSITION} is empty`
        : `position ${INSERTED_POSITION} is "${displaced.title}"`;

      // Position 2 holding the new sub-step is the ordinary already-done case.
      // Anything else there means the seed got in first and renamed it, so the
      // shift can no longer be done from the titles — say so rather than skip
      // quietly.
      if (displaced?.title.includes(INSERTED_TITLE_FRAGMENT)) {
        console.log(`Card ${card.id}: ${state} — already shifted, skipping.`);
      } else {
        console.warn(
          `Card ${card.id}: ${state}, expected "${DISPLACED_TITLE_FRAGMENT}" — skipping. If seedSteps.ts ran before this script, milestone 3 progress is mis-pointed and needs fixing by hand.`,
        );
      }
      continue;
    }

    // Descending, so each item lands on a position the one after it just left.
    const shifted = card.items
      .filter(
        (item) => item.sub_step != null && item.sub_step >= INSERTED_POSITION,
      )
      .sort((a, b) => b.sub_step! - a.sub_step!);

    for (const item of shifted) {
      await prisma.getStartedItem.update({
        where: { id: item.id },
        data: { sub_step: item.sub_step! + 1 },
      });
    }

    console.log(
      `Card ${card.id}: shifted ${shifted.length} item(s) down one, freeing position ${INSERTED_POSITION}.`,
    );
  }

  console.log(
    `Done across ${cards.length} Milestone 3 steps card(s). Now run: npx tsx --env-file=.env prisma/seedSteps.ts`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
