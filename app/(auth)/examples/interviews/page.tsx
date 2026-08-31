import { InterviewsTabs } from "@/app/(auth)/participants/interviews/_components/InterviewsTabs";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import {
  getExampleParticipantTags,
  getExampleJobTitles,
  getExampleInterviewMilestonesWithProgress,
} from "@/services/examples";
import {
  getAvailableMilestones,
  getReviewedMilestones,
} from "@/services/milestoneAccess";
import { MIN_PAYER_INTERVIEWS } from "@/lib/milestones";

// Read-only showcase mirror of /participants/interviews. Same tabs, but sourced
// from example set N (global) with every add/edit/answer control removed.
const EXAMPLE_NUMBER = 1;

export default async function ExampleInterviewsPage() {
  const [
    tags,
    jobTitles,
    { payerDocumentedCount },
    reviewedMilestones,
    availableMilestones,
  ] = await Promise.all([
    getExampleParticipantTags(EXAMPLE_NUMBER),
    getExampleJobTitles(EXAMPLE_NUMBER),
    getExampleInterviewMilestonesWithProgress(EXAMPLE_NUMBER),
    // The tabs below hold example data, but the header's locks and sign-off —
    // and the Interview Prep gate — follow the *viewer's* own access, same rule
    // as the journey mirror, so the strip reads the same on both example pages
    // and on the real ones.
    getReviewedMilestones(),
    getAvailableMilestones(),
  ]);

  return (
    <MilestoneSelectionProvider>
      <SubStepProgressProvider exampleNumber={EXAMPLE_NUMBER}>
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
            readOnly
            exampleNumber={EXAMPLE_NUMBER}
            availableMilestones={availableMilestones}
          />
        </div>
      </SubStepProgressProvider>
    </MilestoneSelectionProvider>
  );
}
