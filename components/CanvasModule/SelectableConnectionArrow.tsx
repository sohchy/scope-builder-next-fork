export interface SelectableConnectionArrowProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  fromSide?: "top" | "right" | "bottom" | "left"; // ✅
  toSide?: "top" | "right" | "bottom" | "left"; // ✅
  selected?: boolean;
  onSelect?: (id: string) => void;
  color?: string;
  strokeWidth?: number;
  zIndex?: number;
  bend?: number;

  layout?: "curved" | "orthogonal";
}

type Side = "top" | "right" | "bottom" | "left";

function norm(vx: number, vy: number) {
  const m = Math.hypot(vx, vy) || 1;
  return { x: vx / m, y: vy / m };
}

function computeOrthogonalPoints(
  fx: number,
  fy: number,
  tx: number,
  ty: number,
  fromSide?: Side,
  toSide?: Side
): { x: number; y: number }[] {
  const pts: { x: number; y: number }[] = [];
  pts.push({ x: fx, y: fy });

  const dx = tx - fx;
  const dy = ty - fy;

  const axisOf = (side?: Side): "h" | "v" | null => {
    if (!side) return null;
    if (side === "left" || side === "right") return "h";
    return "v"; // top / bottom
  };

  const fromAxis = axisOf(fromSide);
  const toAxis = axisOf(toSide);

  // Fallbacks: if we don't know sides or it's basically straight.
  if (!fromAxis || !toAxis || Math.abs(dx) < 4 || Math.abs(dy) < 4) {
    pts.push({ x: tx, y: ty });
    return pts;
  }

  // CASE 1: Same axis (h→h or v→v) → balanced midpoint pattern
  if (fromAxis === toAxis) {
    if (fromAxis === "h") {
      // horizontal → horizontal: H-V-H
      const midX = fx + dx / 2;
      pts.push({ x: midX, y: fy });
      pts.push({ x: midX, y: ty });
    } else {
      // vertical → vertical: V-H-V
      const midY = fy + dy / 2;
      pts.push({ x: fx, y: midY });
      pts.push({ x: tx, y: midY });
    }
    pts.push({ x: tx, y: ty });
    return pts;
  }

  // CASE 2: Different axis (h→v or v→h)
  // We want:
  // - first segment along fromAxis
  // - last segment along toAxis

  if (fromAxis === "h" && toAxis === "v") {
    // from (horizontal) then to (vertical):
    // from → (tx, fy) → to
    pts.push({ x: tx, y: fy });
    pts.push({ x: tx, y: ty });
    return pts;
  }

  if (fromAxis === "v" && toAxis === "h") {
    // from (vertical) then to (horizontal):
    // from → (fx, ty) → to
    pts.push({ x: fx, y: ty });
    pts.push({ x: tx, y: ty });
    return pts;
  }

  // Super defensive fallback
  pts.push({ x: tx, y: ty });
  return pts;
}

export const SelectableConnectionArrow: React.FC<
  SelectableConnectionArrowProps
> = ({
  id,
  from,
  to,
  fromSide,
  toSide,
  selected = false,
  onSelect,
  color = "#3B82F6",
  strokeWidth = 2,
  zIndex = 400,
  bend = 40,
  layout = "curved",
}) => {
  const OUT = 6;

  const pad = 40;
  const minX = Math.min(from.x, to.x) - pad;
  const minY = Math.min(from.y, to.y) - pad;
  const maxX = Math.max(from.x, to.x) + pad;
  const maxY = Math.max(from.y, to.y) + pad;
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);

  const fx = from.x - minX,
    fy = from.y - minY;
  const tx = to.x - minX,
    ty = to.y - minY;

  const normalFor = (side?: "top" | "right" | "bottom" | "left") => {
    switch (side) {
      case "top":
        return { nx: 0, ny: -1 };
      case "bottom":
        return { nx: 0, ny: 1 };
      case "left":
        return { nx: -1, ny: 0 };
      case "right":
        return { nx: 1, ny: 0 };
      default:
        return null;
    }
  };

  const fromN = normalFor(fromSide);
  const toN = normalFor(toSide);

  const fx1 = fromN ? fx + fromN.nx * OUT : fx;
  const fy1 = fromN ? fy + fromN.ny * OUT : fy;
  const tx1 = toN ? tx + toN.nx * OUT : tx;
  const ty1 = toN ? ty + toN.ny * OUT : ty;

  let d: string;

  if (layout === "orthogonal") {
    // ─────────────────────────────────────────
    // ORTHOGONAL / RECTANGULAR PATH
    // ─────────────────────────────────────────
    const pts = computeOrthogonalPoints(fx1, fy1, tx1, ty1, fromSide, toSide);

    d =
      pts.length > 0
        ? `M ${pts[0].x},${pts[0].y}` +
          pts
            .slice(1)
            .map((p) => ` L ${p.x},${p.y}`)
            .join("")
        : `M ${fx1},${fy1} L ${tx1},${ty1}`;
  } else {
    // --- Control points (slightly stronger push near endpoints) ---
    const approach = bend * 1.2;
    // const cp1 = fromN
    //   ? { x: fx + fromN.nx * approach, y: fy + fromN.ny * approach }
    //   : { x: fx + (tx - fx) * 0.3, y: fy };
    const cp1 = fromN
      ? { x: fx1 + fromN.nx * approach, y: fy1 + fromN.ny * approach }
      : { x: fx1 + (tx1 - fx1) * 0.3, y: fy1 };

    // We'll compute cp2 after we find the trimmed end

    // --- Trim the end so the shaft meets the base of the arrowhead ---
    // Length to trim in *px of the local SVG*, roughly matching your marker size.
    const HEAD_LEN = 12; // ← was 10
    const headBaseOffset = HEAD_LEN;

    // If we know the side, trim along the side's outward normal; otherwise along the current tangent
    let endX = tx,
      endY = ty;
    if (toN) {
      endX = tx - toN.nx * headBaseOffset;
      endY = ty - toN.ny * headBaseOffset;
    } else {
      // fallback: compute tangent from a provisional cp2
      const provisional = { x: tx - (tx - fx) * 0.3, y: ty };
      const t = norm(tx - provisional.x, ty - provisional.y);
      endX = tx - t.x * headBaseOffset;
      endY = ty - t.y * headBaseOffset;
    }

    // Now choose cp2 so the curve approaches perpendicular to the border
    // const cp2 = toN
    //   ? { x: endX + toN.nx * approach, y: endY + toN.ny * approach }
    //   : { x: endX - (endX - fx) * 0.3, y: endY };
    const cp2 = toN
      ? { x: tx1 + toN.nx * approach, y: ty1 + toN.ny * approach }
      : { x: tx1 - (tx1 - fx1) * 0.3, y: ty1 };

    // const d = `M ${fx},${fy} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${endX},${endY}`;
    d = `M ${fx1},${fy1} C ${cp1.x},${cp1.y} ${cp2.x},${cp2.y} ${tx1},${ty1}`;
  }

  const markerId = `arrowhead-${id}`;

  const HEAD_W = 12; // length of the head
  const HEAD_H = 8;

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
      <defs>
        <marker
          // id={markerId}
          // markerWidth={HEAD_W}
          // markerHeight={HEAD_H}
          // refX={0} // <-- endpoint is the BASE center
          // refY={HEAD_H / 2}
          // orient="auto-start-reverse"
          // markerUnits="userSpaceOnUse" //
          id={markerId}
          markerWidth={HEAD_W}
          markerHeight={HEAD_H}
          refX={0} // base of head = path endpoint
          refY={HEAD_H / 2}
          orient="auto-start-reverse"
          markerUnits="userSpaceOnUse" // sizes are in world px
        >
          <polygon
            points="0 0, 10 3.5, 0 7"
            fill={selected ? "#2563EB" : color}
          />
        </marker>
      </defs>

      {/* fat, invisible hit area */}
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

      {/* visible shaft (ends at the arrowhead base) */}
      <path
        d={d}
        stroke={selected ? "#2563EB" : color}
        strokeWidth={selected ? strokeWidth + 1 : strokeWidth}
        strokeLinecap="round" // ← small polish
        fill="none"
        markerEnd={`url(#${markerId})`}
        pointerEvents="none"
      />
    </svg>
  );
};
