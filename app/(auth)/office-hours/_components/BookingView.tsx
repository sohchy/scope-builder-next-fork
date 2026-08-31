"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { parseISO, isSameDay } from "date-fns";
import { toast } from "sonner";
import {
  OfficeHourSlot,
  OfficeHourSubSlot,
  OfficeHourBooking,
} from "@/lib/generated/prisma";
import { generateWeeks, formatTimeDisplay } from "@/lib/officeHoursUtils";
import {
  bookSlot,
  cancelBooking,
  updateBookingLink,
} from "@/services/officeHours";
import BookingLinkPopover from "./BookingLinkPopover";
import { MultiSelect } from "@/components/ui/multiselect";

type SubSlotWithBooking = OfficeHourSubSlot & {
  booking: OfficeHourBooking | null;
};
type SlotWithSubSlots = OfficeHourSlot & { subSlots: SubSlotWithBooking[] };

type TimeBlock = {
  start_time: string;
  end_time: string;
  entries: {
    subSlotId: string;
    mentorName: string;
    booking: Pick<OfficeHourBooking, "id" | "user_id" | "meeting_link"> | null;
  }[];
};

interface BookingViewProps {
  initialSlots: SlotWithSubSlots[];
  currentUserId: string;
}

const WEEKS_PER_PAGE = 4;

export default function BookingView({
  initialSlots,
  currentUserId,
}: BookingViewProps) {
  const [slots, setSlots] = useState<SlotWithSubSlots[]>(initialSlots);
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedInstructors, setSelectedInstructors] = useState<string[]>([]);

  const programStart = parseISO(
    process.env.NEXT_PUBLIC_PROGRAM_START_DATE ?? "2026-01-01",
  );
  const programEnd = parseISO(
    process.env.NEXT_PUBLIC_PROGRAM_END_DATE ?? "2026-12-31",
  );

  const weeks = generateWeeks(programStart, programEnd);
  const totalPages = Math.ceil(weeks.length / WEEKS_PER_PAGE);
  const visibleWeeks = weeks.slice(
    pageIndex * WEEKS_PER_PAGE,
    pageIndex * WEEKS_PER_PAGE + WEEKS_PER_PAGE,
  );

  const instructorOptions = useMemo(() => {
    const visibleDates = new Set(
      visibleWeeks.flatMap((w) => w.days.map((d) => d.date.toDateString())),
    );
    const visibleSlots = slots.filter((s) =>
      visibleDates.has(new Date(s.date).toDateString()),
    );
    return [...new Set(visibleSlots.map((s) => s.mentor_name))]
      .sort()
      .map((name) => ({ label: name, value: name }));
  }, [slots, visibleWeeks]);

  // Most recently touched link across the user's own bookings, offered as a
  // "use last meeting link" shortcut when booking a new slot.
  const lastMeetingLink = useMemo(() => {
    const mine = slots
      .flatMap((s) => s.subSlots)
      .map((sub) => sub.booking)
      .filter(
        (b): b is OfficeHourBooking =>
          !!b && b.user_id === currentUserId && !!b.meeting_link?.trim(),
      );
    if (mine.length === 0) return null;
    return mine.reduce((latest, b) =>
      new Date(b.updated_at) > new Date(latest.updated_at) ? b : latest,
    ).meeting_link;
  }, [slots, currentUserId]);

  const filteredSlots = useMemo(
    () =>
      selectedInstructors.length === 0
        ? slots
        : slots.filter((s) => selectedInstructors.includes(s.mentor_name)),
    [slots, selectedInstructors],
  );

  function getDayTimeBlocks(date: Date): TimeBlock[] {
    const daySlots = filteredSlots.filter((s) =>
      isSameDay(new Date(s.date), date),
    );
    const blockMap = new Map<string, TimeBlock>();
    for (const slot of daySlots) {
      for (const sub of slot.subSlots) {
        const key = `${sub.start_time}-${sub.end_time}`;
        if (!blockMap.has(key)) {
          blockMap.set(key, {
            start_time: sub.start_time,
            end_time: sub.end_time,
            entries: [],
          });
        }
        blockMap.get(key)!.entries.push({
          subSlotId: sub.id,
          mentorName: slot.mentor_name,
          booking: sub.booking
            ? {
                id: sub.booking.id,
                user_id: sub.booking.user_id,
                meeting_link: sub.booking.meeting_link,
              }
            : null,
        });
      }
    }
    return Array.from(blockMap.values()).sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );
  }

  async function handleBook(subSlotId: string, meetingLink: string) {
    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        subSlots: slot.subSlots.map((sub) =>
          sub.id === subSlotId
            ? {
                ...sub,
                booking: {
                  id: "temp",
                  slot_id: sub.slot_id,
                  sub_slot_id: subSlotId,
                  user_id: currentUserId,
                  org_id: null,
                  user_name: null,
                  user_email: null,
                  meeting_link: meetingLink,
                  ics_sequence: 0,
                  created_at: new Date(),
                  updated_at: new Date(),
                },
              }
            : sub,
        ),
      })),
    );

    try {
      const result = await bookSlot(subSlotId, meetingLink);

      if (result.status === "already_booked") {
        toast.error("This slot was just booked by someone else.");
      }

      setSlots((prev) =>
        prev.map((slot) => ({
          ...slot,
          subSlots: slot.subSlots.map((sub) =>
            sub.id === subSlotId ? { ...sub, booking: result.booking } : sub,
          ),
        })),
      );
    } catch (err) {
      setSlots((prev) =>
        prev.map((slot) => ({
          ...slot,
          subSlots: slot.subSlots.map((sub) =>
            sub.id === subSlotId ? { ...sub, booking: null } : sub,
          ),
        })),
      );
      throw err;
    }
  }

  async function handleUpdateLink(subSlotId: string, meetingLink: string) {
    const originalBooking =
      slots.flatMap((s) => s.subSlots).find((sub) => sub.id === subSlotId)
        ?.booking ?? null;

    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        subSlots: slot.subSlots.map((sub) =>
          sub.id === subSlotId && sub.booking
            ? { ...sub, booking: { ...sub.booking, meeting_link: meetingLink } }
            : sub,
        ),
      })),
    );

    try {
      await updateBookingLink(subSlotId, meetingLink);
    } catch (err) {
      setSlots((prev) =>
        prev.map((slot) => ({
          ...slot,
          subSlots: slot.subSlots.map((sub) =>
            sub.id === subSlotId ? { ...sub, booking: originalBooking } : sub,
          ),
        })),
      );
      throw err;
    }
  }

  async function handleCancel(subSlotId: string) {
    const originalBooking =
      slots.flatMap((s) => s.subSlots).find((sub) => sub.id === subSlotId)
        ?.booking ?? null;

    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        subSlots: slot.subSlots.map((sub) =>
          sub.id === subSlotId ? { ...sub, booking: null } : sub,
        ),
      })),
    );

    try {
      await cancelBooking(subSlotId);
    } catch (err) {
      setSlots((prev) =>
        prev.map((slot) => ({
          ...slot,
          subSlots: slot.subSlots.map((sub) =>
            sub.id === subSlotId ? { ...sub, booking: originalBooking } : sub,
          ),
        })),
      );
      throw err;
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="relative flex items-center justify-center mb-6">
        <button
          onClick={() => {
            setPageIndex((p) => Math.max(0, p - 1));
            setSelectedInstructors([]);
          }}
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
          Office Hours
        </h1>
        <button
          onClick={() => {
            setPageIndex((p) => Math.min(totalPages - 1, p + 1));
            setSelectedInstructors([]);
          }}
          disabled={pageIndex >= totalPages - 1}
          className="absolute right-0 w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 disabled:opacity-30 hover:bg-gray-50 transition-colors"
          aria-label="Next weeks"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {instructorOptions.length > 0 && (
        <div className="flex items-center gap-3 mb-4">
          <span className="text-sm text-gray-500 shrink-0">
            Filter by instructor
          </span>
          <MultiSelect
            options={instructorOptions}
            value={selectedInstructors.join(", ")}
            onChange={(csv) =>
              setSelectedInstructors(
                csv
                  ? csv
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean)
                  : [],
              )
            }
            placeholder="All instructors"
            creatable={false}
            className="w-72"
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden">
        {visibleWeeks.map((week) => (
          <div
            key={week.weekStart.toISOString()}
            className="bg-white border-2 border-white rounded-2xl overflow-hidden"
          >
            <div className="bg-[#F4F0FF] px-4 py-3">
              <p className="text-sm font-bold text-gray-800">{week.label}</p>
            </div>

            <div className="px-4 py-2 overflow-y-auto">
              {week.days.map((day) => {
                const blocks = getDayTimeBlocks(day.date);
                return (
                  <div
                    key={day.date.toISOString()}
                    className="py-3 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start gap-4 flex-col">
                      <div className="shrink-0 flex flex-row items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800">
                          {day.dayName}
                        </p>
                        <p className="text-xs text-gray-400">{day.dayDate}</p>
                      </div>

                      <div className="flex-1 space-y-2">
                        {blocks.length === 0 ? (
                          <p className="text-xs text-gray-300">—</p>
                        ) : (
                          blocks.map((block) => (
                            <div
                              key={`${block.start_time}-${block.end_time}`}
                              className="flex items-center gap-3 flex-wrap"
                            >
                              <span className="text-sm text-gray-500 w-36 shrink-0">
                                {formatTimeDisplay(block.start_time)} –{" "}
                                {formatTimeDisplay(block.end_time)}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {block.entries.map((entry) => {
                                  const isBookedByMe =
                                    entry.booking?.user_id === currentUserId;
                                  const isBookedByOther =
                                    !!entry.booking && !isBookedByMe;
                                  return (
                                    <BookingLinkPopover
                                      key={entry.subSlotId}
                                      subSlotId={entry.subSlotId}
                                      mentorName={entry.mentorName}
                                      mode={isBookedByMe ? "manage" : "book"}
                                      currentLink={entry.booking?.meeting_link}
                                      lastMeetingLink={lastMeetingLink}
                                      disabled={isBookedByOther}
                                      onBook={handleBook}
                                      onUpdateLink={handleUpdateLink}
                                      onCancel={handleCancel}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
