"use client";

import { Week, TimeOption } from "@/lib/officeHoursUtils";
import type { AdminSlot } from "@/services/officeHours";
import DayRow from "./DayRow";
import { isSameDay } from "date-fns";

interface WeekColumnProps {
  week: Week;
  slots: AdminSlot[];
  allOptions: TimeOption[];
  onAddSlot: (date: Date) => void;
  onUpdateSlot: (id: string, startTime: string, endTime: string) => void;
  onDeleteSlot: (id: string) => void;
  busySlotId: string | null;
}

export default function WeekColumn({
  week,
  slots,
  allOptions,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
  busySlotId,
}: WeekColumnProps) {
  return (
    <div className="bg-white border-2 border-[#B9BDC9] rounded-2xl overflow-hidden flex flex-col min-h-0">
      <div className="bg-[#F4F0FF] px-4 py-3 shrink-0">
        <p className="text-sm font-bold text-gray-800">{week.label}</p>
      </div>

      <div className="px-4 py-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
        {week.days.map((day) => {
          const daySlots = slots.filter((s) =>
            isSameDay(new Date(s.date), day.date),
          );
          return (
            <DayRow
              key={day.date.toISOString()}
              dayName={day.dayName}
              dayDate={day.dayDate}
              date={day.date}
              slots={daySlots}
              allOptions={allOptions}
              onAddSlot={onAddSlot}
              onUpdateSlot={onUpdateSlot}
              onDeleteSlot={onDeleteSlot}
              busySlotId={busySlotId}
            />
          );
        })}
      </div>
    </div>
  );
}
