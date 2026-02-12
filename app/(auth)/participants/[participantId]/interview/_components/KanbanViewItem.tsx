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
    <Card className="w-[440px] min-w-[440px] relative overflow-y-scroll">
      <CardHeader className="">
        <CardTitle className="text-lg font-semibold text-[#111827]">
          {hypothesis.title}
          <div className="absolute top-5 right-5">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <EllipsisIcon />
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
        </CardTitle>
        <CardDescription>{hypothesis.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          {hypothesis.questions.map((question) => (
            <QuestionResponse
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
