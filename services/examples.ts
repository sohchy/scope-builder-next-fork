"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import liveblocks from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import { subStepKey } from "@/lib/milestones";
import type {
  StakeholderRow as PrismaStakeholderRow,
  MarketSegment as PrismaMarketSegment,
  MarketSegmentNote as PrismaMarketSegmentNote,
  Prisma,
} from "@/lib/generated/prisma";

// Re-exported as type aliases (not an `export type {}` list) — a "use server"
// file only allows async-function value exports, and Next's checker doesn't
// erase re-export lists before enforcing that. Alias declarations are erased.
export type ExampleMarketData = {
  stakeholderRows: PrismaStakeholderRow[];
  segments: PrismaMarketSegment[];
  note: PrismaMarketSegmentNote | null;
};

export type ExampleGetStartedCard = Prisma.GetStartedCardGetPayload<{
  include: { items: { include: { reviews: true } }; reviews: true };
}>;

// Example pages are GLOBAL: they require a signed-in user but are NOT scoped by
// org, so — unlike the real services — we never redirect to /pick-startup. Data
// is selected by `example_number` alone.
async function requireUser() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");
}

// Mirror of `generateProblemJourneyRoom` (services/problemJourney.ts) without the
// org guard. Only initializes empty storage when the room has none, so it never
// clobbers content copied in by scripts/copyExample.ts.
export async function generateExampleProblemJourneyRoom(roomId: string) {
  await requireUser();

  await liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] });

  const roomStorage: any = await liveblocks.getStorageDocument(roomId);

  if (Object.keys(roomStorage.data).length === 0) {
    await liveblocks.initializeStorageDocument(roomId, {
      liveblocksType: "LiveObject",
      data: {
        journeyNodes: { liveblocksType: "LiveList", data: [] },
        journeyEdges: { liveblocksType: "LiveList", data: [] },
      },
    });
  }
}

export async function getExampleJobTitles(
  exampleNumber: number,
): Promise<string[]> {
  await requireUser();

  const jobTitles = await prisma.stakeholderJobTitles.findMany({
    where: { example_number: exampleNumber },
  });

  return jobTitles.map((jobTitle) => jobTitle.name);
}

export async function getExampleMarketData(
  exampleNumber: number,
): Promise<ExampleMarketData> {
  await requireUser();

  const [stakeholderRows, segments, note] = await Promise.all([
    prisma.stakeholderRow.findMany({
      where: { example_number: exampleNumber },
      orderBy: { order: "asc" },
    }),
    prisma.marketSegment.findMany({
      where: { example_number: exampleNumber },
      orderBy: { order: "asc" },
    }),
    prisma.marketSegmentNote.findFirst({
      where: { example_number: exampleNumber },
    }),
  ]);

  return { stakeholderRows, segments, note };
}

export async function getExampleGetStartedCards(
  milestone: number,
  exampleNumber: number,
): Promise<ExampleGetStartedCard[]> {
  await requireUser();

  // Card/item content is global curriculum (shared with the real page); only the
  // reviewed state is example-scoped, so `reviews` filters on example_number.
  const cards = await prisma.getStartedCard.findMany({
    where: { milestone },
    orderBy: { order: "asc" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { reviews: { where: { example_number: exampleNumber } } },
      },
      reviews: { where: { example_number: exampleNumber } },
    },
  });

  return cards;
}

/** Example-set mirror of `getSubStepProgress` (services/getStarted.ts). */
export async function getExampleSubStepProgress(
  exampleNumber: number,
): Promise<Record<string, boolean>> {
  await requireUser();

  const items = await prisma.getStartedItem.findMany({
    where: { sub_step: { not: null } },
    select: {
      sub_step: true,
      card: { select: { milestone: true } },
      reviews: {
        where: { example_number: exampleNumber },
        select: { reviewed: true },
      },
    },
  });

  const progress: Record<string, boolean> = {};

  for (const item of items) {
    if (item.sub_step == null) continue;
    progress[subStepKey(item.card.milestone, item.sub_step)] =
      item.reviews.some((review) => review.reviewed);
  }

  return progress;
}

export async function getExampleParticipantTags(
  exampleNumber: number,
): Promise<string[]> {
  await requireUser();

  const tags = await prisma.participantTag.findMany({
    where: { example_number: exampleNumber },
  });

  return tags.map((tag) => tag.name);
}

export async function getExampleParticipants(exampleNumber: number) {
  await requireUser();

  const participants = await prisma.participant.findMany({
    where: { example_number: exampleNumber },
    orderBy: [{ scheduled_date: "asc" }, { name: "asc" }],
  });

  return participants;
}

export async function getExampleInterviewMilestonesWithProgress(
  exampleNumber: number,
) {
  await requireUser();

  const [milestones, documentedCount, payerDocumentedCount] = await Promise.all(
    [
      prisma.interviewMilestone.findMany({
        where: { example_number: exampleNumber },
        orderBy: { date: "asc" },
      }),
      prisma.participant.count({
        where: { example_number: exampleNumber, status: "documented" },
      }),
      prisma.participant.count({
        where: {
          example_number: exampleNumber,
          status: "documented",
          role: { contains: "Payer" },
        },
      }),
    ],
  );

  return { milestones, documentedCount, payerDocumentedCount };
}
