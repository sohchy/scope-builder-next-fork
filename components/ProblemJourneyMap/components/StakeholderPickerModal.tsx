"use client";

import { useEffect, useState } from "react";

import type { StakeholderRow } from "@/services/market";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { STAKEHOLDER_DEFINITIONS } from "./Market/constants";
import { StakeholderCard } from "./Market/StakeholderCard";

interface StakeholderPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stakeholderRows: StakeholderRow[];
  selectedIds: number[];
  onSave: (ids: number[]) => void;
}

export function StakeholderPickerModal({
  open,
  onOpenChange,
  stakeholderRows,
  selectedIds,
  onSave,
}: StakeholderPickerModalProps) {
  // Draft selection, seeded from the current selection each time the modal opens
  // so a Cancel discards in-modal selection changes. Row add/edit/delete persist
  // immediately to the org catalog and are NOT part of this draft.
  const [draft, setDraft] = useState<Set<number>>(new Set(selectedIds));

  useEffect(() => {
    if (open) setDraft(new Set(selectedIds));
  }, [open, selectedIds]);

  const rowsByType = new Map<string, StakeholderRow[]>();
  for (const row of stakeholderRows) {
    const list = rowsByType.get(row.stakeholder_type) ?? [];
    list.push(row);
    rowsByType.set(row.stakeholder_type, list);
  }

  const toggle = (id: number) => {
    setDraft((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Auto-select rows created here, and prune ids of rows deleted here.
  const handleRowCreated = (id: number) => {
    setDraft((prev) => new Set(prev).add(id));
  };

  const handleRowDeleted = (id: number) => {
    setDraft((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleSave = () => {
    onSave([...draft]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] w-[95vw] max-w-[1400px] gap-0 overflow-hidden p-0 sm:max-w-[1400px]">
        <DialogHeader className="border-b border-[#E5E7EB] p-6">
          <DialogTitle>Choose stakeholders</DialogTitle>
          <DialogDescription>
            Select the stakeholders involved in this trigger. Add, edit, or remove
            rows here — changes sync with the Market tab.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-[55vh] overflow-y-auto bg-[#F7F8FA] p-4">
          <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {STAKEHOLDER_DEFINITIONS.map((definition) => (
              <StakeholderCard
                key={definition.key}
                definition={definition}
                initialRows={rowsByType.get(definition.key) ?? []}
                selectable
                selectedIds={draft}
                onToggleSelect={toggle}
                onRowCreated={handleRowCreated}
                onRowDeleted={handleRowDeleted}
              />
            ))}
          </div>
        </div>

        <DialogFooter className="border-t border-[#E5E7EB] p-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
