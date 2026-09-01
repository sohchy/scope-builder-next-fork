"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatTimeDisplay } from "@/lib/officeHoursUtils";
import type { AffectedBooking } from "@/services/officeHours";

export type SlotImpactMode = "delete" | "retime";

interface SlotImpactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Which destructive action is pending — it changes the copy and the button. */
  mode: SlotImpactMode;
  /** The bookings this action would cancel. Never empty when the dialog is open. */
  bookings: AffectedBooking[];
  onConfirm: () => void;
}

export default function SlotImpactDialog({
  open,
  onOpenChange,
  mode,
  bookings,
  onConfirm,
}: SlotImpactDialogProps) {
  const count = bookings.length;
  const plural = count === 1 ? "booking" : "bookings";

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {mode === "delete"
              ? "Delete this availability slot?"
              : "Change this slot's time?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {mode === "delete"
              ? `This slot has ${count} ${plural}.`
              : `The new time drops ${count} ${plural}.`}{" "}
            Continuing cancels {count === 1 ? "it" : "them"} and emails everyone
            involved, removing the meeting from their calendars.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ul className="max-h-[40vh] overflow-y-auto rounded-lg bg-[#F3F3F6] p-3 flex flex-col gap-2">
          {bookings.map((b) => (
            <li key={b.bookingId} className="text-sm">
              <p className="font-semibold text-gray-800">
                {formatTimeDisplay(b.startTime)} – {formatTimeDisplay(b.endTime)}
              </p>
              <p className="text-gray-700">
                {b.participantName}
                {b.startupName ? ` · ${b.startupName}` : ""}
              </p>
            </li>
          ))}
        </ul>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            {mode === "delete" ? "Delete & notify" : "Change time & notify"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
