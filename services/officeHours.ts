"use server";

import { v4 as uuidv4 } from "uuid";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth, currentUser } from "@clerk/nextjs/server";
import { split30MinIntervals } from "@/lib/officeHoursUtils";
import { bookingLinkFormSchema } from "@/schemas/officeHours";
import { OfficeHourBooking } from "@/lib/generated/prisma";
import {
  getBookingEmailSnapshot,
  sendBookingCancellation,
  sendBookingInvite,
  sendBookingUpdate,
} from "@/services/officeHoursEmails";

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
  return slot;
}

export async function updateOfficeHourSlot(
  id: string,
  startTime: string,
  endTime: string
) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Delete old sub-slots (bookings cascade), recreate with new times
  await prisma.officeHourSubSlot.deleteMany({ where: { slot_id: id } });

  const slot = await prisma.officeHourSlot.update({
    where: { id, user_id: userId },
    data: { start_time: startTime, end_time: endTime },
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
  return slot;
}

export async function deleteOfficeHourSlot(id: string) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  await prisma.officeHourSlot.delete({
    where: { id, user_id: userId },
  });

  revalidatePath("/office-hours");
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
