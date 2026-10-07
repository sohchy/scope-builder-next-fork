import { parseCsv } from "@/lib/csv";
import type { AnswerableProblem } from "@/app/(auth)/participants/interviews/_components/InterviewAnswers/types";

/**
 * An interview imported from a CSV, as stored in `ImportedInterview.data`. Ids are
 * minted at import time so an answer edit can address its question without relying on
 * the (possibly repeated) question text.
 */
export interface ImportedQuestion {
  id: string;
  text: string;
  answer: string;
}

export interface ImportedHypothesis {
  id: string;
  text: string;
  questions: ImportedQuestion[];
}

export interface ImportedInterviewData {
  hypotheses: ImportedHypothesis[];
}

export type ParseImportResult =
  | { ok: true; data: ImportedInterviewData }
  | { ok: false; errors: string[] };

const HEADER = ["hypothesis", "question", "answer"];

/** Far more than any one interview — a guard against someone uploading the wrong file. */
const MAX_ROWS = 2000;

/**
 * What two texts must share to count as the same hypothesis (or the same question within
 * one): case, surrounding space and runs of whitespace don't matter. This is also the key
 * an imported hypothesis's summary is stored under.
 */
export function normalizeImportKey(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Validate a `hypothesis,question,answer` CSV and group its rows by hypothesis, keeping
 * the order each hypothesis and question first appears in. Any bad row rejects the whole
 * file — a half-imported interview is worse than none. Row numbers count the header as
 * row 1, matching what a spreadsheet shows.
 */
export function parseImportedInterviewCsv(text: string): ParseImportResult {
  const rows = parseCsv(text)
    .map((cells, i) => ({
      rowNumber: i + 1,
      // Spreadsheets often export a few trailing empty columns; those aren't data.
      cells: trimTrailingEmpty(cells).map((c) => c.trim()),
    }))
    // Blank lines — including Excel's ",," for an emptied row — are skipped, not errors.
    .filter(({ cells }) => cells.some((c) => c !== ""));

  if (rows.length === 0) return { ok: false, errors: ["The file is empty."] };

  const [header, ...body] = rows;
  const headerMatches =
    header.cells.length === HEADER.length &&
    header.cells.every((cell, i) => cell.toLowerCase() === HEADER[i]);
  if (!headerMatches) {
    return {
      ok: false,
      errors: ["The first row must be the header: hypothesis, question, answer."],
    };
  }

  if (body.length === 0) {
    return { ok: false, errors: ["The file has a header but no rows."] };
  }
  if (body.length > MAX_ROWS) {
    return { ok: false, errors: [`The file has more than ${MAX_ROWS} rows.`] };
  }

  const errors: string[] = [];
  const hypotheses = new Map<string, ImportedHypothesis>();
  // Where each question was first seen, per hypothesis — so a repeat can point back at it.
  const seenQuestions = new Map<string, number>();

  for (const { rowNumber, cells } of body) {
    if (cells.length !== HEADER.length) {
      errors.push(
        `Row ${rowNumber}: expected ${HEADER.length} columns, got ${cells.length}.`,
      );
      continue;
    }

    const [hypothesisText, questionText, answer] = cells;
    if (!hypothesisText) {
      errors.push(`Row ${rowNumber}: hypothesis is empty.`);
      continue;
    }
    if (!questionText) {
      errors.push(`Row ${rowNumber}: question is empty.`);
      continue;
    }

    const hypothesisKey = normalizeImportKey(hypothesisText);
    // A repeated question would merge with itself on the summary and show this
    // participant twice under one question, so it is rejected rather than guessed at.
    const questionKey = `${hypothesisKey}\u0000${normalizeImportKey(questionText)}`;
    const firstRow = seenQuestions.get(questionKey);
    if (firstRow !== undefined) {
      errors.push(
        `Row ${rowNumber}: duplicate question under the same hypothesis (first on row ${firstRow}).`,
      );
      continue;
    }
    seenQuestions.set(questionKey, rowNumber);

    let hypothesis = hypotheses.get(hypothesisKey);
    if (!hypothesis) {
      hypothesis = { id: crypto.randomUUID(), text: hypothesisText, questions: [] };
      hypotheses.set(hypothesisKey, hypothesis);
    }
    hypothesis.questions.push({ id: crypto.randomUUID(), text: questionText, answer });
  }

  if (errors.length > 0) return { ok: false, errors };

  return { ok: true, data: { hypotheses: [...hypotheses.values()] } };
}

function trimTrailingEmpty(cells: string[]): string[] {
  let end = cells.length;
  while (end > 0 && cells[end - 1].trim() === "") end--;
  // Never below the expected width: a row whose answer is blank is still a full row.
  return cells.slice(0, Math.max(end, Math.min(cells.length, HEADER.length)));
}

/**
 * Read the stored JSON defensively — it's a free-form column, so anything malformed is
 * dropped rather than trusted.
 */
export function readImportedData(raw: unknown): ImportedInterviewData {
  const list = (raw as { hypotheses?: unknown } | null)?.hypotheses;
  if (!Array.isArray(list)) return { hypotheses: [] };

  const hypotheses = list.flatMap((h): ImportedHypothesis[] => {
    if (!h || typeof h !== "object") return [];
    const { id, text, questions } = h as Record<string, unknown>;
    if (typeof id !== "string" || typeof text !== "string" || !Array.isArray(questions))
      return [];
    const parsed = questions.flatMap((q): ImportedQuestion[] => {
      if (!q || typeof q !== "object") return [];
      const { id: qId, text: qText, answer } = q as Record<string, unknown>;
      if (typeof qId !== "string" || typeof qText !== "string") return [];
      return [{ id: qId, text: qText, answer: typeof answer === "string" ? answer : "" }];
    });
    return [{ id, text, questions: parsed }];
  });

  return { hypotheses };
}

/**
 * An import as the answering view's cards: the hypothesis takes the place of the problem
 * description, and with no action, pill or tags the card header shows only that.
 */
export function importedToAnswerable(data: ImportedInterviewData): AnswerableProblem[] {
  return data.hypotheses
    .filter((h) => h.questions.length > 0)
    .map((h) => ({
      id: h.id,
      kind: "hypothesis" as const,
      action: "",
      label: "",
      description: h.text,
      tags: [],
      questions: h.questions.map((q, i) => ({
        questionId: q.id,
        index: i + 1,
        title: q.text,
        responseType: "text" as const,
        options: [],
        answer: q.answer,
      })),
    }));
}
