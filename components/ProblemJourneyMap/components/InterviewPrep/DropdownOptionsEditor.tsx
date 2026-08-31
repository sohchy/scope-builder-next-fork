"use client";

import { Plus, X } from "lucide-react";
import { DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { Input } from "@/components/ui/input";

import { DragHandle } from "./DragHandle";
import { useSortableSensors } from "./useSortableSensors";
import type { DropdownOption } from "./types";

interface DropdownOptionsEditorProps {
  options: DropdownOption[];
  /** Plain draft state — nothing here persists until the form is saved. */
  onChange: (options: DropdownOption[]) => void;
}

export function DropdownOptionsEditor({
  options,
  onChange,
}: DropdownOptionsEditorProps) {
  const sensors = useSortableSensors();
  const optionIds = options.map((opt) => opt.id);

  const updateLabel = (id: string, label: string) => {
    onChange(options.map((opt) => (opt.id === id ? { ...opt, label } : opt)));
  };

  const removeOption = (id: string) => {
    onChange(options.filter((opt) => opt.id !== id));
  };

  const addOption = () => {
    onChange([...options, { id: crypto.randomUUID(), label: "" }]);
  };

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = optionIds.indexOf(String(active.id));
    const to = optionIds.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onChange(arrayMove(options, from, to));
  };

  return (
    <div className="flex flex-col gap-2">
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <SortableContext items={optionIds} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-2">
            {options.map((option) => (
              <SortableOption
                key={option.id}
                option={option}
                onLabelChange={(label) => updateLabel(option.id, label)}
                onRemove={() => removeOption(option.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <button
        type="button"
        onClick={addOption}
        className="inline-flex w-fit items-center gap-1 pl-10 text-base font-semibold text-[#6A35FF] hover:underline"
      >
        <Plus className="h-4 w-4" />
        Add option
      </button>
    </div>
  );
}

interface SortableOptionProps {
  option: DropdownOption;
  onLabelChange: (label: string) => void;
  onRemove: () => void;
}

function SortableOption({
  option,
  onLabelChange,
  onRemove,
}: SortableOptionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: option.id });

  return (
    <div
      ref={setNodeRef}
      // Translate rather than Transform, matching the other sortable lists on this
      // tab — no scaling of the dragged row.
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={`flex items-center gap-2 ${
        isDragging ? "relative z-10 rounded-md bg-white shadow-md" : ""
      }`}
    >
      <DragHandle
        attributes={attributes}
        listeners={listeners}
        label="Reorder option"
      />
      <Input
        value={option.label}
        onChange={(e) => onLabelChange(e.target.value)}
        placeholder="Enter dropdown option"
        className="h-9 bg-white text-base"
      />
      <button
        type="button"
        aria-label="Remove option"
        onClick={onRemove}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#6E7689] hover:bg-[#F1F2F6] hover:text-[#4B4560]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
