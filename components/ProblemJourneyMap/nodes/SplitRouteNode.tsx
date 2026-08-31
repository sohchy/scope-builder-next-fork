'use client';

import { memo, useState, useCallback, useRef } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { GitForkIcon, PlusIcon, Trash2Icon } from 'lucide-react';

import { NodeTypeMenu } from '../components/NodeTypeMenu';
import { useJourneyContext, type JourneyNodeType } from '../JourneyContext';

function SplitRouteNodeInner({ id }: NodeProps) {
  const { readOnly, addChildNode, canDeleteNode: canDelete, requestDeleteNode } =
    useJourneyContext();
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

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
    [id, addChildNode]
  );

  const handleClose = useCallback(() => setAnchorRect(null), []);

  const handleDeleteNode = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      requestDeleteNode(id);
    },
    [requestDeleteNode, id]
  );

  // A Scenarios card *is* the fork — its children are the branches, and moving
  // them onto a card that doesn't fork would misread the journey. So unlike the
  // other cards this one is still removable only while it's empty.
  const canDeleteNode = !readOnly && canDelete(id);

  return (
    <div className="group/card nopan nodrag pointer-events-auto w-[180px] bg-[#F5DFC6] border-2 border-[#CFD3E0] rounded-xl p-4 relative shadow-[0_1px_3px_0_rgba(16,24,40,0.06),0_6px_14px_-2px_rgba(16,24,40,0.12)] flex items-center gap-3">
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!opacity-0 !pointer-events-none"
      />

      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <GitForkIcon className="w-4 h-4 text-orange-600" />
      </div>
      <div>
        <div className="text-sm font-semibold text-orange-700 uppercase tracking-wide leading-tight">
          Scenarios
        </div>
        <div className="text-sm text-gray-600 mt-0.5">Branches here</div>
      </div>

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!opacity-0 !pointer-events-none"
      />

      {canDeleteNode && (
        <button
          onClick={handleDeleteNode}
          title="Delete card"
          className="nodrag nopan absolute top-1 right-1 opacity-0 group-hover/card:opacity-100 transition-opacity w-6 h-6 rounded-full flex items-center justify-center text-gray-600 hover:text-red-500 hover:bg-red-50"
        >
          <Trash2Icon className="w-4 h-4" />
        </button>
      )}

      {!readOnly && (
        <div className="nopan nodrag absolute right-0 top-1/2 -translate-y-1/2 translate-x-full pl-1">
          <button
            ref={buttonRef}
            className="nodrag nopan w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center shadow hover:bg-orange-600 transition-colors"
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

export const SplitRouteNode = memo(SplitRouteNodeInner);
