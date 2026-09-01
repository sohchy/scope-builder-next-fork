"use client";

import { TimeOption } from "@/lib/officeHoursUtils";
import type { AdminSlot } from "@/services/officeHours";
import TimeSlotRow from "./TimeSlotRow";

interface DayRowProps {
  dayName: string;
  dayDate: string;
  date: Date;
  slots: AdminSlot[];
  allOptions: TimeOption[];
  onAddSlot: (date: Date) => void;
  onUpdateSlot: (id: string, startTime: string, endTime: string) => void;
  onDeleteSlot: (id: string) => void;
  /** Slot whose bookings are currently being looked up, if any. */
  busySlotId: string | null;
}

export default function DayRow({
  dayName,
  dayDate,
  date,
  slots,
  allOptions,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
  busySlotId,
}: DayRowProps) {
  const addSlotButton = (
    <button
      onClick={() => onAddSlot(date)}
      className="text-xs font-semibold text-[#6A35FF] hover:opacity-80 transition-opacity"
    >
      + Add slot
    </button>
  );

  // With slots, the day label sits on its own line so the time pickers get the
  // full card width instead of the narrow right-hand column.
  if (slots.length > 0) {
    return (
      <div className="py-3 border-b border-gray-100 last:border-b-0">
        <div className="mb-2 flex items-baseline gap-2">
          <p className="text-sm font-semibold text-gray-800">{dayName}</p>
          <p className="text-xs text-gray-400">{dayDate}</p>
        </div>

        {slots.map((slot) => (
          <TimeSlotRow
            key={slot.id}
            slot={slot}
            allOptions={allOptions}
            onUpdate={onUpdateSlot}
            onDelete={onDeleteSlot}
            busy={busySlotId === slot.id}
          />
        ))}
        {addSlotButton}
      </div>
    );
  }

  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-4">
        <div className="w-28 shrink-0">
          <p className="text-sm font-semibold text-gray-800">{dayName}</p>
          <p className="text-xs text-gray-400">{dayDate}</p>
        </div>

        <div className="flex-1">{addSlotButton}</div>
      </div>
    </div>
  );
}
