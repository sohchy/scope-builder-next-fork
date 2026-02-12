"use client";

import { v4 as uuidv4 } from "uuid";
import { CircleAlertIcon, PlusCircleIcon, PlusIcon } from "lucide-react";
import { shapeRegistry } from "../CanvasModule/blocks/blockRegistry";
import { useRealtimeShapes } from "../CanvasModule/hooks/realtime/useRealtimeShapes";
import { Button } from "../ui/button";
import { CardType, Shape } from "../CanvasModule/types";
import {
  DndContext,
  DragEndEvent,
  DragMoveEvent,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  UniqueIdentifier,
  useSensor,
  useSensors,
  closestCorners,
  type CollisionDetection,
  DragOverlay,
  DragOverEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { SortableItem } from "./SortableItem";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { KanbanBoardCategory } from "@/lib/generated/prisma";
import Board from "./Board";
import BoardItem from "./BoardItem";
import {
  createKanbanBoard,
  deleteKanbanBoard,
  updateKanbanBoards,
} from "@/services/kanbanBoards";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface KanbanViewProps {
  path: string;
  roomId: string;
  kanbanBoards: KanbanBoardCategory[];
}

export default function KanbanView({
  path,
  roomId,
  kanbanBoards,
}: KanbanViewProps) {
  const [openAlert, setOpenAlert] = useState(false);
  const { shapes, addShape, updateShape } = useRealtimeShapes();
  const [activeId, setActiveId] = useState<string | null>(null);
  const boardsSnapshotRef = useRef<Record<string, string[]>>({});

  // 🌟 UI SOURCE OF TRUTH (used for rendering & preview)
  const [containers, setContainers] = useState<
    (KanbanBoardCategory & { shapes: Shape[] })[]
  >(
    kanbanBoards.map((b) => {
      const boardShapes: Shape[] = [];
      for (const id of b.shape_ids) {
        const shape = shapes.find((s) => s.id === id);
        if (shape) boardShapes.push(shape);
      }
      // keep initial render ordered by kanbanOrder
      boardShapes.sort((a, b) => (a.kanbanOrder ?? 0) - (b.kanbanOrder ?? 0));
      return { ...b, shapes: boardShapes };
    })
  );

  useEffect(() => {}, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ===== helpers bound to current UI state (containers) =====

  const findContainerIndexByBoardKey = useCallback(
    (boardKey: string) =>
      containers.findIndex((c) => String(c.id) === boardKey),
    [containers]
  );

  const findContainerIndexByItemId = useCallback(
    (shapeId: string) =>
      containers.findIndex((c) => c.shapes.some((s) => s.id === shapeId)),
    [containers]
  );

  const shapeById = useCallback(
    (id: string) => shapes.find((s) => s.id === id),
    [shapes]
  );

  const add = (type: string) => {
    const id = uuidv4();
    addShape("card", 20, 20, id);
    updateShape(id, (s) => ({ ...s, subtype: type as CardType }));
  };

  function nextBoardOrder(): number {
    // if you persist order, space them by BOARD_ORDER_STEP
    const maxOrder =
      containers.reduce((m, c) => Math.max(m, c.order ?? 0), 0) || 0;
    return maxOrder + 1;
  }

  async function onAddBoardClick() {
    const name = "Unnamed Board"; // or open a modal and get the name

    try {
      // Persist to DB → returns real id (number) and maybe order
      const newBoard = await createKanbanBoard(
        roomId,
        name,
        nextBoardOrder(),
        path
      );

      // Replace temp id with real id
      // setContainers((prev) =>
      //   prev.map((b) =>
      //     String(b.id) === String(tempId)
      //       ? { ...b, id: created.id, order: created.order ?? newBoard.order }
      //       : b
      //   )
      // );
      setContainers((prev) => [...prev, { ...newBoard, shapes: [] }]);
    } catch (e) {
      console.error("Failed to create board:", e);
      // Rollback optimistic
      // setContainers((prev) =>
      //   prev.filter((b) => String(b.id) !== String(tempId))
      // );
    }
  }

  // 🔁 CHANGED: find board for a shape from *containers* (live UI), not props
  const findBoardKeyForShape = useCallback(
    (shapeId: string): string | null => {
      const entry = containers.find((c) =>
        c.shapes.some((s) => s.id === shapeId)
      );
      return entry ? String(entry.id) : null;
    },
    [containers]
  );

  // 🔁 CHANGED: item/board detection based on *containers* (live UI)
  const boardIdSet = useMemo(
    () => new Set(containers.map((b) => String(b.id))),
    [containers]
  );
  const itemIdSet = useMemo(() => {
    const s = new Set<string>();
    containers.forEach((b) => b.shapes.forEach((sh) => s.add(sh.id)));
    return s;
  }, [containers]);
  const isBoardId = useCallback(
    (id?: UniqueIdentifier | null) => !!id && boardIdSet.has(String(id)),
    [boardIdSet]
  );
  const isItemId = useCallback(
    (id?: UniqueIdentifier | null) => !!id && itemIdSet.has(String(id)),
    [itemIdSet]
  );

  // 🔁 CHANGED: normalize orders using the *current containers state*
  const normalizeAllOrders = useCallback(() => {
    containers.forEach((col) => {
      col.shapes.forEach((shape, idx) => {
        const nextOrder = (idx + 1) * 1000;
        if (shape.kanbanOrder !== nextOrder) {
          updateShape(shape.id, (s) => ({ ...s, kanbanOrder: nextOrder }));
        }
      });
    });
  }, [containers, updateShape]);

  // ===== DnD Handlers =====

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    setActiveId(String(active.id));
    boardsSnapshotRef.current = getCurrentIdsMap();
  }

  // ✅ onDragOver updates *containers* (the state we render from) → no snap
  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!active || !over) return;

    const activeType = active.data.current?.type as
      | "item"
      | "board"
      | undefined;
    const overType = over.data.current?.type as "item" | "board" | undefined;
    if (activeType !== "item") return;

    const fromId = String(active.id);

    setContainers((prev) => {
      const next = [...prev];

      const srcBoardIdx = findContainerIndexByItemId(fromId);
      if (srcBoardIdx < 0) return prev;

      const srcList = [...next[srcBoardIdx].shapes];
      const srcIdx = srcList.findIndex((s) => s.id === fromId);
      if (srcIdx < 0) return prev;

      // A) hover another item: insert BEFORE it
      if (overType === "item" && fromId !== String(over.id)) {
        const toId = String(over.id);
        const dstBoardIdx = findContainerIndexByItemId(toId);
        if (dstBoardIdx < 0) return prev;

        const dstList =
          dstBoardIdx === srcBoardIdx ? srcList : [...next[dstBoardIdx].shapes];
        const dstIdx = dstList.findIndex((s) => s.id === toId);
        if (dstIdx < 0) return prev;

        const [moved] = srcList.splice(srcIdx, 1);
        if (dstBoardIdx === srcBoardIdx) {
          srcList.splice(dstIdx, 0, moved);
          next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
        } else {
          dstList.splice(dstIdx, 0, moved);
          next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
          next[dstBoardIdx] = { ...next[dstBoardIdx], shapes: dstList };
        }
        return next;
      }

      // B) hover board background: append to destination
      if (overType === "board") {
        const dstBoardKey =
          (over.data.current?.boardKey as string) ?? String(over.id);
        const dstBoardIdx = findContainerIndexByBoardKey(dstBoardKey);
        if (dstBoardIdx < 0 || dstBoardIdx === srcBoardIdx) return prev;

        const dstList = [...next[dstBoardIdx].shapes];
        const [moved] = srcList.splice(srcIdx, 1);
        dstList.push(moved);

        next[srcBoardIdx] = { ...next[srcBoardIdx], shapes: srcList };
        next[dstBoardIdx] = { ...next[dstBoardIdx], shapes: dstList };
        return next;
      }

      return prev;
    });
  }

  // 🔁 CHANGED: DragMove (optional) – you can leave it or remove it.
  function handleDragMove(_event: DragMoveEvent) {
    // no-op; preview handled in onDragOver
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!active || !over) return;

    // At this point, containers already reflect the final lists due to preview.
    // We just normalize kanbanOrder (and later you’ll persist shape_ids arrays to DB).
    normalizeAllOrders();

    commitBoardsIfChanged();
  }

  const getCurrentIdsMap = useCallback(() => {
    return Object.fromEntries(
      containers.map((c) => [String(c.id), c.shapes.map((s) => s.id)])
    );
  }, [containers]);

  async function commitBoardsIfChanged() {
    const before = boardsSnapshotRef.current;
    const after = getCurrentIdsMap();

    // which boards changed?
    const changedBoardKeys = Object.keys(after).filter(
      (k) => JSON.stringify(after[k]) !== JSON.stringify(before[k])
    );
    if (changedBoardKeys.length === 0) return;

    // payload to server: boardId (number) + ordered shapeIds (string[])
    const payload = changedBoardKeys.map((k) => ({
      boardId: Number(k),
      shapeIds: after[k],
    }));

    try {
      await updateKanbanBoards(payload, path);
      //await saveBoardsComposition(payload); // 👉 implement below (API or Server Action)
      // success: nothing else to do (UI is already correct)
    } catch (e) {
      console.error("Failed to persist boards:", e);
      // optional rollback:
      // setContainers((prev) =>
      //   prev.map((c) => {
      //     const ids = before[String(c.id)];
      //     if (!ids) return c;
      //     const newShapes = ids
      //       .map((id) => prev.flatMap(b => b.shapes).find((s) => s.id === id))
      //       .filter(Boolean) as Shape[];
      //     return { ...c, shapes: newShapes };
      //   })
      // );
      // normalizeAllOrders();
    }
  }

  const onDeleteBoard = async (boardId: number, hasShapes: boolean) => {
    if (hasShapes) {
      setOpenAlert(true);
    } else {
      await deleteKanbanBoard(boardId, path);
      setContainers((prev) => prev.filter((b) => b.id !== boardId));
    }
  };

  // ===== Render directly from *containers* (🔁 CHANGED) =====
  return (
    <div className="min-h-0">
      <AlertDialog open={openAlert} onOpenChange={setOpenAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Board</AlertDialogTitle>
            <AlertDialogDescription className="flex items-center gap-2">
              You still have cards in this board. Please move them to a
              different board or remove them before deleting this board.
              <CircleAlertIcon className="text-orange-300 size-10" />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction>Ok</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <div className="flex w-full h-full gap-4 px-2 pb-2">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragMove={handleDragMove}
          onDragEnd={handleDragEnd}
        >
          {/* @ts-ignore */}
          <SortableContext
            items={containers.map((b) => b.id.toString() as UniqueIdentifier)}
          >
            {containers.map((board) => {
              // 🔁 CHANGED: use board.shapes (live) instead of getBoardItems(board)
              const boardItems = board.shapes;
              const ids = boardItems.map((s) => s.id);
              return (
                <Board
                  id={board.id}
                  title={board.name}
                  key={board.id}
                  onDeleteBoard={() =>
                    onDeleteBoard(board.id, boardItems.length > 0)
                  }
                  path={path}
                >
                  {/* @ts-ignore */}
                  <SortableContext
                    items={ids}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="flex-1 min-h-0 p-1 space-y-2">
                      {boardItems.map((shape) => (
                        <BoardItem
                          key={shape.id}
                          shape={shape}
                          boardKey={board.id.toString()} // dnd-kit data for items
                        />
                      ))}
                    </div>
                  </SortableContext>
                </Board>
              );
            })}
          </SortableContext>
        </DndContext>
        <Button variant={"outline"} onClick={onAddBoardClick}>
          <PlusCircleIcon />
          Add Board
        </Button>
      </div>
    </div>
  );
}
