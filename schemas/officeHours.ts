import z from "zod";

export const BOOKING_NOTE_MAX_LENGTH = 500;

export const bookingLinkFormSchema = z.object({
  meetingLink: z.string().trim().min(1, "Enter a meeting link."),
  // Optional context for the instructor — empty string means "no note".
  note: z
    .string()
    .trim()
    .max(
      BOOKING_NOTE_MAX_LENGTH,
      `Keep the note under ${BOOKING_NOTE_MAX_LENGTH} characters.`,
    ),
});

export type BookingLinkFormValues = z.infer<typeof bookingLinkFormSchema>;
