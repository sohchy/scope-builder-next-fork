import { NextRequest, NextResponse } from "next/server";

import { runMilestoneDigest } from "@/services/milestoneDigest";
import {
  getMilestoneDigestHour,
  getMilestoneDigestTimeZone,
} from "@/lib/milestoneDigest";

/**
 * Cron entry point for the daily milestone digest.
 *
 * Fired hourly (see vercel.json) rather than once a day, because a cron schedule
 * is UTC and the send time is a wall-clock time in America/Chicago — an hourly
 * poll with the zone check in `isDigestHour` lands on the right hour on both sides
 * of a DST switch, and lets the hour move by env var instead of a redeploy.
 *
 * Cheap on the 23 hours that do nothing: the gate runs before any query.
 *
 * Exempt from Clerk in middleware.ts (there is no signed-in user on a cron
 * request), so CRON_SECRET is the only thing standing in front of it. Vercel Cron
 * sends it automatically as a bearer token.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();

  // Unset is a local-dev convenience only — in production an unauthenticated
  // route that sends mail is not something to leave open.
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error(
        "[milestone-digest] refusing to run — CRON_SECRET is not configured",
      );
      return false;
    }
    return true;
  }

  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runMilestoneDigest();

  if (result.status === "failed") {
    // 500 so the platform's cron log shows the failure and a retry is warranted.
    // Nothing was recorded, so the next run picks the same milestones up.
    return NextResponse.json({ status: "failed", reason: result.reason }, {
      status: 500,
    });
  }

  if (result.status === "skipped") {
    return NextResponse.json({
      status: "skipped",
      reason: result.reason,
      sendHour: getMilestoneDigestHour(),
      timeZone: getMilestoneDigestTimeZone(),
    });
  }

  return NextResponse.json({
    status: result.status,
    reported: result.reported.length,
  });
}
