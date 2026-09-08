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

// Notes the current user hasn't seen yet in the active startup. The visibility
// rule is applied here rather than on the client (the way the panel itself does
// it) so that a founder's count never reveals that a private instructor note
// exists.
export async function getUnreadNotesCount() {
  const { orgId, userId, orgRole } = await auth();

  // This runs on a timer, so it stays quiet instead of redirecting the way the
  // rest of this file does — a redirect from a poll would yank the user out of
  // whatever page they're on.
  if (!userId || !orgId) return 0;

  const read = await prisma.noteRead.findUnique({
    where: { user_id_org_id: { user_id: userId, org_id: orgId } },
  });

  const canSeePrivateNotes = orgRole === "org:admin" || orgRole === "org:mentor";

  return prisma.note.count({
    where: {
      org_id: orgId,
      // Your own notes are never unread; this also covers your own private ones,
      // so `share_with_startup` alone is the right filter for everyone else.
      user_id: { not: userId },
      ...(canSeePrivateNotes ? {} : { share_with_startup: true }),
      ...(read ? { created_at: { gt: read.last_read_at } } : {}),
    },
  });
}

export async function markNotesRead() {
  const { orgId, userId } = await auth();

  if (!userId || !orgId) return;

  const now = new Date();

  await prisma.noteRead.upsert({
    where: { user_id_org_id: { user_id: userId, org_id: orgId } },
    create: { user_id: userId, org_id: orgId, last_read_at: now },
    update: { last_read_at: now },
  });
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
