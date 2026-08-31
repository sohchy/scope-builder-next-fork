/**
 * One-off: drop "2.2 Source & Confidence Score" and pull the rest of Milestone 2
 * up one position, carrying every startup's progress with them.
 *
 *   npx tsx --env-file=.env scripts/shiftMilestone2SubSteps.ts
 *
 * Run this BEFORE `prisma/seedSteps.ts`. The seed matches items on `sub_step`
 * and rewrites their title/description in place, so on its own it would leave
 * each review attached to whatever now sits at that position — a team that had
 * ticked "Source & Confidence" would read as having ticked "Hypothesis", and the
 * old position 5 would be deleted along with its review.
 *
 * Reviews hang off `item_id`, not off the position, so moving `sub_step` on the
 * item rows is what carries progress: 2.3 Hypothesis keeps its reviews as it
 * becomes 2.2, and so on. Only the removed step's reviews are lost, which is the
 * point.
 *
 * Idempotent: a card is skipped unless its position-2 item is still the old
 * "Source & Confidence Score", so a second run is a no-op.
 */
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

/** Title fragment identifying the sub-step being removed. */
const REMOVED_TITLE_FRAGMENT = "Source & Confidence";
const REMOVED_POSITION = 2;

async function main() {
  const cards = await prisma.getStartedCard.findMany({
    where: { milestone: 2, type: "steps" },
    include: { items: true },
  });

  for (const card of cards) {
    const removed = card.items.find(
      (item) =>
        item.sub_step === REMOVED_POSITION &&
        item.title.includes(REMOVED_TITLE_FRAGMENT),
    );

    if (!removed) {
      console.log(
        `Card ${card.id}: no "${REMOVED_TITLE_FRAGMENT}" at position ${REMOVED_POSITION} — already shifted, skipping.`,
      );
      continue;
    }

    const droppedReviews = await prisma.getStartedReview.count({
      where: { item_id: removed.id },
    });

    // Cascades through GetStartedReview — the only progress this migration loses.
    await prisma.getStartedItem.delete({ where: { id: removed.id } });

    // Ascending, so each item lands on a position the one before it just left.
    const shifted = card.items
      .filter(
        (item) => item.sub_step != null && item.sub_step > REMOVED_POSITION,
      )
      .sort((a, b) => a.sub_step! - b.sub_step!);

    for (const item of shifted) {
      await prisma.getStartedItem.update({
        where: { id: item.id },
        data: { sub_step: item.sub_step! - 1, order: item.sub_step! - 2 },
      });
    }

    console.log(
      `Card ${card.id}: removed "${removed.title}" (${droppedReviews} review(s) dropped), shifted ${shifted.length} item(s) up one.`,
    );
  }

  console.log(
    `Done across ${cards.length} Milestone 2 steps card(s). Now run: npx tsx --env-file=.env prisma/seedSteps.ts`,
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
