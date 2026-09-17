/**
 * Minimal RFC 4180 serializer. Deliberately not the `arrayToCsv` in
 * components/ui/multiselect.tsx — that one is an unescaped comma-join used to pack a
 * multiselect's value into a single form string, and it would corrupt any field
 * holding a comma.
 */

/** Quoted only when it has to be: a comma, a quote, or a line break. Inner quotes double. */
export function csvField(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

/**
 * Rows → CSV text. CRLF endings and a trailing newline, which is what Excel expects;
 * every other reader tolerates both.
 */
export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvField).join(",")).join("\r\n") + "\r\n";
}
