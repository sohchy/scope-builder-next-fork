"use client";

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
import type { AdLibCardStorage, AdLibField } from "@/liveblocks.config";

type CardSnapshot = Readonly<AdLibCardStorage>;

// Connector word → the blanks that follow it, in sentence order. A clause is
// left out of the preview when all of its blanks are empty.
const CLAUSES: Array<{
  word: string;
  fields: AdLibField[];
}> = [
  { word: "Our", fields: ["productsAndServices"] },
  { word: "help(s)", fields: ["customerSegment"] },
  { word: "who wants to", fields: ["jobsToBeDone"] },
  { word: "by", fields: ["painVerb", "pain"] },
  { word: "and", fields: ["gainVerb", "gain"] },
  { word: "unlike", fields: ["competingValueProp"] },
];

function sentenceFor(card: CardSnapshot): string {
  return CLAUSES.flatMap(({ word, fields }) => {
    const text = fields
      .map((field) => card[field].trim())
      .filter(Boolean)
      .join(" ");
    return text ? [`${word} ${text}`] : [];
  }).join(" ");
}

interface DeleteAdLibCardDialogProps {
  /** The card being deleted; the dialog is open while this is set. */
  card: CardSnapshot | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function DeleteAdLibCardDialog({
  card,
  onOpenChange,
  onConfirm,
}: DeleteAdLibCardDialogProps) {
  const sentence = card ? sentenceFor(card) : "";

  return (
    <AlertDialog open={card !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Version {card?.version}?</AlertDialogTitle>
          <AlertDialogDescription>
            This value proposition and everything written in it will be
            permanently deleted. This can&apos;t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Shown so the user can tell which version this is. */}
        <div className="rounded-lg bg-[#F3F3F6] p-3">
          <p className="text-sm font-semibold text-gray-700">
            Ad-Lib Value Proposition · Version {card?.version}
          </p>
          <p className="mt-0.5 text-base text-gray-800">
            {sentence || (
              <span className="italic text-gray-500">Nothing written yet</span>
            )}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-700"
          >
            Delete version
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
