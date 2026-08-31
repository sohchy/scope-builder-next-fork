"use client";

import { useState } from "react";
import { createJobTitle } from "@/services/jobTitles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ROLE_OPTIONS = [
  { value: "End-User", label: "End-User" },
  { value: "Buyer-Decision-Maker", label: "Buyer/Decision Maker" },
  { value: "Payer", label: "Payer" },
  { value: "Influencer", label: "Influencer" },
  { value: "Recommender", label: "Recommender" },
  { value: "Saboteur", label: "Saboteur" },
];

interface ManageJobTitlesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (jobTitle: string) => void;
}

export function ManageJobTitlesModal({
  open,
  onOpenChange,
  onCreated,
}: ManageJobTitlesModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const jobTitle = name.trim();
      await createJobTitle(jobTitle, role || undefined);
      onCreated(jobTitle);
      setName("");
      setRole("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Manage Job Titles</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Name</label>
            <Input
              placeholder="Job title name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">Role</label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role..." />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={!name.trim() || loading}>
              {loading ? "Saving..." : "Add Job Title"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
