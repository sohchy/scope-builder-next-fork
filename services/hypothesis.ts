"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";

export type HypothesisWithQuestions = Prisma.HypothesisGetPayload<{
  include: { questions: true };
}>;

export async function getHypothesis() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const hypotheses = await prisma.hypothesis.findMany({
    where: {
      org_id: orgId,
    },
    orderBy: { order: "asc" },
    include: { questions: true },
  });

  return hypotheses;
}

export async function getAllHypothesis() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const hypotheses = await prisma.hypothesis.findMany({
    orderBy: { id: "asc" },
    include: { questions: true },
  });

  return hypotheses;
}

export async function createHypothesis(nextOrder: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const hypotheses = await prisma.hypothesis.create({
    data: {
      org_id: orgId,
      order: nextOrder,
      title: "New Hypothesis",
    },
  });

  revalidatePath("/hypotheses");
}

export async function updateHypothesisTitle(
  hypothesisId: number,
  title: string,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const hypothesis = await prisma.hypothesis.update({
    where: { id: hypothesisId },
    data: { title },
  });

  revalidatePath("/hypotheses");
}

export async function createHypothesisQuestion(
  hypothesisId: number,
  title: string,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const question = await prisma.question.create({
    data: {
      title,
      hypothesis_id: hypothesisId,
    },
  });

  revalidatePath("/hypotheses");
}

export async function updateHypothesisType(hypothesisId: number, type: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const question = await prisma.hypothesis.update({
    where: { id: hypothesisId },
    data: {
      type,
    },
  });

  revalidatePath("/hypotheses");
}

export async function updateHypothesisStatus(
  hypothesisId: number,
  type: string,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const question = await prisma.hypothesis.update({
    where: { id: hypothesisId },
    data: {
      conclusion_status: type,
    },
  });

  revalidatePath("/hypotheses");
}

export async function updateHypothesisConclusion(
  hypothesisId: number,
  conclusion: string,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const question = await prisma.hypothesis.update({
    where: { id: hypothesisId },
    data: {
      conclusion_content: conclusion,
    },
  });

  revalidatePath("/hypotheses");
}

export async function updateHypothesisOrder(
  newOrdering: { id: number; order: number }[],
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  for (const { id, order } of newOrdering) {
    await prisma.hypothesis.update({
      where: { id },
      data: { order },
    });
  }

  revalidatePath("/hypotheses");
}

export async function getInterviewResponses() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const responses = await prisma.interviewResponse.findMany({
    where: {
      participant: {
        org_id: orgId,
      },
    },
    include: {
      question: true,
      participant: true,
    },
  });

  return responses;
}

export async function getParticipantInterviewResponses(participantId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const responses = await prisma.interviewResponse.findMany({
    where: {
      participant_id: participantId,
    },
    include: {
      question: true,
      participant: true,
    },
  });

  return responses;
}

export async function getAllInterviewResponses() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const responses = await prisma.interviewResponse.findMany({
    include: {
      question: true,
      participant: true,
    },
  });

  return responses;
}

export async function upsertInterviewResponse(
  questionId: number,
  participantId: string,
  responseContent: string,
  attachments?: any[],
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const response = await prisma.interviewResponse.upsert({
    where: {
      question_id_participant_id: {
        question_id: questionId,
        participant_id: participantId,
      },
    },
    update: {
      response_content: responseContent,
      attachments,
    },
    create: {
      question_id: questionId,
      participant_id: participantId,
      response_content: responseContent,
      attachments,
    },
  });

  revalidatePath(`/participants/${participantId}/interview`);
}
