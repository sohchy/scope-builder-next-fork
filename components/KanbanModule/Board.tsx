import React, { useCallback, useState } from "react";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import { Button } from "@/components/ui/button";
import { UniqueIdentifier } from "@dnd-kit/core/dist/types/other";
import { DeleteIcon, MoveIcon, Trash2Icon } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { Input } from "../ui/input";
import { updateKanbanBoard } from "@/services/kanbanBoards";

interface BoardProps {
  path: string;
  title?: string;
  id: UniqueIdentifier;
  description?: string;
  children: React.ReactNode;
  onDeleteBoard: () => void;
  //onAddItem?: () => void;
}

const Board = ({
  id,
  path,
  children,
  title,
  description,
  onDeleteBoard,
}: //onAddItem,
BoardProps) => {
  const {
    attributes,
    setNodeRef,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: id,
    data: {
      type: "board",
      boardKey: String(id), // opcional, por si querés leerlo en handlers
    },
  });

  const [value, setValue] = useState(title);
  const [isEditing, setIsEditing] = useState(false);

  const updateBoardTitle = async () => {
    setIsEditing(false);
    await updateKanbanBoard(Number(id), { name: value }, path);
  };

  return (
    <div
      {...attributes}
      ref={setNodeRef}
      style={{
        transition,
        transform: CSS.Translate.toString(transform),
      }}
      className={clsx(
        "w-[440px] bg-white p-1 rounded-lg shadow-md flex min-h-0 flex-col overflow-y-scroll",
        isDragging && "opacity-50"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-y-1">
          {isEditing ? (
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onBlur={() => {
                updateBoardTitle();
              }}
              autoFocus
            />
          ) : (
            <h1
              className="text-gray-800 text-xl"
              onDoubleClick={() => setIsEditing(true)}
            >
              {value}
            </h1>
          )}
        </div>
        <Button
          size={"icon"}
          variant={"ghost"}
          onClick={onDeleteBoard}
          //className="border p-2 text-xs rounded-xl shadow-lg hover:shadow-xl"
          // {...listeners}
        >
          <Trash2Icon />
        </Button>
      </div>

      {children}
      {/* <Button variant="ghost" onClick={onAddItem}>
        Add Item
      </Button> */}
    </div>
  );
};

export default Board;
