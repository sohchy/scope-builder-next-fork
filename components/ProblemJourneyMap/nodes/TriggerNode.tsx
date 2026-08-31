"use client";

import { memo, useState, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { TriggerIcon } from "../icons/TriggerIcon";
import { NodeTypeMenu } from "../components/NodeTypeMenu";
import { StakeholderPickerModal } from "../components/StakeholderPickerModal";
import { STAKEHOLDER_DEFINITIONS } from "../components/Market/constants";
import {
  useJourneyContext,
  type JourneyNodeType,
  type JourneyNodeData,
} from "../JourneyContext";
import type { StakeholderRow } from "@/services/market";
import { Textarea } from "@/components/ui/textarea";
import { STAKEHOLDERS_SUB_STEP } from "@/lib/milestones";

// Resolve the node's selected stakeholder ids to rows, grouped by category in
// `STAKEHOLDER_DEFINITIONS` order. Ids with no matching row (deleted on the
// Market tab) are dropped; empty categories are omitted.
function groupSelected(
  stakeholderRows: StakeholderRow[],
  selectedIds: number[],
): { title: string; values: string[] }[] {
  const selected = new Set(selectedIds);
  const rowsByType = new Map<string, StakeholderRow[]>();
  for (const row of stakeholderRows) {
    if (!selected.has(row.id)) continue;
    const list = rowsByType.get(row.stakeholder_type) ?? [];
    list.push(row);
    rowsByType.set(row.stakeholder_type, list);
  }

  return STAKEHOLDER_DEFINITIONS.flatMap((definition) => {
    const rows = rowsByType.get(definition.key) ?? [];
    if (rows.length === 0) return [];
    return [{ title: definition.title, values: rows.map((r) => r.value) }];
  });
}

function TriggerNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const {
    readOnly,
    isSubStepUnlocked,
    addChildNode,
    updateNodeData,
    stakeholderRows,
    canDeleteNode: canDelete,
    requestDeleteNode,
  } = useJourneyContext();
  // Stakeholders are entered on the Market tab, which stays locked until 1.1 is
  // marked done — so until then a Trigger card is its text alone and the picker
  // isn't offered. This is the one gate that hides rather than greys: a card is
  // too small for a disabled control to read as anything but broken. Anything
  // already picked still renders below.
  const stakeholderPickerUnlocked = isSubStepUnlocked(STAKEHOLDERS_SUB_STEP);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedIds = nodeData.stakeholderIds ?? [];
  const groups = groupSelected(stakeholderRows, selectedIds);

  const handleToggleMenu = useCallback(() => {
    if (anchorRect) {
      setAnchorRect(null);
    } else if (buttonRef.current) {
      setAnchorRect(buttonRef.current.getBoundingClientRect());
    }
  }, [anchorRect]);

  const handleSelect = useCallback(
    (type: JourneyNodeType) => {
      addChildNode(id, type);
      setAnchorRect(null);
    },
    [id, addChildNode],
  );

  const handleClose = useCallback(() => setAnchorRect(null), []);

  const handleDeleteNode = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      requestDeleteNode(id);
    },
    [requestDeleteNode, id],
  );

  // A Trigger heads its chain, so once anything hangs off it there's nowhere to
  // move those cards to and it stays put. One further down a chain can still go.
  const canDeleteNode = !readOnly && canDelete(id);

  // The card width is fixed rather than shrink-to-fit: the content textarea sizes
  // itself to its content, so on an auto-width card every character widens the
  // node, which re-runs the tree layout mid-keystroke. Pinned to the same width as
  // an Action card, the text wraps and only the height grows.
  return (
    <div className="group/card nopan nodrag pointer-events-auto w-[370px] bg-[#E6DEFA] border-2 border-[#CFD3E0] rounded-xl p-4 relative shadow-[0_1px_3px_0_rgba(16,24,40,0.06),0_6px_14px_-2px_rgba(16,24,40,0.12)]">
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
      />

      {/* The title takes what it needs and the controls sit hard right — a fixed
          gap between them would overflow the card once both are present. */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-[30px] h-[30px] bg-[#F4F0FF] rounded-full flex items-center justify-center flex-shrink-0">
            <TriggerIcon className="text-[#6A35FF]" />
          </div>
          <span className="text-lg font-semibold text-[#111827] tracking-wide">
            Trigger / Motivation
          </span>
        </div>
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {!readOnly && stakeholderPickerUnlocked && (
            <>
              <button
                type="button"
                className="nodrag nopan text-base font-medium text-[#6A35FF] whitespace-nowrap hover:underline"
                onClick={() => setShowPicker(true)}
              >
                Stakeholders
              </button>
              <StakeholderPickerModal
                open={showPicker}
                onOpenChange={setShowPicker}
                stakeholderRows={stakeholderRows}
                selectedIds={selectedIds}
                onSave={(ids) => updateNodeData(id, { stakeholderIds: ids })}
              />
            </>
          )}
          {canDeleteNode && (
            <button
              onClick={handleDeleteNode}
              title="Delete card"
              className="nodrag nopan opacity-0 group-hover/card:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2Icon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Selected stakeholders, grouped by category, comma-separated. */}
      {groups.length > 0 ? (
        <div className="mb-3 flex flex-col gap-0.5">
          {groups.map((group) => (
            <p key={group.title} className="text-base leading-snug text-gray-800">
              <span className="font-semibold text-gray-700">
                {group.title}:
              </span>{" "}
              {group.values.join(", ")}
            </p>
          ))}
        </div>
      ) : (
        readOnly && <p className="mb-3 text-base text-gray-600">—</p>
      )}

      <Textarea
        value={nodeData.content ?? ""}
        placeholder="Type your trigger..."
        readOnly={readOnly}
        className="nodrag nopan w-full text-base md:text-base text-gray-800 bg-transparent border-[#B9BDC9] resize-none placeholder-gray-500 focus:outline-none leading-snug"
        onChange={(e) => updateNodeData(id, { content: e.target.value })}
      />

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
      />

      {/* "+" button — positioned on the right edge, outside the card boundary */}
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

export const TriggerNode = memo(TriggerNodeInner);
