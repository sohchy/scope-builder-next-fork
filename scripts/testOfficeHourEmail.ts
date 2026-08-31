/**
 * Office-hour invite harness. Prints the generated .ics so the folding,
 * DTSTART/DTEND instants, UID, SEQUENCE, ORGANIZER and ATTENDEE lines can be
 * eyeballed without booting the app, and optionally sends a real email.
 *
 *   npx tsx --env-file=.env scripts/testOfficeHourEmail.ts
 *   npx tsx --env-file=.env scripts/testOfficeHourEmail.ts --date 2026-01-14 --time 14:00
 *   npx tsx --env-file=.env scripts/testOfficeHourEmail.ts --send you@example.com
 *
 * Flags:
 *   --date <YYYY-MM-DD>  slot day (default 2026-08-05, i.e. EDT)
 *   --time <HH:mm>       slot start (default 14:00; end is +30 min)
 *   --tz <IANA>          overrides OFFICE_HOURS_TIMEZONE
 *   --startup <name>     startup name in the title (pass "" for the fallback)
 *   --method <REQUEST|CANCEL>
 *   --send <email>       actually deliver through Mailjet
 */
import {
  buildOfficeHourIcs,
  getOfficeHoursTimeZone,
  officeHourEventTitle,
  officeHourEventUid,
  slotInstant,
  type IcsMethod,
} from "../lib/officeHoursCalendar";
import {
  bookingCancelledEmail,
  bookingConfirmationEmail,
} from "../lib/emails/officeHourBookingEmail";
import { sendEmail } from "../lib/mailjet";

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

async function main() {
  const timeZone = flag("tz") || getOfficeHoursTimeZone();
  const day = flag("date") || "2026-08-05";
  const startTime = flag("time") || "14:00";
  const endTime = addMinutes(startTime, 30);
  const method = (flag("method") || "REQUEST") as IcsMethod;
  const sendTo = flag("send");

  // Mimic how the app stores it: local midnight on the chosen day.
  const [y, m, d] = day.split("-").map(Number);
  const slotDate = new Date(y, m - 1, d);

  const start = slotInstant(slotDate, startTime, timeZone);
  const end = slotInstant(slotDate, endTime, timeZone);

  const mentorName = "Ada Lovelace";
  const attendeeName = "Grace Hopper";
  const attendeeEmail = sendTo || "attendee@example.com";
  const meetingLink = "https://meet.google.com/abc-defg-hij";
  // Pass --startup "" to check the fallback when the Clerk org lookup fails.
  const startupName = flag("startup") ?? "Acme Robotics";
  const eventTitle = officeHourEventTitle(startupName || null);

  const ics = buildOfficeHourIcs({
    method,
    uid: officeHourEventUid("test-booking-0001"),
    sequence: method === "CANCEL" ? 1 : 0,
    start,
    end,
    summary: eventTitle,
    description: `Office hours with ${mentorName}.\nMeeting link: ${meetingLink}`,
    location: meetingLink,
    url: meetingLink,
    organizer: { name: mentorName, email: "mentor@example.com" },
    attendees: [{ name: attendeeName, email: attendeeEmail }],
  });

  console.log(`timezone : ${timeZone}`);
  console.log(`slot     : ${day} ${startTime}–${endTime} (wall clock)`);
  console.log(`start    : ${start.toISOString()}`);
  console.log(`end      : ${end.toISOString()}`);
  console.log("\n--- invite.ics ---");
  // Show the CRLFs explicitly so folding is verifiable.
  console.log(ics.replace(/\r\n/g, "\n"));
  console.log("--- end ---\n");

  if (!sendTo) {
    console.log("Dry run. Pass --send <email> to deliver through Mailjet.");
    return;
  }

  const params = {
    eventTitle,
    mentorName,
    attendeeName,
    start,
    end,
    timeZone,
    meetingLink,
  };
  const { subject, html, text } =
    method === "CANCEL"
      ? bookingCancelledEmail(params)
      : bookingConfirmationEmail(params);

  const result = await sendEmail({
    to: [{ Email: sendTo, Name: attendeeName }],
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

  if (result.ok) {
    console.log(`Sent to ${sendTo}.`);
  } else {
    console.error(`Send failed: ${result.error}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
