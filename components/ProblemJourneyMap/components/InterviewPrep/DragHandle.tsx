"use client";

import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { GripVertical } from "lucide-react";

import { cn } from "@/lib/utils";

interface DragHandleProps {
  /** Spread from `useSortable` — these are what actually start the drag. */
  attributes: DraggableAttributes;
  listeners: SyntheticListenerMap | undefined;
  label: string;
  className?: string;
}

/**
 * The only draggable surface of a sortable row. Confining the listeners to this button
 * — rather than the whole row — keeps text selectable and leaves the row's own buttons
 * clickable.
 */
export function DragHandle({
  attributes,
  listeners,
  label,
  className,
}: DragHandleProps) {
  return (
    <button
      type="button"
      aria-label={label}
      {...attributes}
      {...listeners}
      className={cn(
        "flex h-8 w-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-[#6E7689] hover:bg-[#F1F2F6] hover:text-[#4B4560] active:cursor-grabbing",
        className,
      )}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  );
}
