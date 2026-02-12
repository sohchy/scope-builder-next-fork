"use server";

import { redirect } from "next/navigation";
import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";

export async function getNotes() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const notes = await prisma.note.findMany({
    where: {
      org_id: orgId,
    },
    orderBy: {
      created_at: "asc",
    },
  });

  return notes;
}

export async function createNote(
  content: string,
  shareWithStartup: boolean,
  attachments: any[],
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const user = await currentUser();

  const note = await prisma.note.create({
    data: {
      content,
      org_id: orgId,
      user_id: userId,
      author_name: user?.fullName || "Unknown",
      author_email: user?.emailAddresses[0]?.emailAddress || "",
      share_with_startup: shareWithStartup,
      attachments,
    },
  });

  return note;
}

export async function updateNote(
  noteId: number,
  content: string,
  shareWithStartup: boolean,
) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const note = await prisma.note.update({
    where: {
      id: noteId,
    },
    data: {
      content,
      share_with_startup: shareWithStartup,
    },
  });
}

export async function deleteNote(noteId: number) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  await prisma.note.delete({
    where: {
      id: noteId,
    },
  });
}
