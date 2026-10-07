"use client";

import { useCallback, useRef, useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";

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
import { Button } from "@/components/ui/button";
import { importInterviewCsv } from "@/services/importedInterview";

/** How many row errors a failed import lists before summarizing the rest. */
const MAX_ERRORS_SHOWN = 5;

interface ImportCsvButtonProps {
  participantId: string;
  /** The participant already has an import — picking a file asks before replacing it. */
  hasImport: boolean;
  onImported: () => void;
}

/**
 * Bring in an interview conducted elsewhere as a `hypothesis,question,answer` CSV. The
 * import replaces the journey-map questions on this participant's interview; a second
 * import replaces the first, so that one is confirmed before anything is sent.
 */
export function ImportCsvButton({
  participantId,
  hasImport,
  onImported,
}: ImportCsvButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const pickFile = useCallback(() => inputRef.current?.click(), []);

  const handleButtonClick = useCallback(() => {
    if (hasImport) setConfirmOpen(true);
    else pickFile();
  }, [hasImport, pickFile]);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Cleared so picking the same file again (after fixing it) still fires a change.
      e.target.value = "";
      if (!file) return;

      setImporting(true);
      try {
        const result = await importInterviewCsv({
          participantId,
          csvText: await file.text(),
          fileName: file.name,
        });

        if (result.ok) {
          toast.success("Interview imported");
          onImported();
          return;
        }

        const shown = result.errors.slice(0, MAX_ERRORS_SHOWN);
        const hidden = result.errors.length - shown.length;
        toast.error("Couldn't import this file", {
          description: (
            <ul className="flex flex-col gap-0.5">
              {shown.map((error) => (
                <li key={error}>{error}</li>
              ))}
              {hidden > 0 && <li>…and {hidden} more.</li>}
            </ul>
          ),
          duration: 10000,
        });
      } catch {
        toast.error("Couldn't import this file", {
          description: "Something went wrong. Please try again.",
        });
      } finally {
        setImporting(false);
      }
    },
    [participantId, onImported],
  );

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleFileChange}
      />
      <Button
        variant="outline"
        onClick={handleButtonClick}
        disabled={importing}
        className="rounded-lg"
      >
        <Upload className="size-4" />
        {importing ? "Importing…" : "Import CSV"}
      </Button>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace the imported interview?</AlertDialogTitle>
            <AlertDialogDescription>
              This interview already has an imported CSV. Importing a new file deletes
              it — every hypothesis, question and answer from it, including any answers
              edited here — and uses the new file instead.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                pickFile();
              }}
            >
              Choose file
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
