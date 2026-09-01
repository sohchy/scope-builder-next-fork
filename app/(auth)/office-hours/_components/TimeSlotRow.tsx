"use client";

import { Loader2, X } from "lucide-react";
import { TimeOption, addThirtyMinutes, isAfter } from "@/lib/officeHoursUtils";
import type { AdminSlot } from "@/services/officeHours";
import TimeSelect from "./TimeSelect";

interface TimeSlotRowProps {
  slot: AdminSlot;
  allOptions: TimeOption[];
  onUpdate: (id: string, startTime: string, endTime: string) => void;
  onDelete: (id: string) => void;
  /** True while the affected bookings are being looked up for the dialog. */
  busy?: boolean;
}

export default function TimeSlotRow({
  slot,
  allOptions,
  onUpdate,
  onDelete,
  busy = false,
}: TimeSlotRowProps) {
  const endOptions = allOptions.filter((opt) =>
    isAfter(opt.value, slot.start_time)
  );

  // Surfaced up front so a mentor sees the cost of editing before they click.
  const booked = slot.subSlots.filter((s) => s.booking).length;

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
    <div className="mb-2">
      <div className="flex items-center gap-2">
        <TimeSelect
          value={slot.start_time}
          onChange={handleStartChange}
          options={allOptions.filter((opt) => {
            // Exclude the last option so there's always room for an end time
            const last = allOptions[allOptions.length - 1];
            return opt.value !== last?.value;
          })}
          disabled={busy}
        />
        <span className="text-gray-400 text-sm">—</span>
        <TimeSelect
          value={slot.end_time}
          onChange={handleEndChange}
          options={endOptions}
          disabled={busy}
        />
        <button
          onClick={() => onDelete(slot.id)}
          disabled={busy}
          className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors disabled:cursor-default"
          aria-label="Remove slot"
        >
          {busy ? (
            <Loader2 size={16} className="animate-spin text-[#6A35FF]" />
          ) : (
            <X size={16} />
          )}
        </button>
      </div>
      {/* Own line — the week column is too narrow to carry this inline without
          squeezing the pickers. */}
      {booked > 0 && (
        <span className="mt-1 inline-block rounded-full bg-[#F4F0FF] px-2 py-0.5 text-xs font-medium text-[#6A35FF]">
          {busy ? "Checking bookings…" : `${booked} booked`}
        </span>
      )}
    </div>
  );
}
