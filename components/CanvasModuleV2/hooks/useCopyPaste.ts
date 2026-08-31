'use client';

// Adapted from .claude/examples/react-flow/copy-paste-pro-example/src/useCopyPaste.ts
// Keeps the RF Pro UX (in-memory buffer, mouse-position paste, useKeyPress shortcuts)
// but routes all writes through Liveblocks so changes persist and sync to collaborators.

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  useReactFlow,
  useStore,
  getConnectedEdges,
  useKeyPress,
  type Edge,
  type Node,
  type XYPosition,
  type KeyCode,
} from '@xyflow/react';
import { useHistory } from '@liveblocks/react';

import { useRealtimeShapes } from '@/components/CanvasModule/hooks/realtime/useRealtimeShapes';
import { useConnectionManager } from '@/components/CanvasModule/hooks/useConnectionManager';
import type { Shape as IShape, ShapeType } from '@/components/CanvasModule/types';

type Side = 'top' | 'right' | 'bottom' | 'left';
type Anchor = { x: number; y: number };

// Verbatim from RF Pro copy-paste example
function useShortcut(keyCode: KeyCode, callback: () => void, isCopyAction = false): void {
  const [didRun, setDidRun] = useState(false);
  const shouldRun = useKeyPress(keyCode, {
    actInsideInputWithModifier: false,
    preventDefault: false,
  });

  useEffect(() => {
    const selection = window.getSelection()?.toString();
    const allowCopy = isCopyAction ? !selection : true;

    if (shouldRun && !didRun && allowCopy) {
      callback();
      setDidRun(true);
    } else {
      setDidRun(shouldRun);
    }
  }, [shouldRun, didRun, callback, isCopyAction]);
}

export function useCopyPaste() {
  const mousePosRef = useRef<XYPosition>({ x: 0, y: 0 });
  const rfDomNode = useStore((state) => state.domNode);

  const { getNodes, getEdges, screenToFlowPosition } = useReactFlow();
  const { addShape, updateShape, removeShapes } = useRealtimeShapes();
  const { connections, addConnectionRelative, removeConnectionsByIds } = useConnectionManager();
  const { pause, resume } = useHistory();

  const [bufferedNodes, setBufferedNodes] = useState<Node[]>([]);
  const [bufferedEdges, setBufferedEdges] = useState<Edge[]>([]);

  // Track mouse position and suppress native clipboard events — same as RF Pro example
  useEffect(() => {
    if (!rfDomNode) return;

    const preventDefault = (e: Event) => e.preventDefault();
    const onMouseMove = (event: MouseEvent) => {
      mousePosRef.current = { x: event.clientX, y: event.clientY };
    };

    rfDomNode.addEventListener('mousemove', onMouseMove);
    for (const evt of ['cut', 'copy', 'paste']) {
      rfDomNode.addEventListener(evt, preventDefault);
    }

    return () => {
      rfDomNode.removeEventListener('mousemove', onMouseMove);
      for (const evt of ['cut', 'copy', 'paste']) {
        rfDomNode.removeEventListener(evt, preventDefault);
      }
    };
  }, [rfDomNode]);

  // Identical to RF Pro example — reads selected nodes + internal edges into buffer
  const copy = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    const selectedEdges = getConnectedEdges(selectedNodes, getEdges()).filter((edge) => {
      const isExternalSource = selectedNodes.every((n) => n.id !== edge.source);
      const isExternalTarget = selectedNodes.every((n) => n.id !== edge.target);
      return !(isExternalSource || isExternalTarget);
    });

    setBufferedNodes(selectedNodes);
    setBufferedEdges(selectedEdges);
  }, [getNodes, getEdges]);

  // cut = copy + remove from Liveblocks (RF follows via data bridge sync)
  const cut = useCallback(() => {
    const selectedNodes = getNodes().filter((node) => node.selected);
    const selectedEdges = getConnectedEdges(selectedNodes, getEdges()).filter((edge) => {
      const isExternalSource = selectedNodes.every((n) => n.id !== edge.source);
      const isExternalTarget = selectedNodes.every((n) => n.id !== edge.target);
      return !(isExternalSource || isExternalTarget);
    });

    setBufferedNodes(selectedNodes);
    setBufferedEdges(selectedEdges);

    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    // Remove all connections touching the cut nodes (not just internal ones)
    const connectionIdsToRemove = connections
      .filter((c) => selectedIds.has(c.fromShapeId) || selectedIds.has(c.toShapeId))
      .map((c) => c.id);

    pause();
    try {
      if (connectionIdsToRemove.length) removeConnectionsByIds(connectionIdsToRemove);
      removeShapes(selectedNodes.map((n) => n.id));
    } finally {
      resume();
    }
  }, [getNodes, getEdges, connections, removeShapes, removeConnectionsByIds, pause, resume]);

  // Same positioning math as RF Pro example; writes through Liveblocks instead of setNodes
  const paste = useCallback(
    (
      { x: pasteX, y: pasteY } = screenToFlowPosition({
        x: mousePosRef.current.x,
        y: mousePosRef.current.y,
      }),
    ) => {
      if (!bufferedNodes.length) return;

      const minX = Math.min(...bufferedNodes.map((n) => n.position.x));
      const minY = Math.min(...bufferedNodes.map((n) => n.position.y));
      const now = Date.now();

      // Build old→new ID map (same suffix pattern as RF Pro example)
      const idMap = new Map<string, string>();
      for (const node of bufferedNodes) {
        idMap.set(node.id, `${node.id}-${now}`);
      }

      pause();
      try {
        for (const node of bufferedNodes) {
          const newId = idMap.get(node.id)!;
          const x = pasteX + (node.position.x - minX);
          const y = pasteY + (node.position.y - minY);
          const shape = node.data as unknown as IShape;

          // Two-step: create shell then patch all fields (same pattern as V1 paste)
          addShape(shape.type as ShapeType, x, y, newId);
          updateShape(newId, () => ({ ...shape, id: newId, x, y }));
        }

        for (const edge of bufferedEdges) {
          const newSource = idMap.get(edge.source);
          const newTarget = idMap.get(edge.target);
          if (!newSource || !newTarget) continue;

          const edgeData = edge.data as Record<string, unknown> | undefined;
          addConnectionRelative({
            fromShapeId: newSource,
            fromSide: (edge.sourceHandle ?? 'right') as Side,
            fromAnchor: (edgeData?.fromAnchor ?? { x: 0.5, y: 0.5 }) as Anchor,
            toShapeId: newTarget,
            toSide: (edge.targetHandle ?? 'left') as Side,
            toAnchor: (edgeData?.toAnchor ?? { x: 0.5, y: 0.5 }) as Anchor,
            style: 'orthogonal',
          });
        }
      } finally {
        resume();
      }
    },
    [bufferedNodes, bufferedEdges, screenToFlowPosition, addShape, updateShape, addConnectionRelative, pause, resume],
  );

  useShortcut(['Meta+x', 'Control+x'], cut);
  useShortcut(['Meta+c', 'Control+c'], copy, true);
  useShortcut(['Meta+v', 'Control+v'], paste);

  return { cut, copy, paste, bufferedNodes, bufferedEdges };
}
