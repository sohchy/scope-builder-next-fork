import { PrismaClient } from "../lib/generated/prisma";
import { seedStepsCards } from "./seedSteps";

const prisma = new PrismaClient();

async function main() {
  // Get Started cards are global curriculum (same for every startup); the
  // per-org "reviewed" state lives in GetStartedReview and is created on toggle.
  // Re-seed the content cards cleanly so this script is idempotent — but never
  // the "steps" cards, whose reviews are milestone progress (see seedStepsCards).
  await prisma.getStartedCard.deleteMany({ where: { type: { not: "steps" } } });

  await seedStepsCards(prisma);

  // Every card below is one payload with a single card-level Reviewed mark:
  // "paragraph" (body only), "image" and "video" (url + optional body). Admins
  // author these in /admin-panel; this seed just gives milestones 1-2 content.

  // ---- Milestone 1 ----
  await prisma.getStartedCard.create({
    data: {
      milestone: 1,
      type: "paragraph",
      title: "How to talk to Humans",
      order: 1,
      body:
        "A beachhead chart is a strategic tool used to visualize and prioritize " +
        "market opportunities for a product or service. It helps businesses " +
        'identify their initial target market segment, or "beachhead," where ' +
        "they can gain traction before expanding further.",
    },
  });

  await prisma.getStartedCard.create({
    data: {
      milestone: 1,
      type: "video",
      title: "The 3 steps to building a user journey map",
      order: 2,
      url: "https://www.youtube.com/watch?v=mSxpVRo3BLg",
      body: "A short walkthrough of the mapping process end to end.",
    },
  });

  await prisma.getStartedCard.create({
    data: {
      milestone: 1,
      type: "video",
      title: "Building journey maps in 3 minutes",
      order: 3,
      url: "https://www.youtube.com/watch?v=W2xLPcmXaSE",
      body: "The condensed version, if you only have a few minutes.",
    },
  });

  // ---- Milestone 2 ----
  await prisma.getStartedCard.create({
    data: {
      milestone: 2,
      type: "paragraph",
      title: "Defining your beachhead",
      order: 1,
      body:
        "By mapping out potential customers, competitors, and key metrics, this " +
        "chart allows teams to focus their efforts on the most promising areas, " +
        "ensuring a more effective and efficient approach to market entry.",
    },
  });

  console.log(
    "Seeded steps cards for milestones 0-5 and Get Started content for milestones 1 and 2.",
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
