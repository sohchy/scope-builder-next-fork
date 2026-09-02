"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { PlusIcon, Trash2Icon, XIcon } from "lucide-react";

import { ActionIcon } from "../icons/ActionIcon";
import { NodeTypeMenu } from "../components/NodeTypeMenu";
import {
  useJourneyContext,
  type JourneyNodeType,
  type JourneyNodeData,
} from "../JourneyContext";
import { useSelectedNode } from "../SelectedNodeContext";
import { useNodeProblems } from "../NodeProblemsContext";
import { useNodeContentDraft } from "../hooks/useNodeContentDraft";
import { Textarea } from "@/components/ui/textarea";
import { PROBLEMS_SUB_STEP } from "@/lib/milestones";
import type { Problem } from "../components/ActionNodeSheet";

// A single problem (+ its solution preview) as it appears stacked on the card.
// Every problem — including the first — renders with this same component.
interface ProblemCardProps {
  nodeId: string;
  problem: Problem;
  isSelected: boolean;
  canDelete: boolean;
}

function ProblemCard({
  nodeId,
  problem,
  isSelected,
  canDelete,
}: ProblemCardProps) {
  const { openProblem, removeProblem, solutionForProblem } =
    useJourneyContext();
  const solution = solutionForProblem(nodeId, problem.id);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openProblem(nodeId, problem.id, "problem");
    },
    [openProblem, nodeId, problem.id],
  );

  // The solution preview sits inside the clickable problem card, so it has to
  // stop propagation or the outer handler would pull the sheet back to Problem.
  const handleSolutionClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      openProblem(nodeId, problem.id, "solution");
    },
    [openProblem, nodeId, problem.id],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      removeProblem(nodeId, problem.id);
    },
    [removeProblem, nodeId, problem.id],
  );

  return (
    <div
      onClick={handleClick}
      className="mt-3 pt-3 border-t border-[#B9BDC9] cursor-pointer group"
    >
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-base font-semibold text-gray-600 underline decoration-dotted underline-offset-4">
          What is the problem/pain?
        </p>
        {canDelete && (
          <button
            onClick={handleDelete}
            title="Delete problem"
            className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50"
          >
            <XIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div
        className={`rounded-lg p-3 ${
          isSelected ? "ring-1 ring-[#6A35FF]" : ""
        }`}
      >
        <p className="text-base text-gray-800">
          {problem.description || (
            <span className="text-gray-500 italic">No description yet</span>
          )}
        </p>
      </div>

      {solution?.description && (
        <div className="mt-3" onClick={handleSolutionClick}>
          <p className="font-semibold text-[#111827] mb-2">Solution</p>
          <div className="bg-[#E8FAE9] rounded-lg p-3">
            <span className="text-sm font-semibold bg-[#2F9E63] text-white rounded-full px-2 py-0.5">
              Solution
            </span>
            <p className="text-base text-gray-800 mt-1.5">
              {solution.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function ActionNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const {
    readOnly,
    isSubStepUnlocked,
    addChildNode,
    updateNodeData,
    openProblem,
    addEmptyProblem,
    canDeleteNode: canDelete,
    requestDeleteNode,
  } = useJourneyContext();
  // Until 1.3 is marked done an Action node is its text alone: both the problem
  // cards and "Add a problem" are absent rather than greyed. This is the one
  // place the unlock map hides instead of dimming — a card this size has no room
  // to explain a disabled control, so it would read as broken rather than as
  // not-yet. Problems already saved on the node are untouched in storage and
  // come back when the gate opens.
  const problemsUnlocked = isSubStepUnlocked(PROBLEMS_SUB_STEP);
  const selected = useSelectedNode();
  const isNodeSelected = selected?.nodeId === id;
  const nodeProblemsMap = useNodeProblems();
  const problems = nodeProblemsMap.get(id) ?? [];
  // A problem is "finished" once it has a description — the sheet refuses to save
  // without one, so a blank description means it was added and abandoned. Adding
  // is withheld only while the node's *lone* problem is blank: there's nothing to
  // add on to yet. Once any problem is real, a stray blank one doesn't block the
  // node from growing.
  const hasOnlyBlankProblem =
    problems.length === 1 && !problems[0].description.trim();
  // Every question the user flagged in the sheet, across every problem on the
  // card. It counts the raw flag rather than answered-ness: the badge reflects
  // what was marked, not how far along the answer is.
  const hypothesisCount = problems.reduce(
    (total, problem) =>
      total + problem.questions.filter((q) => q.isHypothesis).length,
    0,
  );
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const commitContent = useCallback(
    (value: string) => updateNodeData(id, { content: value }),
    [updateNodeData, id],
  );
  const [content, handleContentChange] = useNodeContentDraft(
    nodeData.content ?? "",
    commitContent,
  );

  const handleToggleMenu = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (anchorRect) {
        setAnchorRect(null);
      } else if (buttonRef.current) {
        setAnchorRect(buttonRef.current.getBoundingClientRect());
      }
    },
    [anchorRect],
  );

  const handleSelect = useCallback(
    (type: JourneyNodeType) => {
      addChildNode(id, type);
      setAnchorRect(null);
    },
    [id, addChildNode],
  );

  const handleClose = useCallback(() => setAnchorRect(null), []);

  const handleAddProblem = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const newId = addEmptyProblem(id);
      openProblem(id, newId);
    },
    [addEmptyProblem, openProblem, id],
  );

  const handleDeleteNode = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      requestDeleteNode(id);
    },
    [requestDeleteNode, id],
  );

  // A card in the middle of a chain can go — whatever hangs off it moves up to
  // its parent. Only the head of a chain has to keep its children.
  const canDeleteNode = !readOnly && canDelete(id);

  return (
    <div
      className={`group/card nopan nodrag pointer-events-auto w-[370px] bg-[#C8ECE6] border-2 rounded-xl p-4 relative shadow-[0_1px_3px_0_rgba(16,24,40,0.06),0_6px_14px_-2px_rgba(16,24,40,0.12)] ${isNodeSelected ? "border-purple-500" : "border-[#B9BDC9]"}`}
    >
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-[30px] h-[30px] bg-[#F4F0FF] rounded-full flex items-center justify-center flex-shrink-0">
            <ActionIcon className="text-[#6A35FF]" />
          </div>
          <span className="text-lg font-semibold text-[#111827] tracking-wide">
            Action
          </span>
        </div>
        {/* Delete sits *before* the badge so the badge can end flush with the
            card's padding, matching the icon's inset on the left. The button is
            only visible on hover but still occupies its width — parked here it
            eats into the row's slack instead of pushing the badge inward. */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {canDeleteNode && (
            <button
              onClick={handleDeleteNode}
              title="Delete card"
              className="nodrag nopan opacity-0 group-hover/card:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2Icon className="w-4 h-4" />
            </button>
          )}
          {/* Follows the same gate as the problem cards: while 1.3 is locked the
              problems themselves are hidden, so a count of them would point at
              something the user cannot see. */}
          {problemsUnlocked && hypothesisCount > 0 && (
            <span className="bg-[#F4F0FF] text-[#6A35FF] text-sm font-semibold rounded-full px-2.5 py-0.5 whitespace-nowrap">
              {hypothesisCount}{" "}
              {hypothesisCount === 1 ? "Hypothesis" : "Hypotheses"}
            </span>
          )}
        </div>
      </div>

      <Textarea
        className="nodrag nopan w-full text-base md:text-base text-gray-800 bg-transparent border-[#B9BDC9] resize-none placeholder-gray-500 focus:outline-none leading-snug"
        placeholder="Type your action..."
        value={content}
        readOnly={readOnly}
        onChange={handleContentChange}
        onClick={(e) => e.stopPropagation()}
      />

      {problemsUnlocked &&
        problems.map((problem) => (
          <ProblemCard
            key={problem.id}
            nodeId={id}
            problem={problem}
            isSelected={selected?.problemId === problem.id}
            canDelete={!readOnly && problems.length > 1}
          />
        ))}

      {!readOnly && problemsUnlocked && !hasOnlyBlankProblem && (
        <button
          onClick={handleAddProblem}
          className="nodrag nopan mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-gray-400 text-base font-medium text-gray-700 hover:border-[#6A35FF] hover:text-[#6A35FF] transition-colors"
        >
          <PlusIcon className="w-3.5 h-3.5" />
          {problems.length === 0
            ? "Add a problem"
            : "Add an additional problem"}
        </button>
      )}

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
      />

      {!readOnly && (
        <div className="nopan nodrag absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-3">
          <button
            ref={buttonRef}
            className="nodrag nopan w-[30px] h-[30px] rounded-full bg-[#7A7099] text-white flex items-center justify-center shadow hover:bg-[#655C82] transition-colors"
            onClick={handleToggleMenu}
          >
            <PlusIcon className="w-3.5 h-3.5" />
          </button>
          {anchorRect && (
            <NodeTypeMenu
              anchorRect={anchorRect}
              onSelect={handleSelect}
              onClose={handleClose}
            />
          )}
        </div>
      )}
    </div>
  );
}

export const ActionNode = memo(ActionNodeInner);
