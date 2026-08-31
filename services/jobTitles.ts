"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

export async function getJobTitles(): Promise<string[]> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const jobTitles = await prisma.stakeholderJobTitles.findMany({
    where: { org_id: orgId },
  });

  return jobTitles.map((jobTitle) => jobTitle.name);
}

export async function createJobTitle(
  name: string,
  role?: string,
): Promise<void> {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.stakeholderJobTitles.create({
    data: {
      name,
      role,
      org_id: orgId,
    },
  });
}
