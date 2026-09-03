/**
 * Backfill: mark every already-submitted milestone as reported, so the first real
 * digest only picks up new activity.
 *
 *   npx tsx --env-file=.env scripts/seedMilestoneDigestNotifications.ts
 *   npx tsx --env-file=.env scripts/seedMilestoneDigestNotifications.ts --dry-run
 *
 * Run this once, right after `npx prisma db push` adds the table. Without it the
 * first digest mails the whole history of the cohort in one go.
 *
 * No cutoff-date logic on purpose: the existing milestone data is throwaway test
 * data, so "everything submitted so far" is the right line to draw.
 *
 * Idempotent — `skipDuplicates` against the unique (org_id, milestone) pair means
 * a second run inserts nothing, and running it later only ever suppresses more.
 */
import { PrismaClient } from "../lib/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const dryRun = process.argv.includes("--dry-run");

  const submitted = await prisma.milestoneAccess.findMany({
    where: { submitted_at: { not: null } },
    select: { org_id: true, milestone: true, submitted_at: true },
    orderBy: [{ org_id: "asc" }, { milestone: "asc" }],
  });

  const existing = await prisma.milestoneDigestNotification.count();

  console.log(`submitted milestones : ${submitted.length}`);
  console.log(`rows already present : ${existing}`);

  if (submitted.length === 0) {
    console.log("Nothing to backfill.");
    return;
  }

  for (const row of submitted) {
    console.log(
      `  ${row.org_id} :: Milestone ${row.milestone} (submitted ${row.submitted_at?.toISOString()})`,
    );
  }

  if (dryRun) {
    console.log("\nDry run. Re-run without --dry-run to write these rows.");
    return;
  }

  const result = await prisma.milestoneDigestNotification.createMany({
    data: submitted.map((row) => ({
      org_id: row.org_id,
      milestone: row.milestone,
      // Backdated to the submission, not to now: `sent_at` reads as "the digest
      // covers up to here", and no digest ever actually went out for these.
      sent_at: row.submitted_at ?? new Date(),
    })),
    skipDuplicates: true,
  });

  console.log(`\nInserted ${result.count} row(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
