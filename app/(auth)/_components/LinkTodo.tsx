import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/generated/prisma";

interface LinkTodoProps {
  todo: Task;
  isCompleted: boolean;
  markAsComplete: (id: number, complete: boolean) => Promise<void>;
}

export default function LinkTodo({
  todo,
  isCompleted,
  markAsComplete,
}: LinkTodoProps) {
  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] bg-white border-[0.5px] border-white rounded-[8px] px-[12px] py-[12px] flex flex-row gap-3.5 items-center `}
    >
      <div
        className={`size-4 min-w-[16px] rounded-full text-[#B5BCCC] border border-[#B5BCCC] flex items-center justify-center ${
          isCompleted ? "bg-[#42BC5C] border-[#42BC5C]" : "border"
        }`}
        onClick={() => {
          markAsComplete(todo.id, !isCompleted);
        }}
      >
        {isCompleted && <CheckIcon className="size-2 text-white " />}
      </div>

      <Link
        href={todo.task_url!}
        target="_blank"
        className={`text-[14px] font-medium text-[#6A35FF] hover:text-[#6A35FF] transition-colors cursor-pointer ${
          isCompleted ? "line-through" : "underline"
        }`}
      >
        {todo.task_url}
      </Link>

      {/* <div className="flex ml-7">
        <Link
          href={todo.task_url!}
          target="_blank"
          className="rounded-lg border-[1.5px] h-[44px] w-[44px] mr-2"
        >
          <Button variant={"link"} className="w-full h-full">
            <ExternalLinkIcon className="text-[#8B93A1]" />
          </Button>
        </Link>
        <span className="rounded-lg border-[1.5px] h-[44px] w-[44px]">
          <Button
            variant={"link"}
            className="w-full h-full"
            onClick={() => {
              navigator.clipboard.writeText(todo.task_url!);
            }}
          >
            <CopyIcon className="text-[#8B93A1]" />
          </Button>
        </span>
      </div> */}
    </li>
  );
}
