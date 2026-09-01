"use client";

import { useRef, useState, useTransition } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  createMarketSegment,
  deleteMarketSegment,
  updateMarketSegment,
  upsertMarketSegmentNote,
  type MarketSegment,
} from "@/services/market";
import { BeachheadChart } from "./BeachheadChart";

interface MarketSegmentsSectionProps {
  segments: MarketSegment[];
  note: string;
  readOnly?: boolean;
}

// Row currently in the table. `id` is null for blank spreadsheet rows that
// haven't been persisted yet.
interface EditableSegment {
  localKey: string;
  id: number | null;
  name: string;
  notes: string;
  beachhead: boolean;
}

const MIN_ROWS = 4;

let localKeySeq = 0;
const nextLocalKey = () => `seg-${localKeySeq++}`;

const blankRow = (): EditableSegment => ({
  localKey: nextLocalKey(),
  id: null,
  name: "",
  notes: "",
  beachhead: false,
});

const rowHasContent = (r: EditableSegment) =>
  r.name.trim() !== "" || r.notes.trim() !== "" || r.beachhead;

// Keep the table spreadsheet-shaped: at least MIN_ROWS, always one trailing blank.
const normalize = (rows: EditableSegment[]): EditableSegment[] => {
  const next = [...rows];
  while (next.length < MIN_ROWS) next.push(blankRow());
  const last = next[next.length - 1];
  if (last.id !== null || rowHasContent(last)) next.push(blankRow());
  return next;
};

export function MarketSegmentsSection({
  segments,
  note,
  readOnly = false,
}: MarketSegmentsSectionProps) {
  const [rows, setRowsState] = useState<EditableSegment[]>(() =>
    normalize(
      segments.map((s) => ({
        localKey: nextLocalKey(),
        id: s.id,
        name: s.name,
        notes: s.notes,
        beachhead: s.beachhead,
      })),
    ),
  );
  const rowsRef = useRef(rows);
  const setRows = (updater: (prev: EditableSegment[]) => EditableSegment[]) => {
    setRowsState((prev) => {
      const next = normalize(updater(prev));
      rowsRef.current = next;
      return next;
    });
  };

  const [noteValue, setNoteValue] = useState(note);
  const [, startTransition] = useTransition();

  const patchRow = (localKey: string, patch: Partial<EditableSegment>) => {
    setRows((prev) =>
      prev.map((r) => (r.localKey === localKey ? { ...r, ...patch } : r)),
    );
  };

  const commitRow = (localKey: string) => {
    if (readOnly) return;
    const row = rowsRef.current.find((r) => r.localKey === localKey);
    if (!row) return;

    const data = {
      name: row.name.trim(),
      notes: row.notes.trim(),
      beachhead: row.beachhead,
    };
    const hasContent = rowHasContent(row);

    if (row.id === null && !hasContent) return;

    if (row.id === null && hasContent) {
      const order = rowsRef.current.findIndex((r) => r.localKey === localKey);
      startTransition(async () => {
        const created = await createMarketSegment({ ...data, order });
        setRows((prev) =>
          prev.map((r) =>
            r.localKey === localKey ? { ...r, id: created.id } : r,
          ),
        );
      });
      return;
    }

    // Existing row cleared out — delete it but keep the blank slot in place.
    if (row.id !== null && !hasContent) {
      const id = row.id;
      setRows((prev) =>
        prev.map((r) =>
          r.localKey === localKey ? { ...blankRow(), localKey } : r,
        ),
      );
      startTransition(() => {
        deleteMarketSegment(id);
      });
      return;
    }

    // Existing row edited — update.
    if (row.id === null) return;
    const id = row.id;
    startTransition(() => {
      updateMarketSegment(id, data);
    });
  };

  const toggleBeachhead = (localKey: string, next: boolean) => {
    if (readOnly) return;
    patchRow(localKey, { beachhead: next });
    // Commit immediately after the state (and ref) are updated.
    setTimeout(() => commitRow(localKey), 0);
  };

  const commitNote = () => {
    if (readOnly) return;
    startTransition(() => {
      upsertMarketSegmentNote(noteValue.trim());
    });
  };

  return (
    <section>
      <h2 className="mb-4 text-lg font-semibold text-[#1F2430]">
        Market Segments
      </h2>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Editable spreadsheet-style table — full grid borders on every cell. */}
        <div className="overflow-hidden rounded-lg border border-[#BFC4D2] bg-white">
          <Table className="border-collapse">
            <TableHeader>
              <TableRow className="bg-[#F7F8FA] hover:bg-[#F7F8FA]">
                <TableHead className="h-9 border-b border-r border-[#BFC4D2] text-sm font-medium text-[#4E5566]">
                  Name
                </TableHead>
                <TableHead className="h-9 border-b border-r border-[#BFC4D2] text-sm font-medium text-[#4E5566]">
                  Notes
                </TableHead>
                <TableHead className="h-9 w-24 border-b border-[#BFC4D2] text-center text-sm font-medium text-[#4E5566]">
                  Beachhead
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.localKey}
                  className="border-0 hover:bg-transparent"
                >
                  <TableCell className="border-b border-r border-[#BFC4D2] p-0 align-top">
                    <Textarea
                      rows={2}
                      value={row.name}
                      readOnly={readOnly}
                      onChange={(e) =>
                        patchRow(row.localKey, { name: e.target.value })
                      }
                      onBlur={() => commitRow(row.localKey)}
                      className="min-h-16 w-full resize-none rounded-none border-0 bg-transparent px-3 py-2 text-base leading-6 shadow-none focus-visible:ring-0 md:text-base"
                    />
                  </TableCell>
                  <TableCell className="border-b border-r border-[#BFC4D2] p-0 align-top">
                    <Textarea
                      rows={2}
                      value={row.notes}
                      readOnly={readOnly}
                      onChange={(e) =>
                        patchRow(row.localKey, { notes: e.target.value })
                      }
                      onBlur={() => commitRow(row.localKey)}
                      className="min-h-16 w-full resize-none rounded-none border-0 bg-transparent px-3 py-2 text-base leading-6 shadow-none focus-visible:ring-0 md:text-base"
                    />
                  </TableCell>
                  <TableCell className="border-b border-[#BFC4D2] text-center align-middle">
                    <Checkbox
                      checked={row.beachhead}
                      disabled={readOnly}
                      onCheckedChange={(v) =>
                        toggleBeachhead(row.localKey, v === true)
                      }
                      className="data-[state=checked]:border-[#6A35FF] data-[state=checked]:bg-[#6A35FF] data-[state=checked]:text-white"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Beachhead chart + section-level notes */}
        <div className="flex flex-col gap-4 col-span-2 rounded-lg bg-[#EFF0F4] p-5 justify-between">
          <div className="flex flex-row items-center justify-between gap-6">
            <p>
              The Beachhead Market is the first and best market to generate
              traction for a given innovation. It should be a stepping stone for
              additional success in your overall Target Market. The ideal
              beachhead is rarely the biggest or most lucrative market, instead
              beachheads should be those markets with highest margins, biggest
              need, fastest time to market, offer immediate access, etc.
            </p>
            <BeachheadChart className="h-auto w-[500px] shrink-0" />
          </div>

          <div>
            <p className="mb-1.5 text-base font-medium text-[#1F2430]">
              Explain why you chose this as your beachhead
            </p>
            <Textarea
              value={noteValue}
              readOnly={readOnly}
              onChange={(e) => setNoteValue(e.target.value)}
              onBlur={commitNote}
              placeholder="Type here"
              className="min-h-[64px] resize-none bg-white text-base"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
