"use client";

// Adapted from .claude/examples/react-flow/dynamic-layouting-pro-example/src/hooks/useLayout.ts
// Change from the original: x ↔ y are swapped so the tree grows left-to-right instead of top-to-bottom.
// Extended: both vertical and horizontal spacing are computed from each node's actual measured
// dimensions so nodes with dynamic content (problems / solutions) never overlap, and wider nodes
// at any level naturally push their children further right.

import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import {
  useReactFlow,
  useStore,
  type Node,
  type Edge,
  type ReactFlowState,
  type XYPosition,
} from "@xyflow/react";
import { stratify, tree, type HierarchyPointNode } from "d3-hierarchy";
import { timer } from "d3-timer";

const HORIZONTAL_GAP = 200; // px between the right edge of a node and its children's left edge
const VERTICAL_GAP = 40; // px gap between siblings (top ↔ bottom)
const TREE_GAP = 80; // px gap between separate trigger chains
const ANIMATION_DURATION = 300;
const INITIAL_ZOOM = 0.85; // fixed comfortable zoom instead of fitting the whole tree
const INITIAL_LEFT_MARGIN = 0.1; // on first load the root's left edge sits this far (× viewport width) from the left

function nodeHeight(n: Node): number {
  return n.measured?.height ?? 120;
}

function nodeWidth(n: Node): number {
  return n.measured?.width ?? 370;
}

// Total vertical space a subtree needs (including the root node of that subtree).
function subtreeHeight(d: HierarchyPointNode<Node>): number {
  if (!d.children || d.children.length === 0) return nodeHeight(d.data);
  const childrenTotal =
    d.children.reduce((sum, c) => sum + subtreeHeight(c), 0) +
    VERTICAL_GAP * (d.children.length - 1);
  return Math.max(nodeHeight(d.data), childrenTotal);
}

// Assign d.x (breadth → RF position.y) for every node in the subtree,
// centering each parent over its children and stacking siblings without overlap.
function assignVertical(d: HierarchyPointNode<Node>, topY: number): void {
  if (!d.children || d.children.length === 0) {
    d.x = topY + nodeHeight(d.data) / 2;
    return;
  }

  const childrenTotalH =
    d.children.reduce((sum, c) => sum + subtreeHeight(c), 0) +
    VERTICAL_GAP * (d.children.length - 1);
  const totalH = Math.max(nodeHeight(d.data), childrenTotalH);

  d.x = topY + totalH / 2;

  let childTopY = topY + (totalH - childrenTotalH) / 2;
  for (const child of d.children) {
    assignVertical(child, childTopY);
    childTopY += subtreeHeight(child) + VERTICAL_GAP;
  }
}

// Assign d.y (depth → RF position.x) based on each parent's actual measured width.
// This replaces d3's fixed nodeSize depth spacing so wider nodes push children further right.
function assignHorizontal(d: HierarchyPointNode<Node>, leftX: number): void {
  d.y = leftX;
  if (d.children) {
    const nextLeft = leftX + nodeWidth(d.data) + HORIZONTAL_GAP;
    for (const child of d.children) {
      assignHorizontal(child, nextLeft);
    }
  }
}

function layoutNodes(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return [];

  const hierarchy = stratify<Node>()
    .id((d) => d.id)
    .parentId((d) => edges.find((e) => e.target === d.id)?.source)(nodes);

  // Use d3 tree only to build parent/child relationships and compute depth level.
  // Both horizontal (d.y) and vertical (d.x) positions are overridden below using
  // actual measured dimensions, so the nodeSize values here don't affect output.
  const treeLayout = tree<Node>()
    .nodeSize([1, 1])
    .separation(() => 1);
  const root = treeLayout(hierarchy);

  // Override horizontal positions: each node starts just right of its parent's edge.
  assignHorizontal(root, 0);

  // Override vertical positions: stack siblings using their real measured heights.
  const rootH = subtreeHeight(root);
  assignVertical(root, -rootH / 2);

  // d.y = left edge x  → RF position.x
  // d.x = center y     → RF position.y = top-left (subtract half-height)
  return root.descendants().map((d) => ({
    ...d.data,
    position: { x: d.y, y: d.x - nodeHeight(d.data) / 2 },
  }));
}

function getSubtree(
  allNodes: Node[],
  allEdges: Edge[],
  rootId: string,
): { nodes: Node[]; edges: Edge[] } {
  const visited = new Set<string>([rootId]);
  const queue = [rootId];
  while (queue.length > 0) {
    const id = queue.shift()!;
    for (const edge of allEdges) {
      if (edge.source === id && !visited.has(edge.target)) {
        visited.add(edge.target);
        queue.push(edge.target);
      }
    }
  }
  return {
    nodes: allNodes.filter((n) => visited.has(n.id)),
    edges: allEdges.filter((e) => visited.has(e.source) && visited.has(e.target)),
  };
}

function layoutForest(nodes: Node[], edges: Edge[]): Node[] {
  if (nodes.length === 0) return [];

  const targetIds = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !targetIds.has(n.id));

  // Single root: delegate to existing logic (preserves current behaviour exactly).
  if (roots.length <= 1) return layoutNodes(nodes, edges);

  // Multiple roots: layout each subtree independently and stack vertically.
  let verticalOffset = 0;
  const result: Node[] = [];

  for (const root of roots) {
    const { nodes: subtreeNodes, edges: subtreeEdges } = getSubtree(nodes, edges, root.id);

    const hierarchy = stratify<Node>()
      .id((d) => d.id)
      .parentId((d) => subtreeEdges.find((e) => e.target === d.id)?.source)(subtreeNodes);

    const treeLayout = tree<Node>().nodeSize([1, 1]).separation(() => 1);
    const rootNode = treeLayout(hierarchy);

    assignHorizontal(rootNode, 0);
    const treeH = subtreeHeight(rootNode);
    assignVertical(rootNode, verticalOffset);

    result.push(
      ...rootNode.descendants().map((d) => ({
        ...d.data,
        position: { x: d.y, y: d.x - nodeHeight(d.data) / 2 },
      })),
    );

    verticalOffset += treeH + TREE_GAP;
  }

  return result;
}

// Re-run when node/edge count changes OR when total measured dimensions change
// (i.e. a node grew because problems/solutions were added, or its width changed).
const nodeCountSelector = (state: ReactFlowState) => state.nodeLookup.size;
const edgeCountSelector = (state: ReactFlowState) => state.edges.length;
const totalHeightSelector = (state: ReactFlowState) =>
  [...state.nodeLookup.values()].reduce(
    (sum, n) => sum + (n.measured?.height ?? 0),
    0,
  );
const totalWidthSelector = (state: ReactFlowState) =>
  [...state.nodeLookup.values()].reduce(
    (sum, n) => sum + (n.measured?.width ?? 0),
    0,
  );
const viewportWidthSelector = (state: ReactFlowState) => state.width;

// setNodesState: when ReactFlow is in controlled mode, pass the useNodesState setter here
// so layout positions are written to the controlled state (not just the internal RF store,
// which gets overwritten on every re-render in controlled mode).
export function useLayout(
  setNodesState?: Dispatch<SetStateAction<Node[]>>,
  // Id of a node the user just added; when set, the viewport centers on it after
  // the relayout instead of snapping to the root. Plain ref shape to stay
  // agnostic to the RefObject/MutableRefObject type across React versions.
  pendingFocusRef?: { current: string | null },
) {
  const nodeCount = useStore(nodeCountSelector);
  const edgeCount = useStore(edgeCountSelector);
  const totalHeight = useStore(totalHeightSelector);
  const totalWidth = useStore(totalWidthSelector);
  const viewportWidth = useStore(viewportWidthSelector);
  const {
    getNodes,
    getNode,
    setNodes: setNodesInternal,
    getEdges,
    setCenter,
  } = useReactFlow();
  const setNodes = (setNodesState ??
    setNodesInternal) as typeof setNodesInternal;

  // Whether we've done the one-time center-on-root that happens on initial load.
  const hasInitialCenteredRef = useRef(false);

  // The layout effect only re-runs on node/edge changes, so keep the latest
  // container width in a ref for the initial placement math below.
  const viewportWidthRef = useRef(viewportWidth);
  useEffect(() => {
    viewportWidthRef.current = viewportWidth;
  }, [viewportWidth]);

  useEffect(() => {
    const nodes = getNodes();
    const edges = getEdges();

    if (nodes.length === 0) return;

    let targetNodes: Node[];
    try {
      targetNodes = layoutForest(nodes, edges);
    } catch {
      // stratify throws if the graph isn't a valid tree (e.g. multiple roots
      // during a transient state while Liveblocks is syncing). Skip this tick.
      return;
    }

    const transitions = targetNodes.map((node) => ({
      id: node.id,
      from: getNode(node.id)?.position ?? node.position,
      to: node.position,
    }));

    // Each frame writes *only* positions, onto whatever the nodes hold right
    // then. Writing the laid-out nodes wholesale would pin every node's data to
    // the snapshot taken when the animation started — and a card grows (and so
    // relayouts) the moment its text wraps a line, so anything typed during the
    // next 300ms would be reverted keystroke by keystroke.
    const applyPositions = (at: (t: (typeof transitions)[number]) => XYPosition) =>
      setNodes((current) => {
        const positions = new Map<string, XYPosition>(
          transitions.map((t) => [t.id, at(t)]),
        );
        return current.map((n) => {
          const position = positions.get(n.id);
          return position ? { ...n, position } : n;
        });
      });

    const t = timer((elapsed: number) => {
      const s = Math.min(elapsed / ANIMATION_DURATION, 1);

      applyPositions(({ from, to }) => ({
        x: from.x + (to.x - from.x) * s,
        y: from.y + (to.y - from.y) * s,
      }));

      if (elapsed >= ANIMATION_DURATION) {
        applyPositions(({ to }) => to);
        t.stop();

        const centerOn = (node: Node) =>
          setCenter(
            node.position.x + nodeWidth(node) / 2,
            node.position.y + nodeHeight(node) / 2,
            { zoom: INITIAL_ZOOM, duration: 200 },
          );

        // Initial load: instead of centering the root, park its left edge near
        // the left edge of the viewport so the tree — which grows to the right —
        // fills the screen instead of leaving the left half empty.
        // Screen x of a flow point is `fx * zoom + tx`. Requiring the root's left
        // edge to land at `MARGIN * width` gives a viewport center of
        // `rootX + (0.5 - MARGIN) * width / zoom`.
        const placeLeftAligned = (node: Node) => {
          const width = viewportWidthRef.current;
          if (!width) {
            centerOn(node);
            return;
          }
          setCenter(
            node.position.x +
              ((0.5 - INITIAL_LEFT_MARGIN) * width) / INITIAL_ZOOM,
            node.position.y + nodeHeight(node) / 2,
            { zoom: INITIAL_ZOOM, duration: 200 },
          );
        };

        const focusId = pendingFocusRef?.current ?? null;
        if (focusId) {
          // User just added a node locally → center on it.
          const focusNode = targetNodes.find((n) => n.id === focusId);
          if (focusNode) {
            centerOn(focusNode);
            if (pendingFocusRef) pendingFocusRef.current = null;
            hasInitialCenteredRef.current = true;
          }
          // If the new node isn't in this layout pass yet (transient sync state),
          // leave the ref set so a later tick centers on it.
        } else if (!hasInitialCenteredRef.current) {
          // First load → root sits near the left edge, tree extends right.
          placeLeftAligned(targetNodes[0]);
          hasInitialCenteredRef.current = true;
        }
        // Otherwise this is a resize/content-edit or a remote add → leave the
        // viewport where the user left it.
      }
    });

    return () => t.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeCount, edgeCount, totalHeight, totalWidth]);
}
