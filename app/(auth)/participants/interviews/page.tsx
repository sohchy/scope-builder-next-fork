import { InterviewsTabs } from "./_components/InterviewsTabs";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import {
  getParticipantTags,
  getInterviewMilestonesWithProgress,
} from "@/services/participants";
import { getJobTitles } from "@/services/jobTitles";
import {
  getAvailableMilestones,
  getReviewedMilestones,
} from "@/services/milestoneAccess";
import { getSubStepProgress } from "@/services/getStarted";
import { checkRole } from "@/lib/auth";
import { MIN_PAYER_INTERVIEWS } from "@/lib/milestones";

export default async function ParticipantsInterviewPage() {
  const [
    tags,
    jobTitles,
    { payerDocumentedCount },
    isAdmin,
    isMentor,
    reviewedMilestones,
    availableMilestones,
    subStepProgress,
  ] = await Promise.all([
    getParticipantTags(),
    getJobTitles(),
    getInterviewMilestonesWithProgress(),
    checkRole("admin"),
    checkRole("mentor"),
    getReviewedMilestones(),
    getAvailableMilestones(),
    // Seeds SubStepProgressProvider. The Interview Prep tab gates on these, so
    // fetching them here rather than after mount keeps the tab from opening
    // locked and filling in a beat later.
    getSubStepProgress(),
  ]);

  return (
    // MilestoneHeader reads the selected milestone from context and throws without a
    // provider. Nothing else on this page consumes the selection — it only drives
    // which milestone the header expands.
    <MilestoneSelectionProvider>
      <SubStepProgressProvider initialProgress={subStepProgress}>
        <div className="flex flex-col h-full overflow-hidden">
          <MilestoneHeader
            payerInterviews={MIN_PAYER_INTERVIEWS}
            currentNumber={payerDocumentedCount}
            reviewedMilestones={reviewedMilestones}
            availableMilestones={availableMilestones}
          />
          <InterviewsTabs
            tags={tags}
            jobTitles={jobTitles}
            canReview={isAdmin || isMentor}
            availableMilestones={availableMilestones}
          />
        </div>
      </SubStepProgressProvider>
    </MilestoneSelectionProvider>
  );
}
