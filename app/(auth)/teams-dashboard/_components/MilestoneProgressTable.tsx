"use client";

import { CheckIcon, CircleIcon } from "lucide-react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  milestoneLabel,
  MILESTONE_NUMBERS,
  subStepsForMilestone,
  type MilestoneAccessState,
} from "@/lib/milestones";

/** The three exclusive interview stages, in kanban order. `need_to_schedule` isn't
 * here — an unscheduled participant hasn't entered the funnel yet. */
export interface InterviewCounts {
  /** Booked but not yet held — Participant.status "scheduled". */
  scheduled: number;
  /** Conducted but not yet written up — Participant.status "complete". */
  conducted: number;
  /** Participant.status "documented". Never also counted as `conducted`. */
  documented: number;
}

export interface MilestoneProgressRow {
  orgId: string;
  orgName: string;
  interviews: InterviewCounts;
  /** Sub-step key ("1.1", "2.3"…) → reviewed. Absent key means not reviewed. */
  subSteps: Record<string, boolean>;
  /** All 6 slots, indexed by milestone number (milestone 0 is first). */
  milestones: MilestoneAccessState[];
}

/** Sub-step columns are narrow enough to fit 25 of them; the milestone columns get
 * a little more room and a tint so each group reads as a block. */
const SUB_STEP_WIDTH = 52;
const MILESTONE_WIDTH = 64;
const NAME_WIDTH = 220;
/** Wide enough for "5 | 3 | 4 (15)" plus the bar beside it. */
const INTERVIEWS_WIDTH = 230;

/** Interviews each startup is expected to land by the end of the program. The bar
 * is always drawn against this, so a team past it simply fills the track. */
const INTERVIEW_TARGET = 15;

/** Pins the startup name while the other 26 columns scroll under it. Needs an
 * opaque background of its own or the cells show through. */
const STICKY_NAME_CELL = "sticky left-0 z-20 bg-white";
const STICKY_NAME_HEAD = "sticky left-0 z-30 bg-muted";
const MILESTONE_TINT = "bg-muted/40";

/** Matches the sign-off column only — `milestone-group-N` is the header above the
 * whole group and must not pick up the tint. */
const isMilestoneColumn = (id: string) => /^milestone-\d+$/.test(id);

function ProgressCheck({ done }: { done: boolean }) {
  return (
    <span
      className="flex justify-center"
      title={done ? "Reviewed" : "Not reviewed"}
    >
      {done ? (
        <CheckIcon className="text-progress-done size-4" />
      ) : (
        <CircleIcon className="text-check-empty size-4" />
      )}
    </span>
  );
}

/** Sub-steps stay a circle whether or not they are done — a row of 26 checkmarks
 * was hard to scan — and signal completion by filling green instead. */
function SubStepCheck({ done }: { done: boolean }) {
  return (
    <span
      className="flex justify-center"
      title={done ? "Reviewed" : "Not reviewed"}
    >
      {/* A div, not lucide's CircleIcon — that svg carries `fill="none"`, so a
       * fill utility on it only ever colors the ring. The green is a lighter
       * relative of the --progress-done checkmark, kept literal so this does not
       * depend on a palette token being registered. */}
      <div
        className={
          done
            ? "border-progress-done size-4 rounded-full border bg-[#6ec48f]"
            : "border-check-empty size-4 rounded-full border"
        }
      />
    </span>
  );
}

/** The three stages fill the track in kanban order — scheduled, then conducted, then
 * documented — and the gray track is whatever is left of the target. Each segment is
 * clamped against the room its predecessors left, so a team past 15 simply fills the
 * bar instead of pushing the later segments negative. */
function InterviewProgress({
  scheduled,
  conducted,
  documented,
}: InterviewCounts) {
  const scheduledWidth = Math.min(scheduled, INTERVIEW_TARGET);
  const conductedWidth = Math.min(
    conducted,
    Math.max(0, INTERVIEW_TARGET - scheduledWidth),
  );
  const documentedWidth = Math.min(
    documented,
    Math.max(0, INTERVIEW_TARGET - scheduledWidth - conductedWidth),
  );
  const remaining = Math.max(
    0,
    INTERVIEW_TARGET - scheduledWidth - conductedWidth - documentedWidth,
  );

  return (
    <div className="flex flex-row items-center gap-2">
      <span
        className="text-label-muted font-semibold whitespace-nowrap"
        title={`${scheduled} scheduled, ${conducted} conducted, ${documented} documented, target ${INTERVIEW_TARGET}`}
      >
        <span className="text-progress-scheduled">{scheduled}</span>
        {" | "}
        <span className="text-progress-conducted">{conducted}</span>
        {" | "}
        <span className="text-progress-done">{documented}</span>{" "}
        <span className="font-medium">({INTERVIEW_TARGET})</span>
      </span>
      <Progress
        className="w-[55%]"
        total={INTERVIEW_TARGET}
        segments={[
          { value: scheduledWidth, colorClass: "bg-progress-scheduled" },
          { value: conductedWidth, colorClass: "bg-progress-conducted" },
          { value: documentedWidth, colorClass: "bg-progress-done" },
          { value: remaining, colorClass: "bg-progress-track" },
        ]}
      />
    </div>
  );
}

// Nothing here closes over a callback, so the columns are a module-level constant
// rather than a `getColumns(...)` factory.
const columns: ColumnDef<MilestoneProgressRow>[] = [
  {
    accessorKey: "orgName",
    header: "Startup",
    size: NAME_WIDTH,
    minSize: NAME_WIDTH,
  },
  // Sits ahead of the milestone groups so it's readable without scrolling the 26
  // columns to its right. Like `orgName` it's a top-level leaf, so it renders in the
  // group header row and leaves a placeholder in the sub-step row.
  {
    id: "interviews",
    header: () => (
      <div className="text-label-muted flex flex-col">
        <span>Interviews:</span>
        <span className="whitespace-nowrap">
          <span className="text-progress-scheduled">Scheduled</span>
          {" | "}
          <span className="text-progress-conducted">Conducted</span>
          {" | "}
          <span className="text-progress-done">Documented</span>{" "}
          <span className="font-medium">({INTERVIEW_TARGET})</span>
        </span>
      </div>
    ),
    size: INTERVIEWS_WIDTH,
    minSize: INTERVIEWS_WIDTH,
    cell: ({ row }) => <InterviewProgress {...row.original.interviews} />,
  },
  // One group per milestone: its sub-steps, then the milestone sign-off itself.
  // The grouped header is what keeps 31 columns readable — `getHeaderGroups()`
  // renders the extra row for free.
  ...MILESTONE_NUMBERS.map<ColumnDef<MilestoneProgressRow>>((milestone) => ({
    id: `milestone-group-${milestone}`,
    header: () => (
      <span className="whitespace-nowrap">
        M{milestone} · {milestoneLabel(milestone)}
      </span>
    ),
    columns: [
      ...subStepsForMilestone(milestone).map<ColumnDef<MilestoneProgressRow>>(
        (subStep) => ({
          id: `substep-${subStep.key}`,
          header: () => <span title={subStep.label}>{subStep.key}</span>,
          size: SUB_STEP_WIDTH,
          cell: ({ row }) => (
            <SubStepCheck done={Boolean(row.original.subSteps[subStep.key])} />
          ),
        }),
      ),
      {
        id: `milestone-${milestone}`,
        header: () => <span className="whitespace-nowrap">M #{milestone}</span>,
        size: MILESTONE_WIDTH,
        cell: ({ row }) => (
          <ProgressCheck
            done={row.original.milestones[milestone]?.reviewedAt != null}
          />
        ),
      },
    ],
  })),
];

export default function MilestoneProgressTable({
  data,
}: {
  data: MilestoneProgressRow[];
}) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const leafColumnCount = table.getAllLeafColumns().length;

  return (
    // `Table` renders its own `overflow-x-auto` container, which is therefore the
    // nearest scroll ancestor. Constraining it to the full height makes it the single
    // scroller for both axes, so the sticky header and sticky name column both anchor
    // to something that actually scrolls.
    <div className="h-full rounded-md border [&>[data-slot=table-container]]:h-full [&>[data-slot=table-container]]:overflow-auto">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const isName = header.column.id === "orgName";
                const isInterviews = header.column.id === "interviews";
                const isMilestone = isMilestoneColumn(header.column.id);

                return (
                  <TableHead
                    key={header.id}
                    // Grouped headers span their sub-steps.
                    colSpan={header.colSpan}
                    style={{ width: header.getSize() }}
                    className={`p-2 text-center text-xs font-semibold ${
                      isName ? `text-left ${STICKY_NAME_HEAD}` : ""
                    } ${isInterviews ? "text-left" : ""} ${
                      isMilestone ? MILESTONE_TINT : ""
                    }`}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const isName = cell.column.id === "orgName";
                  const isMilestone = isMilestoneColumn(cell.column.id);

                  return (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className={`p-2 text-sm font-medium text-[#111827] ${
                        isName ? STICKY_NAME_CELL : ""
                      } ${isMilestone ? MILESTONE_TINT : ""}`}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={leafColumnCount} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
