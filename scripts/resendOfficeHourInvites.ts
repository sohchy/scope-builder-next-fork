/**
 * One-off backfill: re-sends office-hour invites whose original .ics was built
 * before OFFICE_HOURS_TIMEZONE was set, so it carried an Eastern instant for a
 * Central slot — an hour off in everyone's calendar.
 *
 * Each send reuses the booking's UID with SEQUENCE + 1, so calendars MOVE the
 * existing event rather than adding a second one.
 *
 *   npm run oh:resend -- --csv ./bookings.csv                      # dry run, sends nothing
 *   npm run oh:resend -- --csv ./bookings.csv --test me@x.com      # everything to one address
 *   npm run oh:resend -- --csv ./bookings.csv --test me@x.com --limit 1
 *   npm run oh:resend -- --csv ./bookings.csv --send               # the real thing
 *
 * Dry run is the default on purpose: --send mails real people and writes
 * ics_sequence back to every booking it touches.
 *
 * Flags:
 *   --csv <path>     file of booking ids (one per line, or a column named
 *                    id/booking_id/bookingId in a headered CSV)
 *   --test <email>   deliver to this address only; does NOT touch the DB
 *   --send           deliver to the real audience and persist the bumped sequence
 *   --limit <n>      only process the first n ids
 *   --delay <ms>     pause between sends (default 600, keeps under Resend's rate limit)
 */
import { readFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";

import { getOfficeHoursTimeZone } from "../lib/officeHoursCalendar";
import {
  sendBookingTimeZoneFix,
  type TimeZoneFixOutcome,
} from "../services/officeHoursEmails";

function flag(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index === -1 ? undefined : process.argv[index + 1];
}

function has(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

const ID_COLUMNS = ["id", "booking_id", "bookingid", "booking id"];

/**
 * Deliberately tolerant: the file is hand-exported, so it may or may not have a
 * header, may be a bare list of ids, and may have quotes or a trailing BOM.
 */
function readBookingIds(path: string): string[] {
  const raw = readFileSync(path, "utf8").replace(/^﻿/, "");
  const rows = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (rows.length === 0) return [];

  const cells = (line: string) =>
    line.split(",").map((c) => c.trim().replace(/^"(.*)"$/, "$1"));

  const header = cells(rows[0]).map((c) => c.toLowerCase());
  const idColumn = header.findIndex((c) => ID_COLUMNS.includes(c));

  // No recognisable header row — treat the first cell of every line as the id.
  if (idColumn === -1) {
    return rows.map((line) => cells(line)[0]).filter(Boolean);
  }

  return rows
    .slice(1)
    .map((line) => cells(line)[idColumn])
    .filter(Boolean);
}

function formatWhen(start: Date, end: Date, timeZone: string): string {
  const fmt = (d: Date) =>
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(d);
  return `${fmt(start)} – ${new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeStyle: "short",
  }).format(end)}`;
}

function describe(outcome: TimeZoneFixOutcome): string {
  if (outcome.status === "missing") {
    return `${outcome.bookingId}  MISSING — no such booking`;
  }

  const when = formatWhen(outcome.start, outcome.end, outcome.timeZone);
  const to = outcome.recipients.map((r) => r.email).join(", ") || "(none)";
  const seq = `seq ${outcome.sequence}${outcome.sequencePersisted ? " persisted" : ""}`;
  const label =
    outcome.status === "sent"
      ? "SENT"
      : outcome.status === "dry-run"
        ? "DRY"
        : `FAILED — ${outcome.result?.ok === false ? outcome.result.error : "unknown"}`;

  return [
    `${outcome.bookingId}  ${label}`,
    `    when : ${when}`,
    `    to   : ${to}`,
    `    ics  : ${seq}`,
  ].join("\n");
}

async function main() {
  const csvPath = flag("csv");
  const testEmail = flag("test");
  const send = has("send");
  const limit = Number(flag("limit") ?? Number.POSITIVE_INFINITY);
  const delayMs = Number(flag("delay") ?? 600);

  if (!csvPath) {
    console.error("Missing --csv <path to booking ids>");
    process.exitCode = 1;
    return;
  }

  if (send && testEmail) {
    console.error(
      "--send and --test are mutually exclusive. --test delivers everything to one address.",
    );
    process.exitCode = 1;
    return;
  }

  let ids = readBookingIds(csvPath);
  const total = ids.length;
  if (Number.isFinite(limit)) ids = ids.slice(0, limit);

  const mode = send ? "SEND (real recipients)" : testEmail ? `TEST → ${testEmail}` : "DRY RUN";

  console.log(`timezone : ${getOfficeHoursTimeZone()}`);
  console.log(`csv      : ${csvPath}`);
  console.log(`bookings : ${ids.length}${ids.length < total ? ` of ${total}` : ""}`);
  console.log(`mode     : ${mode}\n`);

  if (ids.length === 0) {
    console.error("No booking ids found in the CSV.");
    process.exitCode = 1;
    return;
  }

  const counts = { sent: 0, "dry-run": 0, failed: 0, missing: 0 };

  for (const [index, bookingId] of ids.entries()) {
    const outcome = await sendBookingTimeZoneFix(bookingId, {
      overrideRecipients: testEmail ? [{ email: testEmail }] : undefined,
      // Neither a dry run nor a test send is allowed to consume a sequence
      // number, or the real run would reuse it and clients would ignore it.
      dryRun: !send && !testEmail,
      persistSequence: send,
    });

    counts[outcome.status] += 1;
    console.log(describe(outcome));

    if ((send || testEmail) && index < ids.length - 1) await sleep(delayMs);
  }

  console.log(
    `\ndone — sent ${counts.sent}, dry ${counts["dry-run"]}, failed ${counts.failed}, missing ${counts.missing}`,
  );

  if (counts.failed > 0 || counts.missing > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => process.exit(process.exitCode ?? 0));
