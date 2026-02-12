"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { ExerciseResponse } from "@/lib/generated/prisma";
import { revalidatePath } from "next/cache";

export async function getExcerciseResponse(excerciseNumber: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const excerciseResponse = await prisma.exerciseResponse.findFirst({
    where: {
      org_id: orgId,
      excercise_number: excerciseNumber,
    },
  });

  return serializeExcerciseReponse(excerciseResponse);
}

export async function createExcerciseResponse(
  excerciseNumber: number,
  responses: Record<string, any>,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const createdResponse = await prisma.exerciseResponse.create({
    data: {
      org_id: orgId,
      excercise_number: excerciseNumber,
      responses: responses,
    },
  });

  revalidatePath(`/excercises/excercise-${excerciseNumber}`);
}

function serializeExcerciseReponse(prismaRecord: ExerciseResponse | null) {
  if (!prismaRecord) return null;

  console.log("json", prismaRecord.responses!.toString());

  return {
    id: prismaRecord.id,
    org_id: prismaRecord.org_id,
    excercise_number: prismaRecord.excercise_number,
    responses: prismaRecord.responses,
  };
}
