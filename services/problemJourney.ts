"use server";

import liveblocks from "@/lib/liveblocks";
import { LiveObject } from "@liveblocks/node";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { startupIdeaDefaultFor } from "@/lib/startupIdeaDefaults";

export async function generateProblemJourneyRoom(roomId: string) {
  const { orgId, userId } = await auth();

  if (!userId) redirect("/sign-in");
  if (!orgId) redirect("/pick-startup");

  await liveblocks.getOrCreateRoom(roomId, { defaultAccesses: [] });

  const roomStorage: any = await liveblocks.getStorageDocument(roomId);

  if (Object.keys(roomStorage.data).length === 0) {
    await liveblocks.initializeStorageDocument(roomId, {
      liveblocksType: "LiveObject",
      data: {
        journeyNodes: { liveblocksType: "LiveList", data: [] },
        journeyEdges: { liveblocksType: "LiveList", data: [] },
      },
    });
  }

  // The storage document just read tells us, without a second round trip,
  // whether the card is already there — which it is on all but the first load.
  if (!hasStartupIdeaNode(roomStorage)) {
    await seedStartupIdeaNode(roomId, orgId);
  }
}

/** Whether a raw (plain-LSON) storage document already carries the card. */
function hasStartupIdeaNode(roomStorage: any): boolean {
  const nodes = roomStorage?.data?.journeyNodes?.data;
  if (!Array.isArray(nodes)) return false;
  return nodes.some((node: any) => node?.data?.type === "startup_idea");
}

/**
 * Put the single Startup Idea card into a room that doesn't have one yet, seeded
 * with this org's default text (blank when the org has no entry).
 *
 * Every org's room already existed before this card did, so seeding can't happen
 * at room-creation time alone — it has to be a check on load. It runs
 * server-side rather than from the canvas so two collaborators opening the page
 * at the same moment can't each push a card: the mutation reads and writes the
 * room's storage in one round trip, before anything renders. The membership test
 * is repeated inside that mutation because the read above can be stale — a
 * collaborator may have seeded it in between.
 *
 * It is a one-time write. Once the node exists — even emptied by the team — this
 * is a no-op, so a later edit to `STARTUP_IDEA_DEFAULTS` never overwrites text a
 * team has made their own.
 */
async function seedStartupIdeaNode(roomId: string, orgId: string) {
  try {
    await liveblocks.mutateStorage(roomId, ({ root }) => {
      const nodes = root.get("journeyNodes");
      if (!nodes) return;

      const alreadySeeded = nodes
        .toArray()
        .some((node: any) => node?.get?.("type") === "startup_idea");
      if (alreadySeeded) return;

      nodes.push(
        new LiveObject({
          id: `startup-idea-${orgId}`,
          type: "startup_idea",
          content: startupIdeaDefaultFor(orgId),
          stakeholderIds: [],
          problems: [],
          solutions: [],
          conclusions: [],
        } as any) as any
      );
    });
  } catch {
    // The card is an addition to the map, not a prerequisite for it — a storage
    // hiccup here shouldn't stop the journey page from rendering. The next load
    // tries again.
  }
}
