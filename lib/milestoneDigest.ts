import { TZDate } from "@date-fns/tz";

/**
 * Configuration and pure logic for the daily milestone digest — the one email the
 * instructor gets each morning listing the milestones startups submitted for
 * review since the last digest.
 *
 * Everything here is data-only and side-effect free (no Prisma, no Clerk, no
 * Resend) so the selection and formatting rules can be tested without a database.
 * The orchestration lives in `services/milestoneDigest.ts`.
 */

/** Wall-clock zone the send hour is read in. Overridden by MILESTONE_DIGEST_TIMEZONE. */
export const DEFAULT_MILESTONE_DIGEST_TIMEZONE = "America/Chicago";

/** 9am local. Overridden by MILESTONE_DIGEST_HOUR. */
export const DEFAULT_MILESTONE_DIGEST_HOUR = 9;

/**
 * A milestone a startup has submitted for review. "Completed" throughout the
 * digest means `milestone_access.submitted_at is not null` — the startup declaring
 * it done — not the instructor's later sign-off, which is what
 * `sendMilestoneReviewedEmail` announces back to the team.
 */
export interface CompletedMilestone {
  orgId: string;
  milestone: number;
}

/** One rendered line of the digest, already resolved to a display name. */
export interface DigestLine {
  startupName: string;
  milestone: number;
}

/** `${orgId}:${milestone}` — the dedup identity, matching the table's unique pair. */
export function digestKey(entry: CompletedMilestone): string {
  return `${entry.orgId}:${entry.milestone}`;
}

/**
 * Reads a boolean env flag. Anything unset falls back to `fallback`; only the
 * explicit off words turn a defaulted-on flag off, so a typo fails safe rather
 * than silently disabling a mail path.
 */
function readFlag(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return fallback;
  if (["false", "0", "off", "no"].includes(normalized)) return false;
  if (["true", "1", "on", "yes"].includes(normalized)) return true;
  return fallback;
}

export function getMilestoneDigestTimeZone(): string {
  return (
    process.env.MILESTONE_DIGEST_TIMEZONE?.trim() ||
    DEFAULT_MILESTONE_DIGEST_TIMEZONE
  );
}

/**
 * The local hour the digest goes out, 0–23. Out-of-range or non-numeric values
 * fall back to the default with a warning rather than throwing: a fat-fingered
 * env var should not take the job down, and 9am is a safe thing to keep doing.
 */
export function getMilestoneDigestHour(): number {
  const raw = process.env.MILESTONE_DIGEST_HOUR?.trim();

  if (!raw) return DEFAULT_MILESTONE_DIGEST_HOUR;

  const hour = Number(raw);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    console.warn(
      `[milestone-digest] MILESTONE_DIGEST_HOUR="${raw}" is not an hour 0-23 — falling back to ${DEFAULT_MILESTONE_DIGEST_HOUR}`,
    );
    return DEFAULT_MILESTONE_DIGEST_HOUR;
  }

  return hour;
}

/** Master switch for the digest. On unless explicitly turned off. */
export function isMilestoneDigestEnabled(): boolean {
  return readFlag(process.env.MILESTONE_DIGEST_ENABLED, true);
}

/**
 * The per-milestone sign-off mail to the startup's team
 * (`sendMilestoneReviewedEmail`). On unless explicitly turned off — it announces a
 * *different* event to *different* people than the digest, so the digest shipping
 * is not a reason to silence it. The flag exists so it can be turned off from
 * config without a revert.
 */
export function isMilestoneReviewedEmailEnabled(): boolean {
  return readFlag(process.env.MILESTONE_REVIEWED_EMAIL_ENABLED, true);
}

/** The instructor the digest goes to, or null when unconfigured. */
export function getPrimaryInstructorEmail(): string | null {
  return process.env.PRIMARY_APP_INSTRUCTOR?.trim() || null;
}

/**
 * Whether `now` falls in the configured send hour, read as wall-clock time in the
 * configured zone.
 *
 * The cron fires hourly in UTC and this is the gate that turns it into "9am in
 * Chicago" — TZDate resolves the zone's offset for that instant, so the hour is
 * right on both sides of a DST switch with no offset arithmetic anywhere.
 *
 * Hour granularity is deliberate: the dedup table, not the clock, is what stops a
 * second send, so a run landing twice in the same hour is harmless.
 */
export function isDigestHour(
  now: Date = new Date(),
  hour: number = getMilestoneDigestHour(),
  timeZone: string = getMilestoneDigestTimeZone(),
): boolean {
  return new TZDate(now, timeZone).getHours() === hour;
}

/**
 * The milestones to report: submitted, and not already in the dedup table.
 *
 * An anti-join in memory rather than SQL — there is no relation between
 * `milestone_access` and `milestone_digest_notifications`, and the data is at most
 * six rows per startup, so joining here keeps the rule testable without a database.
 */
export function selectUnreportedMilestones(
  completed: CompletedMilestone[],
  alreadySent: CompletedMilestone[],
): CompletedMilestone[] {
  const sent = new Set(alreadySent.map(digestKey));
  return completed.filter((entry) => !sent.has(digestKey(entry)));
}

/**
 * Resolves each entry to a display name and sorts the way the digest reads:
 * alphabetically by startup, then by milestone for a startup that submitted more
 * than one since the last run.
 *
 * An org whose Clerk name did not resolve falls back to its id rather than being
 * dropped — a line the instructor has to decode beats a milestone that silently
 * never gets reported (and, having been reported, it is recorded and won't recur).
 */
export function buildDigestLines(
  entries: CompletedMilestone[],
  namesByOrgId: Record<string, string>,
): DigestLine[] {
  return entries
    .map((entry) => ({
      startupName: namesByOrgId[entry.orgId]?.trim() || entry.orgId,
      milestone: entry.milestone,
    }))
    .sort(
      (a, b) =>
        a.startupName.localeCompare(b.startupName, "en", {
          sensitivity: "base",
        }) || a.milestone - b.milestone,
    );
}

/** "Acme Robotics :: Milestone 2 completed" */
export function formatDigestLine(line: DigestLine): string {
  return `${line.startupName} :: Milestone ${line.milestone} completed`;
}
