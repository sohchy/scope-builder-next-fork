import { TZDate } from "@date-fns/tz";

/**
 * Office-hour slots store a `date` (a DateTime created from the admin's local
 * midnight) plus naive "HH:mm" strings, with no offset anywhere. To build a real
 * calendar event we treat every stored time as wall-clock in one configured
 * program timezone. See OFFICE_HOURS_TIMEZONE.
 */
export const DEFAULT_OFFICE_HOURS_TIMEZONE = "America/New_York";

export function getOfficeHoursTimeZone(): string {
  return process.env.OFFICE_HOURS_TIMEZONE || DEFAULT_OFFICE_HOURS_TIMEZONE;
}

export type IcsMethod = "REQUEST" | "CANCEL";

export interface IcsPerson {
  name?: string | null;
  email: string;
}

export interface BuildIcsParams {
  method: IcsMethod;
  /** Stable across the whole lifecycle so updates replace rather than duplicate. */
  uid: string;
  sequence: number;
  start: Date;
  end: Date;
  summary: string;
  description: string;
  location?: string | null;
  url?: string | null;
  organizer: IcsPerson;
  attendees: IcsPerson[];
}

const DAY_MS = 86_400_000;

/**
 * Recovers the calendar day an admin actually picked from a stored slot `date`.
 *
 * The app stores local midnight in the admin's browser, so the timestamp sits
 * within ±14h of UTC midnight on the intended day — ahead of it for zones behind
 * UTC, behind it for zones ahead. Reading the day off it in any single fixed zone
 * is wrong half the time. Snapping to the nearest day boundary recovers the
 * intended day for every zone within ±12h of UTC, which is all of them bar
 * UTC+13/+14 (Chatham, Kiritimati, NZ in DST).
 */
export function storedSlotDay(date: Date): {
  year: number;
  month: number;
  day: number;
} {
  const snapped = new Date(Math.round(date.getTime() / DAY_MS) * DAY_MS);
  return {
    year: snapped.getUTCFullYear(),
    month: snapped.getUTCMonth(),
    day: snapped.getUTCDate(),
  };
}

/**
 * Combines a stored slot `date` with an "HH:mm" wall-clock time into a real UTC
 * instant, treating the time as wall-clock in `timeZone`.
 */
export function slotInstant(date: Date, time: string, timeZone: string): Date {
  const { year, month, day } = storedSlotDay(date);
  const [hours, minutes] = time.split(":").map(Number);

  return new Date(
    TZDate.tz(timeZone, year, month, day, hours, minutes, 0, 0).getTime()
  );
}

/** "20260805T180000Z" */
function toUtcStamp(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/** RFC 5545 TEXT escaping. */
function escapeText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** Quoted param value (CN=…); double quotes are not escapable, so drop them. */
function quoteParam(value: string): string {
  return `"${value.replace(/"/g, "")}"`;
}

/**
 * Folds a content line to 75 octets, continuation lines prefixed with a single
 * space. Unfolded long lines are rejected outright by several clients.
 */
function foldLine(line: string): string {
  const bytes = Buffer.from(line, "utf8");
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let offset = 0;
  let limit = 75;

  while (offset < bytes.length) {
    let end = Math.min(offset + limit, bytes.length);
    // Never split in the middle of a multi-byte UTF-8 sequence.
    while (end > offset && end < bytes.length && (bytes[end] & 0xc0) === 0x80) {
      end--;
    }
    parts.push(bytes.subarray(offset, end).toString("utf8"));
    offset = end;
    limit = 74; // continuation lines carry a leading space
  }

  return parts.join("\r\n ");
}

function personLine(
  property: "ORGANIZER" | "ATTENDEE",
  person: IcsPerson,
  extraParams: string[] = []
): string {
  const params = [...extraParams];
  if (person.name) params.push(`CN=${quoteParam(person.name)}`);
  const prefix = params.length ? `${property};${params.join(";")}` : property;
  return `${prefix}:mailto:${person.email}`;
}

/**
 * Builds an iCalendar object for an office-hour booking.
 *
 * METHOD:REQUEST paired with an ATTENDEE line matching the recipient is what
 * makes Gmail/Outlook render the RSVP + add-to-calendar treatment; without it
 * they degrade to a plain file attachment.
 */
export function buildOfficeHourIcs(params: BuildIcsParams): string {
  const {
    method,
    uid,
    sequence,
    start,
    end,
    summary,
    description,
    location,
    url,
    organizer,
    attendees,
  } = params;

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Appollo//Office Hours//EN",
    "CALSCALE:GREGORIAN",
    `METHOD:${method}`,
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `SEQUENCE:${sequence}`,
    `DTSTAMP:${toUtcStamp(new Date())}`,
    `DTSTART:${toUtcStamp(start)}`,
    `DTEND:${toUtcStamp(end)}`,
    `SUMMARY:${escapeText(summary)}`,
    `DESCRIPTION:${escapeText(description)}`,
  ];

  if (location?.trim()) {
    lines.push(`LOCATION:${escapeText(location.trim())}`);
  }

  // meeting_link is only validated as a non-empty string, so it may not be a URL.
  if (url && URL.canParse(url)) {
    lines.push(`URL:${url}`);
  }

  lines.push(personLine("ORGANIZER", organizer));

  for (const attendee of attendees) {
    lines.push(
      personLine("ATTENDEE", attendee, [
        "CUTYPE=INDIVIDUAL",
        "ROLE=REQ-PARTICIPANT",
        method === "CANCEL" ? "PARTSTAT=DECLINED" : "PARTSTAT=NEEDS-ACTION",
        "RSVP=TRUE",
      ])
    );
  }

  lines.push(
    `STATUS:${method === "CANCEL" ? "CANCELLED" : "CONFIRMED"}`,
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR"
  );

  return `${lines.map(foldLine).join("\r\n")}\r\n`;
}

/** Stable per booking, so REQUEST/CANCEL for the same booking match up. */
export function officeHourEventUid(bookingId: string): string {
  return `office-hour-${bookingId}@appollo`;
}

/** Calendar event title. Doubles as the email subject. */
export function officeHourEventTitle(startupName: string | null): string {
  return startupName
    ? `ICorps Instructor Check-In with ${startupName}`
    : "ICorps Instructor Check-In";
}
