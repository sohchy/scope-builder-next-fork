"use client";

import { useState } from "react";
import { EllipsisIcon } from "lucide-react";

import {
  Card,
  CardTitle,
  CardHeader,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Hypothesis } from "./KanbanView";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import QuestionResponse from "./QuestionResponse";
import { Textarea } from "@/components/ui/textarea";
import { createHypothesisQuestion } from "@/services/hypothesis";

interface KanbanViewItemProps {
  participantId: string;
  hypothesis: Hypothesis;
}

export default function KanbanViewItem({
  hypothesis,
  participantId,
}: KanbanViewItemProps) {
  const [open, setOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState("");

  const onCreateQuestion = async () => {
    await createHypothesisQuestion(hypothesis.id, questionTitle);
    setOpen(false);
    setQuestionTitle("");
  };

  return (
    <Card className="w-[440px] min-w-[440px] relative overflow-y-auto">
      <CardHeader className="">
        <CardTitle className="text-lg font-semibold text-[#111827]">
          <div className="flex flex-row items-center justify-between mb-3">
            <span className="bg-[#F3F0FD] text-[#6A35FF] font-semibold text-xs p-2 rounded-full">
              Hypothesis
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisIcon className="text-[#8B92A1]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setOpen(true)}>
                  {/* <SheetTrigger className="w-full text-left"> */}
                  Create Question
                  {/* </SheetTrigger> */}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {hypothesis.title}
        </CardTitle>
        <CardDescription>{hypothesis.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <h3 className="text-[#6E6588] text-xs font-semibold mb-4">Replies</h3>
        <div className="flex flex-col gap-3">
          {hypothesis.questions.map((question, idx) => (
            <QuestionResponse
              idx={idx}
              key={question.id}
              question={question}
              participantId={participantId}
            />
          ))}
        </div>
      </CardContent>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="text-[26px] font-medium text-[#162A4F]">
              Create a new question
            </SheetTitle>
          </SheetHeader>
          <div className="h-full flex flex-col gap-8 overflow-auto">
            <div className="space-y-8 p-4">
              <div className="flex flex-col gap-2">
                <Label>Title</Label>

                <Textarea
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                />
              </div>

              <div className="flex ">
                <Button
                  type="button"
                  className="bg-[#162A4F] cursor-pointer ml-auto"
                  onClick={onCreateQuestion}
                >
                  Create
                </Button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </Card>
  );
}
