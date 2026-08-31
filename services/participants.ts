"use server";

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { checkRole } from "@/lib/auth";
import { participantFormSchema } from "@/schemas/participant";
import {
  ParticipantRelationship,
  ParticipantStatus,
} from "@/lib/generated/prisma";

// Statuses owned by the interview flow (markParticipantAsComplete /
// markParticipantAsDocumented). A scheduled date must not drag these back to
// "scheduled" — that would bounce the card backwards on the kanban.
const LOCKED_STATUSES: ParticipantStatus[] = ["complete", "documented"];

// The form submits "" for an unselected relationship; Prisma rejects that for an
// enum column, so it has to become null.
function toRelationship(value?: string): ParticipantRelationship | null {
  return value ? (value as ParticipantRelationship) : null;
}

// `conducted` is the sheets' explicit signal, so it wins over the date-derived
// status. When it's undefined (caller didn't render the checkbox) we fall back to
// the old behaviour: a date means "scheduled", and complete/documented are locked.
function resolveStatus(
  values: z.infer<typeof participantFormSchema>,
  currentStatus?: ParticipantStatus,
): ParticipantStatus {
  const { conducted, scheduled_date, status } = values;

  // "documented" sits past "complete" in the interview flow — never drag it back.
  if (currentStatus === "documented") return "documented";

  if (scheduled_date && conducted !== undefined) {
    return conducted ? "complete" : "scheduled";
  }

  if (currentStatus && LOCKED_STATUSES.includes(currentStatus)) {
    return currentStatus;
  }

  return scheduled_date ? "scheduled" : (status as ParticipantStatus);
}

// The "Submit Interview Documentation for Review" checkbox only exists under a
// checked "Conducted", so an interview that isn't conducted can't be waiting on a
// review. `fallback` keeps an existing flag when the caller has no opinion.
function resolvePendingReview(
  pendingReview: boolean | undefined,
  status: ParticipantStatus,
  fallback = false,
): boolean {
  if (!LOCKED_STATUSES.includes(status)) return false;

  return pendingReview ?? fallback;
}

export async function getParticipantTags() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const tags = await prisma.participantTag.findMany({
    where: { org_id: orgId },
  });

  return tags.map((tag) => tag.name);
}

export async function createParticipantTag(tagName: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const newTag = await prisma.participantTag.create({
    data: {
      name: tagName,
      org_id: orgId,
    },
  });

  revalidatePath(`/participants`);
}

export async function getParticipant(participantId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, org_id: orgId },
  });

  return participant;
}

export async function getParticipants() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const participants = await prisma.participant.findMany({
    where: { org_id: orgId },
    orderBy: [{ scheduled_date: "asc" }, { name: "asc" }],
  });

  return participants;
}

export async function getAllParticipants() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const participants = await prisma.participant.findMany({
    orderBy: [{ scheduled_date: "asc" }, { name: "asc" }],
  });

  return participants;
}

// `Participant.status` values that the progress grid counts, mapped to the bucket
// they land in. Statuses are exclusive — an interview that has been written up is
// `documented` and no longer `complete` — so the three buckets never double-count,
// which is what lets the grid draw the remainder as `target - scheduled - conducted
// - documented`. `need_to_schedule` is deliberately absent: nothing is committed yet.
const INTERVIEW_COUNT_BUCKETS = {
  scheduled: "scheduled",
  complete: "conducted",
  documented: "documented",
} as const satisfies Partial<Record<ParticipantStatus, string>>;

// `Object.keys` widens to string[], which Prisma's `status: { in: ... }` rejects.
const COUNTED_STATUSES = Object.keys(
  INTERVIEW_COUNT_BUCKETS,
) as ParticipantStatus[];

// Interview counts for every org at once, for the instructor-side progress grid.
export async function getAllInterviewCounts(): Promise<
  Record<
    string,
    { scheduled: number; conducted: number; documented: number }
  >
> {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const rows = await prisma.participant.groupBy({
    by: ["org_id", "status"],
    // `example_number: null` matters here — the /examples sets write their
    // participants into this same table and would otherwise count as real progress.
    where: {
      example_number: null,
      status: { in: COUNTED_STATUSES },
    },
    _count: { _all: true },
  });

  const byOrg: Record<
    string,
    { scheduled: number; conducted: number; documented: number }
  > = {};

  for (const row of rows) {
    const bucket =
      INTERVIEW_COUNT_BUCKETS[
        row.status as keyof typeof INTERVIEW_COUNT_BUCKETS
      ];
    if (!bucket) continue;

    const counts = (byOrg[row.org_id] ??= {
      scheduled: 0,
      conducted: 0,
      documented: 0,
    });

    counts[bucket] = row._count._all;
  }

  return byOrg;
}

export async function createParticipant(
  values: z.infer<typeof participantFormSchema>,
) {
  const participantId = uuidv4();
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  // `conducted` is derived into `status` below and isn't a column of its own.
  const { conducted, ...data } = values;

  // A brand-new participant has no current status to guard against.
  const status = resolveStatus(values);

  const newParticipant = await prisma.participant.create({
    data: {
      ...data,
      relationship: toRelationship(values.relationship),
      status,
      pending_review: resolvePendingReview(values.pending_review, status),
      org_id: orgId,
      id: participantId,
      ParticipantRoom: {
        create: {
          roomId: uuidv4(),
        },
      },
    },
  });

  revalidatePath(`/participants`);

  return newParticipant;
}

export async function updateParticipant(
  participantId: string,
  values: z.infer<typeof participantFormSchema>,
) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  // Read the live status rather than trusting the value the form round-tripped —
  // the interview flow may have advanced it while the edit sheet was open.
  const current = await prisma.participant.findFirst({
    where: { id: participantId, org_id: orgId },
    select: { status: true, pending_review: true },
  });

  // `conducted` is derived into `status` below and isn't a column of its own.
  const { conducted, ...data } = values;

  const status = resolveStatus(values, current?.status);

  await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: {
      ...data,
      relationship: toRelationship(values.relationship),
      status,
      pending_review: resolvePendingReview(
        values.pending_review,
        status,
        current?.pending_review,
      ),
    },
  });

  // "layout" so the nested /participants/interviews board picks up a card that
  // just moved into (or out of) the Conducted column.
  revalidatePath(`/participants`, "layout");
}

export async function markParticipantAsComplete(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const updatedParticipant = await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: { status: "complete" },
  });

  revalidatePath(`/participants`);
}

export async function markParticipantAsDocumented(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: { status: "documented" },
  });

  // "layout" so the nested /participants/interviews is revalidated too — a bare
  // revalidatePath("/participants") only busts that exact page, and this status
  // change is what the interviews header's payer count is counting.
  revalidatePath(`/participants`, "layout");
}

// The instructor-side counterpart to the founder's "Submit Interview Documentation for
// Review" checkbox: clears the flag and advances the interview past "complete". Admins
// reach a team's board through /switch-startup, so they carry a real orgId and the usual
// scoping still applies.
export async function completeInterviewReview(participantId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  // The UI only offers this to admins/mentors, but the action is callable directly.
  const canReview = (await checkRole("admin")) || (await checkRole("mentor"));

  if (!canReview) {
    throw new Error("Only an admin or mentor can complete an interview review.");
  }

  await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: { status: "documented", pending_review: false },
  });

  // "layout" so the nested /participants/interviews is revalidated too — a bare
  // revalidatePath("/participants") only busts that exact page, and this status
  // change is what the interviews header's payer count is counting.
  revalidatePath(`/participants`, "layout");
}

export async function deleteParticipant(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  await prisma.participant.delete({
    where: { id: participantId, org_id: orgId },
  });

  revalidatePath(`/participants`);
}

export async function getInterviewMilestonesWithProgress() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  const [milestones, documentedCount, payerDocumentedCount] = await Promise.all(
    [
      prisma.interviewMilestone.findMany({
        where: { org_id: orgId },
        orderBy: { date: "asc" },
      }),
      prisma.participant.count({
        where: { org_id: orgId, status: "documented" },
      }),
      prisma.participant.count({
        where: {
          org_id: orgId,
          status: "documented",
          role: { contains: "Payer" },
        },
      }),
    ],
  );

  return { milestones, documentedCount, payerDocumentedCount };
}
