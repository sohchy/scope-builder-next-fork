// components/CanvasModule/ui/BlockToolbar.tsx
"use client";
import React from "react";
import { Shape as IShape } from "../../types";
import { MoreVertical, Copy, Trash2, Lock, Unlock, Tag } from "lucide-react";
import { TagPicker } from "../../tags/TagPicker";

type Props = {
  shape: IShape;
  extras?: React.ReactNode; // block-specific tools
  flipBelow?: boolean; // place below if near top edge
  gap?: number; // distance from block
  onChangeTags?: (id: string, names: string[]) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
  onLockToggle?: (id: string, lock: boolean) => void;
  locked?: boolean;
};

export const BlockToolbar: React.FC<Props> = ({
  shape,
  extras,
  flipBelow = false,
  gap = 16,
  onChangeTags,
  onDuplicate,
  onDelete,
  onLockToggle,
  locked = false,
}) => {
  const posStyle: React.CSSProperties = flipBelow
    ? { top: "100%", transform: `translate(-50%, ${gap}px)` }
    : { top: 0, transform: `translate(-50%, calc(-100% - ${gap}px))` };

  return (
    <div
      className="absolute left-1/2"
      style={{ ...posStyle, zIndex: 60 }}
      data-nodrag="true"
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="relative">
        {/* Bubble */}
        <div className="flex items-center text-xs gap-1.5 px-2 py-1.5 rounded-2xl bg-white/98 backdrop-blur border border-gray-200 shadow-lg ring-1 ring-black/5 w-max">
          {/* Default set — TagPicker (icon trigger works too if you added it) */}
          {/* <TagPicker
            // trigger="icon" // uncomment if you implemented the icon trigger
            value={shape.tags ?? []}
            onChange={(names) => onChangeTags?.(shape.id, names)}
          /> */}

          {/* <div className="w-px h-5 bg-gray-200" /> */}

          {/* <button
            className="p-1.5 rounded-lg hover:bg-gray-50"
            title="Duplicate"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate?.(shape.id);
            }}
          >
            <Copy size={16} />
          </button> */}
          {/* <button
            className="p-1.5 rounded-lg hover:bg-gray-50"
            title={locked ? "Unlock" : "Lock"}
            onClick={(e) => {
              e.stopPropagation();
              onLockToggle?.(shape.id, !locked);
            }}
          >
            {locked ? <Unlock size={16} /> : <Lock size={16} />}
          </button> */}
          {/* <button
            className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(shape.id);
            }}
          >
            <Trash2 size={16} />
          </button> */}

          {/* <button
            className="p-1.5 rounded-lg hover:bg-gray-50"
            title="More"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical size={16} />
          </button> */}

          {/* Block-specific extras appended to the right */}
          {extras && (
            <>
              <div className="w-px h-5 bg-gray-200" />
              <div className="flex items-center gap-3">{extras}</div>
            </>
          )}
        </div>

        {/* Caret (diamond) */}
        <div
          className="absolute w-3 h-3 bg-white border border-gray-200 shadow rotate-45"
          style={
            flipBelow
              ? {
                  top: -6,
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                }
              : {
                  bottom: -6,
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                }
          }
        />
      </div>
    </div>
  );
};
