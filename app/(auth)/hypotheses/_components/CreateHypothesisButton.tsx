"use client";

import { Button } from "@/components/ui/button";
import { createHypothesis } from "@/services/hypothesis";

export default function CreateHypothesisButton({
  maxOrder,
}: {
  maxOrder: number;
}) {
  return (
    <Button
      className="ml-auto"
      onClick={async () => {
        await createHypothesis(maxOrder + 1);
      }}
    >
      + Create
    </Button>
  );
}
