"use client";

import { CalendarIcon } from "lucide-react";
import { Participant } from "@/lib/generated/prisma";
import {
  createParticipantTag,
  updateParticipant,
} from "@/services/participants";
import { createJobTitle } from "@/services/jobTitles";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { useForm } from "react-hook-form";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  participantFormSchema,
  ROLE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/schemas/participant";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import {
  createMarketSegment,
  getMarketSegments,
  type MarketSegment,
} from "@/services/market";
import { MultiSelect } from "@/components/ui/multiselect";
import { Combobox } from "@/components/ui/combobox";

interface EditParticipantFormProps {
  participant: Participant;
  tags: string[];
  jobTitles: string[];
  onSuccess?: () => void;
}

export default function EditParticipantForm({
  participant,
  tags,
  jobTitles,
  onSuccess,
}: EditParticipantFormProps) {
  // Market segments are the same org-wide rows edited on the Market tab of the
  // User Journey page.
  const [marketSegments, setMarketSegments] = useState<MarketSegment[]>([]);

  useEffect(() => {
    getMarketSegments().then(setMarketSegments);
  }, []);

  const form = useForm<z.infer<typeof participantFormSchema>>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: participant.name,
      organization: participant.organization || "",
      role: participant.role || "",
      relationship: participant.relationship || "",
      contact_info: participant.contact_info || "",
      rationale: participant.rationale || "",
      market_segment: participant.market_segment || "",
      blocking_issues: participant.blocking_issues || "",
      hypothesis_to_validate: participant.hypothesis_to_validate || "",
      learnings: participant.learnings || "",
      status: participant.status || "need_to_schedule",
      scheduled_date: participant.scheduled_date || undefined,
      // "documented" is past "complete" in the interview flow, so it counts as
      // conducted too.
      conducted:
        participant.status === "complete" || participant.status === "documented",
      pending_review: participant.pending_review,
      notes: participant.notes || "",
      tags: participant.tags || "",
      job_title: participant.job_title || "",
    },
  });

  // Drives the "Conducted" checkbox, which only makes sense for a scheduled
  // interview — watched so picking a date reveals it without a save.
  const scheduledDate = form.watch("scheduled_date");
  // Submitting documentation for review only makes sense once it's conducted.
  const conducted = form.watch("conducted");

  async function onSubmit(values: z.infer<typeof participantFormSchema>) {
    await updateParticipant(participant.id, values);
    onSuccess?.();
  }

  async function onCreateTagOption(opt: string) {
    await createParticipantTag(opt);
  }

  async function onCreateJobTitleOption(opt: string) {
    await createJobTitle(opt);
  }

  async function onCreateMarketSegmentOption(name: string) {
    const created = await createMarketSegment({
      name,
      order: marketSegments.length,
    });
    setMarketSegments((prev) => [...prev, created]);
  }

  return (
    <div className="h-full flex flex-col gap-8 overflow-auto">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-8 p-4"
        >
          {/* Only offer "Conducted" once there's something to have conducted. */}
          {scheduledDate && (
            <FormField
              control={form.control}
              name="conducted"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(value) => field.onChange(value === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">Conducted</FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {scheduledDate && conducted && (
            <FormField
              control={form.control}
              name="pending_review"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(value) => field.onChange(value === true)}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Submit Interview Documentation for Review
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="scheduled_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Scheduled Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="center">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      captionLayout="dropdown"
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} className="shadow-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="organization"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Organization</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Where they work" className="shadow-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="job_title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Job Title</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={jobTitles.map((jobTitle) => ({
                      value: jobTitle,
                      label: jobTitle,
                    }))}
                    placeholder="Select or create a job title"
                    onCreateOption={(opt) => onCreateJobTitleOption(opt.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stakeholder</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={ROLE_OPTIONS}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select a stakeholder"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="relationship"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Relationship</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full shadow-none">
                      <SelectValue placeholder="Select a relationship" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {RELATIONSHIP_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="market_segment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Market Segment</FormLabel>
                <FormControl>
                  <Combobox
                    value={field.value}
                    onChange={field.onChange}
                    options={marketSegments
                      .filter((segment) => segment.name.trim().length > 0)
                      .map((segment) => ({
                        value: segment.name,
                        label: segment.name,
                      }))}
                    placeholder="Select or create a market segment"
                    onCreateOption={(opt) =>
                      onCreateMarketSegmentOption(opt.value)
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contact_info"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Info</FormLabel>
                <FormControl>
                  <Textarea {...field} className="shadow-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea {...field} className="shadow-none" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={tags.map((tag) => ({ value: tag, label: tag }))}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Select or create a tag"
                    onCreateOption={(opt) => onCreateTagOption(opt.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex">
            <Button
              type="submit"
              className="bg-[#162A4F] cursor-pointer ml-auto"
            >
              Update
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
