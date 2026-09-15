"use client";

import { useCallback, useEffect } from "react";
import { useMutation, useStorage } from "@liveblocks/react/suspense";
import { LiveObject } from "@liveblocks/client";
import { useNodesState, type Node, type OnNodeDrag } from "@xyflow/react";

import type { AdLibCardStorage, AdLibField } from "@/liveblocks.config";
import {
  buildAdLibCard,
  nextAdLibPosition,
  nextAdLibVersion,
} from "@/lib/adLibValueProp";

export type AdLibCardNodeData = {
  version: number;
};

export type AdLibCardNode = Node<AdLibCardNodeData, "adlib_card">;

type CardPlacement = Pick<AdLibCardStorage, "id" | "version" | "position">;

function toNode(card: CardPlacement): AdLibCardNode {
  return {
    id: card.id,
    type: "adlib_card",
    position: { x: card.position.x, y: card.position.y },
    data: { version: card.version },
  };
}

/**
 * Bridges the room's `adLibCards` list and React Flow's controlled node state.
 *
 * Nodes carry placement only — position and version. Each card reads its own
 * blanks straight from storage, so typing never touches the node array and never
 * re-renders the other cards.
 */
export function useAdLibCards() {
  const cards = useStorage((root) => root.adLibCards);

  const [nodes, setNodes, onNodesChange] = useNodesState<AdLibCardNode>(
    cards.map(toNode),
  );

  // Diff-based storage → React Flow sync. Returns the same array whenever nothing
  // this canvas shows has changed, so a keystroke in a blank (which does change
  // `cards`) doesn't hand React Flow a new `nodes` prop.
  useEffect(() => {
    setNodes((current) => {
      const byId = new Map(current.map((node) => [node.id, node]));
      let changed = current.length !== cards.length;

      const next = cards.map((card) => {
        const node = byId.get(card.id);
        if (!node) {
          changed = true;
          return toNode(card);
        }
        // The local drag wins while it lasts; a collaborator's move of the same
        // card lands on the next sync after it ends.
        if (node.dragging) return node;
        if (
          node.position.x === card.position.x &&
          node.position.y === card.position.y &&
          node.data.version === card.version
        ) {
          return node;
        }
        changed = true;
        return {
          ...node,
          position: { x: card.position.x, y: card.position.y },
          data: { version: card.version },
        };
      });

      return changed ? next : current;
    });
  }, [cards, setNodes]);

  // Version and position are worked out inside the mutation, against the list as
  // it is at write time, and the new card is returned so the canvas can pan to it.
  const addCard = useMutation(({ storage }): AdLibCardStorage => {
    const list = storage.get("adLibCards");
    const existing = list.toImmutable();
    const version = nextAdLibVersion(existing, storage.get("adLibLastVersion"));
    const card = buildAdLibCard(
      crypto.randomUUID(),
      version,
      nextAdLibPosition(existing),
    );
    list.push(new LiveObject(card));
    storage.set("adLibLastVersion", version);
    return card;
  }, []);

  // Permanent: the card leaves storage. Its number stays spent via
  // `adLibLastVersion`, which `addCard` keeps up to date.
  const deleteCard = useMutation(({ storage }, cardId: string) => {
    const list = storage.get("adLibCards");
    const index = list.findIndex((card) => card.get("id") === cardId);
    if (index !== -1) list.delete(index);
  }, []);

  const updateCardField = useMutation(
    ({ storage }, cardId: string, field: AdLibField, value: string) => {
      storage
        .get("adLibCards")
        .find((card) => card.get("id") === cardId)
        ?.set(field, value);
    },
    [],
  );

  const moveCards = useMutation(
    ({ storage }, moved: Array<{ id: string; x: number; y: number }>) => {
      const list = storage.get("adLibCards");
      for (const { id, x, y } of moved) {
        list.find((card) => card.get("id") === id)?.set("position", { x, y });
      }
    },
    [],
  );

  // Positions are written once, on drop — React Flow already moves the card
  // locally while it's dragged.
  const onNodeDragStop: OnNodeDrag<AdLibCardNode> = useCallback(
    (_event, _node, dragged) => {
      moveCards(
        dragged.map((node) => ({
          id: node.id,
          x: node.position.x,
          y: node.position.y,
        })),
      );
    },
    [moveCards],
  );

  return {
    cards,
    nodes,
    onNodesChange,
    onNodeDragStop,
    addCard,
    deleteCard,
    updateCardField,
  };
}
