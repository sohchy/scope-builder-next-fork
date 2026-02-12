import { Task } from "@/lib/generated/prisma";
import { CheckIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface VideoTodoProps {
  todo: Task;
  isCompleted: boolean;
  markAsComplete: (id: number, complete: boolean) => Promise<void>;
}

export default function VideoTodo({
  todo,
  isCompleted,
  markAsComplete,
}: VideoTodoProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const contentLength = todo.task_description?.length || 0;
  const needsShowMore = contentLength > 200;

  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] border-white rounded-[8px] flex flex-col gap-2 bg-white`}
    >
      <div className="flex flex-row gap-3.5 items-center px-[12px] py-[12px]">
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
      <div className="flex flex-col gap-5 pl-[0px]">
        <div className="relative pl-12">
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
      {todo.task_url?.includes("youtube.com") ? (
        <div className="w-full aspect-video rounded-[8px] overflow-hidden">
          <iframe
            className="w-full h-full rounded-[8px] px-[6px] py-[6px]"
            src={todo.task_url?.replace("watch?v=", "embed/")}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : todo.task_url?.includes("vimeo.com") ? (
        <div className="w-full aspect-video rounded-[8px] overflow-hidden">
          <iframe
            className="w-full h-full rounded-[8px] px-[6px] py-[6px]"
            src={`https://player.vimeo.com/video/${todo.task_url
              ?.split("/")
              .pop()}`}
            title="Vimeo video player"
            frameBorder="0"
            allow="autoplay; fullscreen; picture-in-picture; clipboard-write; encrypted-media; web-share"
            allowFullScreen
          />
        </div>
      ) : (
        <video
          controls
          src={todo.task_url!}
          className="w-full aspect-video object-cover rounded-[10px] px-[6px] py-[6px]"
        />
      )}
    </li>
  );
}
