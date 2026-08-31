"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";

type Option = { label: string; value: string };

type ComboboxProps = {
  options: Option[];
  value: string | undefined;
  onChange: (next: string) => void;

  placeholder?: string;
  className?: string;
  showSearch?: boolean;

  /** Creatable behavior */
  creatable?: boolean;
  onCreateOption?: (opt: Option) => void; // let parent persist it if desired
  createLabel?: (input: string) => string; // for display in the list
};

function normalizeForCompare(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function dedupeOptionsByValue(opts: Option[]) {
  const seen = new Set<string>();
  const out: Option[] = [];
  for (const o of opts) {
    if (seen.has(o.value)) continue;
    seen.add(o.value);
    out.push(o);
  }
  return out;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = "Select...",
  className,
  showSearch = true,

  creatable = true,
  onCreateOption,
  createLabel = (input) => `Create "${input}"`,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [createdOptions, setCreatedOptions] = React.useState<Option[]>([]);

  const mergedOptions = React.useMemo(
    () => dedupeOptionsByValue([...options, ...createdOptions]),
    [options, createdOptions],
  );

  const selected = React.useMemo(
    () => mergedOptions.find((o) => o.value === value),
    [mergedOptions, value],
  );

  function select(val: string) {
    onChange(val);
    setOpen(false);
    setQuery("");
  }

  // --- creatable logic ---
  const trimmedQuery = query.trim();
  const normalizedQuery = normalizeForCompare(trimmedQuery);

  const exactLabelMatch = React.useMemo(() => {
    if (!normalizedQuery) return false;
    return mergedOptions.some(
      (o) => normalizeForCompare(o.label) === normalizedQuery,
    );
  }, [mergedOptions, normalizedQuery]);

  const canCreate = creatable && normalizedQuery.length > 0 && !exactLabelMatch;

  function handleCreateAndSelect(label: string) {
    const cleanLabel = label.trim();
    if (!cleanLabel) return;

    // If a label exists (case-insensitive), select that existing option instead of creating.
    const existing = mergedOptions.find(
      (o) => normalizeForCompare(o.label) === normalizeForCompare(cleanLabel),
    );
    if (existing) {
      select(existing.value);
      return;
    }

    const newOpt: Option = { label: cleanLabel, value: cleanLabel };

    setCreatedOptions((prev) => dedupeOptionsByValue([...prev, newOpt]));
    onCreateOption?.(newOpt);

    select(newOpt.value);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span
            className={cn(
              "truncate",
              !selected && "text-muted-foreground",
            )}
          >
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command loop>
          {showSearch && (
            <CommandInput
              placeholder="Search..."
              value={query}
              onValueChange={setQuery}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) {
                  e.preventDefault();
                  handleCreateAndSelect(trimmedQuery);
                }
              }}
            />
          )}

          <CommandEmpty>No results found.</CommandEmpty>

          <CommandGroup>
            {canCreate && (
              <CommandItem
                value={trimmedQuery}
                keywords={[trimmedQuery]}
                onSelect={() => handleCreateAndSelect(trimmedQuery)}
                className="cursor-pointer"
              >
                <Plus className="mr-2 h-4 w-4 opacity-70" />
                <span className="flex-1">{createLabel(trimmedQuery)}</span>
              </CommandItem>
            )}

            {mergedOptions.map((opt) => (
              <CommandItem
                key={opt.value}
                value={opt.label}
                keywords={[opt.label]}
                onSelect={() => select(opt.value)}
                className="cursor-pointer"
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    opt.value === value ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="flex-1">{opt.label}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
