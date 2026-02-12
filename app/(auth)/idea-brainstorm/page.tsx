import { Room } from "@/components/Room";
import InfiniteCanvas from "@/components/InfiniteCanvas";
import { auth } from "@clerk/nextjs/server";
import {
  createBrainstormExampleCards,
  initializeExampleCards,
} from "@/services/rooms";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function IdeaBrainstormPage() {
  const { orgId } = await auth();

  await initializeExampleCards(
    `brainstorm-examples-${orgId}`,
    createBrainstormExampleCards,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Tabs defaultValue="canvas" className="h-full">
          <TabsList>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>
          <TabsContent value="canvas" className="h-full">
            <Room roomId={`brainstorm-${orgId}`}>
              <InfiniteCanvas
                toolbarOptions={{
                  text: true,
                  card: false,
                  table: false,
                  answer: false,
                  ellipse: true,
                  feature: true,
                  question: false,
                  rectangle: true,
                  interview: false,
                }}
              />
            </Room>
          </TabsContent>

          <TabsContent value="examples" className="h-full">
            <Room roomId={`brainstorm-examples-${orgId}`}>
              <InfiniteCanvas
                toolbarOptions={{
                  text: false,
                  card: false,
                  table: false,
                  answer: false,
                  ellipse: false,
                  feature: false,
                  question: false,
                  rectangle: false,
                  interview: false,
                }}
                editable={false}
              />
            </Room>
          </TabsContent>
        </Tabs>
        {/* <Room roomId={`brainstorm-${orgId}`}>
          <InfiniteCanvas
            toolbarOptions={{
              text: true,
              card: false,
              table: false,
              answer: false,
              ellipse: true,
              feature: true,
              question: false,
              rectangle: true,
              interview: false,
            }}
          />
        </Room> */}
      </div>
    </div>
  );
}
