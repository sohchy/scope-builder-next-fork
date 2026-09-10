"use client";

import { useId } from "react";
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  StickyNote,
  Video,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { getInitials } from "@/lib/officeHoursUtils";
import type { BookingOutcome } from "@/lib/generated/prisma";

/** The outcomes an instructor can record, in the order they're offered. */
const OUTCOME_OPTIONS: { value: BookingOutcome; label: string }[] = [
  { value: "attended", label: "Attended" },
  { value: "rescheduled", label: "Rescheduled" },
  { value: "missed", label: "Missed" },
];

interface SlotDetailsPopoverProps {
  mentorName: string;
  /** The slot belongs to the signed-in instructor, so it gets the accent. */
  isOwnSlot: boolean;
  timeLabel: string;
  booking: {
    userName: string | null;
    /** The booker's startup, when their booking carried an org. */
    startupName: string | null;
    meetingLink: string | null;
    note: string | null;
    /** How the session went, as marked by the slot's owner. */
    outcome: BookingOutcome | null;
  } | null;
  /**
   * Records the outcome, or clears it when passed null. Omitted for slots the
   * signed-in instructor doesn't own — they see the mark, they don't set it.
   */
  onSetOutcome?: (outcome: BookingOutcome | null) => Promise<void>;
}

/**
 * The instructor-facing counterpart to BookingLinkPopover: same avatar, but the
 * schedule is read-only. The card names whoever signed up. The schedule
 * currently lists booked slots only, so the free-slot rendering is a fallback
 * kept for when unbooked availability is shown alongside it again.
 */
export default function SlotDetailsPopover({
  mentorName,
  isOwnSlot,
  timeLabel,
  booking,
  onSetOutcome,
}: SlotDetailsPopoverProps) {
  // Several popovers can be mounted at once, so the radio ids have to be
  // per-instance or the labels point at the wrong card's inputs.
  const fieldId = useId();
  const canMarkOutcome = !!booking && !!onSetOutcome;
  const outcomeLabel = booking?.outcome
    ? OUTCOME_OPTIONS.find((o) => o.value === booking.outcome)!.label
    : null;

  const avatarClassName = `w-9 h-9 rounded-full border-2 text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${
    booking
      ? isOwnSlot
        ? "bg-[#6A35FF] text-white border-[#6A35FF] hover:bg-[#5520e0]"
        : "bg-gray-200 text-gray-600 border-gray-300 hover:bg-gray-300"
      : isOwnSlot
        ? "bg-white text-[#6A35FF] border-[#6A35FF] hover:bg-[#F4F0FF]"
        : "bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600"
  }`;

  const participant = booking?.userName?.trim() || "Participant";

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          title={`${mentorName} — ${booking ? "booked" : "available"}`}
          className={avatarClassName}
        >
          {getInitials(mentorName)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3" align="center">
        <div>
          <p className="font-bold text-gray-900">
            {booking ? participant : mentorName}
          </p>
          <p className="text-sm text-gray-500">
            {booking
              ? isOwnSlot
                ? "Booked with you"
                : `Booked with ${mentorName}`
              : isOwnSlot
                ? "Your slot — not booked yet"
                : "Available"}
          </p>
        </div>

        {booking?.startupName?.trim() && (
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <Building2 className="size-3.5 shrink-0" />
            <span className="break-words">{booking.startupName}</span>
          </p>
        )}

        <p className="flex items-center gap-1.5 text-xs text-gray-500">
          {booking ? (
            <CalendarCheck className="size-3.5 shrink-0" />
          ) : (
            <CalendarClock className="size-3.5 shrink-0" />
          )}
          {timeLabel}
        </p>

        {booking?.meetingLink?.trim() && (
          <a
            href={booking.meetingLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-1.5 text-xs text-[#6A35FF] underline break-all hover:text-[#5520e0]"
          >
            <Video className="mt-px size-3.5 shrink-0" />
            {booking.meetingLink}
          </a>
        )}

        {booking?.note?.trim() && (
          <div className="flex items-start gap-1.5 rounded-md bg-gray-50 p-2 text-xs text-gray-600">
            <StickyNote className="mt-px size-3.5 shrink-0 text-gray-400" />
            <p className="whitespace-pre-wrap break-words">{booking.note}</p>
          </div>
        )}

        {canMarkOutcome ? (
          <div className="border-t border-gray-100 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-semibold text-gray-700">
                Session outcome
              </p>
              {/* Radix radios never deselect on their own, so undoing a
                  mis-click needs its own affordance. */}
              {booking!.outcome && (
                <button
                  type="button"
                  onClick={() => onSetOutcome!(null)}
                  className="text-xs text-gray-400 underline hover:text-gray-600"
                >
                  Clear
                </button>
              )}
            </div>
            <RadioGroup
              value={booking!.outcome ?? ""}
              onValueChange={(value) => onSetOutcome!(value as BookingOutcome)}
              className="gap-2"
            >
              {OUTCOME_OPTIONS.map((option) => (
                <div key={option.value} className="flex items-center gap-2">
                  <RadioGroupItem
                    id={`${fieldId}-${option.value}`}
                    value={option.value}
                  />
                  <label
                    htmlFor={`${fieldId}-${option.value}`}
                    className="cursor-pointer text-xs text-gray-600"
                  >
                    {option.label}
                  </label>
                </div>
              ))}
            </RadioGroup>
          </div>
        ) : (
          outcomeLabel && (
            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">
                Session outcome:{" "}
                <span className="font-semibold text-gray-700">
                  {outcomeLabel}
                </span>
              </p>
            </div>
          )
        )}
      </PopoverContent>
    </Popover>
  );
}
