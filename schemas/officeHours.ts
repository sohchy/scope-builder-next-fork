import z from "zod";

export const bookingLinkFormSchema = z.object({
  meetingLink: z.string().trim().min(1, "Enter a meeting link."),
});

export type BookingLinkFormValues = z.infer<typeof bookingLinkFormSchema>;
