"use client";

import { useCallback, useState } from "react";
import { format } from "date-fns";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { exportInterviewQuestionsCsv } from "@/services/interviewPrep";

/**
 * Downloads the prep tab's question tree as a CSV. The action hands back the text and
 * the file is assembled here — the alternative would be a route returning
 * Content-Disposition, which this repo has no precedent for and which would need its
 * own auth handling.
 */
export function ExportQuestionsButton() {
  const [pending, setPending] = useState(false);

  const handleClick = useCallback(async () => {
    if (pending) return;
    setPending(true);

    try {
      const csv = await exportInterviewQuestionsCsv();

      // The BOM is what makes Excel read the file as UTF-8 rather than the local
      // codepage, which otherwise mangles any non-ASCII a team typed into a question.
      const blob = new Blob(["﻿", csv], {
        type: "text/csv;charset=utf-8",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `interview-questions-${format(new Date(), "yyyy-MM-dd")}.csv`;
      // Firefox only honours the click once the anchor is in the document.
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not export the questions. Please try again.");
    } finally {
      setPending(false);
    }
  }, [pending]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      // Matches the Milestone Steps button in JourneyMapTabs, the page's other toolbar action.
      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#CDCFDE] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#4B4560] transition-colors hover:text-[#6A35FF] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Download className="size-3.5" />
      {pending ? "Exporting…" : "Export CSV"}
    </button>
  );
}
