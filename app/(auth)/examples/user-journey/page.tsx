import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { JourneyMapTabs } from "@/components/ProblemJourneyMap/components/JourneyMapTabs";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import { Room } from "@/components/Room";
import {
  generateExampleProblemJourneyRoom,
  getExampleMarketData,
  getExampleSubStepProgress,
  getExampleInterviewMilestonesWithProgress,
} from "@/services/examples";
import {
  getAvailableMilestones,
  getReviewedMilestones,
} from "@/services/milestoneAccess";
import { exampleRoomId } from "@/lib/examples";
import { MIN_PAYER_INTERVIEWS } from "@/lib/milestones";

// Read-only showcase mirror of /user-journey-map. Everything is identical to the
// real page except the data is example set N (global) and no control can edit it.
const EXAMPLE_NUMBER = 1;

export default async function ExampleProblemJourneyPage() {
  const roomId = exampleRoomId(EXAMPLE_NUMBER);
  const [
    ,
    marketData,
    availableMilestones,
    subStepProgress,
    { payerDocumentedCount },
    reviewedMilestones,
  ] = await Promise.all([
    generateExampleProblemJourneyRoom(roomId),
    getExampleMarketData(EXAMPLE_NUMBER),
    // The example data is global, but the milestone gates follow the *viewer's*
    // own access so the showcase matches the shape of their own map — a startup
    // still on Milestone 1 sees the example without problems, same as theirs.
    // Passed to all three of the header, the tabs and the canvas, so the locks a
    // team sees here are the ones they see on their own page.
    getAvailableMilestones(),
    // The sub-step gates, in contrast, stay example-scoped — the showcase is
    // presented at the progress it was authored at, rather than clipped to the
    // viewer's own sub-steps. A gate needs both (see `isSubStepUnlocked`), so a
    // section opens here only where the viewer's milestone is on AND the example
    // was authored past that sub-step.
    getExampleSubStepProgress(EXAMPLE_NUMBER),
    // Counters in the header's pinned right-hand block: the target is the global
    // program constant, the count is the example's own documented payers.
    getExampleInterviewMilestonesWithProgress(EXAMPLE_NUMBER),
    // Sign-off is the viewer's, same as availability above — the green blocks
    // read as "where you are", against the example's locks.
    getReviewedMilestones(),
  ]);

  return (
    <MilestoneSelectionProvider>
      <SubStepProgressProvider
        exampleNumber={EXAMPLE_NUMBER}
        initialProgress={subStepProgress}
      >
        <div className="flex flex-col h-full">
          <MilestoneHeader
            payerInterviews={MIN_PAYER_INTERVIEWS}
            currentNumber={payerDocumentedCount}
            reviewedMilestones={reviewedMilestones}
            availableMilestones={availableMilestones}
          />
          <JourneyMapTabs
            readOnly
            exampleNumber={EXAMPLE_NUMBER}
            availableMilestones={availableMilestones}
            canvas={
              <Room roomId={roomId}>
                <ProblemJourneyCanvas
                  stakeholderRows={marketData.stakeholderRows}
                  availableMilestones={availableMilestones}
                  readOnly
                />
              </Room>
            }
          />
        </div>
      </SubStepProgressProvider>
    </MilestoneSelectionProvider>
  );
}
