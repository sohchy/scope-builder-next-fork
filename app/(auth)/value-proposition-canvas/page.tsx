import { auth } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import MultiCanvas from "./components/MultiCanvas";
import { getSegmentsPropData } from "@/services/valueProposition";
import { QuestionsProvider } from "@/components/CanvasModule/questions/QuestionsProvider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
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
              <div className="flex flex-row">
                <TabsList className="">
                  <TabsTrigger value="canvas">Canvas</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                </TabsList>

                <div className="ml-auto">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant={"outline"}>
                        Show Value Prop Canvas Reference
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent
                      style={{
                        width: "950px",
                        height: "650px",
                        maxWidth: "950px",
                        maxHeight: "650px",
                      }}
                      className="flex flex-col justify-center"
                    >
                      {/* <AlertDialogHeader>
                        <AlertDialogTitle>Book Design</AlertDialogTitle>
                      </AlertDialogHeader> */}
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <Image
                          width={825}
                          height={550}
                          alt="Book Design"
                          src={"/value-prop.png"}
                        />
                      </div>
                      <AlertDialogFooter className="flex justify-end">
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
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
