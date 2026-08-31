import { sendEmail } from "@/lib/mailjet";
import { dedupeRecipients, getStartupContext } from "@/lib/startupRecipients";
import { milestoneReviewedEmail } from "@/lib/emails/milestoneReviewedEmail";
import { milestoneLabel } from "@/lib/milestones";

/**
 * Notifies a startup that an instructor signed one of their milestones off.
 *
 * Called from `reviewMilestone` behind `after()`, so it runs once the response is
 * already out. Nothing in here may throw: the review is committed by the time we
 * get called and a Mailjet hiccup must not surface as a failed review.
 */
export async function sendMilestoneReviewedEmail(
  orgId: string,
  milestone: number,
  unlockedMilestone: number | null,
): Promise<void> {
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
      textPart: text,
      htmlPart: html,
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
