import { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import React from "react";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Shape } from "../CanvasModule/types";
import { shapeRegistry } from "../CanvasModule/blocks/blockRegistry";
import { useRealtimeShapes } from "../CanvasModule/hooks/realtime/useRealtimeShapes";

type BoardItemTypeProps = {
  shape: Shape;
  boardKey: string;
};

const BoardItem = ({ shape, boardKey }: BoardItemTypeProps) => {
  const { updateShape } = useRealtimeShapes();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: shape.id,
    data: {
      type: "item",
      boardKey: boardKey,
      shapeId: shape.id,
    },
  });

  const Component = shapeRegistry[shape.type];

  if (!Component) return null;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      style={{
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      className={clsx(
        "px-2 py-4 bg-white shadow-md rounded-xl w-full border border-transparent hover:border-gray-200 cursor-pointer",
        isDragging && "opacity-50"
      )}
    >
      {/* <div className="flex items-center justify-between">
        {title}
        <button
          className="border p-2 text-xs rounded-xl shadow-lg hover:shadow-xl"
          {...listeners}
        >
          Drag Handle
        </button>
      </div> */}
      <div {...listeners}>
        <Component
          key={shape.id}
          shape={shape}
          isSelected={false}
          selectedCount={0}
          onResizeStart={() => {}}
          onMouseDown={() => {}}
          kanbanView={true}
          //@ts-ignore
          onCommitText={(id, text) =>
            updateShape(id, (s) => ({
              ...s,
              // keep empty strings if user clears the text; Liveblocks adapter already null-coalesces
              text,
            }))
          }
          //@ts-ignore
          onCommitInterview={(id, patch) =>
            updateShape(id, (s) => ({ ...s, ...patch }))
          }
          //@ts-ignore
          onCommitTable={(id, patch) =>
            updateShape(id, (s) => ({ ...s, ...patch }))
          }
          //@ts-ignore
          onChangeTags={(id, names) => {
            updateShape(id, (s) => ({ ...s, tags: names }));
          }}
          //@ts-ignore
          onCommitStyle={(id, patch) => {
            updateShape(id, (s) => ({ ...s, ...patch })); // your existing immutable updater
          }}
        />
      </div>
    </div>
  );
};

export default BoardItem;
