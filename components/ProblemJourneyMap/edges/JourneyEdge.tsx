"use client";

import { useCallback, useState } from "react";
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from "@xyflow/react";

import { useJourneyContext, type JourneyEdgeData } from "../JourneyContext";

export function JourneyEdge({
  id,
  source,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const { getEdges } = useReactFlow();
  const { readOnly, updateEdgeLabel } = useJourneyContext();

  const edgeData = data as unknown as JourneyEdgeData | undefined;

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");

  // Determine if this edge needs an "Option N" label (source has multiple children)
  const siblingsFromSource = getEdges().filter((e) => e.source === source);
  const showLabel = siblingsFromSource.length > 1;
  const optionIndex = siblingsFromSource.findIndex((e) => e.id === id) + 1;

  // A custom label wins; an absent or blank one falls back to the derived
  // numbering, which renumbers as siblings are added or removed.
  const displayLabel = edgeData?.label?.trim() || `Option ${optionIndex}`;

  const startEdit = useCallback(() => {
    if (readOnly) return;
    setDraft(edgeData?.label ?? "");
    setEditing(true);
  }, [readOnly, edgeData?.label]);

  const commit = useCallback(() => {
    setEditing(false);
    updateEdgeLabel(id, draft.trim());
  }, [id, draft, updateEdgeLabel]);

  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 8,
  });

  const centerX = (sourceX + targetX) / 2;
  const labelX = (centerX + targetX) / 2;
  const labelY = targetY;

  // 1.3 is Geist's own em height (ascent 1.005 + descent 0.295). `leading-none`
  // gave the line box only 1em, so the descender in "Option" spilled past the
  // padding onto the bottom border while the capitals kept their space above —
  // the label read as sitting low. At 1.3 the glyphs fit and, because Geist puts
  // exactly `descent` between its ascent and cap height, the cap block lands
  // dead centre.
  // The label centre sits 50px from the target card (75% of the 200px
  // HORIZONTAL_GAP), so 100px is the widest the pill can be without sliding
  // underneath it. `rounded-xl` rather than `rounded-full` because a full radius
  // clamps to half the height: on a wrapped two-line pill that grows 21px
  // half-circle caps that eat into the text. At the single-line height
  // (14px × 1.3 + 2px padding + 1px border, both sides ≈ 24.2px) the clamped
  // full radius is 12.1px, so `rounded-xl`'s 12px looks the same as today.
  const pillClasses =
    "max-w-[100px] text-sm leading-[1.3] font-medium text-[#111827] bg-white px-1.5 py-0.5 rounded-xl border border-gray-300";

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: "#7A7099", strokeWidth: 1.5, ...style }}
      />
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            // `flex` so the wrapper's height is the pill's own box. As a plain
            // block it would take the height of an inherited line box instead —
            // the pill is inline, whose vertical padding paints without adding
            // height — and the -50% would centre the wrong box on the edge.
            className={`nodrag nopan absolute flex items-center ${
              readOnly ? "pointer-events-none" : "pointer-events-auto"
            }`}
            style={{
              transform: `translate(${labelX}px, ${labelY}px) translate(-50%, -50%)`,
            }}
          >
            {editing ? (
              <input
                autoFocus
                value={draft}
                placeholder={`Option ${optionIndex}`}
                // The label sits over the pane, so keep pointer and key events
                // from reaching React Flow (pan, zoom, shortcuts).
                onMouseDown={(e) => e.stopPropagation()}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === "Enter") {
                    e.preventDefault();
                    commit();
                  } else if (e.key === "Escape") {
                    e.preventDefault();
                    setEditing(false);
                  }
                }}
                style={{ width: `${Math.max(draft.length, 8)}ch` }}
                className={`${pillClasses} outline-none focus:border-[#6A35FF]`}
              />
            ) : (
              <span
                onDoubleClick={startEdit}
                // The pill clamps at two lines, so the tooltip is where the rest
                // of a long label stays reachable.
                title={
                  readOnly
                    ? displayLabel
                    : `${displayLabel} — double-click to rename`
                }
                // `break-words` so one long unbroken word breaks across the two
                // lines instead of being clipped mid-glyph with no ellipsis.
                className={`${pillClasses} line-clamp-2 break-words text-center ${
                  readOnly ? "" : "cursor-text"
                }`}
              >
                {displayLabel}
              </span>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
