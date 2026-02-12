import { Task } from "@/lib/generated/prisma";
import { CheckIcon, ChevronDown, ChevronUp } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface ImageTodoProps {
  todo: Task;
  isCompleted: boolean;
  markAsComplete: (id: number, complete: boolean) => Promise<void>;
}

export default function ImageTodo({
  todo,
  isCompleted,
  markAsComplete,
}: ImageTodoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const contentLength = todo.task_description?.length || 0;
  const needsShowMore = contentLength > 200;
  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] border-white rounded-[8px] px-[12px] py-[12px] flex flex-col gap-2 bg-white`}
    >
      <div className="flex flex-row gap-3.5 items-center">
        <div
          className={`size-4 min-w-4 rounded-full text-[#B5BCCC] border border-[#B5BCCC] flex items-center justify-center ${
            isCompleted ? "bg-[#42BC5C] border-[#42BC5C]" : "border"
          }`}
          onClick={() => {
            markAsComplete(todo.id, !isCompleted);
          }}
        >
          {isCompleted && <CheckIcon className="size-2 text-white " />}
        </div>
        <span
          className={`text-[16px] font-bold text-[#111827] ${
            isCompleted ? "line-through" : ""
          }`}
        >
          {todo.title}
        </span>
      </div>
      <div className="flex flex-col gap-5 pl-[30px]">
        <div className="relative">
          <div
            data-todo-content
            className={`text-[14px] font-medium text-[#2E3545] break-words overflow-wrap-anywhere ${
              isCompleted ? "line-through" : ""
            }`}
            dangerouslySetInnerHTML={{
              __html: todo.task_description || "",
            }}
            style={{
              maxHeight: !isExpanded && needsShowMore ? "4.5rem" : "none",
              overflow: !isExpanded && needsShowMore ? "hidden" : "visible",
            }}
          />
          {needsShowMore && (
            <div className="flex justify-center mt-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-1 text-[12px] text-[#6A35FF] font-medium hover:text-[#5A2BC7] transition-colors"
              >
                {isExpanded ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Show more</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
      <img
        src={todo.task_url!}
        alt={todo.task_description || ""}
        className="w-full bg-contain rounded-[10px]"
      />
    </li>
  );
}
