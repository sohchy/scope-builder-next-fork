"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@clerk/nextjs";
import { CalendarCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  bookingLinkFormSchema,
  BookingLinkFormValues,
  BOOKING_NOTE_MAX_LENGTH,
} from "@/schemas/officeHours";
import { getInitials } from "@/lib/officeHoursUtils";
import type { BookingOutcome } from "@/lib/generated/prisma";

const OUTCOME_LABELS: Record<BookingOutcome, string> = {
  attended: "Attended",
  rescheduled: "Rescheduled",
  missed: "Missed",
};

interface BookingLinkPopoverProps {
  subSlotId: string;
  mentorName: string;
  mode: "book" | "manage";
  currentLink?: string | null;
  currentNote?: string | null;
  lastMeetingLink?: string | null;
  disabled?: boolean;
  /**
   * Booked by another member of the signed-in user's team. Managed exactly like
   * the user's own booking; only the header names the teammate who booked.
   */
  bookedByTeammate?: boolean;
  /** Name of the teammate who booked, for the tooltip and header. */
  bookerName?: string | null;
  /** How the instructor marked the session. Read-only here; only they set it. */
  outcome?: BookingOutcome | null;
  onBook: (
    subSlotId: string,
    meetingLink: string,
    note: string,
  ) => Promise<void>;
  onUpdate: (
    subSlotId: string,
    meetingLink: string,
    note: string,
  ) => Promise<void>;
  onCancel: (subSlotId: string) => Promise<void>;
}

export default function BookingLinkPopover({
  subSlotId,
  mentorName,
  mode,
  currentLink,
  currentNote,
  lastMeetingLink,
  disabled,
  bookedByTeammate,
  bookerName,
  outcome,
  onBook,
  onUpdate,
  onCancel,
}: BookingLinkPopoverProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [useLastLink, setUseLastLink] = useState(false);

  const canReuseLastLink = mode === "book" && !!lastMeetingLink?.trim();

  const form = useForm<BookingLinkFormValues>({
    resolver: zodResolver(bookingLinkFormSchema),
    mode: "onChange",
    defaultValues: { meetingLink: "", note: "" },
    // Keeps the fields in sync with the saved booking, so reopening the popover
    // always shows the current values without a manual reset.
    values: { meetingLink: currentLink ?? "", note: currentNote ?? "" },
    resetOptions: { keepDirtyValues: true },
  });

  useEffect(() => {
    if (open) {
      setError(null);
      setUseLastLink(false);
    }
  }, [open]);

  function handleUseLastLinkChange(checked: boolean) {
    setUseLastLink(checked);
    form.setValue("meetingLink", checked ? (lastMeetingLink ?? "") : "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  }

  // Only slots this user can manage carry an outcome (someone else's booking is
  // rendered disabled), and an attended one reads green over the booked purple.
  // Missed and rescheduled keep the purple for now.
  const avatarClassName = `w-9 h-9 rounded-full border-2 text-xs font-bold flex items-center justify-center transition-colors ${
    disabled
      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
      : mode === "manage"
        ? outcome === "attended"
          ? "bg-[#28BF58] text-white border-[#28BF58] hover:bg-[#20A249]"
          : "bg-[#6A35FF] text-white border-[#6A35FF] hover:bg-[#5520e0]"
        : "bg-white text-gray-600 border-gray-300 hover:border-[#6A35FF] hover:text-[#6A35FF]"
  }`;

  const triggerTitle =
    bookedByTeammate && !disabled
      ? `${mentorName} — booked by ${bookerName || "a teammate"}`
      : mentorName;

  if (disabled) {
    return (
      <button disabled title={mentorName} className={avatarClassName}>
        {getInitials(mentorName)}
      </button>
    );
  }

  async function onSubmit(values: BookingLinkFormValues) {
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === "manage") {
        await onUpdate(subSlotId, values.meetingLink, values.note);
      } else {
        await onBook(subSlotId, values.meetingLink, values.note);
      }
      setOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancelBooking() {
    setIsSubmitting(true);
    setError(null);
    try {
      await onCancel(subSlotId);
      form.reset({ meetingLink: "", note: "" });
      setOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button title={triggerTitle} className={avatarClassName}>
          {getInitials(mentorName)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="center">
        <div>
          {bookedByTeammate ? (
            <>
              <p className="font-bold text-gray-900">
                {bookerName || "A teammate"}
              </p>
              <p className="text-sm text-gray-500">Booked by a teammate</p>
            </>
          ) : (
            <>
              <p className="font-bold text-gray-900">{user?.fullName}</p>
              <p className="text-sm text-gray-500">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </>
          )}
        </div>

        {outcome && (
          <p className="text-xs text-gray-500">
            Session outcome:{" "}
            <span className="font-semibold text-gray-700">
              {OUTCOME_LABELS[outcome]}
            </span>
          </p>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              {mode === "manage"
                ? "Update your booking"
                : "Submit a meeting link to the instructor"}
            </p>
            {canReuseLastLink && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`use-last-link-${subSlotId}`}
                  checked={useLastLink}
                  onCheckedChange={(checked) =>
                    handleUseLastLinkChange(checked === true)
                  }
                />
                <label
                  htmlFor={`use-last-link-${subSlotId}`}
                  className="text-sm text-gray-600 cursor-pointer"
                >
                  Use last meeting link
                </label>
              </div>
            )}

            <FormField
              control={form.control}
              name="meetingLink"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Paste link"
                      {...field}
                      onChange={(e) => {
                        setUseLastLink(false);
                        field.onChange(e);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-normal text-gray-600">
                    Note for the instructor{" "}
                    <span className="text-gray-400">(optional)</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="What would you like to cover?"
                      rows={3}
                      maxLength={BOOKING_NOTE_MAX_LENGTH}
                      className="min-h-20 resize-none text-sm"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <p className="flex items-start gap-1.5 text-xs text-gray-500">
              <CalendarCheck className="mt-px size-3.5 shrink-0" />
              Calendar invites sent to the instructor and all startup member(s).
            </p>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex gap-2">
              {mode === "manage" && (
                <Button
                  type="button"
                  variant="destructive"
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={handleCancelBooking}
                >
                  Cancel Booking
                </Button>
              )}
              <Button
                type="submit"
                className="flex-1"
                disabled={!form.formState.isValid || isSubmitting}
              >
                {mode === "manage" ? "Update" : "Sign Up"}
              </Button>
            </div>
          </form>
        </Form>
      </PopoverContent>
    </Popover>
  );
}
