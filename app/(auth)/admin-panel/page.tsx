import { getAllGetStartedCards } from "@/services/getStarted";
import GetStartedCardsTable from "./_components/GetStartedCardsTable";

// The Topics / TopicTasks tables (./_components/TopicsTable, ./_components/
// TopicTasksTable + services/topics.ts) are parked, not deleted — they're just
// not rendered while the Instructions cards are the admin surface.

export default async function AdminPanelPage() {
  const getStartedCards = await getAllGetStartedCards();

  return (
    <div className="p-8 h-full flex flex-col gap-3">
      <GetStartedCardsTable data={getStartedCards} />
    </div>
  );
}
