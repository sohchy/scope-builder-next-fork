import { Participant } from "@/lib/generated/prisma";
import ParticipantTableActions from "./ParticipantTableActions";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import Link from "next/link";
import { ColumnDef } from "@tanstack/react-table";

export const columns: (tags: string[]) => ColumnDef<any>[] = (tags) => [
  {
    id: "actions",
    cell: ({ row }) => {
      const participant = row.original;

      return (
        <ParticipantTableActions
          tags={tags}
          participant={participant as Participant}
        />
      );
    },
  },
  {
    accessorKey: "name",
    header: "Participant",
    cell: ({ row }) => {
      const participantId = row.original.id;
      return (
        <div className="capitalize">
          <Link
            // href={`/participants/${participantId}`}
            href={`/participants/${participantId}/interview`}
            className="hover:underline"
          >
            {row.getValue("name")}
          </Link>
        </div>
      );
    },
  },
  {
    accessorKey: "scheduled_date",
    header: "Schedule Date",
    cell: ({ row }) => {
      if (!row.getValue("scheduled_date"))
        return <div className="capitalize"></div>;

      const schedule_date = format(
        row.getValue("scheduled_date"),
        "MMM d, k:mm",
      );

      return <div className="capitalize">{schedule_date}</div>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as "complete" | "incomplete";

      return (
        <div className="capitalize">
          <Badge
            className={`${
              status === "complete"
                ? "bg-[#D4ECDC] text-[#254F2B]"
                : "bg-red-200 text-red-800"
            } text-[10px] font-semibold h-6`}
          >
            {status}
          </Badge>
        </div>
      );
    },
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as "user" | "customer";

      return (
        <div className="capitalize flex flex-row gap-1">
          {role.split(",").map((r) => (
            <Badge
              key={r}
              className={`${
                role === "customer"
                  ? "bg-[#F4F0FF] text-[#6A35FF]"
                  : "bg-[#F4F0FF] text-[#6A35FF]"
              } text-[10px] font-semibold h-6`}
            >
              {r}
            </Badge>
          ))}
        </div>
      );
    },
  },
  {
    accessorKey: "contact_info",
    header: "Contact Info",
    cell: ({ row }) => (
      <div className="capitalize whitespace-normal">
        {row.getValue("contact_info")}
      </div>
    ),
    size: 350,
    maxSize: 350,
    minSize: 350,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => (
      <div className="capitalize whitespace-normal">
        {row.getValue("notes")}
      </div>
    ),
    size: 350,
    maxSize: 350,
    minSize: 350,
  },
  {
    accessorKey: "tags",
    header: "Tags",
    cell: ({ row }) => {
      const tags = row.getValue("tags") as string;

      return (
        <div className="capitalize flex flex-row gap-1">
          {tags &&
            tags.split(",").map((tag) => (
              <Badge
                key={tag}
                className={`text-[10px] font-semibold h-6 bg-[#F4F0FF] text-[#6A35FF]`}
              >
                {tag}
              </Badge>
            ))}
        </div>
      );
    },
    size: 350,
    maxSize: 350,
    minSize: 350,
  },
  // {
  //   accessorKey: "rationale",
  //   header: "Rationale",
  //   cell: ({ row }) => (
  //     <div className="capitalize whitespace-normal">
  //       {row.getValue("rationale")}
  //     </div>
  //   ),
  //   size: 350,
  //   maxSize: 350,
  //   minSize: 350,
  // },
  // {
  //   accessorKey: "blocking_issues",
  //   header: "Blocking Issues",
  //   cell: ({ row }) => (
  //     <div className="capitalize whitespace-normal">
  //       {row.getValue("blocking_issues")}
  //     </div>
  //   ),
  //   size: 350,
  //   maxSize: 350,
  //   minSize: 350,
  // },
  // {
  //   accessorKey: "hypothesis_to_validate",
  //   header: "Hypothesis to Validate",
  //   cell: ({ row }) => (
  //     <div className="capitalize whitespace-normal">
  //       {row.getValue("hypothesis_to_validate")}
  //     </div>
  //   ),
  //   size: 350,
  //   maxSize: 350,
  //   minSize: 350,
  // },
  // {
  //   accessorKey: "learnings",
  //   header: "Learnings",
  //   cell: ({ row }) => (
  //     <div className="capitalize whitespace-normal">
  //       {row.getValue("learnings")}
  //     </div>
  //   ),
  //   size: 350,
  //   maxSize: 350,
  //   minSize: 350,
  // },
];
