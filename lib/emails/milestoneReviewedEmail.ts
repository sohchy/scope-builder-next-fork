import type { RenderedEmail } from "@/lib/emails/officeHourBookingEmail";

/**
 * The note a startup gets when an instructor signs a milestone off from the
 * Startups page. Deliberately short: the instructor's review notes stay on the
 * instructor's side, so this only carries the two facts the team acts on — the
 * milestone is complete, and (when the instructor ticked the box) the next one is
 * open.
 *
 * Styling mirrors `officeHourBookingEmail.ts`: hand-written inline-styled HTML,
 * since mail clients ignore stylesheets.
 */

export interface MilestoneReviewedEmailParams {
  milestone: number;
  /** `milestoneLabel(milestone)` from lib/milestones.ts */
  milestoneLabel: string;
  startupName: string | null;
  /** The milestone this review opened up, or null when nothing was unlocked. */
  unlocked: { milestone: number; label: string } | null;
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
const UNLOCKED_STYLE =
  "margin:0 0 16px;padding:16px;background-color:#f6f7f9;border-radius:8px;font-size:15px;line-height:24px;";
const FOOTER_STYLE =
  "margin:24px 0 0;font-size:13px;line-height:20px;color:#7b8794;";

const FOOTER_TEXT =
  "Open the Startup Journey app to pick up where you left off.";

/** "Milestone 2 (Deep Dive into Journey)" */
function describe(milestone: number, label: string): string {
  return `Milestone ${milestone} (${label})`;
}

export function milestoneReviewedEmail(
  params: MilestoneReviewedEmailParams,
): RenderedEmail {
  const { milestone, milestoneLabel, startupName, unlocked } = params;

  const reviewed = describe(milestone, milestoneLabel);
  const completeLine = `${reviewed} has been reviewed and marked Complete!`;
  const unlockedLine = unlocked
    ? `Also, ${describe(unlocked.milestone, unlocked.label)} has been unlocked!`
    : null;

  const greeting = startupName ? `Hey ${startupName},` : "Hey,";

  const html = `<div style="${WRAPPER_STYLE}">
  <div style="${CARD_STYLE}">
    <h1 style="${HEADING_STYLE}">${escapeHtml(`Milestone ${milestone} reviewed`)}</h1>
    <p style="${PARAGRAPH_STYLE}">${escapeHtml(greeting)}</p>
    <p style="${PARAGRAPH_STYLE}">${escapeHtml(completeLine)}</p>
    ${
      unlockedLine
        ? `<p style="${UNLOCKED_STYLE}">${escapeHtml(unlockedLine)}</p>`
        : ""
    }
    <p style="${FOOTER_STYLE}">${escapeHtml(FOOTER_TEXT)}</p>
  </div>
</div>`;

  const text = [
    greeting,
    "",
    completeLine,
    ...(unlockedLine ? ["", unlockedLine] : []),
    "",
    FOOTER_TEXT,
  ].join("\n");

  return {
    subject: `Milestone ${milestone} reviewed — ${milestoneLabel}`,
    html,
    text,
  };
}
