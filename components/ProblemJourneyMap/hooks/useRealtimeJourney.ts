'use client';

import { useStorage, useMutation } from '@liveblocks/react/suspense';
import { LiveObject } from '@liveblocks/client';
import type { JourneyNodeStorage, JourneyEdgeStorage } from '@/liveblocks.config';
import type { ProblemQuestionAnswer, SolutionQuestionAnswer, NodeConclusion, PainOrGain, RelieverOrCreator } from '../components/ActionNodeSheet';

export type { JourneyNodeStorage, JourneyEdgeStorage };

export function useRealtimeJourney() {
  const lbNodes = useStorage(
    (root) => root.journeyNodes as unknown as readonly JourneyNodeStorage[]
  );
  const lbEdges = useStorage(
    (root) => root.journeyEdges as unknown as readonly JourneyEdgeStorage[]
  );

  const addJourneyNode = useMutation(({ storage }, node: JourneyNodeStorage) => {
    (storage.get('journeyNodes') as any).push(new LiveObject(node as any));
  }, []);

  const addJourneyEdge = useMutation(({ storage }, edge: JourneyEdgeStorage) => {
    (storage.get('journeyEdges') as any).push(new LiveObject(edge as any));
  }, []);

  // Rename a branch connection. An empty string clears the custom label so the
  // edge falls back to the derived "Option n".
  const updateJourneyEdge = useMutation(({ storage }, id: string, label: string) => {
    const edges = (storage.get('journeyEdges') as any).toArray() as Array<any>;
    const edge = edges.find((e: any) => e.get('id') === id);
    if (edge) edge.update({ label });
  }, []);

  const updateJourneyNode = useMutation(
    (
      { storage },
      id: string,
      patch: Partial<Omit<JourneyNodeStorage, 'id' | 'type'>>
    ) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === id);
      if (node) node.update(patch);
    },
    []
  );

  // Logical delete of one or more cards. The nodes keep all of their data and
  // stay in storage, they just stop being read. The edge that pointed at a
  // deleted node is left alone — readers drop any edge whose endpoint is gone.
  //
  // `reparents` is the list of edges whose source has to move so the deleted
  // cards' children close the gap instead of disappearing with them. The caller
  // resolves each new source (see `planDeletion`) rather than passing a from/to
  // pair, because with several cards going at once a child's new parent may be
  // several steps up — and re-pointing it at a node that is itself being deleted
  // would leave the tree unlayoutable. Edges keep their ids, so a branch that was
  // renamed keeps its label under the new parent.
  //
  // One mutation, so collaborators receive the reparenting and the delete markers
  // together and never observe a half-applied graph.
  const deleteJourneyNodes = useMutation(
    (
      { storage },
      ids: string[],
      reparents: Array<{ id: string; source: string }>
    ) => {
      const edges = (storage.get('journeyEdges') as any).toArray() as Array<any>;
      for (const { id, source } of reparents) {
        const edge = edges.find((e: any) => e.get('id') === id);
        if (edge) edge.update({ source });
      }

      const deletedAt = new Date().toISOString();
      const targets = new Set(ids);
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      // Marks *every* node carrying a deleted id rather than the first match: a
      // racing server seed can leave two cards sharing one id, and a survivor
      // would reappear on the next sync.
      for (const node of nodes) {
        if (targets.has(node.get('id'))) node.update({ deletedAt });
      }
    },
    []
  );

  const addProblem = useMutation(
    (
      { storage },
      nodeId: string,
      problem: {
        id: string;
        description: string;
        type: string;
        painOrGain: PainOrGain;
        questions: ProblemQuestionAnswer[];
      }
    ) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === nodeId);
      if (node) {
        const current: Array<typeof problem> = node.get('problems') ?? [];
        node.update({ problems: [...current, problem] });
      }
    },
    []
  );

  const updateProblem = useMutation(
    (
      { storage },
      nodeId: string,
      problemId: string,
      patch: {
        description: string;
        type: string;
        painOrGain: PainOrGain;
        questions: ProblemQuestionAnswer[];
      }
    ) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === nodeId);
      if (node) {
        const current: Array<{ id: string } & typeof patch> =
          node.get('problems') ?? [];
        const updated = current.map((p) =>
          p.id === problemId ? { ...p, ...patch } : p
        );
        node.update({ problems: updated });
      }
    },
    []
  );

  // One solution per problem: upsert into the node's solutions list keyed by
  // `problemId`. Legacy solutions with no `problemId` are treated as the first
  // problem's, so the first upsert for that problem adopts the existing entry.
  const saveSolution = useMutation(
    (
      { storage },
      nodeId: string,
      solution: {
        id: string;
        problemId: string;
        description: string;
        type: string;
        relieverOrCreator: RelieverOrCreator;
        questions: SolutionQuestionAnswer[];
      }
    ) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === nodeId);
      if (!node) return;
      const current: Array<{ id: string; problemId?: string } & Record<string, unknown>> =
        node.get('solutions') ?? [];
      const exists = current.some((s) => s.problemId === solution.problemId);
      node.update({
        solutions: exists
          ? current.map((s) =>
              s.problemId === solution.problemId ? solution : s
            )
          : [...current, solution],
      });
    },
    []
  );

  const removeProblem = useMutation(
    ({ storage }, nodeId: string, problemId: string) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === nodeId);
      if (!node) return;
      const problems: Array<{ id: string }> = node.get('problems') ?? [];
      const solutions: Array<{ problemId?: string }> = node.get('solutions') ?? [];
      node.update({
        problems: problems.filter((p) => p.id !== problemId),
        solutions: solutions.filter((s) => s.problemId !== problemId),
      });
    },
    []
  );

  const upsertConclusion = useMutation(
    (
      { storage },
      nodeId: string,
      entry: NodeConclusion
    ) => {
      const nodes = (storage.get('journeyNodes') as any).toArray() as Array<any>;
      const node = nodes.find((n: any) => n.get('id') === nodeId);
      if (node) {
        const current: NodeConclusion[] = node.get('conclusions') ?? [];
        const exists = current.some((c) => c.id === entry.id);
        node.update({
          conclusions: exists
            ? current.map((c) => (c.id === entry.id ? { ...c, ...entry } : c))
            : [...current, entry],
        });
      }
    },
    []
  );

  return {
    lbNodes,
    lbEdges,
    addJourneyNode,
    addJourneyEdge,
    updateJourneyEdge,
    updateJourneyNode,
    deleteJourneyNodes,
    addProblem,
    updateProblem,
    removeProblem,
    saveSolution,
    upsertConclusion,
  };
}
