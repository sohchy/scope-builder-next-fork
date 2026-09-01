"use client";

import { useState, useTransition } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO } from "date-fns";
import {
  generateWeeks,
  generateTimeOptions,
  addThirtyMinutes,
} from "@/lib/officeHoursUtils";
import {
  createOfficeHourSlot,
  updateOfficeHourSlot,
  deleteOfficeHourSlot,
  getSlotImpact,
  type AdminSlot,
  type AffectedBooking,
} from "@/services/officeHours";
import WeekColumn from "./WeekColumn";
import SlotImpactDialog, { type SlotImpactMode } from "./SlotImpactDialog";

const WEEKS_PER_PAGE = 4;

interface AvailabilityEditorProps {
  initialSlots: AdminSlot[];
}

/** A destructive edit held back until the mentor confirms it in the dialog. */
interface PendingImpact {
  mode: SlotImpactMode;
  bookings: AffectedBooking[];
  run: () => void;
}

const bookingCount = (slot: AdminSlot) =>
  slot.subSlots.filter((s) => s.booking).length;

export default function AvailabilityEditor({
  initialSlots,
}: AvailabilityEditorProps) {
  const [slots, setSlots] = useState<AdminSlot[]>(initialSlots);
  const [pageIndex, setPageIndex] = useState(0);
  const [pending, setPending] = useState<PendingImpact | null>(null);
  // The impact lookup hits Clerk for startup names, so it is slow enough to need
  // a visible pending state on the row that was clicked.
  const [checkingId, setCheckingId] = useState<string | null>(null);
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
    const optimistic: AdminSlot = {
      id: tempId,
      user_id: "",
      mentor_name: "",
      date,
      start_time: defaultStart,
      end_time: defaultEnd,
      created_at: new Date(),
      updated_at: new Date(),
      subSlots: [],
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

  function commitUpdate(id: string, startTime: string, endTime: string) {
    // Optimistic update
    setSlots((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, start_time: startTime, end_time: endTime } : s
      )
    );

    startTransition(async () => {
      try {
        const saved = await updateOfficeHourSlot(id, startTime, endTime);
        // Bookings may have been dropped — resync so the marker stays honest.
        setSlots((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...saved } : s))
        );
      } catch {
        // Revert on error — re-fetch would be ideal but keep simple for now
      }
    });
  }

  function commitDelete(id: string) {
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

  async function handleUpdateSlot(
    id: string,
    startTime: string,
    endTime: string
  ) {
    const slot = slots.find((s) => s.id === id);
    if (!slot || bookingCount(slot) === 0) {
      commitUpdate(id, startTime, endTime);
      return;
    }

    // Nothing is applied yet: the pickers keep showing the committed time until
    // the mentor confirms, and snap back if they cancel.
    setCheckingId(id);
    let bookings: AffectedBooking[];
    try {
      bookings = await getSlotImpact(id, startTime, endTime);
    } finally {
      setCheckingId(null);
    }

    if (bookings.length === 0) {
      commitUpdate(id, startTime, endTime);
      return;
    }
    setPending({
      mode: "retime",
      bookings,
      run: () => commitUpdate(id, startTime, endTime),
    });
  }

  async function handleDeleteSlot(id: string) {
    const slot = slots.find((s) => s.id === id);
    if (!slot || bookingCount(slot) === 0) {
      commitDelete(id);
      return;
    }

    setCheckingId(id);
    let bookings: AffectedBooking[];
    try {
      bookings = await getSlotImpact(id);
    } finally {
      setCheckingId(null);
    }

    if (bookings.length === 0) {
      commitDelete(id);
      return;
    }
    setPending({ mode: "delete", bookings, run: () => commitDelete(id) });
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
            busySlotId={checkingId}
          />
        ))}
      </div>

      <SlotImpactDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null);
        }}
        mode={pending?.mode ?? "delete"}
        bookings={pending?.bookings ?? []}
        onConfirm={() => {
          pending?.run();
          setPending(null);
        }}
      />
    </div>
  );
}
