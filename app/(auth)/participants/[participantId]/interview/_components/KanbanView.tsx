import { Attachment } from "@/components/Notes";
import KanbanViewItem from "./KanbanViewItem";

export type Question = {
  id: number;
  title: string;
  interviewResponse: string | null;
  attachments: Attachment[];
};

export type Hypothesis = {
  id: number;
  title: string;
  description: string | null;
  questions: Question[];
};

interface KanbanViewProps {
  participantId: string;
  hypotheses: Hypothesis[];
}

export default function KanbanView({
  hypotheses,
  participantId,
}: KanbanViewProps) {
  return (
    <div className="p-8 h-full flex flex-row gap-4 overflow-x-scroll">
      {hypotheses.map((hypothesis) => (
        <KanbanViewItem
          key={hypothesis.id}
          hypothesis={hypothesis}
          participantId={participantId}
        />
      ))}
    </div>
  );
}
