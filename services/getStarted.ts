"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { subStepKey } from "@/lib/milestones";
import {
  MEDIA_CARD_TYPES,
  type GetStartedCardFormValues,
  type StepsCardFormValues,
} from "@/schemas/getStarted";

export type GetStartedCardWithData = Prisma.GetStartedCardGetPayload<{
  include: { items: { include: { reviews: true } }; reviews: true };
}>;

export async function getGetStartedCards(milestone: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  // Card content is global curriculum (same for every startup); only the
  // reviewed state is per-org, so `reviews` is scoped to the active org.
  const cards = await prisma.getStartedCard.findMany({
    where: { milestone },
    orderBy: { order: "asc" },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: { reviews: { where: { org_id: orgId } } },
      },
      reviews: { where: { org_id: orgId } },
    },
  });

  return cards;
}

/**
 * Reviewed state of every sub-step item, keyed by sub-step key ("1.1", "1.2"…),
 * for the active org. Covers all 5 milestones in one query so the milestone
 * header can show progress for the blocks that aren't expanded.
 */
export async function getSubStepProgress(): Promise<Record<string, boolean>> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const items = await prisma.getStartedItem.findMany({
    where: { sub_step: { not: null } },
    select: {
      sub_step: true,
      card: { select: { milestone: true } },
      reviews: { where: { org_id: orgId }, select: { reviewed: true } },
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

/**
 * The cross-org twin of `getSubStepProgress`, for the instructor-facing leaderboard:
 * every startup's sub-step progress in one query, keyed org id → sub-step key.
 *
 * Orgs with nothing reviewed are absent from the map; callers fall back to `{}`.
 */
export async function getAllSubStepProgress(): Promise<
  Record<string, Record<string, boolean>>
> {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const items = await prisma.getStartedItem.findMany({
    where: { sub_step: { not: null } },
    select: {
      sub_step: true,
      card: { select: { milestone: true } },
      // `example_number: null` matters here — the /examples sets write their rows
      // into this same table and would otherwise count as real progress.
      reviews: {
        where: { example_number: null, reviewed: true },
        select: { org_id: true },
      },
    },
  });

  const byOrg: Record<string, Record<string, boolean>> = {};

  for (const item of items) {
    if (item.sub_step == null) continue;

    const key = subStepKey(item.card.milestone, item.sub_step);

    for (const review of item.reviews) {
      if (!byOrg[review.org_id]) byOrg[review.org_id] = {};
      byOrg[review.org_id][key] = true;
    }
  }

  return byOrg;
}

export async function setCardReviewed(cardId: number, reviewed: boolean) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.getStartedReview.upsert({
    where: {
      org_id_card_id: {
        org_id: orgId,
        card_id: cardId,
      },
    },
    create: {
      org_id: orgId,
      card_id: cardId,
      reviewed,
    },
    update: {
      reviewed,
    },
  });

  revalidatePath("/user-journey-map");
}

/* -------------------------------------------------------------------------- */
/* Admin panel authoring                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Every card across every milestone, for the admin table. Cards are global
 * curriculum, so this is not org-scoped and skips the per-org `reviews` include.
 */
export async function getAllGetStartedCards() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  return prisma.getStartedCard.findMany({
    orderBy: [{ milestone: "asc" }, { order: "asc" }],
  });
}

export async function createGetStartedCard(values: GetStartedCardFormValues) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  await prisma.getStartedCard.create({
    data: {
      milestone: values.milestone,
      type: values.type,
      title: values.title,
      body: values.body?.trim() || null,
      url: MEDIA_CARD_TYPES.includes(values.type)
        ? (values.url?.trim() ?? null)
        : null,
      order: values.order,
    },
  });

  revalidatePath("/admin-panel");
  revalidatePath("/user-journey-map");
}

export async function updateGetStartedCard(
  cardId: number,
  values: GetStartedCardFormValues,
) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const card = await prisma.getStartedCard.findUnique({
    where: { id: cardId },
    select: { type: true },
  });

  if (!card) throw new Error(`Get Started card ${cardId} not found.`);

  // "steps" cards are owned by prisma/seedSteps.ts — their items carry the
  // sub_step positions that drive milestone progress. The admin table hides the
  // edit action for them; this is the backstop.
  if (card.type === "steps") {
    throw new Error(
      "The Milestone Steps card is managed by the seed and cannot be edited here.",
    );
  }

  await prisma.getStartedCard.update({
    where: { id: cardId },
    data: {
      milestone: values.milestone,
      type: values.type,
      title: values.title,
      body: values.body?.trim() || null,
      url: MEDIA_CARD_TYPES.includes(values.type)
        ? (values.url?.trim() ?? null)
        : null,
      order: values.order,
    },
  });

  revalidatePath("/admin-panel");
  revalidatePath("/user-journey-map");
}

/**
 * Partial edit of a seeded "steps" card: only the intro text and the optional
 * video shown above the sub-step checklist. Milestone, title, order and the
 * items themselves stay owned by prisma/seedSteps.ts — that sync only writes
 * `title` and `order`, so what's set here survives a re-seed.
 */
export async function updateStepsCard(
  cardId: number,
  values: StepsCardFormValues,
) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const card = await prisma.getStartedCard.findUnique({
    where: { id: cardId },
    select: { type: true },
  });

  if (!card) throw new Error(`Get Started card ${cardId} not found.`);

  if (card.type !== "steps") {
    throw new Error(
      `Card ${cardId} is not a steps card — use updateGetStartedCard instead.`,
    );
  }

  await prisma.getStartedCard.update({
    where: { id: cardId },
    data: {
      body: values.body?.trim() || null,
      url: values.url?.trim() || null,
    },
  });

  revalidatePath("/admin-panel");
  revalidatePath("/user-journey-map");
}

export async function setItemReviewed(itemId: number, reviewed: boolean) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.getStartedReview.upsert({
    where: {
      org_id_item_id: {
        org_id: orgId,
        item_id: itemId,
      },
    },
    create: {
      org_id: orgId,
      item_id: itemId,
      reviewed,
    },
    update: {
      reviewed,
    },
  });

  revalidatePath("/user-journey-map");
}
