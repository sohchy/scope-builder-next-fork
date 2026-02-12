import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";
import {
  createSegmentExampleCards,
  initializeExampleCards,
} from "@/services/rooms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getRoomKanbanBoards } from "@/services/kanbanBoards";
import KanbanDemo from "@/components/KanbanModule/KanbanDemo";
import KanbanView from "@/components/KanbanModule/KanbanView";

export default async function SegmentsPage() {
  const { orgId } = await auth();

  await initializeExampleCards(`segments-${orgId}`, createSegmentExampleCards);

  const kanbanBoards = await getRoomKanbanBoards(`segments-${orgId}`);

  console.log("Kanban Boards:", kanbanBoards);

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Room roomId={`segments-${orgId}`}>
          {/* <InfiniteCanvas
            toolbarOptions={{
              text: true,
              card: true,
              table: false,
              answer: false,
              ellipse: true,
              feature: false,
              question: false,
              rectangle: true,
              interview: false,
            }}
          /> */}
          <Tabs defaultValue="canvas-view" className="w-full h-full">
            <TabsList className="ml-1 mt-2">
              <TabsTrigger value="canvas-view">Canvas View</TabsTrigger>
              <TabsTrigger value="kanban-view">Kanban View</TabsTrigger>
            </TabsList>
            <TabsContent value="canvas-view" className="w-full h-full">
              <InfiniteCanvas
                toolbarOptions={{
                  text: true,
                  card: true,
                  table: false,
                  answer: false,
                  ellipse: true,
                  feature: false,
                  question: false,
                  rectangle: true,
                  interview: false,
                }}
              />
            </TabsContent>
            <TabsContent
              value="kanban-view"
              className="w-full h-full flex overflow-x-scroll"
            >
              <KanbanView
                path="/segments"
                roomId={`segments-${orgId}`}
                kanbanBoards={kanbanBoards}
              />
              {/* <KanbanDemo kanbanBoards={kanbanBoards} /> */}
            </TabsContent>
          </Tabs>
        </Room>
      </div>
    </div>
  );
}
