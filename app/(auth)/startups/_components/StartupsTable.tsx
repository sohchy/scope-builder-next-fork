"use client";

import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
  getFacetedRowModel,
  getFilteredRowModel,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useStartups from "./useStartups";
import { useMemo } from "react";
import { useOrganizationList } from "@clerk/nextjs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTableFacetedFilter } from "@/components/DataTableFacetedFilter";
import MilestoneAccessCell from "./MilestoneAccessCell";
import {
  MILESTONE_NUMBERS,
  defaultMilestoneAccess,
  type MilestoneAccessState,
  type MilestoneReviewInput,
} from "@/lib/milestones";

const LOADING_ROW_COUNT = 5;

export default function StartupsTable({
  data,
  isLoading,
  onSelectOrganization,
  onToggleMilestone,
  onReviewMilestone,
}: {
  data: any[];
  isLoading: boolean;
  onSelectOrganization: (organization: any) => void;
  onToggleMilestone: (
    orgId: string,
    milestone: number,
    available: boolean,
  ) => void;
  onReviewMilestone: (
    orgId: string,
    milestone: number,
    values: MilestoneReviewInput,
  ) => void;
}) {
  const columns = useMemo(
    () => getColumns(onToggleMilestone, onReviewMilestone),
    [onToggleMilestone, onReviewMilestone],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  const getMentorOptions = () => {
    const uniqueMentors: string[] = [];

    data.forEach((startup) => {
      if (startup.mentors && !uniqueMentors.includes(startup.mentors)) {
        uniqueMentors.push(startup.mentors);
      }
    });

    return uniqueMentors.map((mentor) => ({ label: mentor, value: mentor }));
  };

  return (
    <div className="overflow-hidden flex flex-col gap-1">
      <div>
        <DataTableFacetedFilter
          title="Mentors"
          column={table.getColumn("mentors")}
          options={getMentorOptions()}
        />
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-[#EFF0F4]">
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="font-bold text-xs"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: LOADING_ROW_COUNT }).map((_, rowIndex) => (
                <TableRow key={`loading-${rowIndex}`}>
                  {columns.map((column, columnIndex) => (
                    <TableCell key={column.id ?? columnIndex}>
                      <Skeleton className="h-5 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  onClick={() => {
                    onSelectOrganization(row.original);
                  }}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      style={{ width: cell.column.getSize() }}
                      className="text-sm font-medium text-[#111827] hover:cursor-pointer"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

const getColumns = (
  onToggleMilestone: (
    orgId: string,
    milestone: number,
    available: boolean,
  ) => void,
  onReviewMilestone: (
    orgId: string,
    milestone: number,
    values: MilestoneReviewInput,
  ) => void,
): ColumnDef<any>[] => [
  {
    accessorKey: "name",
    header: "Startup Name",
    cell: ({ row }) => {
      const participantId = row.original.id;
      return <div className="capitalize">{row.getValue("name")}</div>;
    },
  },
  {
    header: "Founders",
    accessorKey: "founders",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row flex-wrap gap-1">
          {row.original.founders.map((founder: string, index: number) => (
            <Badge className="bg-[#F4F0FF] text-[#6A35FF]" key={index}>
              {founder}
            </Badge>
          ))}
        </div>
      );
    },
    size: 300,
    minSize: 300,
  },
  {
    header: "Mentors",
    accessorKey: "mentors",
    cell: ({ row }) => {
      return (
        <div className="flex flex-row flex-wrap gap-1">
          {/* {row.original.mentors.map((founder: string, index: number) => (
            <Badge className="bg-[#F4F0FF] text-[#6A35FF]" key={index}>
              {founder}
            </Badge>
          ))} */}
          <Badge className="bg-[#F4F0FF] text-[#6A35FF]">
            {row.original.mentors}
          </Badge>
        </div>
      );
    },
    filterFn: (row, columnId, filterValue) => {
      const { mentors } = row.original;

      if (filterValue.length) return filterValue.includes(mentors);

      return true;
    },
  },
  ...MILESTONE_NUMBERS.map<ColumnDef<any>>((milestone) => ({
    id: `milestone-${milestone}`,
    header: () => (
      <span className="block text-center" title={`Milestone ${milestone}`}>
        M{milestone}
      </span>
    ),
    size: 84,
    cell: ({ row }) => {
      const access: MilestoneAccessState[] =
        row.original.milestones ?? defaultMilestoneAccess();
      // Slots come from MILESTONE_NUMBERS, so the index is the milestone number.
      const state = access[milestone];

      return (
        <MilestoneAccessCell
          milestone={milestone}
          startupName={row.original.name}
          available={state?.available ?? false}
          submittedAt={state?.submittedAt ?? null}
          reviewedAt={state?.reviewedAt ?? null}
          onToggle={(available) =>
            onToggleMilestone(row.original.org_id, milestone, available)
          }
          onReview={(values) =>
            onReviewMilestone(row.original.org_id, milestone, values)
          }
        />
      );
    },
  })),
  // {
  //   id: "actions",
  //   cell: ({ row }) => {
  //     const payment = row.original;
  //     return <div></div>;
  //   },
  // },
];
