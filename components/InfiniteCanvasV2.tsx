"use client";

import { useCallback } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useHistory } from "@liveblocks/react";

import { nodeTypes } from "./CanvasModuleV2/nodes/nodeTypes";
import { edgeTypes } from "./CanvasModuleV2/edges/edgeTypes";
import { useCanvasDataBridge } from "./CanvasModuleV2/hooks/useCanvasDataBridge";
import { CanvasToolbar } from "./CanvasModuleV2/components/CanvasToolbar";
import { useUndoRedo } from "./CanvasModuleV2/hooks/useUndoRedo";
import { useCopyPaste } from "./CanvasModuleV2/hooks/useCopyPaste";
import type { ShapeType } from "./CanvasModule/types";

interface InfiniteCanvasProps {
  editable?: boolean;
  toolbarOptions?: {
    card?: boolean;
    text?: boolean;
    table?: boolean;
    answer?: boolean;
    ellipse?: boolean;
    feature?: boolean;
    question?: boolean;
    rectangle?: boolean;
    interview?: boolean;
  };
  valuePropCanvasTool?: string;
  valuePropCanvasMode?: boolean;
}

function CanvasInner({ editable = true, toolbarOptions }: InfiniteCanvasProps) {
  const { nodes, edges, onNodesChange, onEdgesChange, onConnect, addShape } =
    useCanvasDataBridge();
  const { screenToFlowPosition } = useReactFlow();
  const { pause, resume } = useHistory();
  console.log("nodes", nodes);

  // Undo/redo — Liveblocks history + RF Pro keyboard pattern
  useUndoRedo();
  // Copy/paste/cut — RF Pro UX pattern writing through Liveblocks
  useCopyPaste();

  const handleAddShape = useCallback(
    (type: ShapeType) => {
      const position = screenToFlowPosition({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
      });
      addShape(type, position.x, position.y, crypto.randomUUID());
    },
    [screenToFlowPosition, addShape],
  );

  // Wrap each drag in pause/resume so the entire drag is one Liveblocks undo step
  const onNodeDragStart = useCallback(() => pause(), [pause]);
  const onNodeDragStop = useCallback(() => resume(), [resume]);
  const onSelectionDragStart = useCallback(() => pause(), [pause]);
  const onSelectionDragStop = useCallback(() => resume(), [resume]);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable={editable}
        deleteKeyCode={editable ? ["Backspace", "Delete"] : null}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onSelectionDragStart={onSelectionDragStart}
        onSelectionDragStop={onSelectionDragStop}
        panOnScroll
        zoomOnScroll={false}
        zoomOnPinch
        minZoom={0.1}
        maxZoom={4}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Lines}
          gap={24}
          color="#e5e7eb"
        />
        <Controls />
        {editable && (
          <Panel
            position="top-left"
            style={{
              top: "50%",
              transform: "translateY(-50%)",
              margin: "0 0 0 16px",
            }}
          >
            <CanvasToolbar
              toolbarOptions={toolbarOptions}
              onAddShape={handleAddShape}
            />
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

export default function InfiniteCanvasV2(props: InfiniteCanvasProps) {
  return (
    <ReactFlowProvider>
      <CanvasInner {...props} />
    </ReactFlowProvider>
  );
}
