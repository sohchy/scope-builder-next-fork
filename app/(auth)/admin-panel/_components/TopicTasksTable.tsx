"use client";

import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Topic, TopicTask } from "@/lib/generated/prisma";
import {
  Form,
  FormItem,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { topicTaskFormSchema } from "@/schemas/topic";
import z from "zod";
import { createTopicTask, updateTopicTask } from "@/services/topics";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon } from "lucide-react";

type TopicTaskWithTopicName = TopicTask & { topic_name: string };

const columns: ColumnDef<TopicTaskWithTopicName>[] = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "topic_name", header: "Topic Name" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "subtype", header: "Subtype" },
  { accessorKey: "order", header: "Order" },
];

export default function TopicTasksTable({
  data,
  topics,
}: {
  topics: Topic[];
  data: TopicTaskWithTopicName[];
}) {
  const [open, setOpen] = useState(false);
  const [openEditTopicTask, setOpenEditTopicTask] = useState(false);
  const [selectedTopicTask, setSelectedTopicTask] = useState<TopicTask | null>(
    null,
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const form = useForm({
    resolver: zodResolver(topicTaskFormSchema),
    defaultValues: {
      topic_id: 0,
      type: "",
      subtype: "",
      order: 0,
      url: "",
      title: "",
      description: "",
    },
  });

  async function onSubmit(values: z.infer<typeof topicTaskFormSchema>) {
    await createTopicTask(values);
    setOpen(false);
    form.reset();
  }

  async function onSubmitUpdate(values: z.infer<typeof topicTaskFormSchema>) {
    if (selectedTopicTask) {
      await updateTopicTask(selectedTopicTask.id, values);
      setSelectedTopicTask(null);
      setOpenEditTopicTask(false);
    }
  }

  const subtype = form.watch("subtype");

  return (
    <div>
      <h3 className="w-full flex justify-between items-center font-semibold text-2xl text-[#111827] mb-5">
        Topic Tasks
        <Sheet
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
            form.reset();
          }}
        >
          <SheetTrigger asChild>
            <Button
              className="cursor-pointer "
              onClick={() => {
                form.reset({
                  topic_id: 0,
                  type: "",
                  subtype: "",
                  order: 0,
                  url: "",
                  title: "",
                  description: "",
                });
              }}
            >
              Add Topic Task
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Topic Task</SheetTitle>
            </SheetHeader>
            <div className="h-full flex flex-col gap-8 overflow-auto">
              <Form {...form}>
                <form
                  className="space-y-8 p-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    control={form.control}
                    name="topic_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Topic</FormLabel>
                        <Select
                          value={field.value.toString()}
                          onValueChange={(value) =>
                            field.onChange(parseInt(value))
                          }
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a topic" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {topics.map((topic) => (
                              <SelectItem
                                key={topic.id}
                                value={topic.id.toString()}
                              >
                                {topic.name}
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
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="concept">Concept</SelectItem>
                            <SelectItem value="excercise">Excercise</SelectItem>
                            <SelectItem value="startup">Startup</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subtype"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subtype</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            form.setValue("url", "");
                            form.setValue("title", "");
                            form.setValue("description", "");
                          }}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a subtype" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="image">Image</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="youtube">Youtube</SelectItem>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="book">Book</SelectItem>
                            <SelectItem value="tool">Tool</SelectItem>
                            {/* <SelectItem value="comment">Comment</SelectItem> */}
                            <SelectItem value="excercise">Excercise</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {[
                    "image",
                    "video",
                    "youtube",
                    "book",
                    "tool",
                    "excercise",
                  ].includes(subtype) && (
                    <>
                      <FormField
                        name="url"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="title"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        name="description"
                        control={form.control}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}

                  <FormField
                    name="order"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(e.target.valueAsNumber)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex ">
                    <Button type="submit" className="cursor-pointer ml-auto">
                      Create
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </SheetContent>
        </Sheet>
      </h3>
      <div className="overflow-hidden rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
                <TableHead />
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size={"icon"}
                          className="h-8 w-8 p-0"
                        >
                          <EllipsisVerticalIcon size={16} />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem
                          onClick={() => {
                            setOpenEditTopicTask(true);
                            setSelectedTopicTask(row.original);
                            form.reset({
                              topic_id: row.original.topic_id,
                              type: row.original.type,
                              subtype: row.original.subtype,
                              order: row.original.order,
                              url: row.original.url || "",
                              title: row.original.title || "",
                              description: row.original.description || "",
                            });
                          }}
                        >
                          Edit Topic Task
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          <Sheet
            open={openEditTopicTask}
            onOpenChange={(open) => {
              setOpenEditTopicTask(open);
              form.reset();
            }}
          >
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Update Topic Task</SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col gap-8 overflow-auto">
                <Form {...form}>
                  <form
                    className="space-y-8 p-4"
                    onSubmit={form.handleSubmit(onSubmitUpdate)}
                  >
                    <FormField
                      control={form.control}
                      name="topic_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Topic</FormLabel>
                          <Select
                            value={field.value.toString()}
                            onValueChange={(value) =>
                              field.onChange(parseInt(value))
                            }
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a topic" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {topics.map((topic) => (
                                <SelectItem
                                  key={topic.id}
                                  value={topic.id.toString()}
                                >
                                  {topic.name}
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
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Type</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="concept">Concept</SelectItem>
                              <SelectItem value="excercise">
                                Excercise
                              </SelectItem>
                              <SelectItem value="startup">Startup</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="subtype"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subtype</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              form.setValue("url", "");
                              form.setValue("title", "");
                              form.setValue("description", "");
                            }}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a subtype" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="image">Image</SelectItem>
                              <SelectItem value="video">Video</SelectItem>
                              <SelectItem value="youtube">Youtube</SelectItem>
                              <SelectItem value="article">Article</SelectItem>
                              <SelectItem value="book">Book</SelectItem>
                              <SelectItem value="tool">Tool</SelectItem>
                              <SelectItem value="comment">Comment</SelectItem>
                              <SelectItem value="excercise">
                                Excercise
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {["image", "video", "youtube"].includes(subtype) && (
                      <>
                        <FormField
                          name="url"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>URL</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          name="title"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          name="description"
                          control={form.control}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <FormField
                      name="order"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              value={field.value}
                              onChange={(e) =>
                                field.onChange(e.target.valueAsNumber)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex ">
                      <Button type="submit" className="cursor-pointer ml-auto">
                        Update
                      </Button>
                    </div>
                  </form>
                </Form>
              </div>
            </SheetContent>
          </Sheet>
        </Table>
      </div>
    </div>
  );
}
