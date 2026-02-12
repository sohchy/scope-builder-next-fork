import {
  getHypothesis,
  getParticipantInterviewResponses,
} from "@/services/hypothesis";
import KanbanView from "./_components/KanbanView";
import { Attachment } from "@/components/Notes";

export default async function InterviewPage({
  params,
}: {
  params: Promise<{ participantId: string }>;
}) {
  const { participantId } = await params;

  const hypothesis = await getHypothesis();
  const participantResponses =
    await getParticipantInterviewResponses(participantId);

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
    <div className="flex flex-col h-full">
      <div className="h-full">
        <KanbanView
          hypotheses={formattedHypotheses}
          participantId={participantId}
        />
      </div>
    </div>
  );
}
