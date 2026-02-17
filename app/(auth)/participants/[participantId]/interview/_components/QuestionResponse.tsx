"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { EllipsisIcon, FileTextIcon, LoaderIcon } from "lucide-react";

import { Question } from "./KanbanView";
import { Textarea } from "@/components/ui/textarea";
import { upsertInterviewResponse } from "@/services/hypothesis";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { uploadToSupabase } from "@/lib/uploadToSupabase";
import { Attachment } from "@/components/Notes";
import { cn } from "@/lib/utils";

interface QuestionResponseProps {
  idx: number;
  question: Question;
  participantId: string;
}

export default function QuestionResponse({
  idx,
  question,
  participantId,
}: QuestionResponseProps) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState(question.interviewResponse || "");

  const onUpdateResponse = async () => {
    if (response.trim().length === 0) return;

    setIsLoading(true);

    try {
      await upsertInterviewResponse(question.id, participantId, response);
    } catch (err) {
      console.log(err);
    }

    setIsLoading(false);
  };

  const onUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    const filename = file.name;
    const sizeKB = file.size / 1024;
    const isImage = file.type.startsWith("image/");
    const { url, mime } = await uploadToSupabase(file);

    const newAttachment: Attachment = {
      url,
      name: filename,
      type: isImage ? "image" : "file",
      size:
        sizeKB > 1024
          ? `${(sizeKB / 1024).toFixed(1)} MB`
          : `${Math.round(sizeKB)} KB`,
    };

    e.target.value = "";

    console.log(newAttachment);

    try {
      await upsertInterviewResponse(question.id, participantId, response, [
        ...(question.attachments || []),
        newAttachment,
      ]);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="relative w-full bg-[#F3F0FD] border border-[#B4B9C9] rounded-lg shadow-lg flex flex-col overflow-hidden px-6 py-6 gap-4">
      <div className="absolute top-1 right-1">
        <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="size-6">
              <EllipsisIcon size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={(e) => inputRef.current?.click()}>
              Add Attachments
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <span className="flex flex-row  gap-2.5 text-[14px] text-[#111827] font-semibold">
        <span className="text-[#6A35FF]">{`${idx + 1}.`}</span>
        {question.title}
      </span>
      <Textarea
        value={response}
        className="bg-white text-[14px] font-medium"
        onBlur={onUpdateResponse}
        onChange={(e) => setResponse(e.target.value)}
      />
      {question.attachments.length > 0 && (
        <div className="flex flex-col gap-1.5 px-2.5">
          {question.attachments.map((attachment) => (
            <div key={attachment.url}>
              <Link
                href={attachment.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors text-black no-underline bg-foreground/10",
                  "border-primary-foreground/20 hover:bg-primary-foreground/10",
                )}
              >
                <FileTextIcon className="h-4 w-4 shrink-0 opacity-70" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate text-xs font-medium">
                    {attachment.name}
                  </span>
                  {attachment.size && (
                    <span className="text-[10px] opacity-60">
                      {attachment.size}
                    </span>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
      {isLoading && (
        <LoaderIcon
          size={16}
          className="absolute bottom-1 right-1 animate-spin"
        />
      )}
      <input
        type="file"
        className="hidden"
        ref={inputRef}
        onChange={onUploadFile}
      />
    </div>
  );
}
