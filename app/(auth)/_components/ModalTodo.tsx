"use client";

import { CheckIcon } from "lucide-react";
import { Task } from "@/lib/generated/prisma";
import { useState } from "react";
import Mentors from "./Mentors";
import AboutProgram from "./AboutProgram";

interface ModalTodoProps {
  todo: Task;
  isCompleted: boolean;
  markAsComplete: (id: number, complete: boolean) => Promise<void>;
}

export default function ModalTodo({
  todo,
  isCompleted,
  markAsComplete,
}: ModalTodoProps) {
  const [isMentorsOpen, setIsMentorsOpen] = useState(false);
  const [isAboutProgramOpen, setIsAboutProgramOpen] = useState(false);

  const handleClick = () => {
    if (todo.task_url === "mentors") {
      setIsMentorsOpen(true);
    } else if (todo.task_url === "about_program") {
      setIsAboutProgramOpen(true);
    }
  };

  const getDisplayText = () => {
    if (todo.task_url === "mentors") {
      return "Meet your Instructors";
    } else if (todo.task_url === "about_program") {
      return "Check out the I-Corps Program";
    }
    return todo.task_url || "Open Modal";
  };

  return (
    <>
      <li
        key={todo.id}
        className={`text-[#B5BCCB] border-[0.5px] border-white rounded-[8px] px-[12px] py-[12px] flex flex-row gap-3.5 items-center bg-white`}
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

        <span
          className={`text-[14px] font-medium text-[#6A35FF] hover:text-[#6A35FF] transition-colors cursor-pointer ${
            isCompleted ? "line-through" : "underline"
          }`}
          onClick={handleClick}
        >
          {getDisplayText()}
        </span>
      </li>

      <Mentors isOpen={isMentorsOpen} onClose={() => setIsMentorsOpen(false)} />
      <AboutProgram
        isOpen={isAboutProgramOpen}
        onClose={() => setIsAboutProgramOpen(false)}
      />
    </>
  );
}
