"use client";
import React, { useMemo } from "react";
import { Shape } from "./types";

export type Side = "top" | "right" | "bottom" | "left";
type Pt = { x: number; y: number };

function normal(side?: Side) {
  switch (side) {
    case "top":
      return { x: 0, y: -1 };
    case "bottom":
      return { x: 0, y: 1 };
    case "left":
      return { x: -1, y: 0 };
    case "right":
      return { x: 1, y: 0 };
    default:
      return null;
  }
}

// Builds a simple Miro-like ortho polyline with 1-bend when possible.
// Builds a simple Miro-like ortho polyline with 1-bend when possible,
// and adds a small "dogleg" near the target if the arrow would otherwise
// approach the side from the "wrong" direction.
function routeOrthogonal(args: {
  from: Pt;
  to: Pt;
  fromSide?: Side;
  toSide?: Side;
  out?: number; // how far outside shape border we start/end
  stub?: number; // how far we “exit/approach” before turning
  hook?: number; // size of the little Miro hook
}) {
  const { from, to, fromSide, toSide } = args;
  const out = args.out ?? 6;
  const stub = args.stub ?? 28;
  const hook = args.hook ?? 14;

  const fn = normal(fromSide);
  const tn = normal(toSide);

  // push endpoints slightly OUTSIDE the shape border
  const S = fn
    ? { x: from.x + fn.x * out, y: from.y + fn.y * out }
    : { ...from };
  const E = tn ? { x: to.x + tn.x * out, y: to.y + tn.y * out } : { ...to };

  // first/last “stub” points (exit source / approach target)
  const S1 = fn ? { x: S.x + fn.x * stub, y: S.y + fn.y * stub } : { ...S };
  const E1 = tn ? { x: E.x + tn.x * stub, y: E.y + tn.y * stub } : { ...E };

  // Try 1-bend L: (S1.x, E1.y) or (E1.x, S1.y)
  const cornerA = { x: S1.x, y: E1.y };
  const cornerB = { x: E1.x, y: S1.y };

  let corner = cornerA;
  if (tn) {
    const lastA = { x: E1.x - cornerA.x, y: E1.y - cornerA.y };
    const lastB = { x: E1.x - cornerB.x, y: E1.y - cornerB.y };
    const score = (v: { x: number; y: number }) =>
      tn.x !== 0 ? Math.abs(v.y) : Math.abs(v.x);
    corner = score(lastA) <= score(lastB) ? cornerA : cornerB;
  } else {
    const manA =
      Math.abs(S1.x - cornerA.x) +
      Math.abs(S1.y - cornerA.y) +
      Math.abs(cornerA.x - E1.x) +
      Math.abs(cornerA.y - E1.y);
    const manB =
      Math.abs(S1.x - cornerB.x) +
      Math.abs(S1.y - cornerB.y) +
      Math.abs(cornerB.x - E1.x) +
      Math.abs(cornerB.y - E1.y);
    corner = manA <= manB ? cornerA : cornerB;
  }

  // Base polyline (your working one)
  let points: Pt[] = [S, S1, corner, E1, E];

  // --- Add Miro-like end hook when the last two segments would be collinear ---
  // We want a tiny perpendicular jog right before E1, but only if:
  // segment (corner -> E1) is on same axis as (E1 -> E)
  if (tn) {
    const prev = points[points.length - 3]; // "corner"

    const finalIsHorizontal = tn.x !== 0;
    const finalIsVertical = tn.y !== 0;

    const prevToE1IsHorizontal = prev.y === E1.y;
    const prevToE1IsVertical = prev.x === E1.x;

    const collinear =
      (finalIsHorizontal && prevToE1IsHorizontal) ||
      (finalIsVertical && prevToE1IsVertical);

    // direction of the two last segments
    const v1 = { x: E1.x - prev.x, y: E1.y - prev.y }; // prev -> E1
    const v2 = { x: E.x - E1.x, y: E.y - E1.y }; // E1 -> E

    const sameDir = finalIsHorizontal
      ? Math.sign(v1.x) === Math.sign(v2.x) && Math.sign(v2.x) !== 0
      : Math.sign(v1.y) === Math.sign(v2.y) && Math.sign(v2.y) !== 0;

    // ✅ Only hook if collinear AND reversing direction (not when already straight and correct)
    const needsHook = collinear && !sameDir;

    if (needsHook) {
      const sign = finalIsHorizontal
        ? prev.y <= E1.y
          ? -1
          : 1
        : prev.x <= E1.x
        ? -1
        : 1;

      if (finalIsHorizontal) {
        const yHook = E1.y + hook * sign;
        const pA = { x: prev.x, y: yHook };
        const pB = { x: E1.x, y: yHook };
        points = [S, S1, prev, pA, pB, E1, E];
      } else {
        const xHook = E1.x + hook * sign;
        const pA = { x: xHook, y: prev.y };
        const pB = { x: xHook, y: E1.y };
        points = [S, S1, prev, pA, pB, E1, E];
      }
    }
  }

  // cleanup: remove consecutive duplicates / collinear redundant points
  const simplified: Pt[] = [];
  for (const p of points) {
    const prev = simplified[simplified.length - 1];
    if (!prev || prev.x !== p.x || prev.y !== p.y) simplified.push(p);
  }

  const outPts: Pt[] = [];
  for (let i = 0; i < simplified.length; i++) {
    const a = outPts[outPts.length - 1];
    const b = simplified[i];
    const c = simplified[i + 1];
    if (!a || !c) {
      outPts.push(b);
      continue;
    }
    const abx = b.x - a.x,
      aby = b.y - a.y;
    const bcx = c.x - b.x,
      bcy = c.y - b.y;
    const collinear = (abx === 0 && bcx === 0) || (aby === 0 && bcy === 0);
    if (!collinear) outPts.push(b);
  }

  return outPts;
}

function pathFromPoints(pts: Pt[]) {
  if (pts.length < 2) return "";
  return (
    `M ${pts[0].x},${pts[0].y} ` +
    pts
      .slice(1)
      .map((p) => `L ${p.x},${p.y}`)
      .join(" ")
  );
}

/** angle in degrees so the tip points INTO the shape based on side */
function angleForSide(side?: Side, fallbackVec?: { x: number; y: number }) {
  switch (side) {
    case "left":
      // hit LEFT edge -> arrow tip should point RIGHT (into the shape)
      return 180;
    case "right":
      // hit RIGHT edge -> arrow tip should point LEFT
      return 0;
    case "top":
      // hit TOP edge -> arrow tip should point DOWN
      return -90;
    case "bottom":
      // hit BOTTOM edge -> arrow tip should point UP
      return 90;
    default: {
      if (!fallbackVec) return 0;
      return (Math.atan2(fallbackVec.y, fallbackVec.x) * 180) / Math.PI;
    }
  }
}

export function OrthogonalArrow({
  id,
  from,
  to,
  fromSide,
  toSide,
  fromRect, // 👈 new
  toRect,
  color = "#3B82F6",
  strokeWidth = 2,
  zIndex = 400,
  selected = false,
  onSelect,
  out = 6,
  stub = 28,
}: {
  id: string;
  from: Pt;
  to: Pt;
  fromSide?: Side;
  toSide?: Side;
  color?: string;
  strokeWidth?: number;
  zIndex?: number;
  selected?: boolean;
  onSelect?: (id: string) => void;
  out?: number;
  stub?: number;
  fromRect?: Shape;
  toRect?: Shape;
}) {
  const pts = useMemo(
    () => routeOrthogonal({ from, to, fromSide, toSide, out, stub, hook: 14 }),
    [from, to, fromSide, toSide, out, stub]
  );

  if (pts.length < 2) return null;

  // bbox pad so nothing clips
  const pad = 60;
  const minX = Math.min(...pts.map((p) => p.x)) - pad;
  const minY = Math.min(...pts.map((p) => p.y)) - pad;
  const maxX = Math.max(...pts.map((p) => p.x)) + pad;
  const maxY = Math.max(...pts.map((p) => p.y)) + pad;

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  // localize points into the svg
  const localPts = pts.map((p) => ({ x: p.x - minX, y: p.y - minY }));
  const d = pathFromPoints(localPts);

  const end = localPts[localPts.length - 1];
  const prev = localPts[localPts.length - 2] ?? end;
  const fallbackVec = { x: end.x - prev.x, y: end.y - prev.y };
  const angle = angleForSide(toSide, fallbackVec);

  const HEAD_LEN = 12;
  const HEAD_HALF = 4; // half width

  return (
    <svg
      className="absolute"
      style={{
        left: `${minX}px`,
        top: `${minY}px`,
        width,
        height,
        zIndex,
        overflow: "visible",
      }}
    >
      {/* hit area */}
      <path
        d={d}
        stroke="transparent"
        strokeWidth={16}
        fill="none"
        style={{ cursor: "pointer" }}
        onMouseDown={(e) => {
          e.stopPropagation();
          onSelect?.(id);
        }}
      />

      {/* visible shaft */}
      <path
        d={d}
        stroke={selected ? "#2563EB" : color}
        strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
        fill="none"
        strokeLinejoin="round"
        strokeLinecap="round"
        pointerEvents="none"
      />

      {/* arrow head drawn manually at the end point */}
      <polygon
        points={`0,0 ${HEAD_LEN},-${HEAD_HALF} ${HEAD_LEN},${HEAD_HALF}`}
        transform={`translate(${end.x},${end.y}) rotate(${angle})`}
        fill={selected ? "#2563EB" : color}
        pointerEvents="none"
      />
    </svg>
  );
}
