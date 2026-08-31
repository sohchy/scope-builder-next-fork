/**
 * One-off: copy a real org's data into an example set for the read-only
 * /examples pages. Run once (and re-run to refresh); the user invokes it, not CI.
 *
 *   npx tsx scripts/copyExample.ts <sourceOrgId> [exampleNumber]
 *
 * Needs DATABASE_URL and LIVEBLOCKS_SECRET_KEY in the environment (same as the
 * prisma seed). It copies both:
 *   - DB rows  → stamped with example_number = N and a synthetic org_id ("example-N")
 *   - the Liveblocks journey-map room → problem-journey-example-N
 *
 * Node/problem ids in the canvas are preserved, so the copied
 * ProblemInterviewQuestion rows (which address them by id) stay valid.
 */
import { Liveblocks } from "@liveblocks/node";

import { PrismaClient, Prisma } from "../lib/generated/prisma";
import { exampleOrgId, exampleRoomId } from "../lib/examples";

const prisma = new PrismaClient();
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

async function copyDatabase(sourceOrgId: string, exampleNumber: number) {
  const exOrg = exampleOrgId(exampleNumber);

  await prisma.$transaction(
    async (tx) => {
    // Wipe any previous copy for this example number so re-runs are idempotent.
    // Answers/questions cascade off participants, but delete explicitly by
    // example_number to also catch orphans.
    await tx.problemInterviewAnswer.deleteMany({ where: { example_number: exampleNumber } });
    await tx.problemInterviewQuestion.deleteMany({ where: { example_number: exampleNumber } });
    await tx.problemHypothesisOrder.deleteMany({ where: { example_number: exampleNumber } });
    await tx.problemHypothesisSummary.deleteMany({ where: { example_number: exampleNumber } });
    await tx.participant.deleteMany({ where: { example_number: exampleNumber } });
    await tx.participantTag.deleteMany({ where: { example_number: exampleNumber } });
    await tx.stakeholderJobTitles.deleteMany({ where: { example_number: exampleNumber } });
    await tx.interviewMilestone.deleteMany({ where: { example_number: exampleNumber } });
    await tx.stakeholderRow.deleteMany({ where: { example_number: exampleNumber } });
    await tx.marketSegment.deleteMany({ where: { example_number: exampleNumber } });
    await tx.marketSegmentNote.deleteMany({ where: { example_number: exampleNumber } });
    await tx.getStartedReview.deleteMany({ where: { example_number: exampleNumber } });

    // ---- Straight copies (drop autoincrement id, restamp org + example) ----
    const jobTitles = await tx.stakeholderJobTitles.findMany({ where: { org_id: sourceOrgId } });
    for (const j of jobTitles) {
      await tx.stakeholderJobTitles.create({
        data: { name: j.name, role: j.role, org_id: exOrg, example_number: exampleNumber },
      });
    }

    const tags = await tx.participantTag.findMany({ where: { org_id: sourceOrgId } });
    for (const t of tags) {
      await tx.participantTag.create({
        data: { name: t.name, org_id: exOrg, example_number: exampleNumber },
      });
    }

    const milestones = await tx.interviewMilestone.findMany({ where: { org_id: sourceOrgId } });
    for (const m of milestones) {
      await tx.interviewMilestone.create({
        data: {
          title: m.title,
          date: m.date,
          documented_goal: m.documented_goal,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
    }

    const stakeholderRows = await tx.stakeholderRow.findMany({ where: { org_id: sourceOrgId } });
    for (const r of stakeholderRows) {
      await tx.stakeholderRow.create({
        data: {
          stakeholder_type: r.stakeholder_type,
          value: r.value,
          order: r.order,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
    }

    const segments = await tx.marketSegment.findMany({ where: { org_id: sourceOrgId } });
    for (const s of segments) {
      await tx.marketSegment.create({
        data: {
          name: s.name,
          notes: s.notes,
          beachhead: s.beachhead,
          order: s.order,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
    }

    const note = await tx.marketSegmentNote.findUnique({ where: { org_id: sourceOrgId } });
    if (note) {
      await tx.marketSegmentNote.create({
        data: { content: note.content, org_id: exOrg, example_number: exampleNumber },
      });
    }

    // GetStarted reviews reference global cards/items by id — copy the ids verbatim.
    const reviews = await tx.getStartedReview.findMany({ where: { org_id: sourceOrgId } });
    for (const rv of reviews) {
      await tx.getStartedReview.create({
        data: {
          card_id: rv.card_id,
          item_id: rv.item_id,
          reviewed: rv.reviewed,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
    }

    // ---- Id-remapped copies ----
    const participantIdMap = new Map<string, string>();
    const participants = await tx.participant.findMany({ where: { org_id: sourceOrgId } });
    for (const p of participants) {
      const created = await tx.participant.create({
        data: {
          name: p.name,
          job_title: p.job_title,
          role: p.role,
          relationship: p.relationship,
          market_segment: p.market_segment,
          contact_info: p.contact_info,
          rationale: p.rationale,
          blocking_issues: p.blocking_issues,
          hypothesis_to_validate: p.hypothesis_to_validate,
          learnings: p.learnings,
          notes: p.notes,
          tags: p.tags,
          status: p.status,
          pending_review: p.pending_review,
          scheduled_date: p.scheduled_date,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
      participantIdMap.set(p.id, created.id);
    }

    const questionIdMap = new Map<string, string>();
    const questions = await tx.problemInterviewQuestion.findMany({ where: { org_id: sourceOrgId } });
    for (const q of questions) {
      const created = await tx.problemInterviewQuestion.create({
        data: {
          node_id: q.node_id,
          problem_id: q.problem_id,
          bank_question_id: q.bank_question_id,
          title: q.title,
          response_type: q.response_type,
          options: q.options as Prisma.InputJsonValue[],
          sort_order: q.sort_order,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
      questionIdMap.set(q.id, created.id);
    }

    // No id remapping: these rows are keyed by node/problem/bank ids, which the
    // Liveblocks room copy carries over verbatim.
    const hypothesisOrder = await tx.problemHypothesisOrder.findMany({
      where: { org_id: sourceOrgId },
    });
    for (const h of hypothesisOrder) {
      await tx.problemHypothesisOrder.create({
        data: {
          node_id: h.node_id,
          problem_id: h.problem_id,
          bank_question_id: h.bank_question_id,
          sort_order: h.sort_order,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
    }

    // Keyed the same way as the ordering rows above, so likewise no id remapping.
    const hypothesisSummaries = await tx.problemHypothesisSummary.findMany({
      where: { org_id: sourceOrgId },
    });
    for (const s of hypothesisSummaries) {
      await tx.problemHypothesisSummary.create({
        data: {
          node_id: s.node_id,
          problem_id: s.problem_id,
          bank_question_id: s.bank_question_id,
          summary: s.summary,
          validation_level: s.validation_level,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
    }

    const answers = await tx.problemInterviewAnswer.findMany({ where: { org_id: sourceOrgId } });
    for (const a of answers) {
      const newQuestionId = questionIdMap.get(a.question_id);
      const newParticipantId = participantIdMap.get(a.participant_id);
      if (!newQuestionId || !newParticipantId) continue; // skip dangling references
      await tx.problemInterviewAnswer.create({
        data: {
          question_id: newQuestionId,
          participant_id: newParticipantId,
          value: a.value,
          org_id: exOrg,
          example_number: exampleNumber,
        },
      });
    }

    console.log(
      `DB: ${jobTitles.length} job titles, ${tags.length} tags, ${milestones.length} milestones, ` +
        `${stakeholderRows.length} stakeholder rows, ${segments.length} segments, ` +
        `${participants.length} participants, ${questions.length} questions, ` +
        `${hypothesisOrder.length} hypothesis orders, ${hypothesisSummaries.length} hypothesis summaries, ` +
        `${answers.length} answers copied.`,
      );
    },
    // Many sequential round-trips over the pooled connection — well past Prisma's
    // 5s default, so give the interactive transaction plenty of room.
    { timeout: 120_000, maxWait: 20_000 },
  );
}

async function copyLiveblocks(sourceOrgId: string, exampleNumber: number) {
  const sourceRoom = `problem-journey-${sourceOrgId}`;
  const targetRoom = exampleRoomId(exampleNumber);

  // Read the source storage in its LiveObject-wrapped form — the exact shape
  // initializeStorageDocument expects back.
  const doc = await liveblocks.getStorageDocument(sourceRoom);

  // Reset the target room so re-runs don't collide with existing storage.
  try {
    await liveblocks.deleteRoom(targetRoom);
  } catch {
    // Room may not exist yet — fine.
  }

  await liveblocks.getOrCreateRoom(targetRoom, { defaultAccesses: [] });
  await liveblocks.initializeStorageDocument(targetRoom, doc as never);

  console.log(`Liveblocks: copied ${sourceRoom} → ${targetRoom}.`);
}

async function main() {
  const sourceOrgId = process.argv[2];
  const exampleNumber = Number(process.argv[3] ?? 1);

  if (!sourceOrgId) {
    console.error("Usage: npx tsx scripts/copyExample.ts <sourceOrgId> [exampleNumber]");
    process.exit(1);
  }
  if (!Number.isInteger(exampleNumber) || exampleNumber < 1) {
    console.error("exampleNumber must be a positive integer.");
    process.exit(1);
  }

  console.log(`Copying org ${sourceOrgId} → example #${exampleNumber}…`);
  await copyDatabase(sourceOrgId, exampleNumber);
  await copyLiveblocks(sourceOrgId, exampleNumber);
  console.log("Done.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
