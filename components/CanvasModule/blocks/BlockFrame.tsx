"use client";
import React, { useEffect } from "react";
import { Shape as IShape } from "../types";
import { TagPicker } from "../tags/TagPicker";
import { useExtrasNode } from "./toolbar/toolbarExtrasStore";
import { BlockToolbar } from "./toolbar/BlockToolbar";
import { Badge } from "@/components/ui/badge";
import { useElementSize } from "../hooks/useElementSize";

type Dir = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";
type Connector = "top" | "right" | "bottom" | "left";

export interface ShapeFrameProps {
  shape: IShape;

  // selection state
  isSelected: boolean;
  selectedCount: number;

  // events coming from canvas logic
  onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void;
  onResizeStart: (
    e: React.MouseEvent<HTMLDivElement>,
    id: string,
    handle: Dir,
  ) => void;
  onConnectorMouseDown?: (
    e: React.MouseEvent<HTMLDivElement>,
    shapeId: string,
    direction: Connector,
  ) => void;

  // visual content of the block (Rect, Ellipse, Text, etc.)
  children: React.ReactNode;

  // optional flags for specific blocks
  showConnectors?: boolean; // default true
  resizable?: boolean; // default true
  selectable?: boolean; // default true
  interactive?: boolean;
  minHeight?: number;
  kanbanView?: boolean;

  onChangeTags?: (id: string, tagIds: string[]) => void;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
}

export const ShapeFrame: React.FC<ShapeFrameProps> = ({
  shape,
  isSelected,
  selectedCount,
  onMouseDown,
  onResizeStart,
  onConnectorMouseDown,
  children,
  minHeight = 120,
  showConnectors = true,
  resizable = true,
  selectable = true,
  onChangeTags,
  interactive = true,
  onCommitStyle,
  kanbanView = false,
}) => {
  const { ref, height } = useElementSize<HTMLDivElement>({
    box: "content-box",
  });

  useEffect(() => {
    if (!resizable) {
      onCommitStyle?.(shape.id, { height });
    }
  }, [height]);

  const canInteract = interactive;
  const showSingleSelectionUI =
    canInteract && selectable && isSelected && selectedCount === 1;

  const flipBelow = shape.y < 72;
  const extras = useExtrasNode(shape.id);

  const renderHandles = () => {
    if (!resizable || !showSingleSelectionUI) return null;
    const handles: Dir[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
    return handles.map((handle) => {
      const size = 8;
      const style: React.CSSProperties = {
        width: `${size}px`,
        height: `${size}px`,
        background: "#3B82F6",
        position: "absolute",
        cursor: `${handle}-resize`,
        zIndex: 40,
        transform: "translate(-50%, -50%)",
      };
      if (handle.includes("n")) style.top = `-4px`;
      if (handle.includes("s")) style.top = `calc(100% + 4px)`;
      if (handle.includes("w")) style.left = `-4px`;
      if (handle.includes("e")) style.left = `calc(100% + 4px)`;
      if (handle === "n" || handle === "s") style.left = "50%";
      if (handle === "e" || handle === "w") style.top = "50%";

      return (
        <div
          key={handle}
          data-handle="true" // <-- give it a truthy value
          onMouseDown={(e) => {
            e.preventDefault(); // <-- stop default
            e.stopPropagation(); // <-- stop bubbling to shape/canvas
            onResizeStart(e as any, shape.id, handle);
          }}
          style={style}
        />
      );
    });
  };

  const renderSelectionOutline = () => {
    if (!showSingleSelectionUI) return null;
    return (
      <div
        style={{
          position: "absolute",
          top: -4,
          left: -4,
          width: shape.width + 8,
          height: shape.height + 8,
          border: "2px solid #60A5FA",
          borderRadius: "4px",
          pointerEvents: "none",
          zIndex: 30,
        }}
      />
    );
  };

  const renderConnectorPoints = () => {
    if (!showConnectors || !canInteract) return null;

    const offset = 12; // spacing from the outer edge
    const points: { id: Connector; style: React.CSSProperties }[] = [
      {
        id: "top",
        style: {
          left: "50%",
          top: `-${offset + 8}px`,
          transform: "translateX(-50%)",
        },
      },
      {
        id: "right",
        style: {
          left: `calc(100% + ${offset}px)`,
          top: "50%",
          transform: "translateY(-50%)",
        },
      },
      {
        id: "bottom",
        style: {
          left: "50%",
          top: `calc(100% + ${offset}px)`,
          transform: "translateX(-50%)",
        },
      },
      {
        id: "left",
        style: {
          left: `-${offset + 8}px`,
          top: "50%",
          transform: "translateY(-50%)",
        },
      },
    ];

    const arrowRotation = (pos: Connector) =>
      pos === "top"
        ? "-90deg"
        : pos === "bottom"
          ? "90deg"
          : pos === "left"
            ? "180deg"
            : "0deg";

    return points.map((p) => (
      <div key={p.id} className="group absolute z-40" style={p.style}>
        <div
          className="w-2 h-2 rounded-full bg-blue-500 transition-all duration-150 group-hover:scale-150 group-hover:bg-blue-600 relative flex items-center justify-center"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onConnectorMouseDown?.(e, shape.id, p.id);
          }}
          // make the dot capture pointer events without interfering with drag on body
          style={{ cursor: "crosshair" }}
        >
          <svg
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 w-2 h-2 text-white"
            viewBox="0 0 20 20"
            fill="currentColor"
            style={{ transform: `rotate(${arrowRotation(p.id)})` }}
          >
            <path d="M10 4l6 6-6 6-1.5-1.5L12 10 8.5 6.5 10 4z" />
          </svg>
        </div>
      </div>
    ));
  };

  return (
    <div
      ref={ref}
      data-no-dnd="true"
      data-shapeid={shape.id}
      onMouseDown={onMouseDown}
      style={{
        position: kanbanView ? "relative" : "absolute",
        left: kanbanView ? undefined : shape.x,
        top: kanbanView ? undefined : shape.y,
        width: kanbanView ? undefined : shape.width,
        // height: shape.height,
        height: "min-content",
        minHeight,
        zIndex: isSelected ? 50 : 45,
        pointerEvents: canInteract ? "auto" : "none",
      }}
    >
      {/* Floating toolbar (single select): Tag picker */}
      {/* {showSingleSelectionUI && (
        <BlockToolbar
          shape={shape}
          flipBelow={flipBelow}
          extras={extras}
          onChangeTags={onChangeTags}
          //onDuplicate={onDuplicateShape}
          //onDelete={onDeleteShape}
          //onLockToggle={onLockToggle}
          locked={Boolean((shape as any).locked)}
        />
      )} */}
      {/* {showSingleSelectionUI && (
        <div
          className="absolute -top-9 left-0 z-50"
          data-nodrag="true"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2 px-2 py-1 rounded-lg border bg-white/90 backdrop-blur shadow">
            <TagPicker
              value={shape.tags ?? []}
              onChange={(ids) => onChangeTags?.(shape.id, ids)}
            />
          </div>
        </div>
      )} */}

      {/* Selection outline (single select) */}
      {renderSelectionOutline()}

      {/* Resize handles (single select) */}
      {renderHandles()}

      {shape.tags && shape.tags.length > 0 && (
        <div className="absolute flex flex-row gap-1 -top-8 left-2">
          {shape.tags.map((tag) => (
            <Badge key={tag} variant="outlineGray">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {/* Inner content (actual block visuals) */}
      <div
        style={{
          position: "relative",
          zIndex: 25,
          width: "100%",
          height: "100%",
        }}
      >
        {children}
      </div>

      {/* Connector points */}
      {renderConnectorPoints()}
    </div>
  );
};
