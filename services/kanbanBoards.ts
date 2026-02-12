"use server";

import liveblocks from "@/lib/liveblocks";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createKanbanBoard(
  roomId: string,
  name: string,
  order: number,
  path: string
) {
  const newBoard = await prisma.kanbanBoardCategory.create({
    data: {
      room_id: roomId,
      name,
      order,
      shape_ids: [],
    },
  });

  revalidatePath(path);

  return newBoard;
}

export async function updateKanbanBoard(
  boardId: number,
  values: any,
  path: string
) {
  const updatedBoard = await prisma.kanbanBoardCategory.update({
    where: { id: boardId },
    data: {
      ...values,
    },
  });

  revalidatePath(path);

  return updatedBoard;
}

export async function deleteKanbanBoard(boardId: number, path: string) {
  await prisma.kanbanBoardCategory.delete({
    where: { id: boardId },
  });

  revalidatePath(path);
}

export async function getRoomKanbanBoards(roomId: string) {
  const shapes = await getKanbanBoardShapes(roomId);

  const kanbanBoards = await prisma.kanbanBoardCategory.findMany({
    where: { room_id: roomId },
    orderBy: { order: "asc" },
  });

  if (kanbanBoards.length === 0) {
    const kanbanBoard = await prisma.kanbanBoardCategory.create({
      data: {
        order: 0,
        room_id: roomId,
        name: "Unnamed board",
        shape_ids: shapes.map((shape) => shape.id),
      },
    });
    return [kanbanBoard];
  }

  for (const shape of shapes) {
    const isShapeInAnyBoard = kanbanBoards.some((board) =>
      board.shape_ids.includes(shape.id)
    );

    if (!isShapeInAnyBoard) {
      const defaultBoard = kanbanBoards[0];
      defaultBoard.shape_ids.push(shape.id);
      await prisma.kanbanBoardCategory.update({
        where: { id: defaultBoard.id },
        data: { shape_ids: defaultBoard.shape_ids },
      });
    }
  }

  return kanbanBoards;
}

export async function getKanbanBoardShapes(roomId: string) {
  await liveblocks.getOrCreateRoom(roomId, {
    defaultAccesses: [],
  });

  const storage = await liveblocks.getStorageDocument(roomId, "json");

  return (
    storage.shapes.filter(
      (shape) => !["rect", "text", "ellipse"].includes(shape.type)
    ) || []
  );
}

export async function updateKanbanBoards(
  kanbanBoards: { boardId: number; shapeIds: string[] }[],
  path?: string
) {
  for (const board of kanbanBoards) {
    await prisma.kanbanBoardCategory.update({
      where: { id: board.boardId },
      data: { shape_ids: board.shapeIds },
    });
  }

  if (path) {
    revalidatePath(path);
  }
}
