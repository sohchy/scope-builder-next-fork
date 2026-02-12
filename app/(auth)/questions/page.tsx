import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";
import { getValuePropData } from "@/services/questions";
import { ValuePropProvider } from "./_components/ValuePropProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KanbanView from "@/components/KanbanModule/KanbanView";
import { getRoomKanbanBoards } from "@/services/kanbanBoards";
import { revalidatePath } from "next/cache";

export default async function QuestionsPage() {
  const { orgId } = await auth();

  const valuePropData = await getValuePropData();

  const kanbanBoards = await getRoomKanbanBoards(`questions-${orgId}`);

  console.log("Kanban Boards:", kanbanBoards);

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <ValuePropProvider valuePropData={valuePropData}>
          <Room roomId={`questions-${orgId}`}>
            <Tabs defaultValue="canvas-view" className="w-full h-full">
              <TabsList className="ml-1 mt-2">
                <TabsTrigger value="canvas-view">Canvas View</TabsTrigger>
                <TabsTrigger value="kanban-view">Kanban View</TabsTrigger>
              </TabsList>
              <TabsContent value="canvas-view" className="w-full h-full">
                <InfiniteCanvas
                  toolbarOptions={{
                    text: false,
                    table: false,
                    answer: false,
                    ellipse: false,
                    feature: false,
                    question: true,
                    rectangle: false,
                    interview: false,
                    card: false,
                  }}
                />
              </TabsContent>
              <TabsContent
                value="kanban-view"
                className="w-full h-full flex overflow-x-scroll"
              >
                <KanbanView
                  path={`/questions`}
                  roomId={`questions-${orgId}`}
                  kanbanBoards={kanbanBoards}
                />
                {/* <KanbanDemo kanbanBoards={kanbanBoards} /> */}
              </TabsContent>
            </Tabs>
          </Room>
        </ValuePropProvider>
      </div>
    </div>
  );
}
