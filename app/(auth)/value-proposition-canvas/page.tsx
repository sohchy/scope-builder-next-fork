import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import MultiCanvas from "./components/MultiCanvas";
import { getSegmentsPropData } from "@/services/valueProposition";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function ValuePropositionCanvasPage() {
  const { orgId } = await auth();

  const segmentsPropData = await getSegmentsPropData();
  const questions = await prisma.cardQuestions.findMany({});

  return (
    <div className="flex flex-col h-full">
      <div className="h-full">
        <QuestionsProvider segments={segmentsPropData} questions={questions}>
          <Tabs defaultValue="canvas" className="h-full">
            <TabsList>
              <TabsTrigger value="canvas">Canvas</TabsTrigger>
              <TabsTrigger value="examples">Examples</TabsTrigger>
            </TabsList>
            <TabsContent value="canvas" className="h-full">
              <MultiCanvas orgId={orgId} />
            </TabsContent>
            <TabsContent value="examples" className="h-full">
              <MultiCanvas orgId={orgId} example />
            </TabsContent>
          </Tabs>
        </QuestionsProvider>
      </div>
    </div>
  );
}
