# React Flow

Comprehensive reference for React Flow (v12) in Appollo — covering setup, patterns, advanced features, and all pro examples.

---

## Table of Contents

1. [Package Import](#1-package-import)
2. [Core Setup](#2-core-setup)
3. [ReactFlowProvider](#3-reactflowprovider)
4. [TypeScript Typing](#4-typescript-typing)
5. [Custom Nodes](#5-custom-nodes)
6. [Custom Edges](#6-custom-edges)
7. [Nested / Grouped Nodes](#7-nested--grouped-nodes)
8. [Node Resizing](#8-node-resizing)
9. [MiniMap](#9-minimap)
10. [Controls](#10-controls)
11. [Keyboard Shortcuts](#11-keyboard-shortcuts)
12. [Undo / Redo](#12-undo--redo)
13. [Copy / Paste](#13-copy--paste)
14. [Auto Layout](#14-auto-layout)
15. [Helper Lines](#15-helper-lines)
16. [Freehand Drawing](#16-freehand-drawing)
17. [Shapes](#17-shapes)
18. [Drag and Drop](#18-drag-and-drop)
19. [Context Menu](#19-context-menu)
20. [Workflow Editor Patterns](#20-workflow-editor-patterns)
21. [Liveblocks Real-Time Collaboration](#21-liveblocks-real-time-collaboration)
22. [Key Hooks Reference](#22-key-hooks-reference)
23. [Common Pitfalls](#23-common-pitfalls)
24. [Pro Examples Index](#24-pro-examples-index)

---

## 1. Package Import

```bash
npm install @xyflow/react
```

Import what you need — tree-shaking is supported:

```ts
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Panel,
  // hooks
  useReactFlow,
  useNodesState,
  useEdgesState,
  useOnViewportChange,
  useNodeId,
  useHandleConnections,
  useNodesData,
  useKeyPress,
  // types
  type Node,
  type Edge,
  type NodeTypes,
  type EdgeTypes,
  type Connection,
  type NodeChange,
  type EdgeChange,
  type ReactFlowInstance,
  type XYPosition,
  type CoordinateExtent,
  type NodeOrigin,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
```

> **Always import the stylesheet.** Without it nodes and edges render without styles, handles are invisible, and the canvas background is missing.

---

## 2. Core Setup

The minimal wired-up canvas:

```tsx
'use client';

import { useCallback } from 'react';
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Start' } },
  { id: '2', position: { x: 200, y: 100 }, data: { label: 'End' } },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2' },
];

export default function FlowCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  );

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} />
      </ReactFlow>
    </div>
  );
}
```

### Key `<ReactFlow>` props

| Prop | Type | Purpose |
|---|---|---|
| `nodes` | `Node[]` | Controlled node state |
| `edges` | `Edge[]` | Controlled edge state |
| `onNodesChange` | `(changes: NodeChange[]) => void` | Apply node mutations |
| `onEdgesChange` | `(changes: EdgeChange[]) => void` | Apply edge mutations |
| `onConnect` | `(connection: Connection) => void` | Handle new connections |
| `nodeTypes` | `NodeTypes` | Custom node component map |
| `edgeTypes` | `EdgeTypes` | Custom edge component map |
| `fitView` | `boolean` | Fit all nodes on mount |
| `fitViewOptions` | `FitViewOptions` | Padding, min/max zoom, nodes subset |
| `nodeOrigin` | `[number, number]` | Default `[0,0]`; `[0.5, 0.5]` centres nodes |
| `snapToGrid` | `boolean` | Enable grid snapping |
| `snapGrid` | `[number, number]` | Grid cell size, e.g. `[16, 16]` |
| `minZoom` / `maxZoom` | `number` | Zoom limits |
| `proOptions` | `{ hideAttribution: boolean }` | Hide the React Flow attribution |
| `deleteKeyCode` | `string \| string[]` | Key(s) to delete selected elements |
| `multiSelectionKeyCode` | `string` | Default `'Shift'` |
| `panOnDrag` | `boolean \| number[]` | Allow pan; limit to mouse button numbers |
| `panOnScroll` | `boolean` | Trackpad pan |
| `zoomOnScroll` | `boolean` | Scroll to zoom |
| `elementsSelectable` | `boolean` | Allow selection |
| `nodesConnectable` | `boolean` | Allow connecting nodes |
| `nodesDraggable` | `boolean` | Allow dragging nodes |

---

## 3. ReactFlowProvider

`useReactFlow()` and other hooks **must** be called inside a `ReactFlowProvider`. When using `<ReactFlow>` directly as the root, the provider is implicit. Wrap explicitly when the flow is split across components or when hooks are needed outside the canvas component itself.

```tsx
// app/canvas/layout.tsx
import { ReactFlowProvider } from '@xyflow/react';

export default function CanvasLayout({ children }: { children: React.ReactNode }) {
  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
```

```tsx
// Sidebar that needs flow instance access
import { useReactFlow } from '@xyflow/react';

function NodePalette() {
  const { addNodes, screenToFlowPosition } = useReactFlow();
  // ...
}
```

> In Next.js App Router, mark any file that uses React Flow hooks with `'use client'` — React Flow is strictly client-side.

---

## 4. TypeScript Typing

### Typed nodes and edges

```ts
// types/flow.ts

export type NodeData = {
  label: string;
  description?: string;
  status?: 'idle' | 'running' | 'done' | 'error';
};

export type AppNode = Node<NodeData>;
export type AppEdge = Edge<{ animated?: boolean }>;
```

```tsx
import { useNodesState, useEdgesState } from '@xyflow/react';
import type { AppNode, AppEdge } from '@/types/flow';

const [nodes, setNodes, onNodesChange] = useNodesState<AppNode>([]);
const [edges, setEdges, onEdgesChange] = useEdgesState<AppEdge>([]);
```

### Typing custom node props

```ts
import { type NodeProps } from '@xyflow/react';
import type { AppNode } from '@/types/flow';

type ProcessNodeProps = NodeProps<AppNode>;

export function ProcessNode({ data, selected }: ProcessNodeProps) {
  return (
    <div className={cn('node-base', selected && 'ring-2 ring-primary')}>
      {data.label}
    </div>
  );
}
```

### Typing custom edge props

```ts
import { type EdgeProps } from '@xyflow/react';

export function AnimatedEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps) {
  // ...
}
```

---

## 5. Custom Nodes

### Anatomy

A custom node is a React component receiving `NodeProps`. It must contain at least one `<Handle>` to accept connections.

```tsx
// components/flow/nodes/ActionNode.tsx
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';

type ActionNodeData = {
  label: string;
  icon?: React.ReactNode;
};

export function ActionNode({ data, selected }: NodeProps<Node<ActionNodeData>>) {
  return (
    <>
      <Handle type="target" position={Position.Top} />

      <div className={cn(
        'min-w-[160px] rounded-lg border bg-card px-4 py-3 shadow-sm',
        selected && 'border-primary ring-1 ring-primary',
      )}>
        <div className="flex items-center gap-2">
          {data.icon}
          <span className="text-sm font-medium">{data.label}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} />
    </>
  );
}
```

### Registering node types

Always define `nodeTypes` **outside** the component or use `useMemo` — otherwise React Flow re-renders every node on every render.

```tsx
// constants/flow.ts
import { ActionNode } from '@/components/flow/nodes/ActionNode';
import { ConditionNode } from '@/components/flow/nodes/ConditionNode';
import { type NodeTypes } from '@xyflow/react';

export const nodeTypes: NodeTypes = {
  action: ActionNode,
  condition: ConditionNode,
};
```

```tsx
// In the canvas component
import { nodeTypes } from '@/constants/flow';

<ReactFlow nodeTypes={nodeTypes} ... />
```

### Updating node data from inside the node

```tsx
import { useReactFlow } from '@xyflow/react';

function LabelInput({ id, initialLabel }: { id: string; initialLabel: string }) {
  const { updateNodeData } = useReactFlow();

  return (
    <input
      defaultValue={initialLabel}
      onChange={(e) => updateNodeData(id, { label: e.target.value })}
      className="nodrag" // prevents drag while editing
    />
  );
}
```

### `nodrag`, `nopan`, `nowheel`

Apply these CSS class names to elements inside a custom node to prevent React Flow from intercepting pointer events:

- `nodrag` — element captures pointer; node won't drag
- `nopan` — element captures pointer; canvas won't pan
- `nowheel` — element captures wheel; canvas won't zoom

---

## 6. Custom Edges

### Basic custom edge with label

```tsx
// components/flow/edges/LabeledEdge.tsx
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react';

export function LabeledEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, data,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{ transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          className="nodrag nopan pointer-events-all absolute rounded bg-background px-2 py-1 text-xs shadow"
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
```

### Path helpers

| Helper | Use case |
|---|---|
| `getBezierPath` | Smooth S-curve (default) |
| `getSmoothStepPath` | Right-angled with rounded corners |
| `getStraightPath` | Direct straight line |
| `getSimpleBezierPath` | Single-bend bezier |

### Editable / interactive edges

Use `EdgeLabelRenderer` for any interactive edge content. Apply `pointer-events-all` on the rendered element and `nodrag nopan` to prevent canvas interaction stealing.

See example: `.claude/examples/react-flow/editable-edge`

### Registering edge types

```ts
// constants/flow.ts
import { LabeledEdge } from '@/components/flow/edges/LabeledEdge';
import { type EdgeTypes } from '@xyflow/react';

export const edgeTypes: EdgeTypes = {
  labeled: LabeledEdge,
};
```

---

## 7. Nested / Grouped Nodes

React Flow supports parent–child node relationships via the `parentId` field. A child node's position is relative to its parent.

```ts
const nodes: Node[] = [
  {
    id: 'group-1',
    type: 'group',
    position: { x: 100, y: 100 },
    style: { width: 400, height: 300 },
    data: {},
  },
  {
    id: 'child-1',
    parentId: 'group-1',
    extent: 'parent',        // constrain dragging within parent
    position: { x: 40, y: 60 },
    data: { label: 'Child Node' },
  },
];
```

### Key options

| Property | Purpose |
|---|---|
| `parentId` | Makes this node a child of the given node id |
| `extent: 'parent'` | Constrains child dragging within the parent bounds |
| `expandParent: true` | Parent expands to always contain this child |

### Group node type

For a styled group container, register a custom `group` node type that renders a resizable container with no handles (or optional ones):

```tsx
export function GroupNode({ selected }: NodeProps) {
  return (
    <div className={cn(
      'size-full rounded-xl border-2 border-dashed bg-muted/30',
      selected && 'border-primary',
    )} />
  );
}
```

See example: `.claude/examples/react-flow/parent-child-relation`  
See example: `.claude/examples/react-flow/expand-collapse`  
See example: `.claude/examples/react-flow/selection-grouping`

---

## 8. Node Resizing

Install the node resizer subpackage (included in `@xyflow/react` v12+, previously separate):

```tsx
import { NodeResizer, NodeResizeControl } from '@xyflow/react';

export function ResizableNode({ selected, data }: NodeProps) {
  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={100}
        minHeight={50}
        onResize={(_, params) => {
          // params: { x, y, width, height }
        }}
      />
      <div className="node-content">{data.label}</div>
    </>
  );
}
```

`NodeResizeControl` lets you place a single resize handle at a specific corner:

```tsx
<NodeResizeControl position="bottom-right" style={{ border: 'none', background: 'transparent' }}>
  <ResizeIcon />
</NodeResizeControl>
```

---

## 9. MiniMap

```tsx
import { MiniMap } from '@xyflow/react';

<MiniMap
  nodeStrokeWidth={3}
  nodeColor={(node) => {
    switch (node.type) {
      case 'action': return '#6366f1';
      case 'condition': return '#f59e0b';
      default: return '#e2e8f0';
    }
  }}
  maskColor="rgba(0,0,0,0.1)"
  pannable
  zoomable
/>
```

### Theming

The MiniMap respects CSS variables. Override in your global stylesheet:

```css
.react-flow__minimap {
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
}
```

---

## 10. Controls

```tsx
import { Controls, ControlButton } from '@xyflow/react';
import { LayoutIcon } from 'lucide-react';

<Controls showInteractive={false}>
  <ControlButton onClick={runAutoLayout} title="Auto layout">
    <LayoutIcon size={16} />
  </ControlButton>
</Controls>
```

`showInteractive={false}` hides the lock/unlock button when you don't need it.

---

## 11. Keyboard Shortcuts

React Flow handles these by default:

| Key | Action |
|---|---|
| `Backspace` / `Delete` | Delete selected nodes and edges |
| `Escape` | Deselect all |
| `Shift+click` | Add to selection |
| `Ctrl/Cmd+A` | Select all |
| `Ctrl/Cmd+Z` | Undo (if implemented) |
| `Ctrl/Cmd+Shift+Z` | Redo (if implemented) |
| `Ctrl/Cmd+C` / `V` | Copy/paste (if implemented) |

### Custom key bindings with `useKeyPress`

```tsx
import { useKeyPress } from '@xyflow/react';

function FlowShortcuts() {
  const escPressed = useKeyPress('Escape');
  const savePressed = useKeyPress(['Meta+s', 'Control+s']);

  useEffect(() => {
    if (savePressed) handleSave();
  }, [savePressed]);

  return null;
}
```

### Disable default delete key

```tsx
<ReactFlow deleteKeyCode={null} ... />
```

---

## 12. Undo / Redo

React Flow does not ship a built-in undo/redo system. The pattern is to maintain a history stack in a Zustand store (or React state).

```ts
// store/flow-history.ts
import { create } from 'zustand';
import type { AppNode, AppEdge } from '@/types/flow';

type Snapshot = { nodes: AppNode[]; edges: AppEdge[] };

type HistoryState = {
  past: Snapshot[];
  future: Snapshot[];
  pushSnapshot: (snapshot: Snapshot) => void;
  undo: () => Snapshot | undefined;
  redo: () => Snapshot | undefined;
};

export const useFlowHistory = create<HistoryState>((set, get) => ({
  past: [],
  future: [],

  pushSnapshot(snapshot) {
    set((s) => ({
      past: [...s.past, snapshot],
      future: [],           // clear redo stack on new action
    }));
  },

  undo() {
    const { past, future } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    set({ past: past.slice(0, -1), future: [previous, ...future] });
    return previous;
  },

  redo() {
    const { past, future } = get();
    if (future.length === 0) return;
    const next = future[0];
    set({ past: [...past, next], future: future.slice(1) });
    return next;
  },
}));
```

```tsx
// In your canvas component
const { pushSnapshot, undo, redo } = useFlowHistory();

// Snapshot before every meaningful change
const handleNodesChange = useCallback((changes: NodeChange[]) => {
  // only snapshot on structural changes, not position moves mid-drag
  const isStructural = changes.some(
    (c) => c.type === 'add' || c.type === 'remove',
  );
  if (isStructural) pushSnapshot({ nodes, edges });
  onNodesChange(changes);
}, [nodes, edges, onNodesChange, pushSnapshot]);

// On Ctrl+Z
const handleUndo = useCallback(() => {
  const snapshot = undo();
  if (snapshot) {
    setNodes(snapshot.nodes);
    setEdges(snapshot.edges);
  }
}, [undo, setNodes, setEdges]);
```

See example: `.claude/examples/react-flow/undo-redo`

---

## 13. Copy / Paste

```ts
// hooks/useFlowCopyPaste.ts
import { useCallback, useRef } from 'react';
import { useReactFlow, type Node, type Edge } from '@xyflow/react';
import { nanoid } from 'nanoid';

export function useFlowCopyPaste() {
  const { getNodes, getEdges, setNodes, setEdges, screenToFlowPosition } =
    useReactFlow();
  const clipboard = useRef<{ nodes: Node[]; edges: Edge[] }>({
    nodes: [],
    edges: [],
  });

  const copy = useCallback(() => {
    const selectedNodes = getNodes().filter((n) => n.selected);
    const selectedIds = new Set(selectedNodes.map((n) => n.id));
    const selectedEdges = getEdges().filter(
      (e) => selectedIds.has(e.source) && selectedIds.has(e.target),
    );
    clipboard.current = { nodes: selectedNodes, edges: selectedEdges };
  }, [getNodes, getEdges]);

  const paste = useCallback(() => {
    const { nodes: copiedNodes, edges: copiedEdges } = clipboard.current;
    if (!copiedNodes.length) return;

    const idMap = new Map<string, string>();
    const offset = { x: 20, y: 20 };

    const newNodes: Node[] = copiedNodes.map((n) => {
      const newId = nanoid();
      idMap.set(n.id, newId);
      return { ...n, id: newId, position: { x: n.position.x + offset.x, y: n.position.y + offset.y }, selected: true };
    });

    const newEdges: Edge[] = copiedEdges.map((e) => ({
      ...e,
      id: nanoid(),
      source: idMap.get(e.source)!,
      target: idMap.get(e.target)!,
    }));

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), ...newNodes]);
    setEdges((eds) => [...eds, ...newEdges]);
  }, [setNodes, setEdges]);

  return { copy, paste };
}
```

See example: `.claude/examples/react-flow/copy-paste`

---

## 14. Auto Layout

React Flow does not compute layout positions — use a layout algorithm library alongside it.

### Recommended libraries

| Library | Best for |
|---|---|
| `@dagrejs/dagre` | Hierarchical / directed graphs |
| `elkjs` | Complex layered graphs, ports |
| `d3-force` | Force-directed / organic |
| `@antv/layout` | Various including radial, tree |

### Dagre layout helper

```ts
// lib/layout.ts
import dagre from '@dagrejs/dagre';
import type { Node, Edge } from '@xyflow/react';

const NODE_WIDTH = 172;
const NODE_HEIGHT = 48;

export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB',
) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: 60, nodesep: 40 });

  nodes.forEach((node) => {
    g.setNode(node.id, {
      width: node.measured?.width ?? NODE_WIDTH,
      height: node.measured?.height ?? NODE_HEIGHT,
    });
  });

  edges.forEach((edge) => g.setEdge(edge.source, edge.target));

  dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const { x, y } = g.node(node.id);
      return {
        ...node,
        position: {
          x: x - (node.measured?.width ?? NODE_WIDTH) / 2,
          y: y - (node.measured?.height ?? NODE_HEIGHT) / 2,
        },
      };
    }),
    edges,
  };
}
```

```tsx
// Usage in canvas
const onLayout = useCallback(() => {
  const { nodes: layouted, edges: layoutedEdges } = getLayoutedElements(nodes, edges);
  setNodes(layouted);
  setEdges(layoutedEdges);

  window.requestAnimationFrame(() => fitView({ padding: 0.2 }));
}, [nodes, edges, setNodes, setEdges, fitView]);
```

> Use `node.measured?.width` / `.height` (v12) for exact rendered dimensions instead of hardcoded values.

See example: `.claude/examples/react-flow/auto-layout`  
See example: `.claude/examples/react-flow/dynamic-layouting`  
See example: `.claude/examples/react-flow/force-layout`

---

## 15. Helper Lines

Helper lines (alignment guides) show as the user drags a node near alignment with another. The pattern:

1. Track `onNodeDrag` to compute intersecting alignment axes.
2. Render SVG lines via a custom `<svg>` overlay positioned over the flow.
3. Snap node position if within threshold.

```ts
// lib/helperLines.ts
export type HelperLines = {
  horizontal?: number;
  vertical?: number;
};

export function getHelperLines(
  change: NodePositionChange,
  nodes: Node[],
  distance = 5,
): HelperLines {
  // Compare the dragged node's bounding box against all other nodes
  // Return { horizontal, vertical } when within `distance` pixels of alignment
  // ... (see pro example for full implementation)
}
```

```tsx
// Overlay component
function HelperLinesRenderer({ horizontal, vertical }: HelperLines) {
  const { viewport } = useReactFlow();
  // Render two <line> elements in an absolute <svg> over the canvas
}
```

See example: `.claude/examples/react-flow/helper-lines`

---

## 16. Freehand Drawing

Freehand drawing is implemented as a custom interaction layer on top of the React Flow canvas. The approach:

1. A full-size `<canvas>` or SVG element overlays the flow with `pointer-events-none` unless in draw mode.
2. In draw mode, pointer events are captured, strokes are recorded as SVG path data.
3. On stroke end, the path is either kept as a decorative overlay or converted to a React Flow node.

```tsx
// hooks/useFreehandDraw.ts
import { useRef, useState, useCallback } from 'react';

export function useFreehandDraw(enabled: boolean) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  const currentPath = useRef<string>('');

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (!enabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    currentPath.current = `M ${e.clientX} ${e.clientY}`;
  }, [enabled]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!enabled || !currentPath.current) return;
    currentPath.current += ` L ${e.clientX} ${e.clientY}`;
    // force re-render by updating a temp state
  }, [enabled]);

  const onPointerUp = useCallback(() => {
    if (!currentPath.current) return;
    setPaths((prev) => [...prev, currentPath.current]);
    currentPath.current = '';
  }, []);

  return { svgRef, paths, onPointerDown, onPointerMove, onPointerUp };
}
```

See example: `.claude/examples/react-flow/freehand-draw`

---

## 17. Shapes

Shape nodes extend custom nodes to render geometric SVG shapes instead of HTML div containers. Register each shape as its own node type or use a single parametric `ShapeNode` component:

```tsx
// components/flow/nodes/ShapeNode.tsx
import { NodeResizer, type NodeProps, type Node } from '@xyflow/react';

type ShapeType = 'rectangle' | 'circle' | 'diamond' | 'hexagon' | 'parallelogram';

type ShapeNodeData = {
  shape: ShapeType;
  label?: string;
  color?: string;
};

export function ShapeNode({ data, selected, width = 120, height = 80 }: NodeProps<Node<ShapeNodeData>>) {
  return (
    <>
      <NodeResizer isVisible={selected} />
      <svg width={width} height={height} className="overflow-visible">
        {renderShape(data.shape, width, height, data.color)}
        {data.label && (
          <text x={width / 2} y={height / 2} textAnchor="middle" dominantBaseline="middle" fontSize={13}>
            {data.label}
          </text>
        )}
      </svg>
    </>
  );
}
```

See example: `.claude/examples/react-flow/shapes`

---

## 18. Drag and Drop

### Drop from sidebar onto canvas

```tsx
// Draggable palette item
function PaletteItem({ type }: { type: string }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('application/reactflow', type);
        e.dataTransfer.effectAllowed = 'move';
      }}
      className="cursor-grab rounded border px-3 py-2"
    >
      {type}
    </div>
  );
}
```

```tsx
// Canvas drop handler
import { useReactFlow } from '@xyflow/react';
import { nanoid } from 'nanoid';

function FlowCanvas() {
  const { screenToFlowPosition, addNodes } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = screenToFlowPosition({ x: e.clientX, y: e.clientY });

    addNodes({
      id: nanoid(),
      type,
      position,
      data: { label: `${type} node` },
    });
  }, [screenToFlowPosition, addNodes]);

  return (
    <div ref={reactFlowWrapper} style={{ width: '100%', height: '100vh' }}>
      <ReactFlow onDragOver={onDragOver} onDrop={onDrop} ... />
    </div>
  );
}
```

---

## 19. Context Menu

### Node context menu

```tsx
// hooks/useContextMenu.ts
import { useState, useCallback } from 'react';
import type { Node } from '@xyflow/react';

type ContextMenuState = {
  node: Node;
  x: number;
  y: number;
} | null;

export function useContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState>(null);

  const onNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault();
    setMenu({ node, x: e.clientX, y: e.clientY });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  return { menu, onNodeContextMenu, closeMenu };
}
```

```tsx
// components/flow/NodeContextMenu.tsx
import { useReactFlow } from '@xyflow/react';

export function NodeContextMenu({ node, x, y, onClose }: ContextMenuProps) {
  const { deleteElements, setNodes } = useReactFlow();

  return (
    <div
      style={{ position: 'fixed', top: y, left: x }}
      className="z-50 min-w-[160px] rounded-lg border bg-popover p-1 shadow-md"
      onMouseLeave={onClose}
    >
      <button
        className="menu-item"
        onClick={() => { deleteElements({ nodes: [node] }); onClose(); }}
      >
        Delete
      </button>
      <button
        className="menu-item"
        onClick={() => { duplicateNode(node, setNodes); onClose(); }}
      >
        Duplicate
      </button>
    </div>
  );
}
```

```tsx
// In canvas component
const { menu, onNodeContextMenu, closeMenu } = useContextMenu();

<ReactFlow onNodeContextMenu={onNodeContextMenu} onClick={closeMenu} ...>
  {menu && <NodeContextMenu {...menu} onClose={closeMenu} />}
</ReactFlow>
```

---

## 20. Workflow Editor Patterns

Appollo's canvas is a workflow editor. These patterns form the core interaction model.

### Node status visualization

Drive visual state entirely from `node.data.status` — never store UI state in the node type:

```tsx
const statusStyles: Record<string, string> = {
  idle: 'border-border',
  running: 'border-blue-400 animate-pulse',
  done: 'border-emerald-400',
  error: 'border-red-400',
};

<div className={cn('node-base', statusStyles[data.status ?? 'idle'])}>
```

### Validation / connection rules

Use `isValidConnection` to restrict which nodes can connect:

```tsx
<ReactFlow
  isValidConnection={(connection) => {
    const sourceNode = getNode(connection.source);
    const targetNode = getNode(connection.target);
    // e.g. don't allow connecting a trigger to another trigger
    return !(sourceNode?.type === 'trigger' && targetNode?.type === 'trigger');
  }}
/>
```

### Edge markers and animation

```ts
const edge: Edge = {
  id: 'e1-2',
  source: '1',
  target: '2',
  animated: true,   // built-in dashed animation
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: '#6366f1',
  },
  style: { stroke: '#6366f1', strokeWidth: 2 },
};
```

### Zustand store for flow state

For a canvas this complex, co-locate all flow state in a single Zustand store:

```ts
// store/flow.ts
import { create } from 'zustand';
import {
  applyNodeChanges, applyEdgeChanges,
  type Node, type Edge, type NodeChange, type EdgeChange, type Connection,
  addEdge,
} from '@xyflow/react';

type FlowStore = {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
};

export const useFlowStore = create<FlowStore>((set, get) => ({
  nodes: [],
  edges: [],
  onNodesChange: (changes) =>
    set({ nodes: applyNodeChanges(changes, get().nodes) }),
  onEdgesChange: (changes) =>
    set({ edges: applyEdgeChanges(changes, get().edges) }),
  onConnect: (connection) =>
    set({ edges: addEdge(connection, get().edges) }),
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
}));
```

### Node position animation

Animate nodes moving to new positions (e.g. after auto-layout) using a spring or tween:

```ts
// Trigger layout, then animate each node to its new position
// See: .claude/examples/react-flow/node-position-animation
```

### Panel layout

```tsx
<ReactFlow ...>
  <Background />
  <Controls />
  <MiniMap />

  {/* Toolbar top-left */}
  <Panel position="top-left">
    <Toolbar />
  </Panel>

  {/* Properties panel top-right */}
  <Panel position="top-right">
    <PropertiesPanel selectedNode={selectedNode} />
  </Panel>
</ReactFlow>
```

See example: `.claude/examples/react-flow/workflow-editor`  
See example: `.claude/examples/react-flow/ai-workflow-editor`

---

## 21. Liveblocks Real-Time Collaboration

Multi-user presence on the canvas. Liveblocks stores nodes and edges in a shared `LiveList`/`LiveMap` and broadcasts cursor positions.

### Setup

```bash
npm install @liveblocks/client @liveblocks/react
```

```ts
// liveblocks.config.ts
import { createClient } from '@liveblocks/client';
import { createRoomContext } from '@liveblocks/react';
import type { Node, Edge } from '@xyflow/react';

const client = createClient({ publicApiKey: process.env.NEXT_PUBLIC_LIVEBLOCKS_KEY! });

type Presence = {
  cursor: { x: number; y: number } | null;
  selectedNodeIds: string[];
};

type Storage = {
  nodes: LiveList<Node>;
  edges: LiveList<Edge>;
};

export const { RoomProvider, useStorage, useMutation, useOthers, useSelf } =
  createRoomContext<Presence, Storage>(client);
```

### Shared nodes and edges

```tsx
// components/flow/CollaborativeFlow.tsx
'use client';

import { RoomProvider, useStorage, useMutation } from '@/liveblocks.config';

function Flow() {
  const nodes = useStorage((root) => root.nodes.toArray());
  const edges = useStorage((root) => root.edges.toArray());

  const updateNodes = useMutation(({ storage }, changes: NodeChange[]) => {
    const liveNodes = storage.get('nodes');
    // apply changes to LiveList...
  }, []);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={updateNodes}
      ...
    />
  );
}

export function CollaborativeFlow() {
  return (
    <RoomProvider id="appollo-canvas-1" initialPresence={{ cursor: null, selectedNodeIds: [] }}>
      <ReactFlowProvider>
        <Flow />
      </ReactFlowProvider>
    </RoomProvider>
  );
}
```

### Multiplayer cursors

```tsx
function Cursors() {
  const others = useOthers();
  const { project } = useReactFlow(); // flow position from screen

  return (
    <>
      {others.map(({ connectionId, presence }) =>
        presence.cursor ? (
          <div
            key={connectionId}
            style={{
              position: 'absolute',
              transform: `translate(${presence.cursor.x}px, ${presence.cursor.y}px)`,
              pointerEvents: 'none',
            }}
          >
            <CursorIcon color={getColorForConnection(connectionId)} />
          </div>
        ) : null
      )}
    </>
  );
}
```

See example: `.claude/examples/react-flow/collaborative`

---

## 22. Key Hooks Reference

| Hook | Returns | Notes |
|---|---|---|
| `useReactFlow()` | `ReactFlowInstance` | Full instance: `getNodes`, `setNodes`, `addNodes`, `deleteElements`, `fitView`, `screenToFlowPosition`, `getIntersectingNodes`, `updateNodeData`, etc. Must be inside `ReactFlowProvider`. |
| `useNodesState(initial)` | `[nodes, setNodes, onNodesChange]` | Managed state with built-in change handler |
| `useEdgesState(initial)` | `[edges, setEdges, onEdgesChange]` | Managed state with built-in change handler |
| `useOnViewportChange({ onStart, onChange, onEnd })` | `void` | React to pan/zoom |
| `useNodeId()` | `string` | ID of the enclosing custom node; use inside node components |
| `useHandleConnections({ type, nodeId, id })` | `Connection[]` | Active connections on a handle |
| `useNodesData(ids)` | `NodeData[]` | Subscribe to data of specific nodes |
| `useKeyPress(keyCode)` | `boolean` | True while key held |
| `useStore(selector)` | `T` | Raw access to internal RF store; prefer other hooks |
| `useUpdateNodeInternals()` | `(id: string) => void` | Force RF to recalculate node handles after dynamic changes |

### `useReactFlow` methods cheatsheet

```ts
const {
  // Node helpers
  getNode,            // (id) => Node | undefined
  getNodes,           // () => Node[]
  setNodes,           // (nodes | updater) => void
  addNodes,           // (nodes) => void
  updateNode,         // (id, changes) => void
  updateNodeData,     // (id, data) => void
  deleteElements,     // ({ nodes, edges }) => void

  // Edge helpers
  getEdge,
  getEdges,
  setEdges,
  addEdges,
  updateEdge,

  // Viewport
  fitView,
  zoomIn,
  zoomOut,
  zoomTo,
  getZoom,
  setCenter,
  getViewport,
  setViewport,

  // Coordinates
  screenToFlowPosition,   // (xy) => flow-space xy
  flowToScreenPosition,   // (xy) => screen-space xy

  // Intersection
  getIntersectingNodes,   // (node | rect, partially?) => Node[]
  isNodeIntersecting,     // (node, area, partially?) => boolean
} = useReactFlow();
```

---

## 23. Common Pitfalls

### ❌ Defining `nodeTypes` / `edgeTypes` inside render

```tsx
// BAD — object reference changes every render, RF remounts all nodes
function Canvas() {
  return <ReactFlow nodeTypes={{ custom: CustomNode }} />;
}

// GOOD — stable reference
const nodeTypes: NodeTypes = { custom: CustomNode };
function Canvas() {
  return <ReactFlow nodeTypes={nodeTypes} />;
}
```

### ❌ Missing `'use client'` in Next.js App Router

React Flow uses `useEffect`, `useRef`, `useLayoutEffect`, and browser APIs. Any file importing from `@xyflow/react` must be a Client Component.

### ❌ Forgetting to import the stylesheet

```ts
// Required — without this, handles are invisible and styles break
import '@xyflow/react/dist/style.css';
```

### ❌ Using `node.width` / `node.height` before measurement

In v12, actual rendered dimensions are in `node.measured.width` and `node.measured.height`. They are `undefined` until after the first render. Use `useUpdateNodeInternals()` after dynamically changing handles.

### ❌ Calling `useReactFlow()` outside a provider

Components that call `useReactFlow()` must be descendants of `<ReactFlowProvider>` or rendered inside `<ReactFlow>` (which implicitly wraps one).

### ❌ Mutating node/edge objects directly

Always return new objects from state updaters — React Flow uses reference equality for change detection:

```ts
// BAD
nodes[0].data.label = 'New';
setNodes([...nodes]);

// GOOD
setNodes((nds) => nds.map((n) =>
  n.id === '1' ? { ...n, data: { ...n.data, label: 'New' } } : n
));

// BEST (v12)
updateNodeData('1', { label: 'New' });
```

### ❌ Forgetting `nodrag` on interactive elements inside nodes

Inputs, buttons, sliders — anything the user interacts with inside a custom node needs `className="nodrag"` (or `nopan`) so the canvas doesn't intercept pointer events.

### ❌ `fitView` called before nodes have rendered

`fitView` needs node dimensions. Call it inside `onInit` or defer with `requestAnimationFrame`:

```tsx
<ReactFlow onInit={(instance) => instance.fitView({ padding: 0.1 })} />
```

### ❌ Large graphs with no virtualization

React Flow renders all nodes in the DOM. For graphs > ~500 nodes, investigate `<ReactFlow nodeExtent>` to restrict the viewport, or implement virtualization by only adding nodes near the viewport to state.

---

## 24. Pro Examples Index

All examples live in `.claude/examples/react-flow/`. Each folder contains a working Next.js-compatible implementation ready to copy into Appollo.

| Example | Folder | Key techniques |
|---|---|---|
| AI Workflow Editor | `ai-workflow-editor` | Node types for AI steps, streaming status updates, custom edge with token flow animation |
| Auto Layout | `auto-layout` | Dagre integration, layout on demand, `fitView` after layout |
| Collaborative (Liveblocks) | `collaborative` | `RoomProvider`, shared `LiveList` nodes/edges, multiplayer cursors, presence |
| Copy / Paste | `copy-paste` | Clipboard ref, id remapping, offset paste, Ctrl+C / Ctrl+V key bindings |
| Dynamic Layouting | `dynamic-layouting` | Layout recalculated as nodes are added/removed, animated transitions |
| Editable Edge | `editable-edge` | `EdgeLabelRenderer`, inline text edit on double-click, `pointer-events-all` |
| Expand / Collapse | `expand-collapse` | `parentId`, toggling child node visibility, re-layout on toggle |
| Force Layout | `force-layout` | `d3-force` simulation, live position updates during simulation |
| Freehand Draw | `freehand-draw` | SVG overlay, pointer capture, stroke-to-path, draw mode toggle |
| Helper Lines | `helper-lines` | `onNodeDrag` alignment detection, SVG overlay guides, threshold snap |
| Node Position Animation | `node-position-animation` | Spring animation to new positions after layout changes |
| Parent–Child Relation | `parent-child-relation` | `parentId`, `extent: 'parent'`, `expandParent`, nested drag |
| Remove Attribution | `remove-attribution` | `proOptions={{ hideAttribution: true }}` |
| Selection Grouping | `selection-grouping` | Multi-select → create group node, assign `parentId` to selected nodes |
| Server-Side Image Creation | `server-side-image-creation` | Puppeteer / `@playwright/browser` headless render, export canvas as PNG |
| Shapes | `shapes` | SVG shape renderer inside custom nodes, `NodeResizer`, shape type switcher |
| Undo / Redo | `undo-redo` | History stack in Zustand, snapshot on structural change, Ctrl+Z / Ctrl+Shift+Z |
| Workflow Editor | `workflow-editor` | Full editor shell: sidebar palette, drag-and-drop, properties panel, save/load |

---

*Last updated: Appollo project — `.claude/react-flow.md`*