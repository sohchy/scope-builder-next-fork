import { auth } from "@clerk/nextjs/server";
import { ProblemJourneyCanvas } from "@/components/ProblemJourneyMap/ProblemJourneyCanvas";
import { MilestoneHeader } from "@/components/ProblemJourneyMap/components/MilestoneHeader";
import { JourneyMapTabs } from "@/components/ProblemJourneyMap/components/JourneyMapTabs";
import { MilestoneSelectionProvider } from "@/components/ProblemJourneyMap/MilestoneSelectionContext";
import { SubStepProgressProvider } from "@/components/ProblemJourneyMap/SubStepProgressContext";
import { Room } from "@/components/Room";
import { generateProblemJourneyRoom } from "@/services/problemJourney";
import { generateAdLibValuePropRoom } from "@/services/adLibValueProp";
import { AdLibValuePropCanvas } from "@/components/ProblemJourneyMap/components/AdLibValueProp/AdLibValuePropCanvas";
import { adLibRoomId } from "@/lib/adLibValueProp";
import { getMarketData } from "@/services/market";
import {
  getAvailableMilestones,
  getReviewedMilestones,
} from "@/services/milestoneAccess";
import { getInterviewMilestonesWithProgress } from "@/services/participants";
import { getSubStepProgress } from "@/services/getStarted";
import {
  ALWAYS_AVAILABLE_MILESTONE,
  MIN_PAYER_INTERVIEWS,
} from "@/lib/milestones";

export default async function ProblemJourneyMapPage() {
  const { orgId } = await auth();
  const roomId = `problem-journey-${orgId}`;
  const adLibRoom = adLibRoomId(orgId!);
  const [
    ,
    marketData,
    availableMilestones,
    subStepProgress,
    { payerDocumentedCount },
    reviewedMilestones,
  ] = await Promise.all([
    generateProblemJourneyRoom(roomId),
    getMarketData(),
    // Drives every progressive-disclosure gate on the canvas — which features
    // the startup can see follows its real milestone access, not the milestone
    // block selected in the header.
    getAvailableMilestones(),
    // Seeds SubStepProgressProvider. The canvas gates on these, so fetching them
    // here rather than after mount keeps the problem sheet from opening locked
    // and filling in a beat later.
    getSubStepProgress(),
    getInterviewMilestonesWithProgress(),
    getReviewedMilestones(),
    generateAdLibValuePropRoom(adLibRoom),
  ]);

  // Open on the furthest milestone the startup has unlocked rather than always
  // on #0 — that's where their current work is, and the header scrolls it to the
  // left edge on mount. Availability isn't guaranteed contiguous (it's toggled
  // per milestone from /startups), so this is the max rather than a count;
  // `getAvailableMilestones` returns ascending and always includes milestone 0,
  // so the last entry is it.
  const highestUnlockedMilestone =
    availableMilestones.at(-1) ?? ALWAYS_AVAILABLE_MILESTONE;

  return (
    <MilestoneSelectionProvider defaultSelected={highestUnlockedMilestone}>
      <SubStepProgressProvider initialProgress={subStepProgress}>
        <div className="flex flex-col h-full">
          <MilestoneHeader
            payerInterviews={MIN_PAYER_INTERVIEWS}
            currentNumber={payerDocumentedCount}
            reviewedMilestones={reviewedMilestones}
            availableMilestones={availableMilestones}
          />
          <JourneyMapTabs
            availableMilestones={availableMilestones}
            canvas={
              <Room roomId={roomId}>
                <ProblemJourneyCanvas
                  stakeholderRows={marketData.stakeholderRows}
                  availableMilestones={availableMilestones}
                />
              </Room>
            }
            adLibCanvas={
              <Room roomId={adLibRoom}>
                <AdLibValuePropCanvas
                  availableMilestones={availableMilestones}
                />
              </Room>
            }
          />
        </div>
      </SubStepProgressProvider>
    </MilestoneSelectionProvider>
  );
}
