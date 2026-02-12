"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createHypothesis } from "@/services/hypothesis";
import { DialogContent } from "@radix-ui/react-dialog";

export default function CreateQuestionButton() {
  return (
    <Dialog>
      <DialogTrigger asChild>Create Question</DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Create a new question</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
