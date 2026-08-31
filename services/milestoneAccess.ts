"use server";

import { after } from "next/server";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { checkRole } from "@/lib/auth";
import { sendMilestoneReviewedEmail } from "@/services/milestoneEmails";
import {
  FIRST_MILESTONE,
  LAST_MILESTONE,
  MILESTONE_NUMBERS,
  ALWAYS_AVAILABLE_MILESTONE,
  type MilestoneAccessState,
  type MilestoneReviewInput,
  type MilestoneReviewResult,
} from "@/lib/milestones";

/**
 * Unlike most services here, milestone access is administered from `/startups`
 * for *other* startups, so these actions take an explicit `orgId` instead of
 * reading the caller's active org from `auth()` — same shape as the cross-org
 * reads in `services/participants.ts` (`getAllParticipants`).
 */

/**
 * Access for every startup that has rows, keyed by org id. Orgs with no rows are
 * absent from the map; callers fall back to `defaultMilestoneAccess()`.
 */
export async function getAllMilestoneAccess(): Promise<
  Record<string, MilestoneAccessState[]>
> {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const rows = await prisma.milestoneAccess.findMany();

  const byOrg: Record<string, MilestoneAccessState[]> = {};

  for (const row of rows) {
    if (!byOrg[row.org_id]) {
      // Seed all 6 slots so consumers can index by milestone without holes.
      byOrg[row.org_id] = MILESTONE_NUMBERS.map((milestone) => ({
        milestone,
        available: milestone === ALWAYS_AVAILABLE_MILESTONE,
        submittedAt: null,
        reviewedAt: null,
      }));
    }

    // Slots are seeded from MILESTONE_NUMBERS, so the index is the milestone.
    const slot = byOrg[row.org_id][row.milestone];

    if (!slot) continue;

    slot.available =
      row.milestone === ALWAYS_AVAILABLE_MILESTONE ? true : row.available;
    slot.submittedAt = row.submitted_at;
    slot.reviewedAt = row.reviewed_at;
  }

  return byOrg;
}

/**
 * Whether the active startup has this milestone unlocked. Same read rule as
 * `getAllMilestoneAccess`: milestone 0 is always on, a missing row means locked.
 *
 * Admins and mentors browse without an active org — milestone access is a
 * startup-progression concept, so nothing is gated for them.
 */
export async function isMilestoneAvailable(
  milestone: number,
): Promise<boolean> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) return true;

  if (milestone === ALWAYS_AVAILABLE_MILESTONE) return true;

  const row = await prisma.milestoneAccess.findUnique({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    select: { available: true },
  });

  return row?.available ?? false;
}

/**
 * Every milestone number the active startup has unlocked. The set form of
 * `isMilestoneAvailable` — one round trip for callers that gate several features
 * at once, like the journey canvas.
 *
 * Availability is toggled per milestone from /startups and is *not* guaranteed
 * contiguous, so this is a set rather than a "highest reached" number. Same read
 * rules as `isMilestoneAvailable`: milestone 0 is always on, a missing row means
 * locked, and admins/mentors browsing without an active org get everything.
 */
export async function getAvailableMilestones(): Promise<number[]> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) return [...MILESTONE_NUMBERS];

  const rows = await prisma.milestoneAccess.findMany({
    where: { org_id: orgId, available: true },
    select: { milestone: true },
  });

  const available = new Set(rows.map((row) => row.milestone));

  available.add(ALWAYS_AVAILABLE_MILESTONE);

  return MILESTONE_NUMBERS.filter((milestone) => available.has(milestone));
}

/**
 * Milestone numbers the active startup has been signed off on, for the header to
 * paint green. Admins and mentors browse without an active org and the /examples
 * pages have no org at all — both get an empty list, i.e. nothing signed off.
 */
export async function getReviewedMilestones(): Promise<number[]> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) return [];

  const rows = await prisma.milestoneAccess.findMany({
    where: { org_id: orgId, reviewed_at: { not: null } },
    select: { milestone: true },
  });

  return rows.map((row) => row.milestone);
}

/**
 * When the active startup submitted this milestone, or null if it hasn't.
 *
 * Unlike the rest of this module these two actions are the startup acting on its
 * *own* milestone from the Instructions tab, so they read the active org from
 * `auth()` rather than taking an explicit `orgId`.
 */
export async function getMilestoneSubmission(
  milestone: number,
): Promise<Date | null> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const row = await prisma.milestoneAccess.findUnique({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    select: { submitted_at: true },
  });

  return row?.submitted_at ?? null;
}

/**
 * Mark this milestone submitted for the active startup. Submitting is one-way —
 * the Instructions card disables the button afterwards — so an existing
 * `submitted_at` is left alone rather than being bumped to now.
 */
export async function submitMilestone(milestone: number): Promise<Date> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  if (milestone < FIRST_MILESTONE || milestone > LAST_MILESTONE) {
    throw new Error(`Invalid milestone: ${milestone}`);
  }

  const existing = await prisma.milestoneAccess.findUnique({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    select: { submitted_at: true },
  });

  if (existing?.submitted_at) return existing.submitted_at;

  const submittedAt = new Date();

  await prisma.milestoneAccess.upsert({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    // Milestone 0 has no row until now for most startups; `available` is forced
    // true for it on read (see getAllMilestoneAccess), so false here is fine.
    create: {
      org_id: orgId,
      milestone,
      available: milestone === ALWAYS_AVAILABLE_MILESTONE,
      submitted_at: submittedAt,
    },
    update: { submitted_at: submittedAt },
  });

  revalidatePath("/startups");
  revalidatePath("/user-journey-map");

  return submittedAt;
}

/**
 * The instructor-side counterpart to `submitMilestone`: signs a startup's milestone
 * off, records what the instructor wrote in the review dialog, optionally opens the
 * next milestone, and mails the startup's team. Cross-org like
 * `setMilestoneAvailability`, so it takes an explicit `orgId` rather than reading
 * the caller's active org.
 *
 * One-way, same as submitting — an existing `reviewed_at` short-circuits the whole
 * thing: no notes overwritten, no second unlock, no duplicate email. The green icon
 * on /startups is inert, so in practice this only catches a double submit.
 */
export async function reviewMilestone(
  orgId: string,
  milestone: number,
  input: MilestoneReviewInput = {},
): Promise<MilestoneReviewResult> {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (milestone < FIRST_MILESTONE || milestone > LAST_MILESTONE) {
    throw new Error(`Invalid milestone: ${milestone}`);
  }

  const canReview = (await checkRole("admin")) || (await checkRole("mentor"));

  if (!canReview) {
    throw new Error("Only an admin or mentor can review a milestone.");
  }

  const existing = await prisma.milestoneAccess.findUnique({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    select: { reviewed_at: true, review_notes: true },
  });

  if (existing?.reviewed_at) {
    return {
      reviewedAt: existing.reviewed_at,
      notes: existing.review_notes,
      unlockedMilestone: null,
    };
  }

  const reviewedAt = new Date();
  const notes = input.notes?.trim() || null;
  // Milestone 5 has no successor to open.
  const unlockedMilestone =
    input.unlockNext && milestone < LAST_MILESTONE ? milestone + 1 : null;

  await prisma.milestoneAccess.upsert({
    where: { org_id_milestone: { org_id: orgId, milestone } },
    // Same reasoning as submitMilestone: `available` is forced true for milestone 0
    // on read, so seeding it false here is fine.
    create: {
      org_id: orgId,
      milestone,
      available: milestone === ALWAYS_AVAILABLE_MILESTONE,
      reviewed_at: reviewedAt,
      review_notes: notes,
    },
    update: { reviewed_at: reviewedAt, review_notes: notes },
  });

  if (unlockedMilestone) {
    // Inlined rather than calling setMilestoneAvailability, which would re-run the
    // auth check and revalidate a second time. Idempotent: already-available stays
    // available, and the email still announces it.
    await prisma.milestoneAccess.upsert({
      where: {
        org_id_milestone: { org_id: orgId, milestone: unlockedMilestone },
      },
      create: { org_id: orgId, milestone: unlockedMilestone, available: true },
      update: { available: true },
    });
  }

  revalidatePath("/startups");
  revalidatePath("/teams-dashboard");

  // Deferred so the Mailjet round trip never delays or fails the review.
  after(() => sendMilestoneReviewedEmail(orgId, milestone, unlockedMilestone));

  return { reviewedAt, notes, unlockedMilestone };
}

export async function setMilestoneAvailability(
  orgId: string,
  milestone: number,
  available: boolean,
) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (milestone < FIRST_MILESTONE || milestone > LAST_MILESTONE) {
    throw new Error(`Invalid milestone: ${milestone}`);
  }

  if (milestone === ALWAYS_AVAILABLE_MILESTONE) {
    throw new Error("Milestone 0 is always available and cannot be changed");
  }

  await prisma.milestoneAccess.upsert({
    where: {
      org_id_milestone: {
        org_id: orgId,
        milestone,
      },
    },
    create: {
      org_id: orgId,
      milestone,
      available,
    },
    update: {
      available,
    },
  });

  revalidatePath("/startups");
}
