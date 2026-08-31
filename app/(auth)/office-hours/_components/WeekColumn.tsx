"use client";

import { OfficeHourSlot } from "@/lib/generated/prisma";
import { Week, TimeOption } from "@/lib/officeHoursUtils";
import DayRow from "./DayRow";
import { isSameDay } from "date-fns";

interface WeekColumnProps {
  week: Week;
  slots: OfficeHourSlot[];
  allOptions: TimeOption[];
  onAddSlot: (date: Date) => void;
  onUpdateSlot: (id: string, startTime: string, endTime: string) => void;
  onDeleteSlot: (id: string) => void;
}

export default function WeekColumn({
  week,
  slots,
  allOptions,
  onAddSlot,
  onUpdateSlot,
  onDeleteSlot,
}: WeekColumnProps) {
  return (
    <div className="bg-white border-2 border-white rounded-2xl overflow-hidden">
      <div className="bg-[#F4F0FF] px-4 py-3">
        <p className="text-sm font-bold text-gray-800">{week.label}</p>
      </div>

      <div className="px-4 py-2">
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
            />
          );
        })}
      </div>
    </div>
  );
}
