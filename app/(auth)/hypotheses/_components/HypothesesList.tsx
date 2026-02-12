"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import HypothesesCard, { Hypotheses } from "./HypothesesCard";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useState } from "react";
import { updateHypothesisOrder } from "@/services/hypothesis";
import { Button } from "@/components/ui/button";
import { GridIcon, HandIcon } from "lucide-react";

interface HypothesesListProps {
  hypotheses: Hypotheses[];
}

export default function HypothesesList({ hypotheses }: HypothesesListProps) {
  const [items, setItems] = useState(hypotheses);

  useEffect(() => {
    setItems(hypotheses);
  }, [hypotheses]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = items.findIndex(
        (item) => item.id.toString() === active.id,
      );
      const newIndex = items.findIndex(
        (item) => item.id.toString() === over?.id,
      );

      const newItems = [...items];
      const [movedItem] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, movedItem);

      // update the order property based on the new index
      const updatedItems = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      setItems(updatedItems);
      updateHypothesisOrder(
        updatedItems.map((item) => ({ id: item.id, order: item.order })),
      );
    }
  }

  console.log("items", items);

  return (
    <DndContext onDragEnd={handleDragEnd}>
      {/* @ts-ignore */}
      <SortableContext
        items={items.map((hypothesis) => hypothesis.id.toString())}
      >
        {items.map((hypothesis) => (
          <SortableItem key={hypothesis.id} hypothesis={hypothesis} />
        ))}
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({ hypothesis }: { hypothesis: Hypotheses }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: hypothesis.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <>
        <Button
          variant={"ghost"}
          size={"icon"}
          {...listeners}
          {...attributes}
          className="absolute bottom-2 right-2"
        >
          <HandIcon />
        </Button>
        <HypothesesCard hypothesis={hypothesis} />
      </>
    </div>
  );
}
