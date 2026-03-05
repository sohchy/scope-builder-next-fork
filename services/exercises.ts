"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ExerciseResponse } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

export async function getExerciseResponse(exerciseNumber: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const exerciseResponse = await prisma.exerciseResponse.findFirst({
    where: {
      org_id: orgId,
      exercise_number: exerciseNumber,
    },
  });

  return serializeExerciseReponse(exerciseResponse);
}

export async function createExerciseResponse(
  exerciseNumber: number,
  responses: Record<string, any>,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const createdResponse = await prisma.exerciseResponse.create({
    data: {
      org_id: orgId,
      exercise_number: exerciseNumber,
      responses: responses,
    },
  });

  revalidatePath(`/exercises/exercise-${exerciseNumber}`);
}

function serializeExerciseReponse(prismaRecord: ExerciseResponse | null) {
  if (!prismaRecord) return null;

  console.log("json", prismaRecord.responses!.toString());

  return {
    id: prismaRecord.id,
    org_id: prismaRecord.org_id,
    exercise_number: prismaRecord.exercise_number,
    responses: prismaRecord.responses,
  };
}
