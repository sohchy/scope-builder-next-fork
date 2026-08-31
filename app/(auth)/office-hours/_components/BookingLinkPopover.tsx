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
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  bookingLinkFormSchema,
  BookingLinkFormValues,
} from "@/schemas/officeHours";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface BookingLinkPopoverProps {
  subSlotId: string;
  mentorName: string;
  mode: "book" | "manage";
  currentLink?: string | null;
  lastMeetingLink?: string | null;
  disabled?: boolean;
  onBook: (subSlotId: string, meetingLink: string) => Promise<void>;
  onUpdateLink: (subSlotId: string, meetingLink: string) => Promise<void>;
  onCancel: (subSlotId: string) => Promise<void>;
}

export default function BookingLinkPopover({
  subSlotId,
  mentorName,
  mode,
  currentLink,
  lastMeetingLink,
  disabled,
  onBook,
  onUpdateLink,
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
    defaultValues: { meetingLink: "" },
    // Keeps the field in sync with the saved booking link, so reopening the
    // popover always shows the current value without a manual reset.
    values: { meetingLink: currentLink ?? "" },
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

  const avatarClassName = `w-9 h-9 rounded-full border-2 text-xs font-bold flex items-center justify-center transition-colors ${
    disabled
      ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
      : mode === "manage"
        ? "bg-[#6A35FF] text-white border-[#6A35FF] hover:bg-[#5520e0]"
        : "bg-white text-gray-600 border-gray-300 hover:border-[#6A35FF] hover:text-[#6A35FF]"
  }`;

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
        await onUpdateLink(subSlotId, values.meetingLink);
      } else {
        await onBook(subSlotId, values.meetingLink);
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
      form.reset({ meetingLink: "" });
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
        <button title={mentorName} className={avatarClassName}>
          {getInitials(mentorName)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 space-y-3" align="center">
        <div>
          <p className="font-bold text-gray-900">{user?.fullName}</p>
          <p className="text-sm text-gray-500">
            {user?.primaryEmailAddress?.emailAddress}
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">
              {mode === "manage"
                ? "Update your meeting link"
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
