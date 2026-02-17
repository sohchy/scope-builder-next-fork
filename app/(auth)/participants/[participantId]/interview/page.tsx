import {
  getHypothesis,
  getParticipantInterviewResponses,
} from "@/services/hypothesis";
import KanbanView from "./_components/KanbanView";
import { Attachment } from "@/components/Notes";
import { ChevronLeftIcon } from "lucide-react";
import { getParticipant } from "@/services/participants";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;

  const hypothesis = await getHypothesis();
  const participantResponses =
    await getParticipantInterviewResponses(participantId);
  const participant = await getParticipant(participantId);

  const formattedHypotheses = hypothesis.map((h) => ({
    id: h.id,
    title: h.title,
    description: h.description,
    questions: h.questions.map((q) => ({
      id: q.id,
      title: q.title,
      interviewResponse:
        participantResponses.find((response) => response.question_id === q.id)
          ?.response_content || null,
      attachments:
        (participantResponses.find((response) => response.question_id === q.id)
          ?.attachments as Attachment[]) || [],
    })),
  }));

  return (
    <div className="h-full gap-9">
      <div className="flex flex-col  h-full p-8 gap-9">
        <h1 className="flex flex-row items-center gap-6 text-[#111827] font-semibold text-2xl">
          <div className="bg-white rounded-full size-[22px] flex items-center justify-center">
            <Link href="/participants">
              <ChevronLeftIcon size={18} className="text-gray-500" />
            </Link>
          </div>
          {participant?.name}
        </h1>
        <KanbanView
          hypotheses={formattedHypotheses}
          participantId={participantId}
        />
      </div>
    </div>
  );
}
