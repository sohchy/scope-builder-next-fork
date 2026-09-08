import { v4 as uuidv4 } from "uuid";
import liveblocks from "@/lib/liveblocks";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LiveObject } from "@liveblocks/client";
import { prisma } from "@/lib/prisma";

export async function getRoomData(roomId: string) {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const storage = await liveblocks.getStorageDocument(roomId);

  return storage;
}

export async function generateAnalysisRoom(roomId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const participants = await prisma.participant.findMany({
    where: {
      org_id: orgId,
      deleted_at: null,
    },
    include: {
      ParticipantRoom: true,
    },
  });

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });

  await liveblocks.getOrCreateRoom(`questions-${orgId}`, {
    defaultAccesses: [],
  });

  const roomStorage: any = await liveblocks.getStorageDocument(roomId);
  const questionStorage: any = await liveblocks.getStorageDocument(
    `questions-${orgId}`
  );

  const questions =
    questionStorage.data.shapes?.data.map((shape: any) => shape.data) || [];

  const answers: any[] = [];

  for (const participant of participants) {
    const participantRoomId = participant.ParticipantRoom?.roomId!;
    await liveblocks.getOrCreateRoom(participantRoomId, {
      defaultAccesses: [],
    });

    const participantStorage: any = await liveblocks.getStorageDocument(
      participantRoomId
    );
    const participantAnswers =
      participantStorage.data.shapes?.data
        .map((shape: any) => shape.data)
        .filter((shape: any) => shape.type === "question")
        .map((shape: any) => {
          return {
            ...participant,
            questionId: shape.metadata?.questionId,
            draftRaw: shape.draftRaw,
          };
        }) || [];
    answers.push(...participantAnswers);
  }

  if (Object.keys(roomStorage.data).length === 0) {
    await liveblocks.initializeStorageDocument(roomId, {
      liveblocksType: "LiveObject",
      data: {
        shapes: {
          liveblocksType: "LiveList",
          data: [],
        },
        comments: {
          liveblocksType: "LiveList",
          data: [],
        },
        connections: {
          liveblocksType: "LiveList",
          data: [],
        },
      },
    });
  }

  await liveblocks.mutateStorage(roomId, ({ root }) => {
    //@ts-ignore
    const analysisQuestions = root.get("shapes");

    //@ts-ignore
    if (analysisQuestions.length === 0) {
      questions.forEach((question: any) => {
        const answersForQuestion = answers.filter(
          (a) => a.questionId === question.id
        );

        //@ts-ignore
        analysisQuestions.push(
          new LiveObject({
            ...question,
            type: "question_answer",
            width: 1180,
            height: 320,
            question_answers: answersForQuestion,
          })
        );
      });
    } else {
      questions.forEach((question: any) => {
        const answersForQuestion = answers.filter(
          (a) => a.questionId === question.id
        );
        //@ts-ignore
        const doesExist = analysisQuestions.find((q) => {
          try {
            //@ts-ignore
            const analysisQuestion = q.toObject();
            return analysisQuestion.id === question.id;
          } catch (err) {}
        });

        if (!doesExist) {
          //@ts-ignore
          analysisQuestions.push(
            new LiveObject({
              ...question,
              type: "question_answer",
              width: 1180,
              height: 320,
              question_answers: answersForQuestion,
            })
          );
        } else {
          doesExist.set("questionTitle", question.questionTitle);
          doesExist.set("question_answers", answersForQuestion);
        }
      });
    }
  });
}
