"use client";

import React, { useLayoutEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/** Vertical space between cards, in px. Matches the horizontal `gap-5`. */
const GAP = 20;

/**
 * Pinterest-style card layout: fixed column widths, free-flowing heights.
 *
 * Implemented as a CSS grid with 1px auto rows where each item spans as many
 * rows as it is tall — measured with a ResizeObserver, so cards whose height
 * settles late (the YouTube embeds) re-pack themselves once loaded.
 *
 * Why not `columns-*` or a JS absolute-position masonry:
 * - grid keeps the children in DOM order, so the first card stays top-left and
 *   reading order runs left-to-right (CSS multi-column fills top-to-bottom).
 * - children never move between parents, so nothing remounts on a re-pack —
 *   an iframe that changed columns would otherwise reload.
 *
 * Placement follows CSS grid auto-flow: each card lands in the first column
 * with room for it at that point, which is the tight packing you want — a short
 * card leaves its column free early and the next card slots in right beneath it.
 */
export function MasonryGrid({
  children,
  className,
}: {
  children: React.ReactNode;
  /** Override the column counts; defaults to 1 / 2 (md) / 3 (xl). */
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
        className,
      )}
      style={{ gridAutoRows: "1px", columnGap: GAP }}
    >
      {React.Children.map(children, (child) => (
        <MasonryItem>{child}</MasonryItem>
      ))}
    </div>
  );
}

function MasonryItem({ children }: { children: React.ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [span, setSpan] = useState(0);

  useLayoutEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    // Rows are 1px, so the span is the card's height plus the gap that follows
    // it. Runs in a layout effect so the first paint is already packed.
    const measure = () =>
      setSpan(Math.ceil(content.getBoundingClientRect().height) + GAP);

    measure();

    // Fires on content changes and on column-count changes (the card's width
    // changes, which changes how its text wraps).
    const observer = new ResizeObserver(measure);
    observer.observe(content);

    return () => observer.disconnect();
  }, []);

  return (
    // `span` is 0 only before the first measurement, which happens before paint.
    <div style={{ gridRowEnd: span ? `span ${span}` : undefined }}>
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
