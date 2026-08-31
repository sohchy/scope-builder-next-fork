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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";

type Option = { label: string; value: string };

type MultiSelectProps = {
  options: Option[];
  value: string | undefined; // csv of selected values
  onChange: (next: string) => void;

  placeholder?: string;
  className?: string;
  showSearch?: boolean;
  /** Optional hard cap. Left unset, the trigger shows as many badges as
   *  actually fit on one line and collapses the rest into "+N". */
  maxBadges?: number;

  /** Creatable behavior */
  creatable?: boolean;
  onCreateOption?: (opt: Option) => void; // let parent persist it if desired
  createLabel?: (input: string) => string; // for display in the list
  createValueFromLabel?: (label: string) => string; // value generator
};

function csvToArray(csv?: string | null): string[] {
  if (!csv) return [];
  return csv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function arrayToCsv(arr: string[]): string {
  const seen = new Set<string>();
  const clean = arr.filter((v) => {
    if (seen.has(v)) return false;
    seen.add(v);
    return true;
  });
  return clean.join(", ");
}

function normalizeForCompare(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function defaultCreateValueFromLabel(label: string) {
  // "Head of Finance" -> "head-of-finance"
  // keep it URL-ish, but you can override from props
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9._-]/g, "");
  // guard: empty => fallback
  return base.length ? base : `opt-${cryptoRandom()}`;
}

function cryptoRandom() {
  // safe in modern browsers; fallback if needed
  try {
    return globalThis.crypto?.randomUUID?.() ?? String(Date.now());
  } catch {
    return String(Date.now());
  }
}

// `useLayoutEffect` warns when React renders this on the server, and the
// measurement it guards only means anything in a browser anyway.
const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

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

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder = "Select roles...",
  className,
  showSearch = true,
  maxBadges,

  creatable = true,
  onCreateOption,
  createLabel = (input) => `Create "${input}"`,
  createValueFromLabel = defaultCreateValueFromLabel,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [createdOptions, setCreatedOptions] = React.useState<Option[]>([]);

  const valueArr = React.useMemo(() => csvToArray(value), [value]);

  const mergedOptions = React.useMemo(
    () => dedupeOptionsByValue([...options, ...createdOptions]),
    [options, createdOptions],
  );

  const selected = React.useMemo(() => {
    // Keep order from valueArr (not from options)
    const map = new Map(mergedOptions.map((o) => [o.value, o]));
    return valueArr.map((v) => map.get(v) ?? { value: v, label: v });
  }, [mergedOptions, valueArr]);

  // ── Badge strip sizing ────────────────────────────────────────────────────
  // How many badges fit is a measurement, not a constant — "Payer" and
  // "Buyer/Decision Maker" take very different widths. Every badge is laid out
  // in a hidden max-content twin so its natural width stays readable even while
  // the visible row is showing only a subset.
  const stripRef = React.useRef<HTMLDivElement>(null);
  const measureRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(selected.length);

  useIsomorphicLayoutEffect(() => {
    const strip = stripRef.current;
    const measure = measureRef.current;
    if (!strip || !measure) return;

    const GAP = 4; // gap-1

    const fit = () => {
      const available = strip.clientWidth;
      const nodes = Array.from(measure.children) as HTMLElement[];
      const widths = nodes.slice(0, selected.length).map((n) => n.offsetWidth);
      // The twin renders "+N" at the largest N it could ever show, so the
      // reserved slot is never narrower than the chip that lands in it.
      const overflowWidth = nodes[selected.length]?.offsetWidth ?? 0;

      // Longest run of badges that fits on its own,
      let used = 0;
      let count = 0;
      for (let i = 0; i < widths.length; i++) {
        const next = used + widths[i] + (i > 0 ? GAP : 0);
        if (next > available) break;
        used = next;
        count++;
      }
      // then give badges back until the "+N" chip fits beside them. Dropping to
      // zero is a valid answer: a lone long label yields just the count.
      while (count > 0 && count < selected.length) {
        const run =
          widths.slice(0, count).reduce((a, b) => a + b, 0) + GAP * (count - 1);
        if (run + GAP + overflowWidth <= available) break;
        count--;
      }

      setVisibleCount(maxBadges == null ? count : Math.min(count, maxBadges));
    };

    fit();
    // The trigger is full-width, so it resizes with the sheet and the viewport.
    const observer = new ResizeObserver(fit);
    observer.observe(strip);
    return () => observer.disconnect();
  }, [selected, maxBadges]);

  function commit(arr: string[]) {
    onChange(arrayToCsv(arr));
  }

  function toggle(val: string) {
    if (valueArr.includes(val)) commit(valueArr.filter((v) => v !== val));
    else commit([...valueArr, val]);
  }

  const isChecked = (val: string) => valueArr.includes(val);

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
      toggle(existing.value);
      setQuery("");
      return;
    }

    // Generate a value; ensure it doesn't collide
    let nextValue = createValueFromLabel(cleanLabel);
    const existingValues = new Set(mergedOptions.map((o) => o.value));
    if (existingValues.has(nextValue)) {
      nextValue = `${nextValue}-${cryptoRandom()}`;
    }

    const newOpt: Option = { label: cleanLabel, value: nextValue };

    setCreatedOptions((prev) => dedupeOptionsByValue([...prev, newOpt]));
    onCreateOption?.(newOpt);

    toggle(newOpt.value);
    setQuery("");
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
          {/* One line, never wrapping — the count adapts instead of the height. */}
          <div
            ref={stripRef}
            className="relative flex min-w-0 flex-1 items-center gap-1 overflow-hidden"
          >
            {selected.length === 0 && (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
            {selected.slice(0, visibleCount).map((opt) => (
              <Badge
                key={opt.value}
                variant="secondary"
                className="max-w-[11rem] shrink-0 truncate bg-[#111827] text-white"
              >
                {opt.label}
              </Badge>
            ))}
            {selected.length > visibleCount && (
              <Badge variant="outline" className="shrink-0">
                +{selected.length - visibleCount}
              </Badge>
            )}

            {/* Measurement twin: the full strip at natural width, never painted.
                Absolute so it stays out of the flow, `w-max` so nothing here
                wraps or shrinks and the widths read true. */}
            <div
              ref={measureRef}
              aria-hidden
              className="pointer-events-none absolute top-0 left-0 flex w-max gap-1 opacity-0"
            >
              {selected.map((opt) => (
                <Badge
                  key={opt.value}
                  variant="secondary"
                  className="max-w-[11rem] shrink-0 truncate"
                >
                  {opt.label}
                </Badge>
              ))}
              <Badge variant="outline" className="shrink-0">
                +{selected.length}
              </Badge>
            </div>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command loop>
          {showSearch && (
            <CommandInput
              placeholder="Search roles..."
              value={query}
              onValueChange={setQuery}
              onKeyDown={(e) => {
                // Press Enter to create when "Create ..." is available
                if (e.key === "Enter" && canCreate) {
                  e.preventDefault();
                  handleCreateAndSelect(trimmedQuery);
                }
              }}
            />
          )}

          {/* If you want "No roles found" only when not creatable, keep as-is.
              With creatable, we still show Create row (below) so empty state is less important. */}
          <CommandEmpty>No roles found.</CommandEmpty>

          <CommandGroup>
            {/* Optional: Select All / Clear All */}
            <div className="flex items-center justify-between px-2 py-1.5 text-sm text-muted-foreground">
              <button
                type="button"
                className="hover:underline"
                onClick={() => commit(mergedOptions.map((o) => o.value))}
              >
                Select all
              </button>
              <button
                type="button"
                className="hover:underline"
                onClick={() => commit([])}
              >
                Clear
              </button>
            </div>

            {/* Create row */}
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
                onSelect={() => toggle(opt.value)}
                className="cursor-pointer"
              >
                <Checkbox
                  checked={isChecked(opt.value)}
                  className="mr-2"
                  aria-label={opt.label}
                />
                <span className="flex-1">{opt.label}</span>
                {isChecked(opt.value) && (
                  <Check className="h-4 w-4 opacity-70" />
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
