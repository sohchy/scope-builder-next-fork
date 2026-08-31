/**
 * One-off: move the Instructions cards to the new single-payload type set.
 *
 *   npx tsx --env-file=.env scripts/migrateGetStartedTypes.ts
 *
 * Cards used to come in four shapes: "text" (one body + one card-level Reviewed
 * mark), and "links" / "videos" / "steps" (a list of GetStartedItems, each with
 * its own mark). Only "steps" keeps the list shape. Everything an admin authors
 * is now one card = one payload = one Reviewed mark:
 *
 *   text            → paragraph   (body and card-level reviews carry over)
 *   links / videos  → deleted     (re-created one card per link/video in the
 *                                  admin panel; their per-item reviews are lost)
 *
 * "steps" cards are never touched here — deleting one cascades through
 * GetStartedReview and would wipe every startup's milestone progress. See the
 * header of prisma/seedSteps.ts.
 */
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const renamed = await prisma.getStartedCard.updateMany({
    where: { type: "text" },
    data: { type: "paragraph" },
  });

  const removed = await prisma.getStartedCard.deleteMany({
    where: { type: { in: ["links", "videos"] } },
  });

  const remaining = await prisma.getStartedCard.groupBy({
    by: ["type"],
    _count: { _all: true },
  });

  console.log(`Renamed ${renamed.count} "text" card(s) to "paragraph".`);
  console.log(`Deleted ${removed.count} "links"/"videos" card(s).`);
  console.log("Remaining cards by type:");
  for (const row of remaining) {
    console.log(`  ${row.type}: ${row._count._all}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
