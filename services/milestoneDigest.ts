import { isInCurrentCohort } from "@/lib/cohort";
import { sendEmail, type SendEmailInput, type SendEmailResult } from "@/lib/email";
import { milestoneDigestEmail } from "@/lib/emails/milestoneDigestEmail";
import {
  buildDigestLines,
  getPrimaryInstructorEmail,
  isDigestHour,
  isMilestoneDigestEnabled,
  selectUnreportedMilestones,
  type CompletedMilestone,
  type DigestLine,
} from "@/lib/milestoneDigest";

/**
 * The daily digest job: find the milestones startups have submitted for review and
 * not yet been told about, mail the instructor one summary, then record what was
 * reported so it never goes out twice.
 *
 * Safe to run repeatedly. Nothing here tracks "did today's run happen" — the dedup
 * table is the whole mechanism, so a restart, a retry or a manual trigger an hour
 * later re-selects an empty set and sends nothing. That holds across days too, not
 * just within one.
 *
 * The ordering is load → send → record, and the record step runs only on a
 * successful send: a Resend failure leaves the rows unreported so the next run
 * picks them up again.
 */

/**
 * Every side effect the job has, injectable so the selection, formatting and
 * send/record ordering can be tested without a database, a Clerk round trip or a
 * live Resend key. `defaultDeps()` is what production runs.
 */
export interface MilestoneDigestDeps {
  /** Milestones submitted for review, reported or not. */
  loadCompleted(): Promise<CompletedMilestone[]>;
  /** Pairs already announced in an earlier digest. */
  loadAlreadySent(): Promise<CompletedMilestone[]>;
  /** Reportable startups keyed by org id — the digest ignores orgs absent here. */
  loadStartupNames(): Promise<Record<string, string>>;
  send(input: SendEmailInput): Promise<SendEmailResult>;
  record(entries: CompletedMilestone[]): Promise<void>;
}

export type MilestoneDigestResult =
  | {
      status: "sent" | "dry-run";
      recipient: string;
      reported: CompletedMilestone[];
      lines: DigestLine[];
      subject: string;
      text: string;
      html: string;
    }
  | {
      status: "skipped";
      reason:
        | "disabled"
        | "outside-send-hour"
        | "no-recipient"
        | "nothing-to-report";
    }
  | { status: "failed"; reason: string };

export interface RunMilestoneDigestOptions {
  /** Instant the send-hour gate is judged against. */
  now?: Date;
  /** Ignore both the enabled flag and the send-hour gate. Manual triggers only. */
  force?: boolean;
  /** Select and render, but neither send nor record. */
  dryRun?: boolean;
  deps?: Partial<MilestoneDigestDeps>;
}

/**
 * Prisma and Clerk are imported lazily, per call, rather than at module scope:
 * importing `lib/prisma` constructs a PrismaClient, which the unit tests and
 * `--sample` runs (both of which replace every dep that touches them) have no
 * database for.
 */
export function defaultDeps(): MilestoneDigestDeps {
  return {
    loadCompleted: async () => {
      const { prisma } = await import("@/lib/prisma");
      // "Completed" is the startup submitting for review, not the instructor's
      // later sign-off — see reviewMilestone in services/milestoneAccess.ts.
      const rows = await prisma.milestoneAccess.findMany({
        where: { submitted_at: { not: null } },
        select: { org_id: true, milestone: true },
      });
      return rows.map((row) => ({
        orgId: row.org_id,
        milestone: row.milestone,
      }));
    },

    loadAlreadySent: async () => {
      const { prisma } = await import("@/lib/prisma");
      const rows = await prisma.milestoneDigestNotification.findMany({
        select: { org_id: true, milestone: true },
      });
      return rows.map((row) => ({
        orgId: row.org_id,
        milestone: row.milestone,
      }));
    },

    loadStartupNames: async () => {
      // Same scoping as the pages the instructor reviews from (/startups,
      // /teams-dashboard): the current cohort only. A submission from an org
      // outside it is left unreported rather than recorded, so it would surface
      // if that org ever joined the current cohort.
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const organizations = await client.organizations.getOrganizationList({
        limit: 200,
      });

      const names: Record<string, string> = {};

      for (const org of organizations.data) {
        if (!isInCurrentCohort(org.publicMetadata)) continue;
        names[org.id] = org.name ?? "";
      }

      return names;
    },

    send: sendEmail,

    record: async (entries) => {
      const { prisma } = await import("@/lib/prisma");
      await prisma.milestoneDigestNotification.createMany({
        data: entries.map((entry) => ({
          org_id: entry.orgId,
          milestone: entry.milestone,
        })),
        // Two overlapping runs would otherwise collide on the unique pair. The
        // loser skipping its rows is exactly right: they are already recorded.
        skipDuplicates: true,
      });
    },
  };
}

export async function runMilestoneDigest(
  options: RunMilestoneDigestOptions = {},
): Promise<MilestoneDigestResult> {
  const { now = new Date(), force = false, dryRun = false } = options;
  const deps = { ...defaultDeps(), ...options.deps };

  if (!force && !isMilestoneDigestEnabled()) {
    console.warn("[milestone-digest] skipped — MILESTONE_DIGEST_ENABLED is off");
    return { status: "skipped", reason: "disabled" };
  }

  if (!force && !isDigestHour(now)) {
    return { status: "skipped", reason: "outside-send-hour" };
  }

  const recipient = getPrimaryInstructorEmail();

  // Missing config is a warning, not a crash: the cron should keep running so the
  // digest starts working the moment the address is filled in.
  if (!recipient) {
    console.warn(
      "[milestone-digest] skipped — PRIMARY_APP_INSTRUCTOR is unset or empty",
    );
    return { status: "skipped", reason: "no-recipient" };
  }

  try {
    const [completed, alreadySent, names] = await Promise.all([
      deps.loadCompleted(),
      deps.loadAlreadySent(),
      deps.loadStartupNames(),
    ]);

    const reported = selectUnreportedMilestones(completed, alreadySent).filter(
      (entry) => entry.orgId in names,
    );

    // No "nothing to report" mail, by design.
    if (reported.length === 0) {
      return { status: "skipped", reason: "nothing-to-report" };
    }

    const lines = buildDigestLines(reported, names);
    const { subject, html, text } = milestoneDigestEmail({ lines });

    if (dryRun) {
      return {
        status: "dry-run",
        recipient,
        reported,
        lines,
        subject,
        text,
        html,
      };
    }

    const result = await deps.send({
      to: [{ email: recipient }],
      subject,
      text,
      html,
    });

    // Nothing is recorded, so the next run retries the same milestones.
    if (!result.ok) {
      console.error(`[milestone-digest] send failed — ${result.error}`);
      return { status: "failed", reason: result.error };
    }

    try {
      await deps.record(reported);
    } catch (err) {
      // The mail is already out, so the run did succeed — but these milestones
      // will be reported again tomorrow. Loud, because it is the one path that
      // can double-email.
      console.error(
        `[milestone-digest] SENT but failed to record ${reported.length} milestone(s) — they will repeat in the next digest`,
        err,
      );
    }

    console.log(
      `[milestone-digest] sent ${reported.length} milestone(s) to ${recipient}`,
    );

    return { status: "sent", recipient, reported, lines, subject, text, html };
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    console.error(`[milestone-digest] run failed — ${reason}`, err);
    return { status: "failed", reason };
  }
}
