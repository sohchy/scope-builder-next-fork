"use server";

import liveblocks from "@/lib/liveblocks";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { buildAdLibCard } from "@/lib/adLibValueProp";

/**
 * Create the org's Ad-Lib room on first visit, with Version 1 already in it.
 *
 * Version 1 goes in through `initializeStorageDocument`, not a later
 * `mutateStorage`. Liveblocks only accepts initialization on a room with empty
 * storage, so when two renders race (two collaborators, or a double request in
 * dev), one wins and the other is refused. `mutateStorage` has no such
 * guarantee: it edits a downloaded snapshot and sends the ops, so two racing
 * calls each find an empty list and each push a "Version 1".
 */
export async function generateAdLibValuePropRoom(roomId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  await liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] });

  const roomStorage: any = await liveblocks.getStorageDocument(roomId);
  if (Object.keys(roomStorage.data).length > 0) return;

  const firstCard = buildAdLibCard(crypto.randomUUID(), 1, { x: 0, y: 0 });

  try {
    await liveblocks.initializeStorageDocument(roomId, {
      liveblocksType: "LiveObject",
      data: {
        adLibCards: {
          liveblocksType: "LiveList",
          data: [{ liveblocksType: "LiveObject", data: firstCard }],
        },
        adLibLastVersion: 1,
      },
    });
  } catch (error) {
    // Refused because a racing render initialized the room first: that one
    // seeded Version 1, so there's nothing left to do. Anything else is real.
    const current: any = await liveblocks.getStorageDocument(roomId);
    if (Object.keys(current.data).length === 0) throw error;
  }
}
