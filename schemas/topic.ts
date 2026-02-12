import z from "zod";

export const topicFormSchema = z.object({
  name: z.string().min(1, "Name is required."),
  description: z.string().optional(),
  type: z.string().min(1, "Type is required."),
  deadline: z.string().min(1, "Deadline is required."),
  order: z.number().min(0, "Order must be a positive number."),
});

export const topicTaskFormSchema = z.object({
  topic_id: z.number().min(1, "Topic is required."),
  type: z.string().min(1, "Type is required."),
  subtype: z.string().min(1, "Subtype is required."),
  order: z.number().min(0, "Order must be a positive number."),
});
