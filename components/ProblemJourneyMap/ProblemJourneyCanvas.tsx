"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
} from "@xyflow/react";
import { ZapIcon } from "lucide-react";
import "@xyflow/react/dist/style.css";

import { journeyNodeTypes } from "./nodes/nodeTypes";
import { journeyEdgeTypes } from "./edges/edgeTypes";
import { useJourneyDataBridge } from "./hooks/useJourneyDataBridge";
import { useLayout } from "./hooks/useLayout";
import { JourneyContext, type JourneyNodeData } from "./JourneyContext";
import {
  SelectedNodeContext,
  type SelectedProblem,
} from "./SelectedNodeContext";
import { NodeProblemsContext } from "./NodeProblemsContext";
import { NodeSolutionsContext } from "./NodeSolutionsContext";
import { NodeConclusionsContext } from "./NodeConclusionsContext";
import {
  ActionNodeSheet,
  type ActionSheetTab,
} from "./components/ActionNodeSheet";
import { DeleteNodeDialog } from "./components/DeleteNodeDialog";
import type { StakeholderRow } from "@/services/market";
import {
  HYPOTHESIS_SUB_STEP,
  isSubStepUnlocked as isSubStepUnlockedFor,
  MARKET_QUESTIONS_MILESTONE,
  PROBLEMS_SUB_STEP,
  SOLUTIONS_MILESTONE,
  SOURCE_CONFIDENCE_SUB_STEP,
} from "@/lib/milestones";
import { useSubStepProgress } from "./SubStepProgressContext";

interface ProblemJourneyCanvasProps {
  /** Org-wide stakeholder rows from the Market tab, used by Trigger nodes to
   * pick and display stakeholders. Loaded once server-side. */
  stakeholderRows: StakeholderRow[];
  /** Every milestone the startup has unlocked, resolved server-side by the page.
   * The canvas derives its progressive-disclosure gates from this — see
   * `isMilestoneUnlocked` on JourneyContext. */
  availableMilestones: number[];
  /** Render the canvas as a read-only viewer (Examples pages). */
  readOnly?: boolean;
}

const noop = () => {};

function CanvasInner({
  stakeholderRows,
  availableMilestones,
  readOnly = false,
}: ProblemJourneyCanvasProps) {
  const {
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
  } = useJourneyDataBridge();

  useLayout(setNodes, pendingFocusRef);

  const unlockedMilestones = useMemo(
    () => new Set(availableMilestones),
    [availableMilestones],
  );

  const isMilestoneUnlocked = useCallback(
    (milestone: number) => unlockedMilestones.has(milestone),
    [unlockedMilestones],
  );

  // The finer gates combine both signals — instructor-granted milestone and the
  // team's own "Reviewed" toggle — so they're resolved here, where the unlocked
  // -milestone set already lives, rather than in each node.
  const { progress } = useSubStepProgress();
  const isSubStepUnlocked = useCallback(
    (subStep: string) =>
      isSubStepUnlockedFor(subStep, progress, unlockedMilestones),
    [progress, unlockedMilestones],
  );

  // Problems (the cards on an Action node, "Add a problem", and the sheet they
  // open) open up at 1.3 — before that the canvas is journey structure alone.
  const problemsUnlocked = isSubStepUnlocked(PROBLEMS_SUB_STEP);

  // The sheet then fills in below the description. Its own gates are resolved
  // here so the whole staging reads in one place:
  //
  //   1.3  description + type + pain-or-gain  (implied — the sheet is shut before)
  //   M2   the Market Questions and the bank they're added from
  //   2.1  each answer's source and confidence, and the hypothesis toggle
  //   M4   the Solution tab in full — provisional, see `SOLUTIONS_MILESTONE`
  //
  // A locked section is greyed and read-only rather than absent, and its saved
  // values sit untouched behind it: the editor still hydrates from them and a
  // save round-trips whatever is stored, so unlocking brings the team's own data
  // back rather than a blank form.
  const questionsUnlocked = isMilestoneUnlocked(MARKET_QUESTIONS_MILESTONE);
  const sourceConfidenceUnlocked = isSubStepUnlocked(
    SOURCE_CONFIDENCE_SUB_STEP,
  );
  const hypothesisUnlocked = isSubStepUnlocked(HYPOTHESIS_SUB_STEP);
  const solutionsUnlocked = isMilestoneUnlocked(SOLUTIONS_MILESTONE);

  const [selectedProblem, setSelectedProblem] =
    useState<SelectedProblem | null>(null);
  // Controlled like `open` is, so a click on the card always lands on the right
  // tab — even when the sheet is already open on that same problem.
  const [sheetTab, setSheetTab] = useState<ActionSheetTab>("problem");

  const openProblem = useCallback(
    (nodeId: string, problemId: string, tab: ActionSheetTab = "problem") => {
      // Nothing on a locked canvas can reach this, but the sheet is the one
      // problem surface that isn't rendered by ActionNode — keep it shut here
      // too so a stale handler can't open it.
      if (!problemsUnlocked) return;
      setSelectedProblem({ nodeId, problemId });
      setSheetTab(tab);
    },
    [problemsUnlocked],
  );

  const onPaneClick = useCallback(() => {
    setSelectedProblem(null);
  }, []);

  // Id of the card whose delete was requested — the confirmation dialog is open
  // while this is set. Nothing is written until the user confirms.
  const [nodePendingDelete, setNodePendingDelete] = useState<string | null>(
    null,
  );

  const requestDeleteNode = useCallback((nodeId: string) => {
    setNodePendingDelete(nodeId);
  }, []);

  const confirmDeleteNode = useCallback(() => {
    if (!nodePendingDelete) return;
    deleteNode(nodePendingDelete);
    // The sheet outlives the card it was opened from, so close it when its node
    // is the one going away.
    setSelectedProblem((current) =>
      current?.nodeId === nodePendingDelete ? null : current,
    );
    setNodePendingDelete(null);
  }, [nodePendingDelete, deleteNode]);

  const pendingNodeData = nodePendingDelete
    ? ((nodes.find((n) => n.id === nodePendingDelete)?.data ??
        null) as JourneyNodeData | null)
    : null;

  const selectedProblemData = selectedProblem
    ? (nodeProblems
        .get(selectedProblem.nodeId)
        ?.find((p) => p.id === selectedProblem.problemId) ?? null)
    : null;

  const selectedSolutionData = selectedProblem
    ? solutionForProblem(selectedProblem.nodeId, selectedProblem.problemId)
    : null;

  // What the sheet header needs from the card the open problem belongs to: the
  // Action's own text (editable up there) and its full list of problems, which
  // the header arrows step through.
  const selectedNodeData = selectedProblem
    ? ((nodes.find((n) => n.id === selectedProblem.nodeId)?.data ??
        null) as JourneyNodeData | null)
    : null;

  const selectedNodeProblems = selectedProblem
    ? (nodeProblems.get(selectedProblem.nodeId) ?? [])
    : [];

  // Same node, different problem — the sheet stays open and re-hydrates.
  const selectProblem = useCallback((problemId: string) => {
    setSelectedProblem((current) =>
      current ? { ...current, problemId } : current,
    );
  }, []);

  return (
    <NodeConclusionsContext.Provider value={nodeConclusions}>
      <NodeSolutionsContext.Provider value={nodeSolutions}>
        <NodeProblemsContext.Provider value={nodeProblems}>
          <SelectedNodeContext.Provider value={selectedProblem}>
            <JourneyContext.Provider
              value={{
                readOnly,
                isMilestoneUnlocked,
                isSubStepUnlocked,
                // Structural/field mutators are hard no-ops in read-only mode so
                // nothing can write to the shared example room even if a control
                // were somehow reachable.
                addTriggerNode: readOnly ? noop : addTriggerNode,
                addChildNode: readOnly ? noop : addChildNode,
                canDeleteNode,
                requestDeleteNode: readOnly ? noop : requestDeleteNode,
                updateNodeData: readOnly ? noop : updateNodeData,
                updateEdgeLabel: readOnly ? noop : updateEdgeLabel,
                stakeholderRows,
                openProblem,
                // Problem writes are gated on the milestone as well as read-only,
                // so a locked canvas can never add or drop a problem.
                addEmptyProblem:
                  readOnly || !problemsUnlocked ? () => "" : addEmptyProblem,
                removeProblem:
                  readOnly || !problemsUnlocked ? noop : removeProblem,
                solutionForProblem,
              }}
            >
              <div style={{ width: "100%", height: "100%" }}>
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  nodeTypes={journeyNodeTypes}
                  edgeTypes={journeyEdgeTypes}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={false}
                  deleteKeyCode={null}
                  zoomOnDoubleClick={false}
                  minZoom={0.2}
                  maxZoom={2}
                  proOptions={{ hideAttribution: true }}
                  onPaneClick={onPaneClick}
                >
                  <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    color="#e5e7eb"
                  />
                  <Controls showInteractive={false} />
                  {!readOnly && (
                    <Panel position="bottom-right">
                      <button
                        onClick={addTriggerNode}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#6A35FF] text-white text-sm font-medium shadow hover:bg-[#5a2de0] transition-colors"
                      >
                        <ZapIcon className="w-3.5 h-3.5" />
                        Add Trigger / Motivation
                      </button>
                    </Panel>
                  )}
                </ReactFlow>
              </div>

              <ActionNodeSheet
                readOnly={readOnly}
                questionsUnlocked={questionsUnlocked}
                sourceConfidenceUnlocked={sourceConfidenceUnlocked}
                hypothesisUnlocked={hypothesisUnlocked}
                solutionsUnlocked={solutionsUnlocked}
                open={selectedProblem !== null}
                onOpenChange={(open) => {
                  if (!open) setSelectedProblem(null);
                }}
                activeTab={sheetTab}
                onActiveTabChange={setSheetTab}
                nodeId={selectedProblem?.nodeId ?? null}
                problemId={selectedProblem?.problemId ?? null}
                problem={selectedProblemData}
                actionTitle={selectedNodeData?.content ?? ""}
                onActionTitleChange={(content) => {
                  if (selectedProblem && !readOnly)
                    updateNodeData(selectedProblem.nodeId, { content });
                }}
                problems={selectedNodeProblems}
                onSelectProblem={selectProblem}
                onSaveProblem={(desc, type, painOrGain, questions) => {
                  if (selectedProblem)
                    saveProblem(
                      selectedProblem.nodeId,
                      selectedProblem.problemId,
                      desc,
                      type,
                      painOrGain,
                      questions,
                    );
                }}
                solution={selectedSolutionData}
                onSaveSolution={(desc, type, relieverOrCreator, questions) => {
                  if (selectedProblem)
                    saveSolution(
                      selectedProblem.nodeId,
                      selectedProblem.problemId,
                      desc,
                      type,
                      relieverOrCreator,
                      questions,
                    );
                }}
              />

              <DeleteNodeDialog
                open={nodePendingDelete !== null}
                onOpenChange={(open) => {
                  if (!open) setNodePendingDelete(null);
                }}
                nodeType={pendingNodeData?.type ?? null}
                nodeContent={pendingNodeData?.content ?? ""}
                problems={
                  nodePendingDelete
                    ? (nodeProblems.get(nodePendingDelete) ?? [])
                    : []
                }
                childCount={
                  nodePendingDelete ? childCount(nodePendingDelete) : 0
                }
                showProblems={problemsUnlocked}
                onConfirm={confirmDeleteNode}
              />
            </JourneyContext.Provider>
          </SelectedNodeContext.Provider>
        </NodeProblemsContext.Provider>
      </NodeSolutionsContext.Provider>
    </NodeConclusionsContext.Provider>
  );
}

export function ProblemJourneyCanvas({
  stakeholderRows,
  availableMilestones,
  readOnly = false,
}: ProblemJourneyCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner
        stakeholderRows={stakeholderRows}
        availableMilestones={availableMilestones}
        readOnly={readOnly}
      />
    </ReactFlowProvider>
  );
}
