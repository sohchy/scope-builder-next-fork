import {
  CheckIcon,
  Clock3Icon,
  CopyIcon,
  ExternalLinkIcon,
  Loader2Icon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Task } from "@/lib/generated/prisma";
import { Calendar } from "@/components/ui/calendar";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScheduleTodoProps {
  todo: Task;
  isCompleted: boolean;
  data: Record<string, any>;
  markAsComplete: (
    id: number,
    complete: boolean,
    data?: Record<string, any>
  ) => Promise<void>;
}

export default function ScheduleTodo({
  todo,
  data,
  isCompleted,
  markAsComplete,
}: ScheduleTodoProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [scheduleData, setScheduleData] = useState(
    data
      ? data
      : {
          mentor: "",
          date: new Date(),
          time: "",
        }
  );

  const isDisabled =
    !scheduleData.mentor || !scheduleData.date || !scheduleData.time;

  const onSaveSchedule = async () => {
    setIsSaving(true);
    await markAsComplete(todo.id, true, scheduleData);
    setIsSaving(false);
  };

  return (
    <li
      key={todo.id}
      className={`text-[#B5BCCB] border-[0.5px] border-white rounded-[8px] px-[12px] py-[12px] flex flex-col gap-3.5 bg-white`}
    >
      <div className="flex  gap-3.5 items-center">
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
          className={`text-[16px] font-bold text-[#111827] ${
            isCompleted ? "line-through" : ""
          }`}
        >
          {todo.title}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        <Select
          onValueChange={(value) =>
            setScheduleData({ ...scheduleData, mentor: value })
          }
          value={scheduleData.mentor}
        >
          <SelectTrigger className="w-full bg-white">
            <SelectValue placeholder="Select an option" />
          </SelectTrigger>
          <SelectContent onMouseDown={(e) => e.stopPropagation()}>
            {["Peter Pen", "John Doe"].map((option) => (
              <SelectItem value={option} key={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Calendar
          mode="single"
          className="w-full"
          selected={scheduleData.date}
          onSelect={(date) => setScheduleData({ ...scheduleData, date })}
        />
        <div className="border border-[#E4E5ED] rounded-md">
          <div className="flex flex-row gap-2 items-center bg-[#EEF0FA] py-4 px-6">
            <Clock3Icon size={14} />
            <span className="text-[14px] font-extrabold text-[#111827]">
              Select time
            </span>
          </div>
          <div className="py-4 px-6 flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 justify-items-center">
              {["9:30 PM", "11:45 PM", "2:30 AM", "4:30 PM", "7:30 PM"].map(
                (time) => (
                  <span
                    key={time}
                    onClick={() => {
                      setScheduleData({ ...scheduleData, time });
                    }}
                    className={`border-[1.5px] border-[#E4E5ED] w-[67px] h-[30px] flex items-center justify-center text-xs font-semibold rounded-md ${
                      scheduleData.time === time ? "bg-[#6A35FF]" : ""
                    }`}
                  >
                    {time}
                  </span>
                )
              )}
            </div>
            <Button disabled={isDisabled || isSaving} onClick={onSaveSchedule}>
              {isSaving ? <Loader2Icon className="animate-spin" /> : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </li>
  );
}
