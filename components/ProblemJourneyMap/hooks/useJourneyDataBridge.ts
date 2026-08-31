'use client';

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useNodesState, useEdgesState, type Node, type Edge } from '@xyflow/react';

import type { JourneyNodeType, JourneyNodeData, JourneyEdgeData } from '../JourneyContext';
import type { Problem, Solution, ProblemQuestionAnswer, SolutionQuestionAnswer, NodeConclusion, ConclusionStatus, PainOrGain, RelieverOrCreator } from '../components/ActionNodeSheet';
import { useRealtimeJourney, type JourneyNodeStorage, type JourneyEdgeStorage } from './useRealtimeJourney';

const INITIAL_TRIGGER_ID = 'initial-trigger';

// Order-insensitive equality for the stakeholder id arrays synced between
// Liveblocks and React Flow node data.
function sameIds(a: number[] | undefined, b: number[] | undefined): boolean {
  const x = a ?? [];
  const y = b ?? [];
  if (x.length !== y.length) return false;
  const sortedX = [...x].sort((m, n) => m - n);
  const sortedY = [...y].sort((m, n) => m - n);
  return sortedX.every((v, i) => v === sortedY[i]);
}

// Branch label of an RF edge, normalised so a missing label and a cleared one
// compare equal against Liveblocks (both mean "fall back to Option n").
function labelOf(edge: Edge): string {
  return ((edge.data as unknown as JourneyEdgeData | undefined)?.label ?? '');
}

const INITIAL_TRIGGER_NODE: Node = {
  id: INITIAL_TRIGGER_ID,
  type: 'trigger',
  position: { x: 0, y: 0 },
  data: {
    id: INITIAL_TRIGGER_ID,
    type: 'trigger',
    content: '',
    stakeholderIds: [],
  } as unknown as Record<string, unknown>,
};

function colorForType(type: JourneyNodeType) {
  if (type === 'trigger') return '#EEF1FF';
  if (type === 'split_route') return '#FFF7ED';
  return '#ffffff';
}

function buildNodeStorage(id: string, type: JourneyNodeType): JourneyNodeStorage {
  return { id, type, content: '', stakeholderIds: [], problems: [], solutions: [], conclusions: [] };
}

function lbNodeToRFNode(lb: JourneyNodeStorage): Node {
  return {
    id: lb.id,
    type: lb.type,
    position: { x: 0, y: 0 },
    data: {
      id: lb.id,
      type: lb.type,
      content: lb.content,
      stakeholderIds: lb.stakeholderIds ?? [],
      color: colorForType(lb.type),
    } as unknown as Record<string, unknown>,
  };
}

function lbEdgeToRFEdge(lb: JourneyEdgeStorage): Edge {
  return {
    id: lb.id,
    source: lb.source,
    target: lb.target,
    type: 'journey',
    sourceHandle: lb.sourceHandle,
    targetHandle: lb.targetHandle,
    data: { label: lb.label } as unknown as Record<string, unknown>,
  };
}

export function useJourneyDataBridge() {
  const {
    lbNodes,
    lbEdges,
    addJourneyNode,
    addJourneyEdge,
    updateJourneyEdge,
    updateJourneyNode,
    softDeleteJourneyNode,
    reparentJourneyEdges,
    addProblem: lbAddProblem,
    updateProblem: lbUpdateProblem,
    removeProblem: lbRemoveProblem,
    saveSolution: lbSaveSolution,
    upsertConclusion: lbUpsertConclusion,
  } = useRealtimeJourney();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Logically deleted nodes stay in storage; everything downstream reads these
  // filtered views instead. An edge is dropped when either endpoint is gone,
  // which is why a delete never has to touch the edge list itself.
  const visibleNodes = useMemo(
    () => (lbNodes ?? []).filter((n) => !n.deletedAt),
    [lbNodes]
  );

  const visibleEdges = useMemo(() => {
    const live = new Set(visibleNodes.map((n) => n.id));
    return (lbEdges ?? []).filter((e) => live.has(e.source) && live.has(e.target));
  }, [lbEdges, visibleNodes]);

  const initializedRef = useRef(false);

  // Id of a node the user just created locally, so useLayout can center the
  // viewport on it after the next relayout (instead of snapping back to root).
  // Only local adds set this — remote/Liveblocks additions leave it null so a
  // collaborator's edit never yanks this user's viewport.
  const pendingFocusRef = useRef<string | null>(null);

  // Diff-based Liveblocks → React Flow sync (blink-free)
  useEffect(() => {
    if (lbNodes === null || lbEdges === null) return;

    if (!initializedRef.current) {
      initializedRef.current = true;

      // Seeding is decided on the raw list, not the visible one: a room whose
      // nodes were all deleted must stay empty rather than push a second
      // 'initial-trigger' that would collide with the deleted one by id.
      if (lbNodes.length > 0) {
        setNodes(visibleNodes.map(lbNodeToRFNode));
        setEdges(visibleEdges.map(lbEdgeToRFEdge));
      } else {
        setNodes([INITIAL_TRIGGER_NODE]);
        addJourneyNode(buildNodeStorage(INITIAL_TRIGGER_ID, 'trigger'));
      }
      return;
    }

    setNodes((currentNodes) => {
      const currentIds = new Set(currentNodes.map((n) => n.id));
      const lbIds = new Set(visibleNodes.map((lb) => lb.id));

      const remoteAdditions = visibleNodes
        .filter((lb) => !currentIds.has(lb.id))
        .map(lbNodeToRFNode);

      const removedIds = new Set(
        currentNodes.filter((n) => !lbIds.has(n.id)).map((n) => n.id)
      );

      if (remoteAdditions.length === 0 && removedIds.size === 0) {
        const hasDataChange = visibleNodes.some((lb) => {
          const rf = currentNodes.find((n) => n.id === lb.id);
          if (!rf) return false;
          const data = rf.data as unknown as JourneyNodeData;
          return data.content !== lb.content || !sameIds(data.stakeholderIds, lb.stakeholderIds);
        });
        if (!hasDataChange) return currentNodes;

        return currentNodes.map((n) => {
          const lb = visibleNodes.find((lb) => lb.id === n.id);
          if (!lb) return n;
          const data = n.data as unknown as JourneyNodeData;
          if (data.content === lb.content && sameIds(data.stakeholderIds, lb.stakeholderIds)) return n;
          return { ...n, data: { ...n.data, content: lb.content, stakeholderIds: lb.stakeholderIds ?? [] } as unknown as Record<string, unknown> };
        });
      }

      let result = currentNodes.filter((n) => !removedIds.has(n.id));
      result = [...result, ...remoteAdditions];
      return result;
    });

    setEdges((currentEdges) => {
      const currentIds = new Set(currentEdges.map((e) => e.id));
      const lbIds = new Set(visibleEdges.map((e) => e.id));

      const remoteAdditions = visibleEdges
        .filter((lb) => !currentIds.has(lb.id))
        .map(lbEdgeToRFEdge);

      const removedIds = new Set(
        currentEdges.filter((e) => !lbIds.has(e.id)).map((e) => e.id)
      );

      if (remoteAdditions.length === 0 && removedIds.size === 0) {
        // No edge came or went, so what can still differ on an edge already here
        // is its branch label or its endpoints — a delete in the middle of a
        // chain re-points the children's edges onto the deleted node's parent
        // without changing any id. Return the same array reference when nothing
        // changed: that identity is what keeps the canvas from blinking on
        // every sync tick.
        const hasDataChange = visibleEdges.some((lb) => {
          const rf = currentEdges.find((e) => e.id === lb.id);
          if (!rf) return false;
          return (
            labelOf(rf) !== (lb.label ?? '') ||
            rf.source !== lb.source ||
            rf.target !== lb.target
          );
        });
        if (!hasDataChange) return currentEdges;

        return currentEdges.map((e) => {
          const lb = visibleEdges.find((lb) => lb.id === e.id);
          if (!lb) return e;
          if (
            labelOf(e) === (lb.label ?? '') &&
            e.source === lb.source &&
            e.target === lb.target
          ) {
            return e;
          }
          return {
            ...e,
            source: lb.source,
            target: lb.target,
            data: { ...e.data, label: lb.label } as unknown as Record<string, unknown>,
          };
        });
      }

      let result = currentEdges.filter((e) => !removedIds.has(e.id));
      result = [...result, ...remoteAdditions];
      return result;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNodes, visibleEdges]);

  const addTriggerNode = useCallback(() => {
    const newId = crypto.randomUUID();
    pendingFocusRef.current = newId;
    setNodes((current) => [
      ...current,
      {
        id: newId,
        type: 'trigger',
        position: { x: 0, y: 0 },
        data: {
          id: newId,
          type: 'trigger',
          content: '',
          stakeholderIds: [],
        } as unknown as Record<string, unknown>,
      },
    ]);
    addJourneyNode(buildNodeStorage(newId, 'trigger'));
  }, [setNodes, addJourneyNode]);

  const addChildNode = useCallback(
    (parentId: string, type: JourneyNodeType) => {
      const newId = crypto.randomUUID();
      const connId = crypto.randomUUID();
      pendingFocusRef.current = newId;

      setNodes((current) => {
        const parent = current.find((n) => n.id === parentId);
        const pos = parent
          ? { x: parent.position.x + 340, y: parent.position.y }
          : { x: 0, y: 0 };
        return [
          ...current,
          {
            id: newId,
            type,
            position: pos,
            data: {
              id: newId,
              type,
              content: '',
              stakeholderIds: [],
              color: colorForType(type),
            } as unknown as Record<string, unknown>,
          },
        ];
      });

      setEdges((current) => [
        ...current,
        {
          id: connId,
          source: parentId,
          target: newId,
          type: 'journey',
          sourceHandle: 'right',
          targetHandle: 'left',
        },
      ]);

      addJourneyNode(buildNodeStorage(newId, type));
      addJourneyEdge({ id: connId, source: parentId, target: newId, sourceHandle: 'right', targetHandle: 'left' });
    },
    [setNodes, setEdges, addJourneyNode, addJourneyEdge]
  );

  // Who hangs off whom, and who each node hangs off. The graph is a tree, so a
  // node has at most one parent.
  const childCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of visibleEdges) map.set(e.source, (map.get(e.source) ?? 0) + 1);
    return map;
  }, [visibleEdges]);

  const parentOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of visibleEdges) map.set(e.target, e.source);
    return map;
  }, [visibleEdges]);

  const childCount = useCallback(
    (nodeId: string) => childCounts.get(nodeId) ?? 0,
    [childCounts]
  );

  // What the delete affordance on each card is gated on. A childless card can
  // always go. A card with children can go too — its children move up to its
  // parent — except in two cases that would leave the map worse off:
  //
  //   • no parent to move them to: the head of a chain keeps everything below it
  //   • a Scenarios card: its children *are* its branches, and reparenting them
  //     would spread the fork onto a card that isn't a fork
  const canDeleteNode = useCallback(
    (nodeId: string) => {
      if (childCount(nodeId) === 0) return true;
      if (!parentOf.has(nodeId)) return false;
      const type = visibleNodes.find((n) => n.id === nodeId)?.type;
      return type !== 'split_route';
    },
    [childCount, parentOf, visibleNodes]
  );

  // Logical delete. Locally the node goes right away: the edge that hung it off
  // its parent is dropped, and every edge leaving it is re-pointed at that parent
  // so its children close the gap rather than disappearing with it. Storage gets
  // the same two writes — reparent first, then the delete marker — and
  // collaborators pick both up through the usual diff sync.
  const deleteNode = useCallback(
    (nodeId: string) => {
      const parentId = parentOf.get(nodeId) ?? null;

      setNodes((current) => current.filter((n) => n.id !== nodeId));
      setEdges((current) => {
        if (!parentId) {
          return current.filter((e) => e.source !== nodeId && e.target !== nodeId);
        }
        return current
          .filter((e) => e.target !== nodeId)
          .map((e) => (e.source === nodeId ? { ...e, source: parentId } : e));
      });

      if (parentId) reparentJourneyEdges(nodeId, parentId);
      softDeleteJourneyNode(nodeId);
    },
    [setNodes, setEdges, parentOf, reparentJourneyEdges, softDeleteJourneyNode]
  );

  const updateNodeData = useCallback(
    (id: string, patch: Partial<Omit<JourneyNodeData, 'id' | 'type'>>) => {
      setNodes((current) =>
        current.map((n) =>
          n.id === id
            ? { ...n, data: { ...n.data, ...patch } as unknown as Record<string, unknown> }
            : n
        )
      );
      updateJourneyNode(id, patch);
    },
    [setNodes, updateJourneyNode]
  );

  const updateEdgeLabel = useCallback(
    (edgeId: string, label: string) => {
      setEdges((current) =>
        current.map((e) =>
          e.id === edgeId
            ? { ...e, data: { ...e.data, label } as unknown as Record<string, unknown> }
            : e
        )
      );
      updateJourneyEdge(edgeId, label);
    },
    [setEdges, updateJourneyEdge]
  );

  // Upsert a specific problem: update it when a target id is given, otherwise
  // create a new one and return its id so the caller can keep the sheet on it.
  const saveProblem = useCallback(
    (
      nodeId: string,
      problemId: string | null,
      description: string,
      type: string,
      painOrGain: PainOrGain,
      questions: ProblemQuestionAnswer[]
    ): string => {
      if (problemId) {
        lbUpdateProblem(nodeId, problemId, {
          description,
          type,
          painOrGain,
          questions,
        });
        return problemId;
      }
      const newId = crypto.randomUUID();
      lbAddProblem(nodeId, {
        id: newId,
        description,
        type,
        painOrGain,
        questions,
      });
      return newId;
    },
    [lbAddProblem, lbUpdateProblem]
  );

  // Append a blank problem and return its id. Backs the "Add a problem" button:
  // create-then-open, so the sheet lands on the new problem immediately.
  const addEmptyProblem = useCallback(
    (nodeId: string): string => {
      const newId = crypto.randomUUID();
      lbAddProblem(nodeId, {
        id: newId,
        description: '',
        type: '',
        painOrGain: 'pain',
        questions: [],
      });
      return newId;
    },
    [lbAddProblem]
  );

  const removeProblem = useCallback(
    (nodeId: string, problemId: string) => {
      lbRemoveProblem(nodeId, problemId);
    },
    [lbRemoveProblem]
  );

  // Per-problem solution upsert: reuse the existing solution's id for this
  // problem when there is one so edits don't churn it.
  const saveSolution = useCallback(
    (
      nodeId: string,
      problemId: string,
      description: string,
      type: string,
      relieverOrCreator: RelieverOrCreator,
      questions: SolutionQuestionAnswer[]
    ) => {
      const existing = solutionForProblem(nodeId, problemId);
      lbSaveSolution(nodeId, {
        id: existing?.id ?? crypto.randomUUID(),
        problemId,
        description,
        type,
        relieverOrCreator,
        questions,
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [lbSaveSolution, lbNodes]
  );

  const nodeProblems = useMemo(() => {
    const map = new Map<string, Problem[]>();
    for (const lb of visibleNodes) {
      map.set(
        lb.id,
        (lb.problems ?? []).map((p) => ({
          id: p.id,
          description: p.description,
          type: p.type ?? '',
          painOrGain: (p.painOrGain ?? 'pain') as PainOrGain,
          questions: (p.questions ?? []).map((q) => ({
            bankQuestionId: q.bankQuestionId,
            answer: q.answer,
            source: q.source ?? '',
            confidence: q.confidence ?? 0,
            isHypothesis: q.isHypothesis ?? false,
          })),
        }))
      );
    }
    return map;
  }, [visibleNodes]);

  const nodeSolutions = useMemo(() => {
    const map = new Map<string, Solution[]>();
    for (const lb of visibleNodes) {
      map.set(
        lb.id,
        (lb.solutions ?? []).map((s) => ({
          id: s.id,
          problemId: s.problemId,
          description: s.description,
          type: s.type ?? '',
          relieverOrCreator: (s.relieverOrCreator ?? 'reliever') as RelieverOrCreator,
          questions: (s.questions ?? []).map((q) => ({
            bankQuestionId: q.bankQuestionId,
            answer: q.answer,
            source: q.source ?? '',
            confidence: q.confidence ?? 0,
          })),
        }))
      );
    }
    return map;
  }, [visibleNodes]);

  // Find a problem's solution. Falls back to a legacy node-scoped solution (no
  // problemId) when the requested problem is the node's first — those were
  // written before solutions were per-problem.
  const solutionForProblem = useCallback(
    (nodeId: string, problemId: string): Solution | null => {
      const solutions = nodeSolutions.get(nodeId) ?? [];
      const direct = solutions.find((s) => s.problemId === problemId);
      if (direct) return direct;
      const isFirstProblem = nodeProblems.get(nodeId)?.[0]?.id === problemId;
      if (isFirstProblem) {
        return solutions.find((s) => s.problemId === undefined) ?? null;
      }
      return null;
    },
    [nodeSolutions, nodeProblems]
  );

  const nodeConclusions = useMemo(() => {
    const map = new Map<string, NodeConclusion[]>();
    for (const lb of visibleNodes) {
      map.set(lb.id, lb.conclusions ?? []);
    }
    return map;
  }, [visibleNodes]);

  const upsertConclusion = useCallback(
    (nodeId: string, id: string, status: ConclusionStatus, content: string) => {
      lbUpsertConclusion(nodeId, { id, status, content });
    },
    [lbUpsertConclusion]
  );

  return {
    nodes,
    edges,
    setNodes,
    pendingFocusRef,
    onNodesChange,
    onEdgesChange,
    addTriggerNode,
    addChildNode,
    canDeleteNode,
    childCount,
    deleteNode,
    updateNodeData,
    updateEdgeLabel,
    saveProblem,
    addEmptyProblem,
    removeProblem,
    saveSolution,
    nodeProblems,
    nodeSolutions,
    solutionForProblem,
    nodeConclusions,
    upsertConclusion,
  };
}
