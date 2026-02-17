"use server";

import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@clerk/nextjs/server";

import { participantFormSchema } from "@/schemas/participant";
import { ParticipantStatus } from "@/lib/generated/prisma";

export async function getParticipantTags() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const tags = await prisma.participantTag.findMany({
    where: { org_id: orgId },
  });

  return tags.map((tag) => tag.name);
}

export async function createParticipantTag(tagName: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const newTag = await prisma.participantTag.create({
    data: {
      name: tagName,
      org_id: orgId,
    },
  });

  revalidatePath(`/participants`);
}

export async function getParticipant(participantId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const participant = await prisma.participant.findFirst({
    where: { id: participantId, org_id: orgId },
  });

  return participant;
}

export async function getParticipants() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const participants = await prisma.participant.findMany({
    where: { org_id: orgId },
    orderBy: [{ scheduled_date: "asc" }, { name: "asc" }],
  });

  return participants;
}

export async function getAllParticipants() {
  const { userId } = await auth();

  if (!userId) redirect("/sign-in");

  const participants = await prisma.participant.findMany({
    orderBy: [{ scheduled_date: "asc" }, { name: "asc" }],
  });

  return participants;
}

export async function createParticipant(
  values: z.infer<typeof participantFormSchema>,
) {
  const participantId = uuidv4();
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const newParticipant = await prisma.participant.create({
    data: {
      ...values,
      status: values.status as ParticipantStatus,
      org_id: orgId,
      id: participantId,
      ParticipantRoom: {
        create: {
          roomId: uuidv4(),
        },
      },
    },
  });

  revalidatePath(`/participants`);

  return newParticipant;
}

export async function updateParticipant(
  participantId: string,
  values: z.infer<typeof participantFormSchema>,
) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const updatedParticipant = await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: { ...values, status: values.status as ParticipantStatus },
  });

  revalidatePath(`/participants`);
}

export async function markParticipantAsComplete(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const updatedParticipant = await prisma.participant.update({
    where: { id: participantId, org_id: orgId },
    data: { status: "complete" },
  });

  revalidatePath(`/participants`);
}

export async function deleteParticipant(participantId: string) {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  await prisma.participant.delete({
    where: { id: participantId, org_id: orgId },
  });

  revalidatePath(`/participants`);
}
