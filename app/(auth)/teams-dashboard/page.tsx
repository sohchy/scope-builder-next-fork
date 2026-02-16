import {
  getAllHypothesis,
  getAllInterviewResponses,
} from "@/services/hypothesis";
import TeamsDashboardTable from "./_components/TeamsDashboardTable";
import { clerkClient } from "@clerk/nextjs/server";
import { getAllParticipants } from "@/services/participants";

export default async function TeamsDashboardPage() {
  const client = await clerkClient();
  const hypothesis = await getAllHypothesis();
  const participants = await getAllParticipants();
  const interviewResponses = await getAllInterviewResponses();
  const organizations = await client.organizations.getOrganizationList();

  const getInterviewsData = (orgId: string) => {
    const scheduleInterviews = participants.filter(
      (p) => p.org_id === orgId && p.scheduled_date,
    );

    const conductedInterviews = interviewResponses.filter((ir) => {
      const participant = participants.find((p) => p.id === ir.participant_id);
      return participant?.org_id === orgId;
    });

    const conductedInterviewsIds: string[] = [];

    conductedInterviews.forEach((ir) => {
      if (!conductedInterviewsIds.includes(ir.participant_id)) {
        conductedInterviewsIds.push(ir.participant_id);
      }
    });

    return {
      scheduled: scheduleInterviews.length,
      conducted: conductedInterviewsIds.length,
    };
  };

  const getHypothesisData = (orgId: string) => {
    const orgHypotheses = hypothesis.filter((h) => h.org_id === orgId);

    const testingHypotheses = orgHypotheses.filter(
      (h) => h.conclusion_status === "Testing",
    ).length;
    const validatedHypotheses = orgHypotheses.filter(
      (h) => h.conclusion_status === "Validated",
    ).length;
    const invalidatedHypotheses = orgHypotheses.filter(
      (h) => h.conclusion_status === "Invalidated",
    ).length;

    return {
      testing: testingHypotheses,
      validated: validatedHypotheses,
      invalidated: invalidatedHypotheses,
    };
  };

  const dashboardData = organizations.data.map((org) => ({
    orgId: org.id,
    orgName: org.name,
    interviews: getInterviewsData(org.id),
    hypothesisStatus: getHypothesisData(org.id),
    hypothesis: hypothesis.filter((h) => h.org_id === org.id).length,
  }));

  return (
    <div className="p-8 h-full bg-white">
      <TeamsDashboardTable data={dashboardData} />
    </div>
  );
}
