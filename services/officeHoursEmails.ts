import { clerkClient } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { sendEmail, type MailjetRecipient } from "@/lib/mailjet";
import {
  buildOfficeHourIcs,
  getOfficeHoursTimeZone,
  officeHourEventTitle,
  officeHourEventUid,
  slotInstant,
  type IcsMethod,
} from "@/lib/officeHoursCalendar";
import {
  bookingCancelledEmail,
  bookingConfirmationEmail,
  bookingUpdatedEmail,
  bookingWithdrawnEmail,
  type OfficeHourEmailParams,
  type RenderedEmail,
} from "@/lib/emails/officeHourBookingEmail";
import {
  dedupeRecipients,
  getStartupContext,
  EMPTY_STARTUP,
} from "@/lib/startupRecipients";

/**
 * Everything the emails need, captured up front. `cancelBooking` hard-deletes the
 * row, so cancellation has to work from a snapshot taken before the delete.
 */
export interface BookingEmailSnapshot {
  bookingId: string;
  sequence: number;
  attendeeName: string;
  attendeeEmail: string | null;
  orgId: string | null;
  meetingLink: string | null;
  mentorUserId: string;
  mentorName: string;
  slotDate: Date;
  startTime: string;
  endTime: string;
}

/** Loads the snapshot for a booking, or null if it no longer exists. */
export async function getBookingEmailSnapshot(
  bookingId: string,
): Promise<BookingEmailSnapshot | null> {
  const booking = await prisma.officeHourBooking.findUnique({
    where: { id: bookingId },
    include: { subSlot: { include: { slot: true } } },
  });

  if (!booking) return null;

  return {
    bookingId: booking.id,
    sequence: booking.ics_sequence,
    attendeeName: booking.user_name ?? "Participant",
    attendeeEmail: booking.user_email,
    orgId: booking.org_id,
    meetingLink: booking.meeting_link,
    mentorUserId: booking.subSlot.slot.user_id,
    mentorName: booking.subSlot.slot.mentor_name,
    slotDate: booking.subSlot.slot.date,
    startTime: booking.subSlot.start_time,
    endTime: booking.subSlot.end_time,
  };
}

/** The host's email is never persisted — only their Clerk id lives on the slot. */
async function getMentorEmail(mentorUserId: string): Promise<string | null> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(mentorUserId);
    return (
      user.primaryEmailAddress?.emailAddress ??
      user.emailAddresses?.[0]?.emailAddress ??
      null
    );
  } catch (err) {
    console.error(
      `[office-hours-email] could not resolve mentor email for ${mentorUserId}`,
      err,
    );
    return null;
  }
}

async function deliver(options: {
  snapshot: BookingEmailSnapshot;
  method: IcsMethod;
  sequence: number;
  render: (params: OfficeHourEmailParams) => RenderedEmail;
}): Promise<void> {
  const { snapshot, method, sequence, render } = options;

  const timeZone = getOfficeHoursTimeZone();
  const start = slotInstant(snapshot.slotDate, snapshot.startTime, timeZone);
  const end = slotInstant(snapshot.slotDate, snapshot.endTime, timeZone);

  const [mentorEmail, startup] = await Promise.all([
    getMentorEmail(snapshot.mentorUserId),
    snapshot.orgId
      ? getStartupContext(snapshot.orgId)
      : Promise.resolve(EMPTY_STARTUP),
  ]);

  const eventTitle = officeHourEventTitle(startup.name);

  const candidates: MailjetRecipient[] = [];
  if (snapshot.attendeeEmail) {
    candidates.push({
      Email: snapshot.attendeeEmail,
      Name: snapshot.attendeeName,
    });
  }
  if (mentorEmail) {
    candidates.push({ Email: mentorEmail, Name: snapshot.mentorName });
  }
  // The booker is usually a member too — dedupe handles the overlap.
  candidates.push(...startup.recipients);

  const notifyEmail = process.env.OFFICE_HOURS_NOTIFY_EMAIL?.trim();
  if (notifyEmail) {
    candidates.push({ Email: notifyEmail });
  }

  const recipients = dedupeRecipients(candidates);

  if (recipients.length === 0) {
    console.warn(
      `[office-hours-email] no recipients for booking ${snapshot.bookingId}`,
    );
    return;
  }

  const emailParams: OfficeHourEmailParams = {
    eventTitle,
    mentorName: snapshot.mentorName,
    attendeeName: snapshot.attendeeName,
    start,
    end,
    timeZone,
    meetingLink: snapshot.meetingLink,
  };
  const { subject, html, text } = render(emailParams);

  // ORGANIZER must be a real address; fall back to the configured sender so the
  // invite stays valid even when the mentor's Clerk lookup fails.
  const organizerEmail =
    mentorEmail || process.env.MAILJET_FROM_EMAIL || "no-reply@appollo.app";

  const ics = buildOfficeHourIcs({
    method,
    uid: officeHourEventUid(snapshot.bookingId),
    sequence,
    start,
    end,
    summary: eventTitle,
    description: snapshot.meetingLink
      ? `Office hours with ${snapshot.mentorName}.\nMeeting link: ${snapshot.meetingLink}`
      : `Office hours with ${snapshot.mentorName}.`,
    location: snapshot.meetingLink,
    url: snapshot.meetingLink,
    organizer: { name: snapshot.mentorName, email: organizerEmail },
    attendees: recipients.map((r) => ({ name: r.Name, email: r.Email })),
  });

  await sendEmail({
    to: recipients,
    subject,
    textPart: text,
    htmlPart: html,
    attachments: [
      {
        ContentType: `text/calendar; charset=UTF-8; method=${method}`,
        Filename: "invite.ics",
        Base64Content: Buffer.from(ics, "utf8").toString("base64"),
      },
    ],
  });
}

/** Fire-and-forget wrapper — email must never break a booking flow. */
async function safely(label: string, run: () => Promise<void>): Promise<void> {
  try {
    await run();
  } catch (err) {
    console.error(`[office-hours-email] ${label} failed`, err);
  }
}

export async function sendBookingInvite(bookingId: string): Promise<void> {
  await safely(`invite for ${bookingId}`, async () => {
    const snapshot = await getBookingEmailSnapshot(bookingId);
    if (!snapshot) return;
    await deliver({
      snapshot,
      method: "REQUEST",
      sequence: snapshot.sequence,
      render: bookingConfirmationEmail,
    });
  });
}

export async function sendBookingUpdate(bookingId: string): Promise<void> {
  await safely(`update for ${bookingId}`, async () => {
    const snapshot = await getBookingEmailSnapshot(bookingId);

    if (!snapshot) return;
    await deliver({
      snapshot,
      method: "REQUEST",
      sequence: snapshot.sequence,
      render: bookingUpdatedEmail,
    });
  });
}

export async function sendBookingCancellation(
  snapshot: BookingEmailSnapshot,
): Promise<void> {
  await safely(`cancellation for ${snapshot.bookingId}`, async () => {
    await deliver({
      snapshot,
      method: "CANCEL",
      // The row is gone, so bump the stored sequence here.
      sequence: snapshot.sequence + 1,
      render: bookingCancelledEmail,
    });
  });
}

/** The mentor deleted or retimed the slot out from under the booking. */
export async function sendBookingWithdrawn(
  snapshot: BookingEmailSnapshot,
): Promise<void> {
  await safely(`withdrawal for ${snapshot.bookingId}`, async () => {
    await deliver({
      snapshot,
      method: "CANCEL",
      sequence: snapshot.sequence + 1,
      render: bookingWithdrawnEmail,
    });
  });
}
