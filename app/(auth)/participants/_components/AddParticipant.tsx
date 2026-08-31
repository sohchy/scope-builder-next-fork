"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Sheet,
  SheetTitle,
  SheetFooter,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
import { Popover, PopoverContent } from "@/components/ui/popover";
import { PopoverTrigger } from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns/format";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { SelectValue } from "@radix-ui/react-select";
import {
  participantFormSchema,
  ROLE_OPTIONS,
  RELATIONSHIP_OPTIONS,
} from "@/schemas/participant";
import {
  createParticipant,
  createParticipantTag,
} from "@/services/participants";
import { createJobTitle } from "@/services/jobTitles";
import {
  createMarketSegment,
  getMarketSegments,
  type MarketSegment,
} from "@/services/market";
import { MultiSelect } from "@/components/ui/multiselect";
import { Combobox } from "@/components/ui/combobox";
import { useEffect, useState } from "react";

interface AddParticipantProps {
  tags: string[];
  jobTitles: string[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function AddParticipant({
  tags,
  jobTitles,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onSuccess,
}: AddParticipantProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? controlledOnOpenChange! : setInternalOpen;

  // Market segments are the same org-wide rows edited on the Market tab of the
  // User Journey page.
  const [marketSegments, setMarketSegments] = useState<MarketSegment[]>([]);

  useEffect(() => {
    getMarketSegments().then(setMarketSegments);
  }, []);

  const form = useForm<z.infer<typeof participantFormSchema>>({
    resolver: zodResolver(participantFormSchema),
    defaultValues: {
      name: "",
      organization: "",
      job_title: "",
      role: "",
      relationship: "",
      contact_info: "",
      rationale: "",
      blocking_issues: "",
      hypothesis_to_validate: "",
      learnings: "",
      market_segment: "",
      status: "need_to_schedule",
      scheduled_date: undefined,
      conducted: false,
      pending_review: false,
      notes: "",
      tags: "",
    },
  });

  // Drives the "Conducted" checkbox, which only makes sense for a scheduled
  // interview — watched so picking a date reveals it right away.
  const scheduledDate = form.watch("scheduled_date");
  // Submitting documentation for review only makes sense once it's conducted.
  const conducted = form.watch("conducted");

  async function onSubmit(values: z.infer<typeof participantFormSchema>) {
    await createParticipant(values);
    form.reset();
    setOpen(false);
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
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <SheetTrigger asChild>
          <Button className="rounded-full text-sm font-bold">
            + Add Participant
          </Button>
        </SheetTrigger>
      )}
      <SheetContent>
        <SheetHeader className="border-b p-3">
          <SheetTitle className="text-[20px] font-medium text-[#111827]">
            New Participant
          </SheetTitle>
        </SheetHeader>
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
                          onCheckedChange={(value) =>
                            field.onChange(value === true)
                          }
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
                          onCheckedChange={(value) =>
                            field.onChange(value === true)
                          }
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
                        onCreateOption={(opt) =>
                          onCreateJobTitleOption(opt.value)
                        }
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
                        creatable={false}
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

              {/* <FormField
                control={form.control}
                name="rationale"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rationale</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="shadow-none" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* <FormField
                control={form.control}
                name="blocking_issues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Blocking Issues</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="shadow-none" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* <FormField
                control={form.control}
                name="hypothesis_to_validate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hypothesis to Validate</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="shadow-none" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              /> */}

              {/* <FormField
                control={form.control}
                name="learnings"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Learnings</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="shadow-none" />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              /> */}

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
                        value={field.value}
                        onChange={field.onChange}
                        options={tags.map((tag) => ({
                          value: tag,
                          label: tag,
                        }))}
                        placeholder="Select or create a tag"
                        onCreateOption={(opt) => onCreateTagOption(opt.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex ">
                <Button
                  type="submit"
                  className="bg-[#162A4F] cursor-pointer ml-auto"
                >
                  Create
                </Button>
              </div>
            </form>
          </Form>
        </div>
        {/* <SheetFooter className="border-t flex items-center flex-row">
          <Button type="submit" className="bg-[#162A4F] cursor-pointer ml-auto">
            Create
          </Button>
        </SheetFooter> */}
      </SheetContent>
    </Sheet>
  );
}
