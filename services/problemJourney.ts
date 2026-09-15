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

  // A new room gets its Startup Idea card as part of initialization. Liveblocks
  // only accepts that on empty storage, so when two renders race one wins and
  // the other is refused — the card can't be pushed twice.
  if (Object.keys(roomStorage.data).length === 0) {
    try {
      await liveblocks.initializeStorageDocument(roomId, {
        liveblocksType: "LiveObject",
        data: {
          journeyNodes: {
            liveblocksType: "LiveList",
            data: [
              {
                liveblocksType: "LiveObject",
                data: buildStartupIdeaNode(orgId),
              },
            ],
          },
          journeyEdges: { liveblocksType: "LiveList", data: [] },
        },
      });
    } catch (error) {
      // Refused because a racing render initialized the room first, and that
      // one seeded the card. Anything else is real.
      const current: any = await liveblocks.getStorageDocument(roomId);
      if (Object.keys(current.data).length === 0) throw error;
    }
    return;
  }

  // The storage document just read tells us, without a second round trip,
  // whether the card is already there — which it is on all but the first load.
  const ideaCount = countStartupIdeaNodes(roomStorage);
  if (ideaCount === 0) {
    await seedStartupIdeaNode(roomId, orgId);
  } else if (ideaCount > 1) {
    await removeDuplicateStartupIdeaNodes(roomId);
  }
}

/** How many Startup Idea cards a raw (plain-LSON) storage document carries. */
function countStartupIdeaNodes(roomStorage: any): number {
  const nodes = roomStorage?.data?.journeyNodes?.data;
  if (!Array.isArray(nodes)) return 0;
  return nodes.filter((node: any) => node?.data?.type === "startup_idea").length;
}

function buildStartupIdeaNode(orgId: string) {
  return {
    id: `startup-idea-${orgId}`,
    type: "startup_idea",
    content: startupIdeaDefaultFor(orgId),
    stakeholderIds: [],
    problems: [],
    solutions: [],
    conclusions: [],
  };
}

/**
 * Put the single Startup Idea card into an existing room that doesn't have one
 * yet, seeded with this org's default text (blank when the org has no entry).
 * Rooms created before the card existed can only get it this way; new rooms get
 * it at initialization instead.
 *
 * `mutateStorage` is not a transaction — it edits a downloaded snapshot and
 * sends the ops — so two racing loads can each push a card despite the check
 * inside. That's why `removeDuplicateStartupIdeaNodes` runs on the next load.
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

      nodes.push(new LiveObject(buildStartupIdeaNode(orgId) as any) as any);
    });
  } catch {
    // The card is an addition to the map, not a prerequisite for it — a storage
    // hiccup here shouldn't stop the journey page from rendering. The next load
    // tries again.
  }
}

/**
 * Drop every Startup Idea card after the first. The copies share one id, and
 * the canvas's mutations look nodes up with `find`, so the first is the one that
 * holds the team's edits; the rest are the untouched seed. Deletes target list
 * items rather than positions, so two loads healing at once is harmless.
 */
async function removeDuplicateStartupIdeaNodes(roomId: string) {
  try {
    await liveblocks.mutateStorage(roomId, ({ root }) => {
      const nodes = root.get("journeyNodes");
      if (!nodes) return;

      const ideaIndexes = nodes
        .toArray()
        .flatMap((node: any, index: number) =>
          node?.get?.("type") === "startup_idea" ? [index] : []
        );

      // Back to front, so each delete leaves the earlier indexes valid.
      for (const index of ideaIndexes.slice(1).reverse()) {
        nodes.delete(index);
      }
    });
  } catch {
    // The canvas already ignores the extra copies; the next load tries again.
  }
}
