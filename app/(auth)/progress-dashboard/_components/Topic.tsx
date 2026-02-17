"use client";

import {
  YoutubeIcon,
  BookOpenIcon,
  EllipsisIcon,
  FileTextIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  MessageSquareMoreIcon,
  CircleCheckIcon,
  ImageIcon,
  PlayIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { YouTubeEmbed } from "@next/third-parties/google";

import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuGroup,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { markTaskAsCompleted, markTopicAsCompleted } from "@/services/topics";
import { Button } from "@/components/ui/button";
import Image from "next/image";

type Topic = {
  id: number;
  name: string;
  type: string;
  isDone: boolean;
  deadline: string;
  description: string | null;
  concept_tasks: {
    id: number;
    subtype: string;
    completed: boolean;
    url?: string;
    title?: string;
    description?: string;
  }[];
  startup_tasks: {
    id: number;
    subtype: string;
    completed: boolean;
    url?: string;
    title?: string;
    description?: string;
  }[];
  excercises_tasks: {
    id: number;
    subtype: string;
    completed: boolean;
    url?: string;
    title?: string;
    description?: string;
  }[];
};

interface TopicProps {
  topic: Topic;
}

export default function Topic({ topic }: TopicProps) {
  const [isOpen, setIsOpen] = useState(!topic.isDone);
  const [topicState, setTopicState] = useState<Topic>(topic);

  const markAsCompleted = async () => {
    await markTopicAsCompleted(topic.id);
    setTopicState({ ...topicState, isDone: true });
  };

  const completeTask = async (taskId: number) => {
    await markTaskAsCompleted(taskId);
    setTopicState({
      ...topicState,
      concept_tasks: topicState.concept_tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t,
      ),
      excercises_tasks: topicState.excercises_tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t,
      ),
      startup_tasks: topicState.startup_tasks.map((t) =>
        t.id === taskId ? { ...t, completed: true } : t,
      ),
    });
  };

  useEffect(() => {
    if (topicState.isDone) {
      setIsOpen(false);
    }
  }, [topicState.isDone]);

  return (
    <div key={topic.id} className="grid grid-cols-7 ">
      <div className="col-span-2 w-[330px] flex flex-row items-center ">
        <div className="h-full flex flex-col items-center justify-center">
          <div
            onClick={() => setIsOpen(!isOpen)}
            className={`w-[26px] min-w-[26px] h-[26px] min-h-[26px]  rounded-full flex items-center justify-center cursor-pointer ${topicState.isDone ? "bg-[#E4F5E9]" : "bg-[#F4F0FF]"}`}
          >
            {isOpen ? (
              <ChevronDownIcon
                className={` ${topicState.isDone ? "text-[#247C30]" : "text-[#6A35FF]"}`}
                size={18}
              />
            ) : (
              <ChevronRightIcon
                className={` ${topicState.isDone ? "text-[#247C30]" : "text-[#6A35FF]"}`}
                size={18}
              />
            )}
          </div>
          <div
            className={`w-1.5  h-full ${topicState.isDone ? "bg-[#E4F5E9]" : "bg-[#F4F0FF]"}`}
          />
        </div>
        <div className="h-full flex flex-col gap-4 px-3.5 w-full">
          <div className="flex flex-row items-center justify-between">
            <div className="flex flex-row gap-2">
              <Badge
                className={`${topicState.isDone ? "bg-[#E4F5E9] text-[#247C30]" : "bg-[#F4F0FF] text-[#6A35FF]"}`}
              >{`${topicState.type}`}</Badge>
              <Badge
                className={`${topicState.isDone ? "bg-[#E4F5E9] text-[#247C30]" : "bg-[#F4F0FF] text-[#6A35FF]"}`}
              >{`${topicState.deadline}`}</Badge>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                {/* <Button variant="ghost" size="icon"> */}
                <EllipsisIcon className="cursor-pointer" size={20} />
                {/* </Button> */}
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40" align="start">
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    className="flex flex-row justify-between items-center"
                    onClick={markAsCompleted}
                  >
                    Complete
                    <CircleCheckIcon
                      className="ml-2 text-green-500"
                      size={16}
                    />
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {isOpen && (
            <>
              <h3 className="text-sm font-semibold">{topicState.name}</h3>
              <p className="text-xs font-medium text-[#697288]">
                {topicState.description}
              </p>
            </>
          )}
        </div>
      </div>

      {isOpen && (
        <div className="grid grid-cols-3 w-[750px] col-span-5  font-semibold border border-gray-400 rounded-[10px] mb-[30px]">
          <div className="border-r w-[250px] border-gray-400 p-4 h-[172px] grid grid-cols-4 gap-2 content-start">
            {topicState.concept_tasks.map((task) => (
              <TaskItem
                key={task.id}
                url={task.url}
                title={task.title}
                type={task.subtype}
                completed={task.completed}
                description={task.description}
                onComplete={() => completeTask(task.id)}
              />
            ))}
          </div>
          <div className="border-r w-[250px] border-gray-400  p-4 h-[172px] grid grid-cols-4 gap-8">
            {topicState.excercises_tasks.map((task) => (
              <TaskItem
                key={task.id}
                url={task.url}
                title={task.title}
                type={task.subtype}
                completed={task.completed}
                description={task.description}
                onComplete={() => completeTask(task.id)}
              />
            ))}
          </div>
          <div className=" w-[250px] border-gray-400  p-4  h-[172px] grid grid-cols-4 gap-8">
            {topicState.startup_tasks.map((task) => (
              <TaskItem
                key={task.id}
                url={task.url}
                title={task.title}
                type={task.subtype}
                completed={task.completed}
                description={task.description}
                onComplete={() => completeTask(task.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!isOpen && <div className="h-14" />}
    </div>
  );
}

const TaskItem = ({
  url,
  type,
  title,
  completed,
  onComplete,
  description,
}: {
  type: string;
  url?: string;
  completed: boolean;
  title?: string;
  description?: string;
  onComplete: () => Promise<void>;
}) => {
  function getYouTubeVideoId(input: string): string {
    try {
      const url = new URL(input);

      // https://www.youtube.com/watch?v=VIDEOID
      if (url.hostname.includes("youtube.com")) {
        const v = url.searchParams.get("v");
        if (v && /^[A-Za-z0-9_-]{11}$/.test(v)) return v;

        // https://www.youtube.com/embed/VIDEOID  | /shorts/VIDEOID | /v/VIDEOID
        const m = url.pathname.match(/\/(embed|shorts|v)\/([A-Za-z0-9_-]{11})/);
        if (m) return m[2];
      }

      // https://youtu.be/VIDEOID
      if (url.hostname === "youtu.be") {
        const id = url.pathname.replace(/^\/+/, "");
        if (/^[A-Za-z0-9_-]{11}$/.test(id)) return id;
      }

      return "";
    } catch {
      return ""; // invalid URL
    }
  }

  if (type === "youtube")
    return (
      <ProgressItem
        title={title}
        isCompleted={completed}
        triggerEl={
          <div
            className={`size-10 border ${completed ? "bg-[#28BF58] text-[#FFFFFF] border-[#28BF58]" : "bg-[#EDF6F0] text-[#8F84AE] border-gray-400"} flex items-center justify-center rounded-[8px] `}
          >
            <YoutubeIcon size={20} />
          </div>
        }
        onComplete={onComplete}
      >
        <div>
          <div className="w-full flex items-center justify-center">
            <YouTubeEmbed
              width={700}
              height={400}
              params="controls=0"
              videoid={getYouTubeVideoId(url || "")}
            />
          </div>
          <span className="text-[#697288] text-xs font-medium mt-4 mb-1 block">
            YouTube
          </span>
          {/* <h3 className="text-[#111827] text-sm font-semibold mb-3">{title}</h3> */}
          {/* <p className="text-[#697288] text-[16px] font-medium mb-1">
            {description}
          </p> */}
          <div
            data-todo-content
            className={`text-[14px] font-medium text-[#2E3545] break-words overflow-wrap-anywhere `}
            dangerouslySetInnerHTML={{
              __html: description || "",
            }}
            style={
              {
                //maxHeight: !isExpanded && needsShowMore ? "4.5rem" : "none",
                //overflow: !isExpanded && needsShowMore ? "hidden" : "visible",
              }
            }
          />
        </div>
      </ProgressItem>
    );

  if (type === "image") {
    return (
      <ProgressItem
        title={title}
        isCompleted={completed}
        triggerEl={
          <div
            className={`size-10 border ${completed ? "bg-[#28BF58] text-[#FFFFFF]" : "bg-[#EDF6F0] text-[#8F84AE] border-gray-400"} flex items-center justify-center rounded-[8px] `}
          >
            <ImageIcon size={20} />
          </div>
        }
        onComplete={onComplete}
      >
        <div>
          <div className="w-full flex items-center justify-center">
            <img
              width={"100%"}
              height={"100%"}
              src={url || ""}
              alt={title || "Image"}
            />
          </div>
          <span className="text-[#697288] text-xs font-medium mt-4 mb-1 block">
            Image
          </span>
          {/* <h3 className="text-[#111827] text-sm font-semibold mb-3">{title}</h3> */}
          {/* <p className="text-[#697288] text-[16px] font-medium mb-1">
            {description}
          </p> */}
          <div
            data-todo-content
            className={`text-[14px] font-medium text-[#2E3545] break-words overflow-wrap-anywhere `}
            dangerouslySetInnerHTML={{
              __html: description || "",
            }}
            style={
              {
                //maxHeight: !isExpanded && needsShowMore ? "4.5rem" : "none",
                //overflow: !isExpanded && needsShowMore ? "hidden" : "visible",
              }
            }
          />
        </div>
      </ProgressItem>
    );
  }

  if (type === "video") {
    return (
      <ProgressItem
        title={title}
        isCompleted={completed}
        triggerEl={
          <div
            className={`size-10 border ${completed ? "bg-[#28BF58] text-[#FFFFFF]" : "bg-[#EDF6F0] text-[#8F84AE] border-gray-400"} flex items-center justify-center rounded-[8px] `}
          >
            <PlayIcon size={20} />
          </div>
        }
        onComplete={onComplete}
      >
        <div>
          <div className="w-full flex items-center justify-center">
            <video width={600} height={400} controls src={url || ""} />
          </div>
          <span className="text-[#697288] text-xs font-medium mt-4 mb-1 block">
            Video
          </span>
          {/* <h3 className="text-[#111827] text-sm font-semibold mb-3">{title}</h3> */}
          {/* <p className="text-[#697288] text-[16px] font-medium mb-1">
            {description}
          </p> */}
          <div
            data-todo-content
            className={`text-[14px] font-medium text-[#2E3545] break-words overflow-wrap-anywhere `}
            dangerouslySetInnerHTML={{
              __html: description || "",
            }}
            style={
              {
                //maxHeight: !isExpanded && needsShowMore ? "4.5rem" : "none",
                //overflow: !isExpanded && needsShowMore ? "hidden" : "visible",
              }
            }
          />
        </div>
      </ProgressItem>
    );
  }

  if (type === "lecture")
    return (
      <ProgressItem
        isCompleted={completed}
        triggerEl={
          <div
            className={`size-10 ${completed ? "bg-[#28BF58] text-[#FFFFFF]" : "bg-[#EDF6F0] text-[#8F84AE]"} flex items-center justify-center rounded-[8px] `}
          >
            <BookOpenIcon size={20} />
          </div>
        }
        onComplete={onComplete}
      >
        <div>Lecture</div>
      </ProgressItem>
    );

  if (type === "article")
    return (
      <ProgressItem
        isCompleted={completed}
        triggerEl={
          <div
            className={`size-10 border ${completed ? "bg-[#28BF58] text-[#FFFFFF] border-[#28BF58]" : "bg-[#EDF6F0] text-[#8F84AE] border-gray-400"} flex items-center justify-center rounded-[8px] `}
          >
            <FileTextIcon size={20} />
          </div>
        }
        onComplete={onComplete}
      >
        <div>This is the content for the article modal</div>
      </ProgressItem>
    );

  if (type === "comment")
    return (
      <ProgressItem
        isCompleted={completed}
        triggerEl={
          <div
            className={`size-10 border ${completed ? "bg-[#28BF58] text-[#FFFFFF] border-[#28BF58]" : "bg-[#EDF6F0] text-[#8F84AE] border-gray-400"} flex items-center justify-center rounded-[8px] `}
          >
            <MessageSquareMoreIcon size={20} />
          </div>
        }
        onComplete={onComplete}
      >
        <div>Comment</div>
      </ProgressItem>
    );

  return null;
};

const ProgressItem = ({
  title,
  children,
  triggerEl,
  onComplete,
  isCompleted,
}: {
  title?: string;
  isCompleted: boolean;
  children: React.ReactNode;
  triggerEl: React.ReactNode;
  onComplete: () => Promise<void>;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger className="cursor-pointer" asChild>
        {triggerEl}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[890px] h-[700px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
        {!isCompleted && (
          <Button
            size={"sm"}
            onClick={async () => {
              await onComplete();
              setIsOpen(false);
            }}
          >
            Mark as Completed
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
