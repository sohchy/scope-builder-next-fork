/**
 * Minimal RFC 4180 serializer and parser. Deliberately not the `arrayToCsv` in
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

/**
 * CSV text → rows. RFC 4180: quoted fields may hold commas, line breaks and doubled
 * quotes; CRLF, LF and a leading BOM (Excel's "CSV UTF-8") are all accepted. Rows keep
 * their raw cell count so the caller can reject a malformed one by row number.
 */
export function parseCsv(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < input.length; i++) {
    const ch = input[i];

    if (inQuotes) {
      if (ch !== '"') field += ch;
      else if (input[i + 1] === '"') {
        field += '"';
        i++;
      } else inQuotes = false;
      continue;
    }

    if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }

  // The last line has no terminator when the file doesn't end in a newline.
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}
