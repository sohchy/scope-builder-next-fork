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
    // `brainstorm-examples-${orgId}`,
    `brainstorm-examples`,
    // createBrainstormExampleCards,
  );

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <Tabs defaultValue="canvas" className="h-full">
          <TabsList>
            <TabsTrigger value="canvas">Canvas</TabsTrigger>
            <TabsTrigger value="examples-problem">
              Example: Problem & Value Prop Ad-Lib
            </TabsTrigger>
            <TabsTrigger value="examples-ecosystem">
              Example: Ecosystem Map
            </TabsTrigger>
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
          <TabsContent value="examples-problem" className="h-full">
            <Room roomId={`brainstorm-examples`}>
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
          <TabsContent value="examples-ecosystem" className="h-full">
            <Room roomId={`brainstorm-ecosystem-examples`}>
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
                editable={true}
              />
            </Room>
          </TabsContent>

          {/* <TabsContent value="examples" className="h-full">
            <Tabs defaultValue="examples-problem" className="h-full">
              <TabsList>
                <TabsTrigger value="examples-problem">
                  Problem & Value Prop Ad-Lib
                </TabsTrigger>
                <TabsTrigger value="examples-ecosystem">
                  Ecosystem Map
                </TabsTrigger>
              </TabsList>

              <TabsContent value="examples-problem" className="h-full">
                <Room roomId={`brainstorm-problem-examples`}>
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

              <TabsContent value="examples-ecosystem" className="h-full">
                <Room roomId={`brainstorm-ecosystem-examples`}>
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
          </TabsContent> */}
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
