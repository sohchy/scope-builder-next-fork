"use server";

import { v4 as uuidv4 } from "uuid";
import { prisma } from "@/lib/prisma";
import liveblocks from "@/lib/liveblocks";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getValuePropositionVersions() {
  const { orgId, userId } = await auth();

  if (!orgId || !userId) return redirect("/sign-in");

  const valuePropositionVersions =
    await prisma.valuePropositionVersion.findMany({
      where: {
        org_id: orgId,
      },
      orderBy: {
        version_number: "asc",
      },
    });

  return valuePropositionVersions;
}

export async function createValuePropositionVersion() {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");

  if (!orgId) redirect("/pick-startup");

  const versions = await prisma.valuePropositionVersion.count({
    where: {
      org_id: orgId,
    },
  });

  let version;

  if (versions === 0) {
    version = await prisma.valuePropositionVersion.create({
      data: {
        org_id: orgId,
        room_id: uuidv4(),
        version_number: 1,
      },
    });
  }

  if (versions > 0) {
    const latestVersion = await prisma.valuePropositionVersion.findFirst({
      where: { org_id: orgId },
      orderBy: { created_at: "desc" },
    });

    const participantsWithCompleteStatus = await prisma.participant.count({
      where: {
        org_id: orgId,
        status: "complete",
        deleted_at: null,
      },
    });

    const latestVersionStorage = await liveblocks.getStorageDocument(
      latestVersion?.room_id!
    );

    const newVersionRoomId = uuidv4();

    await liveblocks.getOrCreateRoom(newVersionRoomId, {
      defaultAccesses: [],
    });

    await liveblocks.initializeStorageDocument(
      newVersionRoomId,
      latestVersionStorage
    );

    if (
      versions < 2 &&
      participantsWithCompleteStatus > 4 &&
      participantsWithCompleteStatus < 10
    ) {
      version = await prisma.valuePropositionVersion.create({
        data: {
          org_id: orgId,
          room_id: newVersionRoomId,
          version_number: 2,
        },
      });
      await prisma.valuePropositionVersion.update({
        where: { id: latestVersion?.id },
        data: { switch_at: new Date() },
      });
    }

    if (
      versions < 3 &&
      participantsWithCompleteStatus > 9 &&
      participantsWithCompleteStatus < 20
    ) {
      version = await prisma.valuePropositionVersion.create({
        data: {
          org_id: orgId,
          room_id: newVersionRoomId,
          version_number: 3,
        },
      });
      await prisma.valuePropositionVersion.update({
        where: { id: latestVersion?.id },
        data: { switch_at: new Date() },
      });
    }

    if (versions < 4 && participantsWithCompleteStatus >= 20) {
      version = await prisma.valuePropositionVersion.create({
        data: {
          org_id: orgId,
          room_id: newVersionRoomId,
          version_number: 4,
        },
      });
      await prisma.valuePropositionVersion.update({
        where: { id: latestVersion?.id },
        data: { switch_at: new Date() },
      });
    }
  }

  //revalidatePath(`/value-proposition`);

  return version;
}

/**
  0-4 completed : 1 room
  5-9 : 2 rooms
  10-19 : 3 rooms
  20+ : 4 rooms
 */

export async function getSegmentsPropData() {
  const { orgId } = await auth();

  if (!orgId) return;

  const roomId = `segments-${orgId}`;

  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });

  const segmentsData = await liveblocks.getStorageDocument(roomId);

  //@ts-ignore
  return segmentsData.data?.shapes?.data.map((s) => s.data);
}
