'use client';

import { useCallback, useEffect, useRef } from 'react';
import {
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type NodeChange,
  type EdgeChange,
  type Connection as RFConnection,
} from '@xyflow/react';

import { useRealtimeShapes } from '@/components/CanvasModule/hooks/realtime/useRealtimeShapes';
import { useConnectionManager, type Connection } from '@/components/CanvasModule/hooks/useConnectionManager';
import type { Shape } from '@/components/CanvasModule/types';

// RF's Node generic requires data to extend Record<string, unknown>.
// Shape doesn't have an index signature so we cast at the boundary.
// Node components recover the type with: const shape = data as unknown as Shape
export type AppNode = Node;
export type AppEdge = Edge;

type Side = 'top' | 'right' | 'bottom' | 'left';

function sideToAnchor(side: Side | null | undefined): { x: number; y: number } {
  switch (side) {
    case 'top':    return { x: 0.5, y: 0 };
    case 'right':  return { x: 1,   y: 0.5 };
    case 'bottom': return { x: 0.5, y: 1 };
    case 'left':   return { x: 0,   y: 0.5 };
    default:       return { x: 0.5, y: 0.5 };
  }
}

function shapeToNode(shape: Shape): Node {
  return {
    id: shape.id,
    type: shape.type,
    position: { x: shape.x, y: shape.y },
    style: { width: shape.width, height: shape.height },
    data: shape as unknown as Record<string, unknown>,
  };
}

function connectionToEdge(conn: Connection): Edge {
  return {
    id: conn.id,
    source: conn.fromShapeId,
    target: conn.toShapeId,
    sourceHandle: conn.fromSide ?? null,
    targetHandle: conn.toSide ?? null,
    type: 'ortho',
    data: { fromAnchor: conn.fromAnchor, toAnchor: conn.toAnchor },
  };
}

export function useCanvasDataBridge() {
  const { shapes, addShape, updateShape, removeShapes } = useRealtimeShapes();
  const { connections, addConnectionRelative, removeConnectionsByIds } = useConnectionManager();

  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Prevent Liveblocks → RF sync loop while a drag is in progress
  const isDraggingRef = useRef(false);

  // Sync Liveblocks shapes → RF nodes (skip during drag to avoid position jitter)
  useEffect(() => {
    if (isDraggingRef.current) return;
    setNodes(shapes.map(shapeToNode));
  }, [shapes]);

  // Sync Liveblocks connections → RF edges
  useEffect(() => {
    setEdges(connections.map(connectionToEdge));
  }, [connections]);

  const handleNodesChange = useCallback(
    (changes: NodeChange[]) => {
      onNodesChange(changes);

      const removedIds: string[] = [];

      for (const change of changes) {
        if (change.type === 'position') {
          isDraggingRef.current = change.dragging ?? false;

          // Write position back to Liveblocks when drag ends
          if (!change.dragging && change.position) {
            const { x, y } = change.position;
            updateShape(change.id, (s) => ({ ...s, x, y }));
          }
        }

        if (change.type === 'dimensions' && change.dimensions) {
          const { width, height } = change.dimensions;
          updateShape(change.id, (s) => ({ ...s, width, height }));
        }

        if (change.type === 'remove') {
          removedIds.push(change.id);
        }
      }

      if (removedIds.length > 0) removeShapes(removedIds);
    },
    [onNodesChange, updateShape, removeShapes],
  );

  const handleEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      onEdgesChange(changes);

      const removedIds = changes
        .filter((c) => c.type === 'remove')
        .map((c) => c.id);

      if (removedIds.length > 0) removeConnectionsByIds(removedIds);
    },
    [onEdgesChange, removeConnectionsByIds],
  );

  const handleConnect = useCallback(
    (connection: RFConnection) => {
      const sourceHandle = (connection.sourceHandle ?? 'right') as Side;
      const targetHandle = (connection.targetHandle ?? 'left') as Side;

      addConnectionRelative({
        fromShapeId: connection.source,
        fromAnchor: sideToAnchor(sourceHandle),
        fromSide: sourceHandle,
        toShapeId: connection.target,
        toAnchor: sideToAnchor(targetHandle),
        toSide: targetHandle,
        style: 'orthogonal',
      });

      setEdges((eds) => addEdge({ ...connection, type: 'ortho' }, eds));
    },
    [addConnectionRelative, setEdges],
  );

  return {
    nodes,
    edges,
    onNodesChange: handleNodesChange,
    onEdgesChange: handleEdgesChange,
    onConnect: handleConnect,
    addShape,
    updateShape,
  };
}
