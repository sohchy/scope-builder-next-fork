"use client";

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
import { getInitials } from "@/lib/officeHoursUtils";

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
  } | null;
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
}: SlotDetailsPopoverProps) {
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
      </PopoverContent>
    </Popover>
  );
}
