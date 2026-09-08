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
import { bookSlot, cancelBooking, updateBooking } from "@/services/officeHours";
import BookingLinkPopover from "./BookingLinkPopover";
import SlotDetailsPopover from "./SlotDetailsPopover";
import { MultiSelect } from "@/components/ui/multiselect";

type SubSlotWithBooking = OfficeHourSubSlot & {
  booking: OfficeHourBooking | null;
};
export type SlotWithSubSlots = OfficeHourSlot & {
  subSlots: SubSlotWithBooking[];
};

type TimeBlock = {
  start_time: string;
  end_time: string;
  entries: {
    subSlotId: string;
    mentorName: string;
    /** The slot's owner is the signed-in user — only meaningful in read-only mode. */
    isOwnSlot: boolean;
    booking: Pick<
      OfficeHourBooking,
      "id" | "user_id" | "org_id" | "meeting_link" | "user_name" | "note"
    > | null;
  }[];
};

interface BookingViewProps {
  initialSlots: SlotWithSubSlots[];
  currentUserId: string;
  /**
   * Booker org id → startup name, resolved server-side from Clerk. Only the
   * read-only schedule names teams, so the booking view is handed nothing.
   */
  startupNames?: Record<string, string>;
  /**
   * Instructors get the same schedule startups see, but they browse it rather
   * than book on it: nothing is editable and booked slots name their booker.
   */
  readOnly?: boolean;
}

const WEEKS_PER_PAGE = 4;

export default function BookingView({
  initialSlots,
  currentUserId,
  startupNames = {},
  readOnly = false,
}: BookingViewProps) {
  const [slots, setSlots] = useState<SlotWithSubSlots[]>(initialSlots);
  const [pageIndex, setPageIndex] = useState(0);

  const programStart = parseISO(
    process.env.NEXT_PUBLIC_PROGRAM_START_DATE ?? "2026-01-01",
  );
  const programEnd = parseISO(
    process.env.NEXT_PUBLIC_PROGRAM_END_DATE ?? "2026-12-31",
  );

  const weeks = generateWeeks(programStart, programEnd);
  const totalPages = Math.ceil(weeks.length / WEEKS_PER_PAGE);

  const weeksForPage = (page: number) =>
    weeks.slice(page * WEEKS_PER_PAGE, page * WEEKS_PER_PAGE + WEEKS_PER_PAGE);

  // The instructor's schedule shows appointments, not availability: an unbooked
  // half-hour is something they publish in the editor, not something to browse
  // here. Startups still need the open ones — that's what they book against.
  const isVisibleSubSlot = (sub: SubSlotWithBooking) =>
    !readOnly || !!sub.booking;

  /** The instructors with slots on a given page — the filter's options there. */
  const mentorsOnPage = (page: number) => {
    const dates = new Set(
      weeksForPage(page).flatMap((w) =>
        w.days.map((d) => d.date.toDateString()),
      ),
    );
    return new Set(
      slots
        .filter(
          (s) =>
            dates.has(new Date(s.date).toDateString()) &&
            s.subSlots.some(isVisibleSubSlot),
        )
        .map((s) => s.mentor_name),
    );
  };

  // Instructors browsing the schedule came for their own column, so it starts
  // selected. Startups have no slots of their own, so they start unfiltered.
  const ownMentorName = readOnly
    ? (initialSlots.find((s) => s.user_id === currentUserId)?.mentor_name ??
      null)
    : null;

  /** The default selection, minus anyone with nothing on that page to show. */
  const defaultInstructorsForPage = (page: number) =>
    ownMentorName && mentorsOnPage(page).has(ownMentorName)
      ? [ownMentorName]
      : [];

  const [selectedInstructors, setSelectedInstructors] = useState<string[]>(() =>
    defaultInstructorsForPage(0),
  );

  const visibleWeeks = weeksForPage(pageIndex);

  const instructorOptions = useMemo(
    () =>
      [...mentorsOnPage(pageIndex)]
        .sort()
        .map((name) => ({ label: name, value: name })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [slots, pageIndex],
  );

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
        if (!isVisibleSubSlot(sub)) continue;
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
          isOwnSlot: slot.user_id === currentUserId,
          booking: sub.booking
            ? {
                id: sub.booking.id,
                user_id: sub.booking.user_id,
                org_id: sub.booking.org_id,
                meeting_link: sub.booking.meeting_link,
                user_name: sub.booking.user_name,
                note: sub.booking.note,
              }
            : null,
        });
      }
    }
    return Array.from(blockMap.values()).sort((a, b) =>
      a.start_time.localeCompare(b.start_time),
    );
  }

  async function handleBook(
    subSlotId: string,
    meetingLink: string,
    note: string,
  ) {
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
                  note: note || null,
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
      const result = await bookSlot(subSlotId, meetingLink, note);

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

  async function handleUpdate(
    subSlotId: string,
    meetingLink: string,
    note: string,
  ) {
    const originalBooking =
      slots.flatMap((s) => s.subSlots).find((sub) => sub.id === subSlotId)
        ?.booking ?? null;

    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        subSlots: slot.subSlots.map((sub) =>
          sub.id === subSlotId && sub.booking
            ? {
                ...sub,
                booking: {
                  ...sub.booking,
                  meeting_link: meetingLink,
                  note: note || null,
                },
              }
            : sub,
        ),
      })),
    );

    try {
      await updateBooking(subSlotId, meetingLink, note);
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
            const next = Math.max(0, pageIndex - 1);
            setPageIndex(next);
            setSelectedInstructors(defaultInstructorsForPage(next));
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
            const next = Math.min(totalPages - 1, pageIndex + 1);
            setPageIndex(next);
            setSelectedInstructors(defaultInstructorsForPage(next));
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

      <div className="grid grid-cols-4 grid-rows-1 gap-4 flex-1 min-h-0">
        {visibleWeeks.map((week) => (
          <div
            key={week.weekStart.toISOString()}
            className="bg-white border-2 border-[#B9BDC9] rounded-2xl overflow-hidden flex flex-col min-h-0"
          >
            <div className="bg-[#F4F0FF] px-4 py-3 shrink-0">
              <p className="text-sm font-bold text-gray-800">{week.label}</p>
            </div>

            <div className="px-4 py-2 flex-1 min-h-0 overflow-y-auto overscroll-contain">
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
                                  if (readOnly) {
                                    return (
                                      <SlotDetailsPopover
                                        key={entry.subSlotId}
                                        mentorName={entry.mentorName}
                                        isOwnSlot={entry.isOwnSlot}
                                        timeLabel={`${day.dayName} ${day.dayDate}, ${formatTimeDisplay(
                                          block.start_time,
                                        )} – ${formatTimeDisplay(block.end_time)}`}
                                        booking={
                                          entry.booking
                                            ? {
                                                userName:
                                                  entry.booking.user_name,
                                                startupName:
                                                  (entry.booking.org_id &&
                                                    startupNames[
                                                      entry.booking.org_id
                                                    ]) ||
                                                  null,
                                                meetingLink:
                                                  entry.booking.meeting_link,
                                                note: entry.booking.note,
                                              }
                                            : null
                                        }
                                      />
                                    );
                                  }

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
                                      currentNote={entry.booking?.note}
                                      lastMeetingLink={lastMeetingLink}
                                      disabled={isBookedByOther}
                                      onBook={handleBook}
                                      onUpdate={handleUpdate}
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
