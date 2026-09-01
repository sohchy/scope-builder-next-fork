"use server";

import { v4 as uuidv4 } from "uuid";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { split30MinIntervals } from "@/lib/officeHoursUtils";
import { bookingLinkFormSchema } from "@/schemas/officeHours";
import { OfficeHourBooking, Prisma } from "@/lib/generated/prisma";
import { getStartupContext } from "@/lib/startupRecipients";
import {
  getBookingEmailSnapshot,
  sendBookingCancellation,
  sendBookingInvite,
  sendBookingUpdate,
  sendBookingWithdrawn,
  type BookingEmailSnapshot,
} from "@/services/officeHoursEmails";

/** A mentor's own slot with the bookings hanging off it, for the admin editor. */
export type AdminSlot = Prisma.OfficeHourSlotGetPayload<{
  include: { subSlots: { include: { booking: true } } };
}>;

/** One booking a delete/retime is about to destroy, as shown in the dialog. */
export type AffectedBooking = {
  bookingId: string;
  startTime: string;
  endTime: string;
  participantName: string;
  startupName: string | null;
};

const intervalKey = (start: string, end: string) => `${start}-${end}`;

async function getCurrentUserDisplayInfo() {
  const user = await currentUser();
  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Participant";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? null;
  return { name, email };
}

export async function getOfficeHourSlots() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const slots = await prisma.officeHourSlot.findMany({
    where: { user_id: userId },
    // The editor needs to know which slots are booked before offering to delete them.
    include: {
      subSlots: {
        include: { booking: true },
        orderBy: { start_time: "asc" },
      },
    },
    orderBy: [{ date: "asc" }, { start_time: "asc" }],
  });

  return slots;
}

export async function createOfficeHourSlot(
  date: Date,
  startTime: string,
  endTime: string
) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  const mentorName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    user?.emailAddresses?.[0]?.emailAddress ||
    "Mentor";

  const slot = await prisma.officeHourSlot.create({
    data: {
      id: uuidv4(),
      user_id: userId,
      mentor_name: mentorName,
      date,
      start_time: startTime,
      end_time: endTime,
    },
  });

  const intervals = split30MinIntervals(startTime, endTime);
  await prisma.officeHourSubSlot.createMany({
    data: intervals.map(({ start, end }) => ({
      id: uuidv4(),
      slot_id: slot.id,
      start_time: start,
      end_time: end,
    })),
  });

  revalidatePath("/office-hours");
  // Re-read so the caller gets the same booking-aware shape as getOfficeHourSlots.
  return prisma.officeHourSlot.findUniqueOrThrow({
    where: { id: slot.id },
    include: { subSlots: { include: { booking: true } } },
  });
}

export async function updateOfficeHourSlot(
  id: string,
  startTime: string,
  endTime: string
) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const existing = await prisma.officeHourSubSlot.findMany({
    where: { slot_id: id, slot: { user_id: userId } },
    include: { booking: { select: { id: true } } },
  });

  const intervals = split30MinIntervals(startTime, endTime);
  const target = new Set(intervals.map((i) => intervalKey(i.start, i.end)));

  // Sub-slots whose window survives the new range keep their bookings; only the
  // ones that fall outside are dropped.
  const surviving = new Set<string>();
  const dropped: typeof existing = [];
  for (const sub of existing) {
    const key = intervalKey(sub.start_time, sub.end_time);
    if (target.has(key)) surviving.add(key);
    else dropped.push(sub);
  }
  const toCreate = intervals.filter(
    (i) => !surviving.has(intervalKey(i.start, i.end))
  );

  // Snapshot before the delete — the email needs the row's data.
  const snapshots = await snapshotBookings(
    dropped.flatMap((s) => (s.booking ? [s.booking.id] : []))
  );

  const slot = await prisma.$transaction(async (tx) => {
    if (dropped.length > 0) {
      await tx.officeHourSubSlot.deleteMany({
        where: { id: { in: dropped.map((s) => s.id) } },
      });
    }
    if (toCreate.length > 0) {
      await tx.officeHourSubSlot.createMany({
        data: toCreate.map(({ start, end }) => ({
          id: uuidv4(),
          slot_id: id,
          start_time: start,
          end_time: end,
        })),
      });
    }
    return tx.officeHourSlot.update({
      where: { id, user_id: userId },
      data: { start_time: startTime, end_time: endTime },
    });
  });

  revalidatePath("/office-hours");
  if (snapshots.length > 0) {
    // Deferred so the Mailjet round trip never delays or fails the edit.
    after(() => Promise.all(snapshots.map(sendBookingWithdrawn)));
  }
  return slot;
}

export async function deleteOfficeHourSlot(id: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Cascade wipes the bookings, so snapshot them while they still exist.
  const bookings = await prisma.officeHourBooking.findMany({
    where: { subSlot: { slot: { id, user_id: userId } } },
    select: { id: true },
  });
  const snapshots = await snapshotBookings(bookings.map((b) => b.id));

  await prisma.officeHourSlot.delete({
    where: { id, user_id: userId },
  });

  revalidatePath("/office-hours");
  if (snapshots.length > 0) {
    after(() => Promise.all(snapshots.map(sendBookingWithdrawn)));
  }
}

async function snapshotBookings(
  bookingIds: string[]
): Promise<BookingEmailSnapshot[]> {
  const snapshots = await Promise.all(bookingIds.map(getBookingEmailSnapshot));
  return snapshots.filter((s): s is BookingEmailSnapshot => s !== null);
}

/**
 * The bookings a destructive edit is about to destroy. Omit the new range for a
 * delete (everything goes); pass it for a retime (only windows that fall outside).
 */
export async function getSlotImpact(
  slotId: string,
  nextStart?: string,
  nextEnd?: string
): Promise<AffectedBooking[]> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const subSlots = await prisma.officeHourSubSlot.findMany({
    where: { slot_id: slotId, slot: { user_id: userId }, booking: { isNot: null } },
    include: { booking: true },
    orderBy: { start_time: "asc" },
  });

  const survives =
    nextStart && nextEnd
      ? (() => {
          const target = new Set(
            split30MinIntervals(nextStart, nextEnd).map((i) =>
              intervalKey(i.start, i.end)
            )
          );
          return (start: string, end: string) =>
            target.has(intervalKey(start, end));
        })()
      : () => false;

  const affected = subSlots.filter(
    (s) => s.booking && !survives(s.start_time, s.end_time)
  );

  // Startup names live in Clerk, not the database — one lookup per distinct org.
  const orgIds = [
    ...new Set(
      affected.flatMap((s) => (s.booking?.org_id ? [s.booking.org_id] : []))
    ),
  ];
  const names = new Map(
    await Promise.all(
      orgIds.map(
        async (orgId) =>
          [orgId, (await getStartupContext(orgId)).name] as const
      )
    )
  );

  return affected.map((s) => ({
    bookingId: s.booking!.id,
    startTime: s.start_time,
    endTime: s.end_time,
    participantName: s.booking!.user_name ?? "Participant",
    startupName: s.booking!.org_id
      ? names.get(s.booking!.org_id) ?? null
      : null,
  }));
}

export async function getAllSlotsWithBookings() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const slots = await prisma.officeHourSlot.findMany({
    include: {
      subSlots: {
        include: { booking: true },
        orderBy: { start_time: "asc" },
      },
    },
    orderBy: [{ date: "asc" }, { start_time: "asc" }],
  });

  return slots;
}

export type BookSlotResult =
  | { status: "booked"; booking: OfficeHourBooking }
  | { status: "already_booked"; booking: OfficeHourBooking | null };

export async function bookSlot(
  subSlotId: string,
  meetingLink: string,
): Promise<BookSlotResult> {
  const { userId, orgId } = await auth();
  if (!userId) redirect("/sign-in");

  const { meetingLink: validatedLink } = bookingLinkFormSchema.parse({
    meetingLink,
  });
  const { name, email } = await getCurrentUserDisplayInfo();

  try {
    const booking = await prisma.officeHourBooking.create({
      data: {
        id: uuidv4(),
        sub_slot_id: subSlotId,
        user_id: userId,
        // Pinned now so later update/cancel emails reach the same startup even if
        // the booker switches their active org.
        org_id: orgId ?? null,
        user_name: name,
        user_email: email,
        meeting_link: validatedLink,
      },
    });

    revalidatePath("/office-hours");
    // Deferred so the Mailjet round trip never delays or fails the booking.
    after(() => sendBookingInvite(booking.id));
    return { status: "booked", booking };
  } catch (err) {
    const code = (err as { code?: unknown } | null)?.code;
    if (code === "P2002") {
      const existing = await prisma.officeHourBooking.findUnique({
        where: { sub_slot_id: subSlotId },
      });
      return { status: "already_booked", booking: existing };
    }
    throw err;
  }
}

export async function updateBookingLink(subSlotId: string, meetingLink: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { meetingLink: validatedLink } = bookingLinkFormSchema.parse({
    meetingLink,
  });

  const booking = await prisma.officeHourBooking.update({
    where: { sub_slot_id: subSlotId, user_id: userId },
    // Bumped so the new invite replaces the calendar event instead of duplicating it.
    data: { meeting_link: validatedLink, ics_sequence: { increment: 1 } },
  });

  revalidatePath("/office-hours");
  after(() => sendBookingUpdate(booking.id));
  return booking;
}

export async function cancelBooking(subSlotId: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const existing = await prisma.officeHourBooking.findUnique({
    where: { sub_slot_id: subSlotId, user_id: userId },
    select: { id: true },
  });

  // Snapshot before deleting — the cancellation email needs the row's data.
  const snapshot = existing ? await getBookingEmailSnapshot(existing.id) : null;

  await prisma.officeHourBooking.delete({
    where: { sub_slot_id: subSlotId, user_id: userId },
  });

  revalidatePath("/office-hours");
  if (snapshot) {
    after(() => sendBookingCancellation(snapshot));
  }
}
