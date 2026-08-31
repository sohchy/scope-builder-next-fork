"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO } from "date-fns";
import { OfficeHourSlot } from "@/lib/generated/prisma";
import {
  generateWeeks,
  generateTimeOptions,
  addThirtyMinutes,
} from "@/lib/officeHoursUtils";
import {
  createOfficeHourSlot,
  updateOfficeHourSlot,
  deleteOfficeHourSlot,
} from "@/services/officeHours";
import WeekColumn from "./WeekColumn";

const WEEKS_PER_PAGE = 4;

interface AvailabilityEditorProps {
  initialSlots: OfficeHourSlot[];
}

export default function AvailabilityEditor({
  initialSlots,
}: AvailabilityEditorProps) {
  const [slots, setSlots] = useState<OfficeHourSlot[]>(initialSlots);
  const [pageIndex, setPageIndex] = useState(0);
  const [, startTransition] = useTransition();

  const programStart = parseISO(
    process.env.NEXT_PUBLIC_PROGRAM_START_DATE ?? "2026-01-01"
  );
  const programEnd = parseISO(
    process.env.NEXT_PUBLIC_PROGRAM_END_DATE ?? "2026-12-31"
  );
  const slotStartTime = process.env.NEXT_PUBLIC_SLOT_START_TIME ?? "08:00";
  const slotEndTime = process.env.NEXT_PUBLIC_SLOT_END_TIME ?? "22:00";

  const weeks = generateWeeks(programStart, programEnd);
  const allOptions = generateTimeOptions(slotStartTime, slotEndTime);

  const totalPages = Math.ceil(weeks.length / WEEKS_PER_PAGE);
  const visibleWeeks = weeks.slice(
    pageIndex * WEEKS_PER_PAGE,
    pageIndex * WEEKS_PER_PAGE + WEEKS_PER_PAGE
  );

  async function handleAddSlot(date: Date) {
    const defaultStart = slotStartTime;
    const defaultEnd = addThirtyMinutes(defaultStart);

    // Optimistic update with a temporary id
    const tempId = `temp-${Date.now()}`;
    const optimistic: OfficeHourSlot = {
      id: tempId,
      user_id: "",
      mentor_name: "",
      date,
      start_time: defaultStart,
      end_time: defaultEnd,
      created_at: new Date(),
      updated_at: new Date(),
    };
    setSlots((prev) => [...prev, optimistic]);

    startTransition(async () => {
      try {
        const saved = await createOfficeHourSlot(date, defaultStart, defaultEnd);
        setSlots((prev) =>
          prev.map((s) => (s.id === tempId ? saved : s))
        );
      } catch {
        setSlots((prev) => prev.filter((s) => s.id !== tempId));
      }
    });
  }

  async function handleUpdateSlot(
    id: string,
    startTime: string,
    endTime: string
  ) {
    // Optimistic update
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, start_time: startTime, end_time: endTime } : s
      )
    );

    startTransition(async () => {
      try {
        await updateOfficeHourSlot(id, startTime, endTime);
      } catch {
        // Revert on error — re-fetch would be ideal but keep simple for now
      }
    });
  }

  async function handleDeleteSlot(id: string) {
    const removed = slots.find((s) => s.id === id);
    setSlots((prev) => prev.filter((s) => s.id !== id));

    startTransition(async () => {
      try {
        await deleteOfficeHourSlot(id);
      } catch {
        if (removed) setSlots((prev) => [...prev, removed]);
      }
    });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center justify-center mb-6">
        <button
          onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
          disabled={pageIndex === 0}
          className="absolute left-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          aria-label="Previous weeks"
        >
          <ChevronLeft size={16} />
        </button>
        <h1
          className="text-2xl font-bold text-gray-900"
          style={{ fontFamily: "Manrope" }}
        >
          Your availability
        </h1>
        <button
          onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
          disabled={pageIndex >= totalPages - 1}
          className="absolute right-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          aria-label="Next weeks"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden">
        {visibleWeeks.map((week) => (
          <WeekColumn
            key={week.weekStart.toISOString()}
            week={week}
            slots={slots}
            allOptions={allOptions}
            onAddSlot={handleAddSlot}
            onUpdateSlot={handleUpdateSlot}
            onDeleteSlot={handleDeleteSlot}
          />
        ))}
      </div>
    </div>
  );
}
