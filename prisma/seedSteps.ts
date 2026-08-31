/**
 * Seeds the "steps" card — the default first card on every milestone's
 * Instructions tab, one item per sub-step (see lib/milestones.ts). Its reviewed
 * state is what marks sub-steps Done in the MilestoneHeader.
 *
 * Runs as part of `prisma/seed.ts`, and standalone when you only want to refresh
 * the sub-step checklist without re-seeding (and so wiping the reviews of) the
 * other Get Started cards:
 *
 *   npx tsx --env-file=.env prisma/seedSteps.ts
 *
 * The flag is not optional: nothing here imports dotenv, so without it
 * DATABASE_URL has to already be exported in the shell.
 *
 * Run this after any label or description edit in lib/milestones.ts. The header
 * strip renders from that constant directly, but the Instructions steps card and
 * the milestone steps dialog read GetStartedItem.title — so until this runs the
 * two disagree.
 *
 * The sync is in-place — cards/items are updated, never deleted and recreated —
 * because deleting cascades through GetStartedReview and would wipe every
 * startup's milestone progress. Items are matched on `sub_step`.
 */
import { PrismaClient } from "../lib/generated/prisma";
import { MILESTONE_NUMBERS, subStepsForMilestone } from "../lib/milestones";

// Title of the default first card on every milestone's Instructions tab. The
// number is baked in so the card names its milestone on the Instructions tab,
// where several milestones' worth of cards look otherwise identical.
export const stepsCardTitle = (milestone: number) =>
  `Milestone #${milestone} Steps`;

export async function seedStepsCards(prisma: PrismaClient) {
  for (const milestone of MILESTONE_NUMBERS) {
    const subSteps = subStepsForMilestone(milestone);

    const existing = await prisma.getStartedCard.findFirst({
      where: { milestone, type: "steps" },
      include: { items: true },
    });

    if (!existing) {
      await prisma.getStartedCard.create({
        data: {
          milestone,
          type: "steps",
          title: stepsCardTitle(milestone),
          order: 0,
          items: {
            create: subSteps.map((subStep, index) => ({
              title: subStep.label,
              description: subStep.description,
              sub_step: subStep.position,
              order: index,
            })),
          },
        },
      });
      continue;
    }

    await prisma.getStartedCard.update({
      where: { id: existing.id },
      data: { title: stepsCardTitle(milestone), order: 0 },
    });

    for (const [index, subStep] of subSteps.entries()) {
      const item = existing.items.find(
        (candidate) => candidate.sub_step === subStep.position,
      );

      if (item) {
        await prisma.getStartedItem.update({
          where: { id: item.id },
          data: {
            title: subStep.label,
            description: subStep.description,
            order: index,
          },
        });
      } else {
        await prisma.getStartedItem.create({
          data: {
            card_id: existing.id,
            title: subStep.label,
            description: subStep.description,
            sub_step: subStep.position,
            order: index,
          },
        });
      }
    }

    // Drop items whose sub-step no longer exists in the curriculum.
    const positions = subSteps.map((subStep) => subStep.position);
    await prisma.getStartedItem.deleteMany({
      where: {
        card_id: existing.id,
        OR: [{ sub_step: null }, { sub_step: { notIn: positions } }],
      },
    });
  }
}

// Standalone entry point — skipped when imported by prisma/seed.ts.
if (process.argv[1]?.endsWith("seedSteps.ts")) {
  const prisma = new PrismaClient();

  seedStepsCards(prisma)
    .then(() => console.log("Synced steps cards for milestones 0-5."))
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
