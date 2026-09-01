"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { CheckCircle2, Lock } from "lucide-react";

import { MILESTONE_LABELS, SUB_STEPS } from "@/lib/milestones";
import { useMilestoneSelection } from "../MilestoneSelectionContext";
import { useSubStepProgress } from "../SubStepProgressContext";

type SubStepStatus = "done" | "active" | "pending";

interface SubStep {
  label: string;
  status: SubStepStatus;
  /** Number of filled progress segments (0..SEGMENTS). */
  filled: number;
}

interface Milestone {
  label: string;
  subSteps: SubStep[];
}

interface MilestoneHeaderProps {
  milestones?: Milestone[];
  payerInterviews?: number;
  currentNumber?: number;
  /** Milestone numbers (0-based — milestone 0 is Program Orientation) an
   *  instructor has signed off. These paint green instead of indigo when
   *  selected, and a lighter green instead of gray when not — so completed
   *  milestones are recognisable across the whole strip at a glance. */
  reviewedMilestones?: number[];
  /** Milestone numbers the startup has unlocked. The rest get a lock icon beside
   *  their name, and their sub-step cells grey out with a lock of their own once
   *  the block is expanded — a hint only, the blocks stay clickable so a team can
   *  preview what's coming. Omit to show no locks at all. The /examples mirrors
   *  pass the viewer's own access here rather than omitting, so a showcase strip
   *  carries the same locks as the viewer's real page. */
  availableMilestones?: number[];
}

// Number of progress segments rendered under each sub-step.
const SEGMENTS = 3;

// Sub-step completion is binary today (one steps-card item per sub-step, Reviewed
// or not), so the partial-progress segments are hidden. Kept behind this flag —
// flip it back on if sub-steps ever gain sub-items to count.
const SHOW_PROGRESS_SEGMENTS = false;

// Depth of the arrow tip / notch, as a length. Lives in a CSS variable rather
// than a JS constant because the clip-path polygons below are plain strings that
// have to resolve it at paint time, and the horizontal paddings derive from it
// with calc().
const ARROW = "var(--ms-arrow)";

// Every segment of the strip — a milestone's label block and each of its
// sub-step cells — is one of these two shapes, applied to the element's OWN box
// via clip-path rather than drawn as an SVG sitting outside it. That's what makes
// the background, the hover color and the hit area follow the arrow instead of
// the bounding rectangle. Segments overlap their left neighbour by exactly
// ARROW, so a block's notch and its predecessor's tip are complementary and tile
// without a seam.
const CLIP_ARROW = `polygon(0 0, calc(100% - ${ARROW}) 0, 100% 50%, calc(100% - ${ARROW}) 100%, 0 100%, ${ARROW} 50%)`;
// First block in the strip: nothing to its left, so no notch (per design).
const CLIP_ARROW_FLAT_LEFT = `polygon(0 0, calc(100% - ${ARROW}) 0, 100% 50%, calc(100% - ${ARROW}) 100%, 0 100%)`;

const INDIGO = "#6935FD";
const CHEVRON_GRAY = "#B9BDC9"; // divider / tip outline on the gray blocks
const CHEVRON_INDIGO = "#B3A0E4"; // divider outline between tinted sub-steps
const CHEVRON_GREEN = "#98C5A5"; // divider outline on completed sub-steps
const GRAY_TEXT = "#6E7689";
const INDIGO_LABEL = "#C7D2FE"; // indigo-200, used for the milestone title

// Reviewed milestones swap indigo for green on the label block only — the
// sub-step cells keep their own indigo/green tints, which track sub-step
// completion rather than instructor sign-off.
const GREEN_SOLID = "#2F9E63"; // label block of a reviewed, selected milestone
const GREEN_SOLID_LABEL = "#C7EBD5"; // its title text, mirroring INDIGO_LABEL

// The same state while collapsed: a lighter green standing in for BLOCK_GRAY,
// with green counterparts of GRAY_LABEL / GRAY_TEXT so the whole block reads as
// done without competing with the selected one.
const GREEN_BLOCK = "#D7EFE0"; // unselected reviewed milestone
const GREEN_BLOCK_HOVER = "#C6E7D3";
const GREEN_BLOCK_NUMBER = "#1F7A4C"; // its "#N" caption
const GREEN_BLOCK_LABEL = "#178E55"; // its title text

const INDIGO_TINT = "#F1ECFF"; // sub-step cells of the selected milestone
const GREEN_TINT = "#E7F7EC"; // completed sub-step cells
const GREEN_TEXT = "#178E55"; // "Completed" check + label — one notch under --progress-done
const BLOCK_GRAY = "#EFF0F4"; // unselected milestone blocks
const GRAY_LABEL = "#4E5566"; // "#N" caption on unselected blocks

// Shared transition for every animated property so resize, color and content
// reveal all move together. easeInOut cubic-bezier, ~280ms.
const TRANSITION = { duration: 0.28, ease: [0.4, 0, 0.2, 1] } as const;
const INSTANT = { duration: 0 } as const;

/**
 * One arrow-shaped cell of the strip. Two stacked clipped layers:
 *
 *   - the outer element, clipped to the full arrow and painted `edge` — the
 *     outline color;
 *   - an absolute fill layer, clipped to the same arrow but inset `edgeWidth` on
 *     the right only, painted `fill`.
 *
 * The strip the fill doesn't cover (`edgeWidth`, 1px by default) is the diagonal
 * border along the tip. The notch side is left flush on purpose: a notch always
 * sits on top of the previous segment's tip, which has already drawn that line,
 * so outlining both would make every divider read double.
 *
 * Horizontal borders are NOT drawn here — the milestone block paints its own
 * top/bottom rules across all of its segments, matching the old behaviour where
 * those belonged to the block and the diagonals to the chevrons.
 *
 * Content sits above the fill layer, horizontally centred on the arrow's area
 * centroid — which is NOT the same as the centre of its mid-height slice. The
 * notch and the tip are congruent triangles, so removing one near the left edge
 * and adding one past the right edge cancel out exactly: a notched arrow's
 * centroid is its plain box centre, and symmetric padding centres the label. (An
 * un-notched arrow keeps the tip without the cancelling notch, so its centroid
 * sits A/4 to the LEFT of the box centre — hence the nudge below.)
 *
 * Centring on the mid-height slice instead would push labels A/2 to the right.
 * That reads as off-centre here because the labels are ~60px tall in an ~80px
 * block, so most of the text sits well away from mid-height, where the diagonals
 * have already closed in.
 *
 * The pad also has to clear those diagonals over the content's full height: a
 * content box C tall in a block H tall needs at least A·C/H of right padding, or
 * the corners of the top and bottom lines get clipped. See each caller's values.
 */
function ArrowSegment({
  fill,
  edge,
  edgeWidth = 1,
  notched,
  overlap,
  transition,
  className = "",
  style,
  children,
}: {
  /** Interior color of the arrow. */
  fill: string;
  /** Outline along the tip diagonal. Pass the same value as `fill` for no
   *  visible divider. */
  edge: string;
  /** Horizontal thickness of that outline, in px. 1 for the internal chevron
   *  dividers; 2 for a segment whose tip is the milestone block's own outer
   *  border, so it matches the 2px top/bottom rules the block paints. */
  edgeWidth?: number;
  /** Bite a notch out of the left edge. False only for the very first block. */
  notched: boolean;
  /** Pull left by one arrow depth so this segment's notch lands on its
   *  neighbour's tip. False for the first segment inside a block — the block
   *  itself carries that offset. */
  overlap: boolean;
  transition: typeof TRANSITION | typeof INSTANT;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const clipPath = notched ? CLIP_ARROW : CLIP_ARROW_FLAT_LEFT;
  return (
    <motion.div
      initial={false}
      transition={transition}
      animate={{ backgroundColor: edge }}
      style={{
        clipPath,
        marginLeft: overlap ? `calc(${ARROW} * -1)` : 0,
        paddingLeft: notched
          ? "var(--ms-pad)"
          : `calc(var(--ms-pad) - ${ARROW} / 4)`,
        paddingRight: notched
          ? "var(--ms-pad)"
          : `calc(var(--ms-pad) + ${ARROW} / 4)`,
        ...style,
      }}
      className={`relative ${className}`}
    >
      <motion.div
        aria-hidden
        initial={false}
        transition={transition}
        animate={{ backgroundColor: fill }}
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: edgeWidth,
          clipPath,
        }}
      />
      {children}
    </motion.div>
  );
}

function ProgressSegments({ filled }: { filled: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: SEGMENTS }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 w-3 rounded-full lg:w-4 xl:w-5 ${
            i < filled ? "bg-[#6935FD]" : "bg-[#D9CCFF]"
          }`}
        />
      ))}
    </div>
  );
}

function SubStepCell({
  subStep,
  isLast,
  accent,
  isLocked,
  transition,
}: {
  subStep: SubStep;
  /** Terminates the milestone, so its tip is the block's tip and takes the
   *  block's accent outline rather than a pale internal divider. */
  isLast: boolean;
  accent: string;
  /** Its milestone hasn't been activated for this startup. The whole cell greys
   *  out and shows a lock, overriding any Done tint — a sub-step ticked ahead of
   *  the instructor unlocks nothing (see `isSubStepUnlocked`), so showing it as
   *  Completed here would claim progress the team doesn't have. */
  isLocked: boolean;
  transition: typeof TRANSITION | typeof INSTANT;
}) {
  const isDone = !isLocked && subStep.status === "done";
  const bg = isLocked ? BLOCK_GRAY : isDone ? GREEN_TINT : INDIGO_TINT;
  const divider = isLocked
    ? CHEVRON_GRAY
    : isDone
      ? CHEVRON_GREEN
      : CHEVRON_INDIGO;
  return (
    <ArrowSegment
      fill={bg}
      edge={isLast ? accent : divider}
      // The last cell's tip is the whole block's tip, so it carries the block's
      // outer border rather than an internal chevron divider — 2px, matching the
      // top/bottom rules. The dividers between cells stay 1px.
      edgeWidth={isLast ? 2 : 1}
      notched
      overlap
      transition={transition}
      // Tallest content in the strip — ~59px (label + status row) in a 75-83px
      // block — so the tip diagonal has closed in by ~16px by the time it reaches
      // the top and bottom lines. That, not visual balance, sets the minimum.
      className="flex shrink-0 flex-col items-center justify-center gap-1.5 py-2 lg:py-3 [--ms-pad:18px] lg:[--ms-pad:20px] xl:[--ms-pad:22px]"
    >
      {/* Capped narrow so labels wrap onto a second line instead of stretching
          the cell wide on one. */}
      <span
        style={isLocked ? { color: GRAY_LABEL } : undefined}
        className="relative h-[35px] block line-clamp-2 max-w-[112px] text-center text-xs font-medium leading-tight text-gray-800 xl:max-w-[132px] xl:text-sm"
      >
        {subStep.label}
      </span>

      {isLocked ? (
        // Same row the check / segments occupy, so locked cells keep the strip's
        // shared baseline.
        <div
          className="relative flex h-[18px] items-center"
          style={{ color: GRAY_LABEL }}
        >
          <Lock aria-label="Not activated yet" size={13} />
        </div>
      ) : isDone ? (
        <div
          className="relative flex items-center gap-1"
          style={{ color: GREEN_TEXT }}
        >
          <CheckCircle2 size={13} />
          <span className="text-xs">Completed</span>
        </div>
      ) : SHOW_PROGRESS_SEGMENTS ? (
        <div className="relative">
          <ProgressSegments filled={subStep.filled} />
        </div>
      ) : (
        // Placeholder matching the height of the "Completed" row / segments, so
        // pending cells don't shrink and shift the strip.
        <span aria-hidden className="relative h-[18px]" />
      )}
    </ArrowSegment>
  );
}

export function MilestoneHeader({
  milestones: milestonesProp,
  payerInterviews = 8,
  currentNumber = 4,
  reviewedMilestones,
  availableMilestones,
}: MilestoneHeaderProps) {
  const reviewed = useMemo(
    () => new Set(reviewedMilestones ?? []),
    [reviewedMilestones],
  );
  const available = useMemo(
    () => (availableMilestones ? new Set(availableMilestones) : null),
    [availableMilestones],
  );
  // Selected milestone is shared via context so the tab content (Get Started)
  // can react to it. Milestones start at 0, so the milestone number and its
  // index into MILESTONE_LABELS are the same value — hence no ±1 below.
  const { selectedMilestone: expandedIndex, setSelectedMilestone } =
    useMilestoneSelection();
  // A sub-step is Done when its item on the milestone's steps card (Instructions
  // tab) is marked Reviewed. Toggling there updates this map optimistically, so
  // the header reflects the change without a reload.
  const { progress } = useSubStepProgress();

  const derivedMilestones = useMemo<Milestone[]>(
    () =>
      MILESTONE_LABELS.map((label, index) => ({
        label,
        subSteps: SUB_STEPS.filter(
          (subStep) => subStep.milestone === index,
        ).map((subStep) => ({
          label: subStep.label,
          status: progress[subStep.key] ? "done" : "active",
          filled: progress[subStep.key] ? SEGMENTS : 0,
        })),
      })),
    [progress],
  );

  const milestones = milestonesProp ?? derivedMilestones;
  const total = milestones.length;

  const reduceMotion = useReducedMotion();
  const transition = reduceMotion ? INSTANT : TRANSITION;

  // A collapsing block keeps its content-sized width until its sub-steps have
  // finished exiting — otherwise it snaps narrow immediately and the outgoing
  // sub-steps overlap the neighbouring blocks for the length of the exit.
  const [exitingIndex, setExitingIndex] = useState<number | null>(null);

  // Hover is tracked in state rather than with `whileHover` because two elements
  // have to react to it together — the label segment's fill and its 1px tip
  // outline — and they are siblings, not one box. Hit testing follows the
  // clip-path, so this only fires over the actual arrow.
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const spacerRef = useRef<HTMLDivElement | null>(null);
  const blockRefs = useRef<(HTMLDivElement | null)[]>([]);
  const prevIndexRef = useRef(expandedIndex);

  useEffect(() => {
    const prev = prevIndexRef.current;
    prevIndexRef.current = expandedIndex;
    if (prev !== expandedIndex) setExitingIndex(prev);
  }, [expandedIndex]);

  // Align the selected milestone to the start of the strip so it's always seen
  // from its beginning (its sub-steps extend to the right). Scroll the strip
  // container itself by the measured gap between the block's left edge and the
  // container's left edge — `scrollIntoView` gets interrupted by the ongoing
  // flexGrow animation and lands the block mid-strip. Wait for the grow
  // animation to settle, otherwise this measures the pre-grow box.
  useEffect(() => {
    const scroll = () => {
      const container = scrollRef.current;
      const block = blockRefs.current[expandedIndex];
      const lastBlock = blockRefs.current[total - 1];
      if (!container || !block || !lastBlock) return;

      const containerLeft = container.getBoundingClientRect().left;
      const blockLeft = block.getBoundingClientRect().left;
      // Only reserve as much trailing room as this milestone actually needs to
      // reach the left edge: the shortfall between the visible strip width and
      // the real content from the selected block to the end. Middle milestones
      // have enough following content, so this is 0 and no blank is added.
      const trailingContent =
        lastBlock.getBoundingClientRect().right - blockLeft;
      const needed = Math.max(0, container.clientWidth - trailingContent);
      if (spacerRef.current) spacerRef.current.style.width = `${needed}px`;

      container.scrollBy({
        left: blockLeft - containerLeft,
        behavior: reduceMotion ? "auto" : "smooth",
      });
    };

    if (reduceMotion) {
      scroll();
      return;
    }
    // Add margin past the transition so the previous milestone has fully
    // collapsed before we measure — otherwise its late collapse shifts the
    // selected block and the alignment lands off. rAF ensures the final layout
    // is flushed before measuring.
    let raf = 0;
    const id = window.setTimeout(
      () => {
        raf = window.requestAnimationFrame(scroll);
      },
      TRANSITION.duration * 1000 + 80,
    );
    return () => {
      window.clearTimeout(id);
      window.cancelAnimationFrame(raf);
    };
  }, [expandedIndex, reduceMotion, total]);

  return (
    <div className="flex w-full items-stretch border-b border-[#E4E5ED] bg-white">
      <div
        ref={scrollRef}
        className="no-scrollbar min-w-0 flex-1 overflow-x-auto"
      >
        {/* Collapsed width. Sized so the longest two-word tail ("Present
            Findings") still fits on one line — i.e. every label wraps to at most
            two lines — after the horizontal padding and the notch are taken out.
            Note that a block overlaps its neighbour by one arrow depth, so the
            width it actually advances the strip by is the basis minus that
            depth. */}
        <div className="flex w-full min-w-max items-stretch [--ms-arrow:20px] [--ms-basis:145px] lg:[--ms-basis:162px] xl:[--ms-basis:185px]">
          {milestones.map((milestone, index) => {
            const isExpanded = index === expandedIndex;
            // Sign-off recolours the block green in both states — solid while
            // selected, a lighter tint while collapsed.
            const isReviewed = reviewed.has(index);
            // Not yet unlocked for this startup. Purely a visual hint — the block
            // still selects, so the milestone can be previewed.
            const isLocked = available ? !available.has(index) : false;
            const accent = isReviewed ? GREEN_SOLID : INDIGO;
            const accentLabel = isReviewed ? GREEN_SOLID_LABEL : INDIGO_LABEL;
            // Collapsed palette — green for a reviewed milestone, gray otherwise.
            const restBg = isReviewed ? GREEN_BLOCK : BLOCK_GRAY;
            const restHoverBg = isReviewed ? GREEN_BLOCK_HOVER : "#E4E5ED";
            const restNumber = isReviewed ? GREEN_BLOCK_NUMBER : GRAY_LABEL;
            const restLabel = isReviewed ? GREEN_BLOCK_LABEL : GRAY_TEXT;
            const restChevron = isReviewed ? CHEVRON_GREEN : CHEVRON_GRAY;
            // Content-sized while expanded (and while collapsing) so the sub-steps
            // widen the block instead of overflowing onto the next one.
            const sizeToContent = isExpanded || index === exitingIndex;
            // Left blocks stack above right ones. With complementary clip-paths
            // nothing overdraws, but this keeps the paint order predictable.
            const zIndex = total - index;
            const isFirst = index === 0;
            const isHovered = !isExpanded && hoveredIndex === index;
            const labelFill = isExpanded
              ? accent
              : isHovered
                ? restHoverBg
                : restBg;
            // While collapsed the label segment IS the whole block, so its tip
            // carries the block's outline. While expanded its tip is an internal
            // divider against the first sub-step, which the old design drew
            // unstroked — matching `edge` to `fill` reproduces that.
            const labelEdge = isExpanded ? accent : restChevron;
            const blockBorder = isExpanded ? accent : "rgba(0,0,0,0)";
            // Painted behind the segments, so it only shows in the sliver the
            // sub-steps briefly vacate while they slide in and out. Matched to the
            // colour of whichever segment ends the block, so that sliver reads as
            // part of the tip instead of flashing the page background through it.
            const tailFill = !isExpanded
              ? labelFill
              : isLocked
                ? BLOCK_GRAY
                : milestone.subSteps.at(-1)?.status === "done"
                  ? GREEN_TINT
                  : INDIGO_TINT;

            return (
              <motion.div
                key={milestone.label}
                ref={(el) => {
                  blockRefs.current[index] = el;
                }}
                onClick={() => setSelectedMilestone(index)}
                onHoverStart={() => setHoveredIndex(index)}
                onHoverEnd={() =>
                  setHoveredIndex((cur) => (cur === index ? null : cur))
                }
                initial={false}
                transition={transition}
                // Animate flexGrow (a real layout property) rather than framer's
                // transform-based `layout`, so the box you see is always the real
                // box — no transform to release at the end of the animation, which
                // is what caused the settle-jump. flexBasis pins the collapsed
                // width; grow=1 lets the expanded one absorb the free space.
                animate={{
                  flexGrow: isExpanded ? 1 : 0,
                  backgroundColor: tailFill,
                }}
                style={{
                  zIndex,
                  flexBasis: "var(--ms-basis)",
                  flexShrink: 0,
                  minWidth: sizeToContent ? "max-content" : 0,
                  // The block is clipped to the union of its segments. It has no
                  // background of its own, but the clip is what makes clicks and
                  // hovers land on the arrow rather than the bounding rectangle —
                  // without it the shoulders above and below a neighbour's tip
                  // would still be hit by this block.
                  clipPath: isFirst ? CLIP_ARROW_FLAT_LEFT : CLIP_ARROW,
                  marginLeft: isFirst ? 0 : `calc(${ARROW} * -1)`,
                }}
                className="relative flex cursor-pointer items-stretch"
              >
                {/* Milestone label — the arrow's head. Purple when expanded. */}
                <ArrowSegment
                  fill={labelFill}
                  edge={labelEdge}
                  notched={!isFirst}
                  overlap={false}
                  transition={transition}
                  // Shorter content than a sub-step cell (~46px), so it needs
                  // less clearance — but the same pad in both states, since the
                  // block's width is what changes on expand, not its padding.
                  className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 lg:py-3 [--ms-pad:14px] lg:[--ms-pad:16px] xl:[--ms-pad:18px]"
                >
                  <motion.div
                    transition={transition}
                    animate={{ color: isExpanded ? "#ffffff" : restNumber }}
                    className="relative flex items-center justify-center gap-1"
                  >
                    <span className="text-sm font-bold leading-none xl:text-base">
                      #{index}
                    </span>
                  </motion.div>
                  <motion.span
                    transition={transition}
                    animate={{ color: isExpanded ? accentLabel : restLabel }}
                    // Capped width so the label wraps onto a second line instead
                    // of stretching the block wide on one. Wide enough that the
                    // longest label ("User, their Journey & Market") fits in two.
                    //
                    // The height is pinned to two lines (line-height 1.25 at each
                    // font size) so one-line labels still reserve the second row —
                    // otherwise they centre themselves and sit off the shared
                    // baseline of their neighbours.
                    className={`relative block min-h-[30px] max-w-[116px] text-center text-xs leading-tight xl:min-h-[35px] xl:max-w-[140px] xl:text-sm ${
                      isExpanded ? "font-bold" : "font-medium"
                    }`}
                  >
                    {milestone.label}
                  </motion.span>

                  {/* Lock row, under the title — same placement and height as the
                      one on a sub-step cell, so the two read as the same mark.
                      Reserved on EVERY block as soon as locking is in play (i.e.
                      `availableMilestones` was passed), empty or not: the column
                      is centred, so a row present on some blocks only would lift
                      their "#N" and title off the shared baseline. Color lives on
                      the row so the icon inherits it through currentColor. */}
                  {available && (
                    <motion.div
                      transition={transition}
                      animate={{ color: isExpanded ? "#ffffff" : restNumber }}
                      className="relative flex h-[18px] items-center justify-center"
                    >
                      {isLocked && (
                        <Lock
                          aria-label="Not activated yet"
                          className="size-3 shrink-0 xl:size-3.5"
                        />
                      )}
                    </motion.div>
                  )}
                </ArrowSegment>

                {/* Fixed sub-steps — fade + slide in only while expanded. The
                    last one's tip is the block's tip, so the milestone ends in
                    that sub-step's own tint. */}
                <AnimatePresence
                  initial={false}
                  onExitComplete={() =>
                    setExitingIndex((cur) => (cur === index ? null : cur))
                  }
                >
                  {isExpanded && (
                    <motion.div
                      key="substeps"
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={transition}
                      className="flex items-stretch"
                    >
                      {milestone.subSteps.map((subStep, i) => (
                        <SubStepCell
                          key={subStep.label}
                          subStep={subStep}
                          isLast={i === milestone.subSteps.length - 1}
                          accent={accent}
                          isLocked={isLocked}
                          transition={transition}
                        />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Top / bottom (and, on the first block, left) rules. Drawn at
                    block level rather than per segment so an expanded milestone
                    gets one continuous accent outline instead of one per cell;
                    the block's clip-path terminates them on the diagonals. 2px
                    so the selected block's outline reads as a border rather than
                    a hairline — the last sub-step's tip diagonal matches it. */}
                <motion.div
                  aria-hidden
                  initial={false}
                  transition={transition}
                  animate={{ backgroundColor: blockBorder }}
                  className="pointer-events-none absolute inset-x-0 top-0 z-20 h-0.5"
                />
                <motion.div
                  aria-hidden
                  initial={false}
                  transition={transition}
                  animate={{ backgroundColor: blockBorder }}
                  className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-0.5"
                />
                {isFirst && (
                  <motion.div
                    aria-hidden
                    initial={false}
                    transition={transition}
                    animate={{ backgroundColor: blockBorder }}
                    className="pointer-events-none absolute inset-y-0 left-0 z-20 w-0.5"
                  />
                )}
              </motion.div>
            );
          })}

          {/* Trailing scroll room so the later milestones can reach the left edge.
              Width is set imperatively per selection to the minimum needed. */}
          <div ref={spacerRef} aria-hidden className="shrink-0" />
        </div>
      </div>

      {/* Pinned outside the scroll strip so the counts stay visible when the
          milestones overflow. */}
      <div className="flex shrink-0 flex-col items-end justify-center border-l border-[#E4E5ED] bg-white px-3 py-2 lg:px-5 lg:py-3 xl:px-8">
        <div className="flex items-center gap-2 whitespace-nowrap text-xs xl:text-sm">
          <span className="text-gray-500">Payer interviews:</span>
          <span className="font-semibold text-[#111827]">
            {payerInterviews}
          </span>
        </div>
        <div className="flex items-center gap-2 whitespace-nowrap text-xs xl:text-sm">
          <span className="text-gray-400">Current number:</span>
          <span className="font-medium text-gray-400">{currentNumber}</span>
        </div>
      </div>
    </div>
  );
}
