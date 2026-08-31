"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetTrigger,
  SheetContent,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { Participant } from "@/lib/generated/prisma";
import {
  deleteParticipant,
  markParticipantAsComplete,
} from "@/services/participants";
import { useState } from "react";
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
import EditParticipantForm from "./EditParticipantForm";

interface ParticipantTableActionsProps {
  tags: string[];
  jobTitles: string[];
  participant: Participant;
}

export default function ParticipantTableActions({
  tags,
  jobTitles,
  participant,
}: ParticipantTableActionsProps) {
  const [open, setOpen] = useState(false);
  const [openAlert, setOpenAlert] = useState<string | undefined>(undefined);

  const markAsComplete = async () => {
    await markParticipantAsComplete(participant.id);
  };

  const onDeleteParticipant = async () => {
    await deleteParticipant(openAlert!);
    setOpenAlert(undefined);
  };

  return (
    <>
      <AlertDialog
        open={!!openAlert}
        onOpenChange={() => setOpenAlert(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete a
              participant.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onDeleteParticipant}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Sheet open={open} onOpenChange={setOpen}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <SheetTrigger className="w-full text-left">Edit</SheetTrigger>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={markAsComplete}>
              Mark as Complete
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => setOpenAlert(participant.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <SheetContent>
          <SheetHeader className="border-b p-3">
            <SheetTitle className="text-[20px] font-medium text-[#111827]">
              Edit Participant
            </SheetTitle>
          </SheetHeader>
          <EditParticipantForm
            participant={participant}
            tags={tags}
            jobTitles={jobTitles}
            onSuccess={() => setOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
