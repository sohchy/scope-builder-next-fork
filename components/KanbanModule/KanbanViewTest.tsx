"use client";

import { v4 as uuidv4 } from "uuid";
import { PlusCircleIcon, PlusIcon } from "lucide-react";
import { shapeRegistry } from "../CanvasModule/blocks/blockRegistry";
import { useRealtimeShapes } from "../CanvasModule/hooks/realtime/useRealtimeShapes";
import { Button } from "../ui/button";
import { CardType, Shape } from "../CanvasModule/types";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SortableItem } from "./SortableItem";
import { useCallback, useEffect, useState } from "react";
import { KanbanBoardCategory } from "@/lib/generated/prisma";

interface KanbanViewProps {
  kanbanBoards: KanbanBoardCategory[];
}

export default function KanbanView({ kanbanBoards }: KanbanViewProps) {
  const { shapes, addShape, updateShape } = useRealtimeShapes();

  useEffect(() => {}, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        delay: 100,
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const add = (type: string) => {
    const id = uuidv4();
    addShape("card", 20, 20, id);
    updateShape(id, (s) => ({ ...s, subtype: type as CardType }));
  };

  // Helper: returns ordered shapes for a given board key
  const getBoardItems = useCallback(
    (board: KanbanBoardCategory) =>
      shapes
        .filter((s) => board.shape_ids.includes(s.id))
        .sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0)),
    [shapes]
  );

  // Reorder within a single board: rewrite kanbanOrder sequentially (robust & smooth)
  const reorderWithinBoard = useCallback(
    (boardKey: string, fromId: string, toId: string) => {
      const board = kanbanBoards.find((b) => b.id.toString() === boardKey);
      const boardItems = getBoardItems(board!);
      const ids = boardItems.map((s) => s.id);

      const oldIndex = ids.indexOf(fromId);
      const newIndex = ids.indexOf(toId);
      if (oldIndex === -1 || newIndex === -1) return;

      const newIds = arrayMove(ids, oldIndex, newIndex);

      // write back normalized order (index * 1000)
      newIds.forEach((id, idx) => {
        //const target = shapes.find((s) => s.id === id);
        const target = boardItems.find((s) => s.id === id);
        const nextOrder = (idx + 1) * 1000;

        if (!target || target.kanbanOrder === nextOrder) return;
        updateShape(id, (s) => ({ ...s, kanbanOrder: nextOrder }));
      });
    },
    [getBoardItems, updateShape]
  );

  // Drag end handler (per-board because each board has its own DndContext)
  const makeHandleDragEnd = (boardKey: string) => (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    reorderWithinBoard(boardKey, String(active.id), String(over.id));
  };

  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="flex w-full h-full gap-4 px-2 pb-2">
        {kanbanBoards.map((board) => {
          const boardItems = getBoardItems(board);
          const ids = boardItems.map((s) => s.id);

          return (
            <DndContext
              key={board.id}
              sensors={sensors}
              collisionDetection={closestCenter}
              //onDragEnd={handleDragEnd}
              onDragEnd={makeHandleDragEnd(board.id.toString())}
            >
              <div
                key={board.id}
                className="w-[440px] bg-white p-1 rounded-lg shadow-md flex min-h-0 flex-col"
              >
                <h2 className="px-2 text-xl text-muted-foreground mb-2 flex items-center justify-between">
                  {board.name}
                  <Button
                    size={"icon"}
                    variant={"ghost"}
                    //onClick={() => add(board.id)}
                    className="cursor-pointer"
                  >
                    <PlusCircleIcon size={18} className="text-[#6A35FF]" />
                  </Button>
                </h2>
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-1 space-y-2">
                  {/* @ts-ignore */}
                  <SortableContext
                    items={ids}
                    strategy={verticalListSortingStrategy}
                  >
                    {boardItems.map((shape) => {
                      const Component = shapeRegistry[shape.type];
                      if (!Component) return null;
                      return (
                        <SortableItem key={shape.id} id={shape.id}>
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
                        </SortableItem>
                      );
                    })}
                  </SortableContext>
                </div>
              </div>
            </DndContext>
          );
        })}
        <Button>
          <PlusIcon className="mr-2" />
          Add new board
        </Button>
      </div>
    </div>
  );
}
