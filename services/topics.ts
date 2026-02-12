"use server";

import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/generated/prisma";
import { topicFormSchema, topicTaskFormSchema } from "@/schemas/topic";
import z from "zod";

export type TopicWithTasks = Prisma.TopicGetPayload<{
  include: { topic_tasks: true; topic_progresses: true };
}>;

export async function getTopics() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const topics = await prisma.topic.findMany({
    include: { topic_tasks: true },
  });

  return topics;
}

export async function getTopicTasks() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const topicTasks = await prisma.topicTask.findMany({
    include: { topic: true },
  });

  return topicTasks;
}

export async function createTopic(values: z.infer<typeof topicFormSchema>) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.topic.create({
    data: {
      ...values,
    },
  });

  revalidatePath("/admin-panel");
}

export async function createTopicTask(
  values: z.infer<typeof topicTaskFormSchema>,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.topicTask.create({
    data: {
      ...values,
    },
  });

  revalidatePath("/admin-panel");
}

export async function getTopicProgress() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const topicProgress = await prisma.topicProgress.findMany({
    where: { org_id: orgId },
  });

  return topicProgress;
}

export async function markTopicAsCompleted(topicId: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.topicProgress.upsert({
    where: {
      org_id_topic_id: {
        org_id: orgId,
        topic_id: topicId,
      },
    },
    create: {
      org_id: orgId,
      topic_id: topicId,
      completed: true,
    },
    update: {
      completed: true,
    },
  });

  revalidatePath("/progress-dashboard");
}

export async function markTaskAsCompleted(taskId: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.topicProgress.upsert({
    where: {
      org_id_task_id: {
        org_id: orgId,
        task_id: taskId,
      },
    },
    create: {
      org_id: orgId,
      task_id: taskId,
      completed: true,
    },
    update: {
      completed: true,
    },
  });

  revalidatePath("/progress-dashboard");
}
