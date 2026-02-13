"use client";

import z from "zod";
import {
  ColumnDef,
  flexRender,
  useReactTable,
  getCoreRowModel,
} from "@tanstack/react-table";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Topic } from "@/lib/generated/prisma";
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
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { topicFormSchema } from "@/schemas/topic";
import { createTopic, updateTopic } from "@/services/topics";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EllipsisVerticalIcon } from "lucide-react";

const columns: ColumnDef<Topic>[] = [
  { accessorKey: "id", header: "Id" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "description", header: "Description" },
  { accessorKey: "type", header: "Type" },
  { accessorKey: "deadline", header: "Deadline" },
  { accessorKey: "order", header: "Order" },
];

export default function TopicsTable({ data }: { data: Topic[] }) {
  const [open, setOpen] = useState(false);
  const [openEditTopic, setOpenEditTopic] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const maxOrder = data.reduce(
    (acc, topic) => (topic.order > acc ? topic.order : acc),
    0,
  );

  const form = useForm<z.infer<typeof topicFormSchema>>({
    resolver: zodResolver(topicFormSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "",
      deadline: "",
      order: maxOrder + 1,
    },
  });

  async function onSubmit(values: z.infer<typeof topicFormSchema>) {
    await createTopic(values);
    setOpen(false);
    form.reset({
      name: "",
      description: "",
      type: "",
      deadline: "",
      order: values.order + 1,
    });
  }

  async function onSubmitUpdate(values: z.infer<typeof topicFormSchema>) {
    if (selectedTopic) {
      await updateTopic(selectedTopic.id, values);
      setSelectedTopic(null);
      setOpenEditTopic(false);
    }
  }

  return (
    <div>
      <h3 className="w-full flex justify-between items-center font-semibold text-2xl text-[#111827] mb-5">
        Topics
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
              onClick={() =>
                form.reset({
                  name: "",
                  description: "",
                  type: "",
                  deadline: "",
                  order: maxOrder + 1,
                })
              }
            >
              Add Topic
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader>
              <SheetTitle>Create Topic</SheetTitle>
            </SheetHeader>
            <div className="h-full flex flex-col gap-8 overflow-auto">
              <Form {...form}>
                <form
                  className="space-y-8 p-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
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
                          <Textarea {...field} />
                        </FormControl>
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
                            <SelectItem value="Learning">Learning</SelectItem>
                            <SelectItem value="Milestone #1">
                              Milestone #1
                            </SelectItem>
                            <SelectItem value="Milestone #2">
                              Milestone #2
                            </SelectItem>
                            <SelectItem value="Milestone #3">
                              Milestone #3
                            </SelectItem>
                            <SelectItem value="Milestone #4">
                              Milestone #4
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a deadline" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Prior to Session 1">
                              Prior to Session 1
                            </SelectItem>
                            <SelectItem value="Prior to Session 2">
                              Prior to Session 2
                            </SelectItem>
                            <SelectItem value="Prior to Session 3">
                              Prior to Session 3
                            </SelectItem>
                            <SelectItem value="Prior to Session 4">
                              Prior to Session 4
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="order"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Number</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
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
                            setOpenEditTopic(true);
                            setSelectedTopic(row.original);
                            form.reset({
                              name: row.original.name,
                              description: row.original.description || "",
                              type: row.original.type,
                              deadline: row.original.deadline,
                              order: row.original.order,
                            });
                          }}
                        >
                          Edit Topic
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
            open={openEditTopic}
            onOpenChange={(open) => {
              setOpenEditTopic(open);
              form.reset();
            }}
          >
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit Topic</SheetTitle>
              </SheetHeader>
              <div className="h-full flex flex-col gap-8 overflow-auto">
                <Form {...form}>
                  <form
                    className="space-y-8 p-4"
                    onSubmit={form.handleSubmit(onSubmitUpdate)}
                  >
                    <FormField
                      name="name"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
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
                            <Textarea {...field} />
                          </FormControl>
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
                              <SelectItem value="Learning">Learning</SelectItem>
                              <SelectItem value="Milestone #1">
                                Milestone #1
                              </SelectItem>
                              <SelectItem value="Milestone #2">
                                Milestone #2
                              </SelectItem>
                              <SelectItem value="Milestone #3">
                                Milestone #3
                              </SelectItem>
                              <SelectItem value="Milestone #4">
                                Milestone #4
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="deadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Deadline</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a deadline" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Prior to Session 1">
                                Prior to Session 1
                              </SelectItem>
                              <SelectItem value="Prior to Session 2">
                                Prior to Session 2
                              </SelectItem>
                              <SelectItem value="Prior to Session 3">
                                Prior to Session 3
                              </SelectItem>
                              <SelectItem value="Prior to Session 4">
                                Prior to Session 4
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      name="order"
                      control={form.control}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
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
