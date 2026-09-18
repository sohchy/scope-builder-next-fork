import type { Edge } from '@xyflow/react';

import type { JourneyNodeType } from '../JourneyContext';

/**
 * Deleting cards is the one operation on this canvas that can corrupt the tree,
 * so the graph maths lives here — no React, no Liveblocks, nothing to mock.
 *
 * The rule the whole module exists to enforce: a card that goes away hands its
 * children to the nearest ancestor that *stays*. With one card that's just "its
 * parent". With several, the parent may be going away too, so the answer is a
 * walk rather than a lookup — and getting it wrong leaves an edge pointing at a
 * deleted node, which `useLayout` cannot lay out (see `planDeletion`).
 */

/** Read-only view of the journey tree, built once per render by the data bridge. */
export interface GraphView {
  /** target → source. The graph is a tree, so a node has at most one parent. */
  parentOf: ReadonlyMap<string, string>;
  /** source → targets. */
  childrenOf: ReadonlyMap<string, readonly string[]>;
  /** Type of a live node, or undefined if it isn't on the canvas (any more). */
  typeOf: (nodeId: string) => JourneyNodeType | undefined;
}

export interface DeletionPlan {
  /** Ids actually being removed — the requested set minus anything undeletable. */
  deleted: Set<string>;
  /** The full edge list after the delete, ready to hand to `setEdges`. */
  keptEdges: Edge[];
  /** Edges whose source moved, for the Liveblocks write. */
  reparents: Array<{ id: string; source: string }>;
}

/**
 * The nearest ancestor of `nodeId` that isn't itself being deleted, or null when
 * there is none (the node is about to become a root).
 *
 * The loop — rather than a single `parentOf.get()` — is what makes deleting
 * adjacent cards safe: with A → B → C → D and both B and C going, D's edge has to
 * land on A, not on C.
 */
export function survivingAncestor(
  nodeId: string,
  parentOf: GraphView['parentOf'],
  deleted: ReadonlySet<string>,
): string | null {
  // Storage is shared and eventually consistent, so a malformed graph is
  // possible in principle. Walking it must never hang the UI thread.
  const seen = new Set<string>([nodeId]);
  let current = parentOf.get(nodeId) ?? null;
  while (current !== null && deleted.has(current)) {
    if (seen.has(current)) return null;
    seen.add(current);
    current = parentOf.get(current) ?? null;
  }
  return current;
}

/**
 * Work out the whole delete up front: which cards go, what the edge list looks
 * like afterwards, and which edges storage has to re-point.
 *
 * Returns null when nothing would be deleted.
 *
 * Three invariants hold on `keptEdges`, and `useLayout` depends on every one:
 *
 *   • No edge touches a deleted node. A dangling edge is worse than it sounds —
 *     `layoutForest` builds its root set as "every node that is nobody's target",
 *     so a node whose only incoming edge dangles is neither a root nor reachable
 *     from one. It drops out of the layout pass entirely and freezes at its old
 *     position, and `stratify` can throw, which skips the tick for every card.
 *   • No node gains a second parent — targets are never rewritten, and each
 *     target had at most one incoming edge to begin with. The tree stays a tree.
 *   • Untouched edges are kept by reference, so the array the Liveblocks sync
 *     later compares against is identical where nothing changed. That identity is
 *     what keeps the canvas from blinking.
 */
export function planDeletion(
  ids: readonly string[],
  view: GraphView,
  edges: readonly Edge[],
): DeletionPlan | null {
  const deleted = new Set(
    ids.filter((id) => {
      const type = view.typeOf(id);
      // An id that no longer resolves was deleted by a collaborator mid-flight;
      // the Startup Idea card isn't part of the tree and has no delete path.
      return type !== undefined && type !== 'startup_idea';
    }),
  );
  if (deleted.size === 0) return null;

  const keptEdges: Edge[] = [];
  const reparents: Array<{ id: string; source: string }> = [];

  for (const edge of edges) {
    // The edge that hung a deleted card off its parent goes with it.
    if (deleted.has(edge.target)) continue;

    if (!deleted.has(edge.source)) {
      keptEdges.push(edge);
      continue;
    }

    const source = survivingAncestor(edge.source, view.parentOf, deleted);
    // Nothing left to hang this child on: drop the edge and let it become a root
    // of its own. Normally unreachable — `canDeleteSelection` refuses a set that
    // would orphan anything — but a collaborator can add a child while the
    // confirmation dialog is open.
    if (source === null) continue;
    if (source === edge.target) continue;

    keptEdges.push({ ...edge, source });
    reparents.push({ id: edge.id, source });
  }

  return { deleted, keptEdges, reparents };
}

/**
 * Whether a set of cards can be deleted together.
 *
 * The single-card rules still hold, but they're evaluated against what *survives*
 * the delete rather than against the card alone, so a block lifts when whatever
 * was blocking it is in the selection too:
 *
 *   • the head of a chain keeps its children — unless they're going as well
 *   • a Scenarios card is its branches — unless the branches are going as well
 *
 * With one id this reduces to exactly the old rule: a childless card can go, a
 * Scenarios card with branches can't, and a card whose children have nowhere to
 * move can't either.
 */
export function canDeleteSelection(
  ids: readonly string[],
  view: GraphView,
): boolean {
  if (ids.length === 0) return false;

  const set = new Set(ids);
  for (const id of set) {
    const type = view.typeOf(id);
    if (type === undefined || type === 'startup_idea') return false;
  }

  for (const id of set) {
    const orphans = (view.childrenOf.get(id) ?? []).filter((c) => !set.has(c));
    if (orphans.length === 0) continue;
    if (view.typeOf(id) === 'split_route') return false;
    if (survivingAncestor(id, view.parentOf, set) === null) return false;
  }

  return true;
}
