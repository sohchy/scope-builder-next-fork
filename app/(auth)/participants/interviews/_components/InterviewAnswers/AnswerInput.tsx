"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ScalePicker } from "../ScalePicker";
import type { AnswerableQuestion } from "./types";

interface AnswerInputProps {
  question: AnswerableQuestion;
  value: string;
  onChange: (value: string) => void;
  /**
   * Persist the answer. Pass the value when committing in the same tick as the edit —
   * state hasn't re-rendered yet, so the argument is the only fresh copy.
   */
  onCommit: (value?: string) => void;
  readOnly?: boolean;
}

export function AnswerInput({
  question,
  value,
  onChange,
  onCommit,
  readOnly = false,
}: AnswerInputProps) {
  if (question.responseType === "scale") {
    return (
      <ScalePicker
        // 0 when unanswered, so no point reads as selected.
        value={value ? Number(value) : 0}
        disabled={readOnly}
        onSelect={(point) => {
          // Cleared comes back as 0, which is stored as an empty answer rather than "0".
          const next = point === 0 ? "" : String(point);
          onChange(next);
          onCommit(next);
        }}
      />
    );
  }

  if (question.responseType === "dropdown") {
    return (
      <Select
        value={value || undefined}
        disabled={readOnly}
        onValueChange={(next) => {
          onChange(next);
          onCommit(next);
        }}
      >
        <SelectTrigger className="w-full bg-white">
          <SelectValue placeholder="Select an answer" />
        </SelectTrigger>
        <SelectContent>
          {question.options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <Input
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      onBlur={() => onCommit()}
      placeholder="Type user's answer"
      className="bg-white"
    />
  );
}
