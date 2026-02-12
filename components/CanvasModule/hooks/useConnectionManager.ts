"use client";

import { useMemo, useRef, useState } from "react";
import { LiveList, LiveObject } from "@liveblocks/client";
//import { useStorage, useMutation } from "@/app/liveblocks";
import { Shape, Position } from "../types";
import { useMutation, useStorage } from "@liveblocks/react";

/** Relative anchor inside a shape (0..1 in both axes) */
export type Anchor = { x: number; y: number };
type Side = "top" | "right" | "bottom" | "left";

/** A persisted connection between two shapes via relative anchors */
export type Connection = {
  id: string;
  fromShapeId: Shape["id"]; // matches your Shape id type (number or string)
  fromAnchor: Anchor;
  toShapeId: Shape["id"];
  toAnchor: Anchor;

  fromSide?: Side;
  toSide?: Side;
  style?: "curved" | "orthogonal";
};

/** Helper: absolute pos from a shape + relative anchor */
export function getAbsoluteAnchorPosition(
  shape: Shape,
  anchor: Anchor
): Position {
  return {
    x: shape.x + shape.width * anchor.x,
    y: shape.y + shape.height * anchor.y,
  };
}

function sideFromAnchor(a: { x: number; y: number }, tol = 0.15): Side {
  const { x, y } = a;
  const dTop = y; // distance to top
  const dBottom = 1 - y; // distance to bottom
  const dLeft = x; // distance to left
  const dRight = 1 - x; // distance to right

  const best = Math.min(dTop, dBottom, dLeft, dRight);

  if (best === dTop && dTop <= tol) return "top";
  if (best === dBottom && dBottom <= tol) return "bottom";
  if (best === dLeft && dLeft <= tol) return "left";
  return "right"; // default/fallback
}

/** Helper: convert absolute point to relative anchor for a given shape */
export function computeRelativeAnchor(shape: Shape, point: Position): Anchor {
  const w = shape.width || 1;
  const h = shape.height || 1;
  // Clamp to [0,1] so arrows stay on edges even on tiny numerical drift
  const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
  return {
    x: clamp01((point.x - shape.x) / w),
    y: clamp01((point.y - shape.y) / h),
  };
}

/** Helper: find a shape by id (tiny convenience) */
function byId(shapes: Shape[], id: Shape["id"]) {
  return shapes.find((s) => s.id === id) || null;
}

/**
 * Centralized connection manager (Liveblocks-powered):
 * - Reads connections from Liveblocks Storage (root.connections: LiveList<LiveObject>)
 * - Adds/removes/updates connections via mutations
 * - Computes absolute endpoints for rendering
 *
 * Selection state is kept local (not shared).
 */
export function useConnectionManager() {
  const storage = useStorage((root) => root);
  const liveConnections = useStorage((root) => root.connections);

  // READ (plain snapshots for render)
  // const connections: Connection[] =
  //   useStorage((root) => {
  //     const list = root.connections as
  //       | LiveList<LiveObject<Connection>>
  //       | undefined;
  //     if (!list) return [];
  //     // Avoid .toObject() (not present on proxied snapshots). Read fields explicitly.
  //     const result: Connection[] = [];
  //     for (let i = 0; i < list.length; i++) {
  //       const lo = list.get(i)!;
  //       result.push({
  //         id: lo.get("id") as string,
  //         fromShapeId: lo.get("fromShapeId") as Shape["id"],
  //         fromAnchor: lo.get("fromAnchor") as Anchor,
  //         toShapeId: lo.get("toShapeId") as Shape["id"],
  //         toAnchor: lo.get("toAnchor") as Anchor,
  //       });
  //     }
  //     return result;
  //   }) ?? [];

  const connections: Connection[] = useMemo(() => {
    if (!liveConnections) return [];
    // return liveShapes.map(fromLiveShape);

    return liveConnections as Connection[];
  }, [liveConnections, storage]);

  // WRITE: push a new connection
  const addConnectionRelative = useMutation(
    ({ storage }, input: Omit<Connection, "id"> & { id?: string }) => {
      const list = storage.get("connections") as LiveList<
        LiveObject<Connection>
      >;
      const id = input.id ?? crypto.randomUUID();
      const conn: Connection = { id, ...input } as Connection;
      list.push(new LiveObject(conn));
      return id;
    },
    []
  );

  // WRITE: remove by id(s)
  const removeConnection = useMutation(({ storage }, id: string) => {
    const list = storage.get("connections") as LiveList<LiveObject<Connection>>;
    for (let i = list.length - 1; i >= 0; i--) {
      const lo = list.get(i)!;
      if ((lo.get("id") as string) === id) {
        list.delete(i);
        break;
      }
    }
  }, []);

  const removeConnectionsByIds = useMutation(({ storage }, ids: string[]) => {
    const set = new Set(ids);
    const list = storage.get("connections") as LiveList<LiveObject<Connection>>;
    for (let i = list.length - 1; i >= 0; i--) {
      const lo = list.get(i)!;
      if (set.has(lo.get("id") as string)) list.delete(i);
    }
  }, []);

  // WRITE: patch/update by id
  const updateConnection = useMutation(
    ({ storage }, params: { id: string; patch: Partial<Connection> }) => {
      const list = storage.get("connections") as LiveList<
        LiveObject<Connection>
      >;
      for (let i = 0; i < list.length; i++) {
        const lo = list.get(i)!;
        if ((lo.get("id") as string) === params.id) {
          const { patch } = params;
          // set only provided fields
          if (patch.fromShapeId !== undefined)
            lo.set("fromShapeId", patch.fromShapeId);
          if (patch.toShapeId !== undefined)
            lo.set("toShapeId", patch.toShapeId);
          if (patch.fromAnchor !== undefined)
            lo.set("fromAnchor", patch.fromAnchor);
          if (patch.toAnchor !== undefined) lo.set("toAnchor", patch.toAnchor);
          break;
        }
      }
    },
    []
  );

  /**
   * Finalize a connection from your current “connecting” state + a snap result.
   * Converts absolute points to relative anchors and persists to Liveblocks.
   */
  function finalizeFromSnap(args: {
    connecting: {
      fromShapeId: Shape["id"];
      fromDirection?: "top" | "right" | "bottom" | "left";
      fromPosition: Position; // world coords where the drag started
    };
    snapResult: {
      shapeId: Shape["id"];
      snappedPosition: Position;
      side?: Side;
      // world coords where the line snapped
    };
    shapes: Shape[];
  }) {
    const { connecting, snapResult, shapes } = args;

    const from = byId(shapes, connecting.fromShapeId);
    const to = byId(shapes, snapResult.shapeId);
    if (!from || !to) return null;

    const fromAnchor = computeRelativeAnchor(from, connecting.fromPosition);
    const toAnchor = computeRelativeAnchor(to, snapResult.snappedPosition);

    const id = addConnectionRelative({
      fromShapeId: connecting.fromShapeId,
      fromAnchor,
      toShapeId: snapResult.shapeId,
      toAnchor,

      fromSide: connecting.fromDirection,
      toSide: snapResult.side,

      style: "orthogonal",
    });

    return id;
  }

  /** Compute absolute endpoints for rendering against current shapes */
  // function useConnectionEndpoints(shapes: Shape[]) {
  //   return useMemo(
  //     () =>
  //       connections
  //         .map((c) => {
  //           const from = byId(shapes, c.fromShapeId);
  //           const to = byId(shapes, c.toShapeId);
  //           if (!from || !to) return null;

  //           const fromPt = getAbsoluteAnchorPosition(from, c.fromAnchor);
  //           const toPt = getAbsoluteAnchorPosition(to, c.toAnchor);

  //           const fromSide = sideFromAnchor(c.fromAnchor);
  //           const toSide = sideFromAnchor(c.toAnchor);

  //           return {
  //             id: c.id,
  //             from: fromPt,
  //             to: toPt,
  //             fromSide,
  //             toSide,
  //             connection: c,
  //           };
  //         })
  //         .filter(Boolean) as Array<{
  //         id: string;
  //         from: Position;
  //         to: Position;
  //         fromSide: Side;
  //         toSide: Side;
  //         connection: Connection;
  //       }>,
  //     [connections, shapes]
  //   );
  // }
  function useConnectionEndpoints(shapes: Shape[]) {
    return useMemo(
      () =>
        connections
          .map((c) => {
            const from = byId(shapes, c.fromShapeId);
            const to = byId(shapes, c.toShapeId);
            if (!from || !to) return null;

            const fromPt0 = getAbsoluteAnchorPosition(from, c.fromAnchor);
            const toPt0 = getAbsoluteAnchorPosition(to, c.toAnchor);

            // ✅ Prefer persisted sides (if you added them), fallback to derived
            const fromSide: Side =
              (c as any).fromSide ?? sideFromAnchor(c.fromAnchor);
            const toSide: Side =
              (c as any).toSide ?? sideFromAnchor(c.toAnchor);

            // ✅ push endpoints OUT of the shape border so arrow is not inside it
            // Pick an OUT distance in world units. If you want pixel-constant, pass scale here.
            const OUT = 6;
            const fromPt = pushOut(fromPt0, fromSide, OUT);
            const toPt = pushOut(toPt0, toSide, OUT);

            const fromRect = {
              x: from.x,
              y: from.y,
              width: from.width,
              height: from.height,
            };
            const toRect = {
              x: to.x,
              y: to.y,
              width: to.width,
              height: to.height,
            };

            return {
              id: c.id,
              from: fromPt,
              to: toPt,
              fromSide,
              toSide,
              connection: c,
              fromRect,
              toRect,
            };
          })
          .filter(Boolean) as Array<{
          id: string;
          from: Position;
          to: Position;
          fromSide: Side;
          toSide: Side;
          connection: Connection;
          fromRect: Shape;
          toRect: Shape;
        }>,
      [connections, shapes]
    );
  }

  /** Optional helpers */
  // function getConnectionsForShape(shapeId: Shape["id"]) {
  //   return connections.filter(
  //     (c) => c.fromShapeId === shapeId || c.toShapeId === shapeId
  //   );
  // }

  function replaceEndpointWithAbsolute(args: {
    id: string;
    endpoint: "from" | "to";
    shapeId: Shape["id"];
    absolutePoint: Position;
    shapes: Shape[];
  }) {
    const { id, endpoint, shapeId, absolutePoint, shapes } = args;
    const shape = byId(shapes, shapeId);
    if (!shape) return;
    const anchor = computeRelativeAnchor(shape, absolutePoint);
    updateConnection({
      id,
      patch:
        endpoint === "from"
          ? { fromShapeId: shapeId, fromAnchor: anchor }
          : { toShapeId: shapeId, toAnchor: anchor },
    });
  }

  // Local (non-shared) connection selection
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null);
  function selectConnection(id: string | null) {
    setSelectedConnectionId(id);
  }
  function removeSelectedConnection() {
    if (!selectedConnectionId) return;
    removeConnection(selectedConnectionId);
    setSelectedConnectionId(null);
  }

  return {
    // live snapshots
    connections,

    // core ops (persisted)
    addConnectionRelative,
    removeConnection,
    removeConnectionsByIds,
    updateConnection,
    finalizeFromSnap,

    // selection (local)
    selectedConnectionId,
    selectConnection,
    removeSelectedConnection,

    // computed endpoints for rendering
    useConnectionEndpoints,

    // helpers
    //getConnectionsForShape,
    replaceEndpointWithAbsolute,
  };
}

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

// Given a side, push a point OUT from the border by `out` (world units)
function pushOut(pt: Position, side: Side, out: number): Position {
  switch (side) {
    case "top":
      return { x: pt.x, y: pt.y - out };
    case "bottom":
      return { x: pt.x, y: pt.y + out };
    case "left":
      return { x: pt.x - out, y: pt.y };
    case "right":
      return { x: pt.x + out, y: pt.y };
  }
}
