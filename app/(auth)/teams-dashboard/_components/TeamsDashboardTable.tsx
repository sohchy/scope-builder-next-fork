"use client";

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
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { StarIcon } from "lucide-react";

const columns: ColumnDef<any>[] = [
  // {
  //   id: "favorite",
  //   header: ({ table }) => (
  //     <div>
  //       <StarIcon size={20} />
  //     </div>
  //   ),
  //   cell: ({ row }) => (
  //     <div>
  //       <StarIcon size={20} />
  //     </div>
  //   ),
  // },
  {
    id: "orgName",
    header: "Team",
    cell: ({ row }) => (
      <div>
        <span className="text-xs font-semibold">{row.original.orgName}</span>
      </div>
    ),
  },
  {
    id: "interviews",
    header: ({ table }) => (
      <div className="flex flex-col">
        <span className="text-[#697288]">Interviews:</span>
        <span>conducted / scheduled</span>
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-row items-center gap-2">
          <span className="text-gray-500 font-semibold">
            {row.original.interviews.conducted} /{" "}
            {row.original.interviews.scheduled}
          </span>
          <Progress
            className="w-[60%]"
            progressClassname="bg-purple-500"
            value={
              (row.original.interviews.conducted /
                row.original.interviews.scheduled) *
              100
            }
          />
        </div>
      );
    },
  },
  {
    id: "hypothesis",
    header: ({ table }) => (
      <div className="flex flex-col">
        <span className="text-[#697288]">Hypothesis</span>
        <span>stated</span>
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div>
          <span className="text-gray-500 font-semibold">
            {row.original.hypothesis}
          </span>
        </div>
      );
    },
  },
  {
    id: "hypothesisStatus",
    header: ({ table }) => (
      <div className="flex flex-col">
        <span className="text-[#697288]">Hypothesis</span>
        <span>validated / invalidated / testing</span>
      </div>
    ),
    cell: ({ row }) => {
      return (
        <div className="flex flex-row items-center gap-2">
          <span className="font-semibold text-[#697288]">
            <span className="text-[#58C184] underline">
              {" "}
              {row.original.hypothesisStatus.validated}
            </span>{" "}
            /{" "}
            <span className="text-[#C66B8F] underline">
              {row.original.hypothesisStatus.invalidated}
            </span>{" "}
            /{" "}
            <span className="text-[#697288]">
              {row.original.hypothesisStatus.testing}
            </span>
          </span>
          <Progress
            className="w-[60%]"
            progressClassname="bg-[#6A35FF]"
            total={row.original.hypothesis}
            segments={[
              {
                value: row.original.hypothesisStatus.validated,
                colorClass: "bg-[#58C184]",
              },
              {
                value: row.original.hypothesisStatus.invalidated,
                colorClass: "bg-[#C66B8F]",
              },
              {
                value: row.original.hypothesisStatus.testing,
                colorClass: "bg-[#DDD9E9]",
              },
            ]}
          />
        </div>
      );
    },
  },
];

export default function TeamsDashboardTable({ data }: { data: any[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="h-full overflow-y-auto">
      <Table>
        <TableHeader className="bg-muted sticky top-0 z-10 p-2">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead
                    className="p-2 text-xs font-semibold"
                    key={header.id}
                    colSpan={header.colSpan}
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
          {table.getRowModel().rows.map((row) => (
            <TableRow
              id={row.id}
              key={row.id}
              className="relative z-0 data-[dragging=true]:z-10 data-[dragging=true]:opacity-80"
            >
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
