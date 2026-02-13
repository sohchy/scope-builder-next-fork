import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import MultiCanvas from "./components/MultiCanvas";
import { getSegmentsPropData } from "@/services/valueProposition";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";

export default async function ValuePropositionCanvasPage() {
  const { orgId } = await auth();

  const segmentsPropData = await getSegmentsPropData();
  const questions = await prisma.cardQuestions.findMany({});

  return (
    <div className="flex flex-col h-full">
      <div className="h-full ">
        <QuestionsProvider segments={segmentsPropData} questions={questions}>
          <div className="h-full p-2">
            <Tabs defaultValue="canvas" className="h-full">
              <TabsList>
                <TabsTrigger value="canvas">Canvas</TabsTrigger>
                <TabsTrigger value="examples">Examples</TabsTrigger>
                <div className="ml-2">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant={"outline"}>Show Design</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      style={{
                        width: "950px",
                        height: "650px",
                        maxWidth: "950px",
                        maxHeight: "650px",
                      }}
                      className="flex flex-col items-center justify-center"
                    >
                      {/* <AlertDialogHeader>
                        <AlertDialogTitle>Book Design</AlertDialogTitle>
                      </AlertDialogHeader> */}
                      <Image
                        width={825}
                        height={550}
                        alt="Book Design"
                        src={"/value-prop.png"}
                      />
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TabsList>
              <TabsContent value="canvas" className="h-full">
                <MultiCanvas orgId={orgId} />
              </TabsContent>
              <TabsContent value="examples" className="h-full">
                <MultiCanvas orgId={orgId} example />
              </TabsContent>
            </Tabs>
          </div>
        </QuestionsProvider>
      </div>
    </div>
  );
}
