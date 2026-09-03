/**
 * Manual trigger for the daily milestone digest, so it can be exercised without
 * waiting for 9am.
 *
 *   npm run digest:run                  # dry run against real data — renders, sends nothing
 *   npm run digest:run -- --sample      # dry run against fabricated data, no DB or Clerk
 *   npm run digest:run -- --send        # really send, and record what was sent
 *   npm run digest:run -- --send --to me@example.com   # send to me instead of the instructor
 *   npm run digest:run -- --send --sample --to me@example.com   # mail yourself the sample
 *
 * Dry run is the default on purpose: a real run writes dedup rows, and those rows
 * permanently suppress the milestones they cover.
 *
 * Both `--force` behaviours are always on here — the send-hour gate and
 * MILESTONE_DIGEST_ENABLED are for the cron, not for a human asking for it now.
 */
import { runMilestoneDigest, type MilestoneDigestDeps } from "../services/milestoneDigest";
import type { CompletedMilestone } from "../lib/milestoneDigest";

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** Enough startups to show the alphabetical sort and a startup with two milestones. */
function sampleDeps(): Partial<MilestoneDigestDeps> {
  const completed: CompletedMilestone[] = [
    { orgId: "org_zephyr", milestone: 1 },
    { orgId: "org_acme", milestone: 2 },
    { orgId: "org_acme", milestone: 1 },
    { orgId: "org_beacon", milestone: 0 },
    { orgId: "org_delta", milestone: 3 },
  ];

  return {
    loadCompleted: async () => completed,
    // Delta's milestone 3 went out in an earlier digest, so it must not reappear.
    loadAlreadySent: async () => [{ orgId: "org_delta", milestone: 3 }],
    loadStartupNames: async () => ({
      org_acme: "Acme Robotics",
      org_beacon: "beacon health",
      org_delta: "Delta Materials",
      org_zephyr: "Zephyr Analytics",
    }),
    // The org ids above are invented, so recording them would put junk rows in
    // the dedup table. A sample can be mailed; it is never recorded.
    record: async (entries) => {
      console.log(
        `(sample: ${entries.length} milestone(s) NOT recorded — fabricated org ids)`,
      );
    },
  };
}

async function main() {
  const sample = has("sample");
  const send = has("send");
  const to = flag("to")?.trim();

  if (to) {
    // runMilestoneDigest reads the recipient from config, so override it here.
    process.env.PRIMARY_APP_INSTRUCTOR = to;
  }

  const deps: Partial<MilestoneDigestDeps> = sample ? sampleDeps() : {};

  // Sending fabricated startups to the real instructor would be confusing, so a
  // sample send has to name its own recipient.
  if (sample && send && !to) {
    console.error(
      "--sample --send needs --to <email>: a sample must not go to PRIMARY_APP_INSTRUCTOR.",
    );
    process.exitCode = 1;
    return;
  }

  const result = await runMilestoneDigest({
    force: true,
    dryRun: !send,
    deps,
  });

  if (result.status === "skipped") {
    const explanation: Record<string, string> = {
      "no-recipient":
        "PRIMARY_APP_INSTRUCTOR is unset. Set it in .env, or pass --to <email>.",
      "nothing-to-report":
        "No submitted milestones without a digest row. Nothing would be sent.",
      disabled: "MILESTONE_DIGEST_ENABLED is off.",
      "outside-send-hour": "Outside the send hour (unexpected with --force).",
    };
    console.log(`skipped : ${result.reason}`);
    console.log(explanation[result.reason] ?? "");
    return;
  }

  if (result.status === "failed") {
    console.error(`failed : ${result.reason}`);
    process.exitCode = 1;
    return;
  }

  console.log(`recipient : ${result.recipient}`);
  console.log(`milestones: ${result.reported.length}`);
  console.log(`subject   : ${result.subject}`);
  console.log("\n--- text part ---");
  console.log(result.text);
  console.log("--- end ---\n");

  if (result.status === "dry-run") {
    console.log(
      "Dry run — nothing sent, nothing recorded. Pass --send to deliver.",
    );
    return;
  }

  console.log(
    sample
      ? `Sent the sample to ${result.recipient}. Nothing was recorded.`
      : `Sent, and recorded ${result.reported.length} milestone(s).`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
