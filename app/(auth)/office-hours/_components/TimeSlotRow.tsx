"use client";

import { X } from "lucide-react";
import { OfficeHourSlot } from "@/lib/generated/prisma";
import { TimeOption, addThirtyMinutes, isAfter } from "@/lib/officeHoursUtils";
import TimeSelect from "./TimeSelect";

interface TimeSlotRowProps {
  slot: OfficeHourSlot;
  allOptions: TimeOption[];
  onUpdate: (id: string, startTime: string, endTime: string) => void;
  onDelete: (id: string) => void;
}

export default function TimeSlotRow({
  slot,
  allOptions,
  onUpdate,
  onDelete,
}: TimeSlotRowProps) {
  const endOptions = allOptions.filter((opt) =>
    isAfter(opt.value, slot.start_time)
  );

  function handleStartChange(newStart: string) {
    // If current end is no longer after new start, advance it
    const newEnd = isAfter(slot.end_time, newStart)
      ? slot.end_time
      : addThirtyMinutes(newStart);
    onUpdate(slot.id, newStart, newEnd);
  }

  function handleEndChange(newEnd: string) {
    onUpdate(slot.id, slot.start_time, newEnd);
  }

  return (
    <div className="flex items-center gap-2 mb-2">
      <TimeSelect
        value={slot.start_time}
        onChange={handleStartChange}
        options={allOptions.filter((opt) => {
          // Exclude the last option so there's always room for an end time
          const last = allOptions[allOptions.length - 1];
          return opt.value !== last?.value;
        })}
      />
      <span className="text-gray-400 text-sm">—</span>
      <TimeSelect
        value={slot.end_time}
        onChange={handleEndChange}
        options={endOptions}
      />
      <button
        onClick={() => onDelete(slot.id)}
        className="ml-1 text-gray-400 hover:text-gray-600 transition-colors"
        aria-label="Remove slot"
      >
        <X size={16} />
      </button>
    </div>
  );
}
