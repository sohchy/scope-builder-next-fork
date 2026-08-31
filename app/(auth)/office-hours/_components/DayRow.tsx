"use client";

import { OfficeHourSlot } from "@/lib/generated/prisma";
import { TimeOption } from "@/lib/officeHoursUtils";
import TimeSlotRow from "./TimeSlotRow";

interface DayRowProps {
  dayName: string;
  dayDate: string;
  date: Date;
  slots: OfficeHourSlot[];
  allOptions: TimeOption[];
  onAddSlot: (date: Date) => void;
  onUpdateSlot: (id: string, startTime: string, endTime: string) => void;
  onDeleteSlot: (id: string) => void;
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
}: DayRowProps) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-4">
        <div className="w-28 shrink-0">
          <p className="text-sm font-semibold text-gray-800">{dayName}</p>
          <p className="text-xs text-gray-400">{dayDate}</p>
        </div>

        <div className="flex-1">
          {slots.map((slot) => (
            <TimeSlotRow
              key={slot.id}
              slot={slot}
              allOptions={allOptions}
              onUpdate={onUpdateSlot}
              onDelete={onDeleteSlot}
            />
          ))}
          <button
            onClick={() => onAddSlot(date)}
            className="text-xs font-semibold text-[#6A35FF] hover:opacity-80 transition-opacity mt-1"
          >
            + Add slot
          </button>
        </div>
      </div>
    </div>
  );
}
