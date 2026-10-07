"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/lib/generated/prisma";
import {
  normalizeImportKey,
  parseImportedInterviewCsv,
  readImportedData,
} from "@/lib/importedInterview";
import type {
  SummaryHypothesis,
  SummaryQuestion,
} from "@/app/(auth)/participants/interviews/_components/InterviewSummary/types";

export type ImportInterviewCsvInput = {
  participantId: string;
  csvText: string;
  fileName: string;
};

export type ImportInterviewCsvResult = { ok: true } | { ok: false; errors: string[] };

export type ImportedInterviewAnswerInput = {
  participantId: string;
  /** The question's id inside the stored import, not a ProblemInterviewQuestion id. */
  questionId: string;
  value: string;
};

export type ImportedHypothesisSummaryInput = {
  hypothesisKey: string;
  /** Omitted leaves whatever is stored — the two fields are edited independently. */
  summary?: string;
  /** 1..5, or 0 to clear the rating. */
  validationLevel?: number;
};

async function requireOrg() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  return orgId;
}

/**
 * Replace a participant's imported interview with the given CSV. The file is validated
 * here rather than in the browser so there is one set of rules; on any error nothing is
 * written and the previous import (if any) stays as it was.
 */
export async function importInterviewCsv(
  input: ImportInterviewCsvInput,
): Promise<ImportInterviewCsvResult> {
  const orgId = await requireOrg();

  const { participantId, csvText, fileName } = input;

  // participantId comes from the client, so it can't be trusted to be ours.
  const participant = await prisma.participant.findFirst({
    where: { id: participantId, org_id: orgId, deleted_at: null },
    select: { id: true },
  });
  if (!participant) return { ok: false, errors: ["Interview not found."] };

  const parsed = parseImportedInterviewCsv(csvText);
  if (!parsed.ok) return parsed;

  const data = parsed.data as unknown as Prisma.InputJsonValue;

  await prisma.importedInterview.upsert({
    where: { participant_id: participantId },
    create: { org_id: orgId, participant_id: participantId, file_name: fileName, data },
    update: { file_name: fileName, data },
  });

  return { ok: true };
}

/**
 * Edit one answer inside a participant's import. The whole interview is one JSON value,
 * so this is a read-modify-write; the transaction keeps two quick blurs from writing
 * over each other.
 */
export async function upsertImportedInterviewAnswer(
  input: ImportedInterviewAnswerInput,
): Promise<void> {
  const orgId = await requireOrg();

  const { participantId, questionId, value } = input;

  await prisma.$transaction(async (tx) => {
    const row = await tx.importedInterview.findFirst({
      where: {
        participant_id: participantId,
        org_id: orgId,
        participant: { deleted_at: null },
      },
      select: { id: true, data: true },
    });
    if (!row) return;

    const data = readImportedData(row.data);
    let found = false;
    for (const hypothesis of data.hypotheses) {
      for (const question of hypothesis.questions) {
        if (question.id === questionId) {
          question.answer = value;
          found = true;
        }
      }
    }
    if (!found) return;

    await tx.importedInterview.update({
      where: { id: row.id },
      data: { data: data as unknown as Prisma.InputJsonValue },
    });
  });

  // No revalidatePath: this fires on every blur, same as the journey-map answers.
}

/**
 * Write one imported hypothesis's summary and/or validation rating. The row is created on
 * the first edit — a hypothesis nobody has written about simply has none.
 */
export async function upsertImportedHypothesisSummary(
  input: ImportedHypothesisSummaryInput,
): Promise<void> {
  const orgId = await requireOrg();

  const { summary, validationLevel } = input;
  // Re-normalized so a key that arrives in any other shape still lands on the same row.
  const hypothesisKey = normalizeImportKey(input.hypothesisKey);
  if (!hypothesisKey) return;

  // Clamped rather than rejected, as with the journey-map summaries: 0 is the "not
  // rated" the UI writes when a selected point is cleared.
  const level =
    validationLevel === undefined
      ? undefined
      : Math.min(5, Math.max(0, Math.round(validationLevel)));

  const fields = {
    ...(summary !== undefined ? { summary } : {}),
    ...(level !== undefined ? { validation_level: level } : {}),
  };

  await prisma.importedHypothesisSummary.upsert({
    where: {
      org_id_hypothesis_key: { org_id: orgId, hypothesis_key: hypothesisKey },
    },
    create: { org_id: orgId, hypothesis_key: hypothesisKey, ...fields },
    update: fields,
  });
}

/** Every imported hypothesis in the org, merged across participants, for the Summary tab. */
export async function getImportedSummaryData(): Promise<SummaryHypothesis[]> {
  const orgId = await requireOrg();
  return buildImportedSummary({ org_id: orgId });
}

// Global read-only variant for the /examples/interviews page.
export async function getExampleImportedSummaryData(
  exampleNumber: number,
): Promise<SummaryHypothesis[]> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return buildImportedSummary({ example_number: exampleNumber });
}

type LoadScope = { org_id: string } | { example_number: number };

/**
 * Not exported: every exported async function in a "use server" file is a public
 * endpoint, and this takes its scope on trust.
 *
 * Hypotheses merge across participants by normalized text, and within a hypothesis so do
 * questions. Both keep the order they first appear in, oldest import first, and show the
 * text as it was first written.
 */
async function buildImportedSummary(scope: LoadScope): Promise<SummaryHypothesis[]> {
  const [imports, summaries] = await Promise.all([
    prisma.importedInterview.findMany({
      where: { ...scope, participant: { deleted_at: null } },
      orderBy: { created_at: "asc" },
      include: {
        participant: { select: { id: true, name: true, scheduled_date: true } },
      },
    }),
    prisma.importedHypothesisSummary.findMany({ where: scope }),
  ]);

  type MergedQuestion = SummaryQuestion & { key: string; unanswered: number };
  type MergedHypothesis = { key: string; text: string; questions: Map<string, MergedQuestion> };

  const merged = new Map<string, MergedHypothesis>();

  for (const row of imports) {
    const { participant } = row;
    for (const hypothesis of readImportedData(row.data).hypotheses) {
      const hKey = normalizeImportKey(hypothesis.text);
      if (!hKey) continue;

      let target = merged.get(hKey);
      if (!target) {
        target = { key: hKey, text: hypothesis.text, questions: new Map() };
        merged.set(hKey, target);
      }

      for (const question of hypothesis.questions) {
        const qKey = normalizeImportKey(question.text);
        if (!qKey) continue;

        let q = target.questions.get(qKey);
        if (!q) {
          q = {
            key: qKey,
            questionId: `imported:${hKey}:${qKey}`,
            index: target.questions.size + 1,
            title: question.text,
            responseType: "text",
            answers: [],
            unanswered: 0,
          };
          target.questions.set(qKey, q);
        }

        if (question.answer.trim() === "") {
          q.unanswered++;
          continue;
        }
        q.answers.push({
          participantId: participant.id,
          participantName: participant.name,
          interviewDate: participant.scheduled_date?.toISOString() ?? null,
          value: question.answer,
        });
      }
    }
  }

  const summaryByKey = new Map(summaries.map((s) => [s.hypothesis_key, s]));

  return [...merged.values()].map((h, i) => {
    const questions: SummaryQuestion[] = [...h.questions.values()].map(
      ({ key: _key, unanswered: _unanswered, ...q }) => ({
        ...q,
        answers: q.answers.sort((a, b) =>
          a.participantName.localeCompare(b.participantName),
        ),
      }),
    );
    const stored = summaryByKey.get(h.key);

    return {
      id: `imported:${h.key}`,
      target: { kind: "imported" as const, hypothesisKey: h.key },
      index: i + 1,
      prompt: h.text,
      questions,
      summary: stored?.summary ?? "",
      validationLevel: stored?.validation_level ?? 0,
      answeredCount: questions.reduce((n, q) => n + q.answers.length, 0),
      // Only questions someone actually had in their CSV and left blank — a participant
      // whose import never asked it wasn't silent on it.
      noAnswerCount: [...h.questions.values()].reduce((n, q) => n + q.unanswered, 0),
    };
  });
}
