"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DropdownOptionsEditor } from "./DropdownOptionsEditor";
import { RESPONSE_TYPES } from "./responseTypes";
import type {
  DropdownOption,
  InterviewQuestionDraft,
  ResponseType,
} from "./types";

interface QuestionFormProps {
  /** Seeds the draft. Omitted for a brand-new question. */
  initial?: InterviewQuestionDraft;
  onSave: (value: InterviewQuestionDraft) => Promise<void> | void;
  /** Omitted for the auto-opened draft on an empty hypothesis — there is nothing to
   *  cancel back to, so the button is left out entirely. */
  onCancel?: () => void;
}

const EMPTY: InterviewQuestionDraft = {
  title: "",
  responseType: "text",
  options: [],
};

export function QuestionForm({ initial, onSave, onCancel }: QuestionFormProps) {
  // The draft lives here rather than in the page's block state: nothing is persisted
  // until Save, so a keystroke has no business travelling up the tree.
  const [draft, setDraft] = useState<InterviewQuestionDraft>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);

  const patch = (next: Partial<InterviewQuestionDraft>) =>
    setDraft((prev) => ({ ...prev, ...next }));

  const handleOptionsChange = (options: DropdownOption[]) => patch({ options });

  const handleSave = async () => {
    if (!draft.title.trim() || saving) return;
    setSaving(true);
    try {
      // Only dropdown questions carry options; dropping them otherwise keeps a
      // half-configured list from resurfacing if the type is switched back later.
      await onSave({
        ...draft,
        title: draft.title.trim(),
        options: draft.responseType === "dropdown" ? draft.options : [],
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="text-base text-[#4E5566]">Question:</span>
        <Input
          autoFocus
          value={draft.title}
          onChange={(e) => patch({ title: e.target.value })}
          placeholder="Type your question"
          className="h-9 bg-white text-base"
        />
      </div>

      {/* Response type selector — inline, violet accent. */}
      <div className="flex items-center gap-2">
        <span className="text-base text-[#4E5566]">Response type:</span>
        <Select
          value={draft.responseType}
          onValueChange={(value) =>
            patch({ responseType: value as ResponseType })
          }
        >
          <SelectTrigger
            size="sm"
            className="h-auto gap-1 border-0 bg-transparent px-0 py-0 text-base font-semibold text-[#6A35FF] shadow-none focus-visible:ring-0 dark:bg-transparent dark:hover:bg-transparent [&_svg]:text-[#6A35FF] [&_svg]:opacity-100"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {RESPONSE_TYPES.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {draft.responseType === "dropdown" && (
        <DropdownOptionsEditor
          options={draft.options}
          onChange={handleOptionsChange}
        />
      )}
      {/* `scale` has no extra configuration — the response is a fixed 1-5 rating. */}

      <div className="flex items-center justify-end gap-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={saving}
            className="text-[#4E5566] hover:bg-[#F1F2F6]"
          >
            Cancel
          </Button>
        )}
        <Button
          type="button"
          onClick={handleSave}
          disabled={!draft.title.trim() || saving}
          className="bg-[#6A35FF] text-white hover:bg-[#5A2BE0]"
        >
          Save
        </Button>
      </div>
    </div>
  );
}
