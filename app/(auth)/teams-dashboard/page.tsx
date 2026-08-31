import { clerkClient } from "@clerk/nextjs/server";

import MilestoneProgressTable, {
  type MilestoneProgressRow,
} from "./_components/MilestoneProgressTable";
import { getAllSubStepProgress } from "@/services/getStarted";
import { getAllInterviewCounts } from "@/services/participants";
import { getAllMilestoneAccess } from "@/services/milestoneAccess";
import { defaultMilestoneAccess } from "@/lib/milestones";

// The interviews / hypothesis-status view is parked while the milestone progress
// grid takes over this page. `_components/TeamsDashboardTable.tsx` is still on disk
// — restore the imports and the block at the bottom of this file to bring it back.
//
// import {
//   getAllHypothesis,
//   getAllInterviewResponses,
// } from "@/services/hypothesis";
// import TeamsDashboardTable from "./_components/TeamsDashboardTable";
// import { getAllParticipants } from "@/services/participants";

export default async function TeamsDashboardPage() {
  const client = await clerkClient();

  // Org identity comes from Clerk, per-startup progress from Prisma; the two are
  // joined by `org_id` here on the server.
  const [organizations, subStepProgress, milestoneAccess, interviewCounts] =
    await Promise.all([
      client.organizations.getOrganizationList({ limit: 200 }),
      getAllSubStepProgress(),
      getAllMilestoneAccess(),
      getAllInterviewCounts(),
    ]);

  const rows: MilestoneProgressRow[] = organizations.data
    .filter((org) => org.publicMetadata?.cohort === "spring26")
    .map((org) => ({
      orgId: org.id,
      orgName: org.name,
      interviews: interviewCounts[org.id] ?? {
        scheduled: 0,
        conducted: 0,
        documented: 0,
      },
      subSteps: subStepProgress[org.id] ?? {},
      milestones: milestoneAccess[org.id] ?? defaultMilestoneAccess(),
    }))
    .sort((a, b) => a.orgName.localeCompare(b.orgName));

  return (
    <div className="p-8 h-full bg-white">
      <MilestoneProgressTable data={rows} />
    </div>
  );
}

// ─── Parked: interviews + hypothesis status ──────────────────────────────────
//
// const getInterviewsData = (orgId: string) => {
//   const scheduleInterviews = participants.filter(
//     (p) => p.org_id === orgId && p.scheduled_date,
//   );
//
//   const conductedInterviews = participants.filter(
//     (p) => p.org_id === orgId && p.status === "complete",
//   );
//
//   return {
//     scheduled: scheduleInterviews.length,
//     conducted: conductedInterviews.length,
//   };
// };
//
// const getHypothesisData = (orgId: string) => {
//   const orgHypotheses = hypothesis.filter((h) => h.org_id === orgId);
//
//   return {
//     testing: orgHypotheses.filter((h) => h.conclusion_status === "Testing")
//       .length,
//     validated: orgHypotheses.filter((h) => h.conclusion_status === "Validated")
//       .length,
//     invalidated: orgHypotheses.filter(
//       (h) => h.conclusion_status === "Invalidated",
//     ).length,
//   };
// };
//
// const dashboardData = organizations.data
//   .filter((org) => org.publicMetadata?.cohort === "spring26")
//   .map((org) => ({
//     orgId: org.id,
//     orgName: org.name,
//     interviews: getInterviewsData(org.id),
//     hypothesisStatus: getHypothesisData(org.id),
//     hypothesis: hypothesis.filter((h) => h.org_id === org.id).length,
//   }))
//   .sort((a, b) => a.orgName.localeCompare(b.orgName));
//
// <TeamsDashboardTable data={dashboardData} />
