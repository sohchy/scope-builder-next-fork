import type { RenderedEmail } from "@/lib/emails/officeHourBookingEmail";
import { formatDigestLine, type DigestLine } from "@/lib/milestoneDigest";

/**
 * The daily digest of milestones submitted for review — one mail a morning to the
 * instructor, one line per startup/milestone, replacing a stream of per-event
 * notifications.
 *
 * Deliberately plain: this is a worklist, not an announcement. The instructor
 * reads it to know whose milestone is waiting on them, so the lines are the whole
 * content and the text part is the canonical form — the HTML is the same lines in
 * a card.
 *
 * Styling mirrors `milestoneReviewedEmail.ts` and `officeHourBookingEmail.ts`:
 * hand-written inline-styled HTML, since mail clients ignore stylesheets.
 */

export interface MilestoneDigestEmailParams {
  /** Already resolved, sorted and deduped by `buildDigestLines`. Never empty —
   *  a digest with nothing to report is not sent at all. */
  lines: DigestLine[];
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
const LIST_STYLE =
  "margin:0 0 16px;padding:16px;background-color:#f6f7f9;border-radius:8px;";
const LINE_STYLE = "margin:0 0 8px;font-size:15px;line-height:24px;";
const LAST_LINE_STYLE = "margin:0;font-size:15px;line-height:24px;";
const FOOTER_STYLE =
  "margin:24px 0 0;font-size:13px;line-height:20px;color:#7b8794;";

const FOOTER_TEXT =
  "Open the Startup Journey app to review them on the Startups page.";

/** "1 milestone" / "3 milestones" */
function countPhrase(count: number): string {
  return `${count} milestone${count === 1 ? "" : "s"}`;
}

export function milestoneDigestEmail(
  params: MilestoneDigestEmailParams,
): RenderedEmail {
  const { lines } = params;

  const intro = `${countPhrase(lines.length)} submitted for review since the last digest:`;
  const rendered = lines.map(formatDigestLine);

  const html = `<div style="${WRAPPER_STYLE}">
  <div style="${CARD_STYLE}">
    <h1 style="${HEADING_STYLE}">${escapeHtml("Milestones submitted for review")}</h1>
    <p style="${PARAGRAPH_STYLE}">${escapeHtml(intro)}</p>
    <div style="${LIST_STYLE}">
${rendered
  .map(
    (line, index) =>
      `      <p style="${index === rendered.length - 1 ? LAST_LINE_STYLE : LINE_STYLE}">${escapeHtml(line)}</p>`,
  )
  .join("\n")}
    </div>
    <p style="${FOOTER_STYLE}">${escapeHtml(FOOTER_TEXT)}</p>
  </div>
</div>`;

  const text = [intro, "", ...rendered, "", FOOTER_TEXT].join("\n");

  return {
    subject: `${countPhrase(lines.length)} submitted for review`,
    html,
    text,
  };
}
