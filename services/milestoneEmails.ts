import { sendEmail } from "@/lib/email";
import { dedupeRecipients, getStartupContext } from "@/lib/startupRecipients";
import { milestoneReviewedEmail } from "@/lib/emails/milestoneReviewedEmail";
import { milestoneLabel } from "@/lib/milestones";
import { isMilestoneReviewedEmailEnabled } from "@/lib/milestoneDigest";

/**
 * Notifies a startup that an instructor signed one of their milestones off.
 *
 * Called from `reviewMilestone` behind `after()`, so it runs once the response is
 * already out. Nothing in here may throw: the review is committed by the time we
 * get called and a Resend hiccup must not surface as a failed review.
 *
 * Gated on MILESTONE_REVIEWED_EMAIL_ENABLED so this path can be turned off from
 * config without a revert. Note it is NOT the counterpart of the daily digest:
 * this announces the instructor's *sign-off* to the startup's team, while the
 * digest tells the instructor which milestones startups have *submitted*.
 * Different event, different recipients — turning one off does not cover the
 * other.
 */
export async function sendMilestoneReviewedEmail(
  orgId: string,
  milestone: number,
  unlockedMilestone: number | null,
): Promise<void> {
  if (!isMilestoneReviewedEmailEnabled()) {
    console.warn(
      `[milestone-email] skipped for ${orgId} milestone ${milestone} — MILESTONE_REVIEWED_EMAIL_ENABLED is off`,
    );
    return;
  }

  try {
    const startup = await getStartupContext(orgId);
    const recipients = dedupeRecipients(startup.recipients);

    if (recipients.length === 0) {
      console.warn(
        `[milestone-email] no recipients for ${orgId} milestone ${milestone}`,
      );
      return;
    }

    const { subject, html, text } = milestoneReviewedEmail({
      milestone,
      milestoneLabel: milestoneLabel(milestone),
      startupName: startup.name,
      unlocked: unlockedMilestone
        ? {
            milestone: unlockedMilestone,
            label: milestoneLabel(unlockedMilestone),
          }
        : null,
    });

    const result = await sendEmail({
      to: recipients,
      subject,
      text,
      html,
    });

    if (!result.ok) {
      console.error(
        `[milestone-email] send failed for ${orgId} milestone ${milestone}: ${result.error}`,
      );
    }
  } catch (err) {
    console.error(
      `[milestone-email] review notification for ${orgId} milestone ${milestone} failed`,
      err,
    );
  }
}
