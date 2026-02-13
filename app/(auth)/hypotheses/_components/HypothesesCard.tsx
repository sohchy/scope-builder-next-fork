"use client";

import z from "zod";
import {
  MicIcon,
  FlameIcon,
  CircleXIcon,
  EllipsisIcon,
  HourglassIcon,
  CircleCheckIcon,
  MessageCircleIcon,
  XIcon,
  CheckIcon,
} from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { hypothesisFormSchema } from "@/schemas/hypothesis";
import {
  createHypothesisQuestion,
  updateHypothesisConclusion,
  updateHypothesisTitle,
  updateHypothesisStatus,
  updateHypothesisType,
} from "@/services/hypothesis";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

/*
  Hypotheses Table
    id
    type
    title
    priority
    description
    conclusion_status
    conclusion_content

  InterviewResponses Table
    id
    question_id
    participant_id
    response_content
    attachments

  Questions Tables
    id
    hypothesis_id
    title
*/

type Response = {
  id: number;
  content: string;
  questionId: number;
  interviewee: string;
  hypothesysId: number;
};

type Question = {
  id: number;
  title: string;
  responses: Response[];
};

export type Hypotheses = {
  id: number;
  title: string;
  order: number;
  priority: number;
  interviews: string[];
  type?: string | null;
  questions: Question[];
  conclusion_status: string;
  description: string | null;
  conclusion_content?: string | null;
};

interface HypothesesCardProps {
  example?: boolean;
  hypothesis: Hypotheses;
}

export default function HypothesesCard({
  example,
  hypothesis,
}: HypothesesCardProps) {
  const [open, setOpen] = useState(false);
  const [openType, setOpenType] = useState(false);
  const [openStatus, setOpenStatus] = useState(false);
  const [showEditTitle, setShowEditTitle] = useState(false);
  const [showResponses, setShowResponses] = useState(false);
  const [openConclusion, setOpenConclusion] = useState(false);
  const [conclusionContent, setConclusionContent] = useState(
    hypothesis.conclusion_content || "",
  );
  const [type, setType] = useState(hypothesis.type || "");
  const [editableTitle, setEditableTitle] = useState(hypothesis.title);
  const [status, setStatus] = useState(hypothesis.conclusion_status || "");

  const form = useForm<z.infer<typeof hypothesisFormSchema>>({
    resolver: zodResolver(hypothesisFormSchema),
    defaultValues: {
      title: "",
    },
  });

  const getPriorityLevel = (priority: number | undefined) => {
    if (!priority) return "No priority";
    switch (priority) {
      case 1:
        return "Low priority";
      case 2:
        return "Medium priority";
      case 3:
        return "High priority";
      default:
        return "No priority";
    }
  };

  const getConclusionStatus = (status: string | undefined) => {
    switch (status) {
      case "Testing":
        return (
          <span className="flex flex-row gap-2 text-[#6E6588] text-xs font-semibold items-center">
            <HourglassIcon size={20} />
            Testing
          </span>
        );
      case "Validated":
        return (
          <span className="flex flex-row gap-2 text-[#247C30] text-xs font-semibold items-center">
            <CircleCheckIcon size={20} />
            Validated
          </span>
        );
      case "Invalidated":
        return (
          <span className="flex flex-row gap-2 text-[#C23522] text-xs font-semibold items-center">
            <CircleXIcon size={20} />
            Invalidated
          </span>
        );
      default:
        return "Proposed";
    }
  };

  async function onSubmit(values: z.infer<typeof hypothesisFormSchema>) {
    await createHypothesisQuestion(hypothesis.id, values.title);
    setOpen(false);
    form.reset();
  }

  async function onUpdateType() {
    await updateHypothesisType(hypothesis.id, type);
    setOpenType(false);
  }

  async function onUpdateStatus() {
    await updateHypothesisStatus(hypothesis.id, status);
    setOpenStatus(false);
  }

  async function onUpdateConclusion() {
    await updateHypothesisConclusion(hypothesis.id, conclusionContent);
    setOpenConclusion(false);
  }

  return (
    <div className="bg-white rounded-2xl px-10 py-8 grid grid-cols-3 gap-10">
      <div className="w-full col-span-2 border-r border-r-[#E4E5ED] pr-10">
        <h3 className="text-lg font-semibold w-full flex justify-between items-center mb-5">
          {showEditTitle ? (
            <div className="flex flex-row items-center justify-between gap-2">
              <Input
                className="w-60"
                value={editableTitle}
                onChange={(e) => setEditableTitle(e.target.value)}
              />
              <div className="flex flex-row gap-2 items-center">
                <CheckIcon
                  size={18}
                  className="text-[#247C30] cursor-pointer"
                  onClick={async () => {
                    await updateHypothesisTitle(hypothesis.id, editableTitle);
                    setShowEditTitle(false);
                  }}
                />
                <XIcon
                  size={18}
                  className="cursor-pointer"
                  onClick={() => {
                    setShowEditTitle(false);
                    setEditableTitle(hypothesis.title);
                  }}
                />
              </div>
            </div>
          ) : (
            <span onDoubleClick={() => setShowEditTitle(true)}>
              {hypothesis.title}
            </span>
          )}
          {/* <Sheet open={open} onOpenChange={setOpen}> */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            {!example && (
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setOpen(true)}>
                  {/* <SheetTrigger className="w-full text-left"> */}
                  Create Question
                  {/* </SheetTrigger> */}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenType(true)}>
                  {/* <SheetTrigger className="w-full text-left"> */}
                  Update Hypothesis Type
                  {/* </SheetTrigger> */}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenStatus(true)}>
                  {/* <SheetTrigger className="w-full text-left"> */}
                  Update Hypothesis Status
                  {/* </SheetTrigger> */}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOpenConclusion(true)}>
                  {/* <SheetTrigger className="w-full text-left"> */}
                  Update Conclusion
                  {/* </SheetTrigger> */}
                </DropdownMenuItem>
              </DropdownMenuContent>
            )}
          </DropdownMenu>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
                  Create a new question
                </SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col gap-8 overflow-auto">
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-8 p-4"
                  >
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Textarea {...field} />
                          </FormControl>

                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex ">
                      <Button
                        type="submit"
                        className="bg-[#162A4F] cursor-pointer ml-auto"
                      >
                        Create
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={openType}
            onOpenChange={(open) => {
              setOpenType(open);
              setStatus(hypothesis.type || "");
            }}
          >
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
                  Update type
                </SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col gap-8 overflow-auto">
                <div className="space-y-8 p-4">
                  <div className="flex flex-col gap-2">
                    <Label>Type</Label>

                    <Select value={type} onValueChange={setType}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex ">
                    <Button
                      type="button"
                      onClick={onUpdateType}
                      className="bg-[#162A4F] cursor-pointer ml-auto"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={openStatus}
            onOpenChange={(open) => {
              setOpenStatus(open);
              setStatus(hypothesis.conclusion_status || "");
            }}
          >
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
                  Update status
                </SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col gap-8 overflow-auto">
                <div className="space-y-8 p-4">
                  <div className="flex flex-col gap-2">
                    <Label>Status</Label>

                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Testing">Testing</SelectItem>
                        <SelectItem value="Validated">Validated</SelectItem>
                        <SelectItem value="Invalidated">Invalidated</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex ">
                    <Button
                      type="button"
                      onClick={onUpdateStatus}
                      className="bg-[#162A4F] cursor-pointer ml-auto"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Sheet
            open={openConclusion}
            onOpenChange={(open) => {
              setOpenConclusion(open);
              setStatus(hypothesis.conclusion_content || "");
            }}
          >
            <SheetContent>
              <SheetHeader>
                <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
                  Update conclusion
                </SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col gap-8 overflow-auto">
                <div className="space-y-8 p-4">
                  <div className="flex flex-col gap-2">
                    <Label>Conclusion</Label>

                    <Textarea
                      value={conclusionContent}
                      onChange={(e) => setConclusionContent(e.target.value)}
                    />
                  </div>

                  <div className="flex ">
                    <Button
                      type="button"
                      onClick={onUpdateConclusion}
                      className="bg-[#162A4F] cursor-pointer ml-auto"
                    >
                      Update
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </h3>
        {hypothesis.questions.length === 0 && (
          <span className="text-[#697288] font-semibold text-xs">
            No questions has been added yet.
          </span>
        )}

        {hypothesis.questions.length > 0 && (
          <div className="mb-9">
            <div className="flex flex-row items-center justify-between">
              <div className="flex flex-row items-center gap-0.5">
                {hypothesis.interviews.length > 0 && (
                  <MicIcon className="text-[#697288] mr-3" size={24} />
                )}
                {hypothesis.interviews.map((interview, index) => {
                  return (
                    <div key={index}>
                      <span className="text-xs text-[#697288] font-semibold underline decoration-dotted">
                        {interview}
                      </span>
                      {index < hypothesis.interviews.length - 1 && (
                        <span className="text-xs text-[#697288] font-semibold">
                          ,{" "}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              {!hypothesis.questions.some(
                (question) => question.responses.length > 0,
              ) && (
                <span className="text-[#697288] text-xs font-semibold">
                  No responses yet
                </span>
              )}

              {hypothesis.questions.some(
                (question) => question.responses.length > 0,
              ) && (
                <span
                  className="text-[#6A35FF] text-xs font-semibold cursor-pointer"
                  onClick={() => setShowResponses(!showResponses)}
                >
                  {`${showResponses ? "Hide" : "Show responses"}`}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3.5">
          {hypothesis.questions.map((question, index) => (
            <div key={question.id} className="flex flex-col gap-2.5">
              <div className="flex flex-row items-center justify-between">
                <div className="flex flex-row items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[#6A35FF]" />
                  <span className="text-sm font-medium">{question.title}</span>
                </div>
                <div className="flex flex-row items-center gap-2 text-[#6E6588]">
                  <MessageCircleIcon size={18} />
                  <span className="font-semibold text-xs w-1.5">
                    {question.responses.length}
                  </span>
                </div>
              </div>

              {showResponses &&
                question.responses.map((response) => (
                  <div
                    key={response.id}
                    className="bg-[#F3F0FD] rounded-[5px] py-2.5 px-6 flex flex-row justify-between items-center"
                  >
                    <span className="text-sm font-medium text-[#111827]">
                      {response.content}
                    </span>
                    <span className="text-xs font-semibold text-[#6E6588]">
                      {response.interviewee}
                    </span>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center justify-between">
          <div className="bg-[#F3F0FD] text-xs rounded-full text-[#6E6588] font-semibold px-2 py-0.5">
            {hypothesis.type || "No type"}
          </div>
          <div className="flex flex-row items-center gap-2.5">
            {hypothesis.priority > 0 && (
              <div className="flex flex-row items-center">
                <FlameIcon
                  size={20}
                  fill={hypothesis.priority > 0 ? "#DF6E5A" : "#F3F0FD"}
                  color={hypothesis.priority > 0 ? "#DF6E5A" : "#F3F0FD"}
                />
                <FlameIcon
                  size={20}
                  fill={hypothesis.priority > 1 ? "#DF6E5A" : "#F3F0FD"}
                  color={hypothesis.priority > 1 ? "#DF6E5A" : "#F3F0FD"}
                />
                <FlameIcon
                  size={20}
                  fill={hypothesis.priority > 2 ? "#DF6E5A" : "#F3F0FD"}
                  color={hypothesis.priority > 2 ? "#DF6E5A" : "#F3F0FD"}
                />
              </div>
            )}
            <span className="text-[#6E6588] text-xs font-semibold ">
              {getPriorityLevel(hypothesis.priority)}
            </span>
          </div>
        </div>

        <div
          className={`rounded-[5px] border py-3 flex items-center justify-center ${hypothesis.conclusion_status === "validated" && "bg-[#E9F6EE] border-[#E9F6EE]"} ${hypothesis.conclusion_status === "invalidated" && "bg-[#FDF0F0] border-[#FDF0F0]"}`}
        >
          {getConclusionStatus(hypothesis.conclusion_status)}
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-[#697288] font-semibold text-xs">
            Conclusion:
          </span>
          <p className="text-[#111827] font-medium text-sm">
            {hypothesis.conclusion_content}
          </p>
        </div>
      </div>
    </div>
  );
}
