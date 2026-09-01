export interface OfficeHourEmailParams {
  /** Calendar event title; also the email subject. */
  eventTitle: string;
  mentorName: string;
  attendeeName: string;
  start: Date;
  end: Date;
  timeZone: string;
  meetingLink?: string | null;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function formatDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatTime(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatZoneAbbreviation(date: Date, timeZone: string): string {
  const part = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "short",
  })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName");
  return part?.value ?? timeZone;
}

function formatWhen(start: Date, end: Date, timeZone: string): string {
  return `${formatDay(start, timeZone)} · ${formatTime(start, timeZone)} – ${formatTime(
    end,
    timeZone
  )} ${formatZoneAbbreviation(start, timeZone)}`;
}

/** "20260805T180000Z" */
function toCompactUtc(date: Date): string {
  return `${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z`;
}

/** Visible fallback for clients that ignore the .ics attachment. */
function googleCalendarUrl(params: OfficeHourEmailParams): string {
  const query = new URLSearchParams({
    action: "TEMPLATE",
    text: params.eventTitle,
    dates: `${toCompactUtc(params.start)}/${toCompactUtc(params.end)}`,
    details: params.meetingLink
      ? `Meeting link: ${params.meetingLink}`
      : "Office hours session",
  });
  if (params.meetingLink) query.set("location", params.meetingLink);
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const WRAPPER_STYLE =
  "margin:0;padding:24px;background-color:#f6f7f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1f2933;";
const CARD_STYLE =
  "max-width:560px;margin:0 auto;background-color:#ffffff;border:1px solid #e4e7eb;border-radius:12px;padding:32px;";
const HEADING_STYLE =
  "margin:0 0 16px;font-size:20px;line-height:28px;font-weight:600;color:#1f2933;";
const PARAGRAPH_STYLE = "margin:0 0 16px;font-size:15px;line-height:24px;";
const DETAIL_BOX_STYLE =
  "margin:0 0 24px;padding:16px;background-color:#f6f7f9;border-radius:8px;font-size:15px;line-height:24px;";
const LABEL_STYLE =
  "display:block;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;color:#7b8794;margin-bottom:2px;";
const LINK_STYLE = "color:#2563eb;text-decoration:underline;word-break:break-all;";
const FOOTER_STYLE =
  "margin:24px 0 0;font-size:13px;line-height:20px;color:#7b8794;";

function renderHtml(options: {
  heading: string;
  intro: string;
  params: OfficeHourEmailParams;
  cancelled: boolean;
  footer: string;
}): string {
  const { heading, intro, params, cancelled, footer } = options;
  const when = formatWhen(params.start, params.end, params.timeZone);
  const link = params.meetingLink?.trim();
  const linkIsUrl = !!link && URL.canParse(link);

  return `<div style="${WRAPPER_STYLE}">
  <div style="${CARD_STYLE}">
    <h1 style="${HEADING_STYLE}">${escapeHtml(heading)}</h1>
    <p style="${PARAGRAPH_STYLE}">${escapeHtml(intro)}</p>
    <div style="${DETAIL_BOX_STYLE}">
      <span style="${LABEL_STYLE}">When</span>
      <strong${cancelled ? ' style="text-decoration:line-through;"' : ""}>${escapeHtml(when)}</strong>
      <div style="height:12px;"></div>
      <span style="${LABEL_STYLE}">Mentor</span>
      <strong>${escapeHtml(params.mentorName)}</strong>
      <div style="height:12px;"></div>
      <span style="${LABEL_STYLE}">Participant</span>
      <strong>${escapeHtml(params.attendeeName)}</strong>
      ${
        link
          ? `<div style="height:12px;"></div>
      <span style="${LABEL_STYLE}">Meeting link</span>
      ${
        linkIsUrl
          ? `<a href="${escapeHtml(link)}" style="${LINK_STYLE}">${escapeHtml(link)}</a>`
          : `<strong>${escapeHtml(link)}</strong>`
      }`
          : ""
      }
    </div>
    ${
      cancelled
        ? ""
        : `<p style="${PARAGRAPH_STYLE}">The invite is attached — your mail client should offer to add it to your calendar. You can also <a href="${escapeHtml(
            googleCalendarUrl(params)
          )}" style="${LINK_STYLE}">add it to Google Calendar</a>.</p>`
    }
    <p style="${FOOTER_STYLE}">${escapeHtml(footer)}</p>
  </div>
</div>`;
}

function renderText(options: {
  heading: string;
  intro: string;
  params: OfficeHourEmailParams;
  cancelled: boolean;
  footer: string;
}): string {
  const { heading, intro, params, cancelled, footer } = options;
  const lines = [
    heading,
    "",
    intro,
    "",
    `When: ${formatWhen(params.start, params.end, params.timeZone)}`,
    `Mentor: ${params.mentorName}`,
    `Participant: ${params.attendeeName}`,
  ];

  if (params.meetingLink?.trim()) {
    lines.push(`Meeting link: ${params.meetingLink.trim()}`);
  }

  if (!cancelled) {
    lines.push(
      "",
      "The invite is attached as a calendar file.",
      `Add to Google Calendar: ${googleCalendarUrl(params)}`
    );
  }

  lines.push("", footer);
  return lines.join("\n");
}

export function bookingConfirmationEmail(
  params: OfficeHourEmailParams
): RenderedEmail {
  const options = {
    heading: "Your office hours are booked",
    intro: `${params.attendeeName} is booked in with ${params.mentorName}.`,
    params,
    cancelled: false,
    footer: "Need to change it? Update or cancel the booking from the Office Hours page.",
  };

  return {
    subject: params.eventTitle,
    html: renderHtml(options),
    text: renderText(options),
  };
}

export function bookingUpdatedEmail(
  params: OfficeHourEmailParams
): RenderedEmail {
  const options = {
    heading: "Your office hours meeting link changed",
    intro: `The meeting link for the session between ${params.attendeeName} and ${params.mentorName} was updated. The time is unchanged.`,
    params,
    cancelled: false,
    footer: "The attached invite replaces the previous one in your calendar.",
  };

  return {
    // Prefixed so an update is distinguishable at a glance from the original.
    subject: `Updated: ${params.eventTitle}`,
    html: renderHtml(options),
    text: renderText(options),
  };
}

/** The mentor removed the availability — the participant did not cancel. */
export function bookingWithdrawnEmail(
  params: OfficeHourEmailParams
): RenderedEmail {
  const options = {
    heading: "Office hours cancelled by your mentor",
    intro: `${params.mentorName} is no longer available at this time, so the session with ${params.attendeeName} has been cancelled.`,
    params,
    cancelled: true,
    footer:
      "You can book another time from the Office Hours page. The attached update removes this event from your calendar.",
  };

  return {
    subject: `Cancelled: ${params.eventTitle}`,
    html: renderHtml(options),
    text: renderText(options),
  };
}

export function bookingCancelledEmail(
  params: OfficeHourEmailParams
): RenderedEmail {
  const options = {
    heading: "Office hours cancelled",
    intro: `The session between ${params.attendeeName} and ${params.mentorName} has been cancelled.`,
    params,
    cancelled: true,
    footer: "The attached update removes this event from your calendar.",
  };

  return {
    subject: `Cancelled: ${params.eventTitle}`,
    html: renderHtml(options),
    text: renderText(options),
  };
}
