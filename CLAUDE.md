# CLAUDE.md — InfiniteCanvas Migration

This file is the entry point for this migration task. Read this first, then load
`.claude/react-flow.md` before writing any code.

## What this task is

Migrate the existing custom `InfiniteCanvas` component to **React Flow v12**.

The current canvas is a single core component (`InfiniteCanvas`) that is composed
differently across multiple pages with slight feature variations. The migration should
preserve this architecture — one core canvas component, composed per page.

## Knowledge base

| Doc | When to read it |
|-----|----------------|
| `.claude/react-flow.md` | Before writing any React Flow code — covers all patterns, APIs, and gotchas |

## Package

React Flow v12 is imported from `@xyflow/react` — not `react-flow-renderer`:

import { ReactFlow, ... } from '@xyflow/react'
import '@xyflow/react/dist/style.css'

## Non-negotiable rules

- **Always** wrap the canvas in `<ReactFlowProvider>` when `useReactFlow()` is needed outside `<ReactFlow>`
- **Always** define `nodeTypes` and `edgeTypes` OUTSIDE the component — inline definitions cause infinite re-renders
- **Always** use `useCallback` for all event handlers passed to `<ReactFlow>`
- **Never** type node or edge data as `any` — define explicit TypeScript types
- **Always** add `"use client"` — React Flow is entirely client-side

## Migration approach

Before implementing anything, ask clarifying questions until 90% confident about:
1. What the current `InfiniteCanvas` does and what props it accepts
2. Which page variations exist and what differs between them
3. What node types and edge types need to be created
4. What interactions exist (drag, connect, delete, resize, keyboard shortcuts)

Before starting any implementation, ask clarifying questions until you are at least 90% confident you understand the requirement. Do not begin coding while ambiguity remains.

Do not start migrating until the scope is clear. Flag any decisions made during implementation explicitly.