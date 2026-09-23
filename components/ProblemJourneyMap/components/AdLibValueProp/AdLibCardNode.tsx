"use client";

import {
  memo,
  useCallback,
  type ChangeEvent,
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import type { NodeProps } from "@xyflow/react";
import { useStorage } from "@liveblocks/react/suspense";
import { Trash2Icon } from "lucide-react";

import type { AdLibField } from "@/liveblocks.config";
import { ADLIB_CARD_WIDTH } from "@/lib/adLibValueProp";
import { cn } from "@/lib/utils";
import { useNodeContentDraft } from "../../hooks/useNodeContentDraft";
import { useAdLibContext } from "./AdLibContext";
import type { AdLibCardNode as AdLibCardNodeType } from "./useAdLibCards";
import {
  CompetingIcon,
  GainIcon,
  JobsIcon,
  PainIcon,
  ProductsIcon,
  SegmentIcon,
} from "./AdLibIcons";

type IconComponent = ComponentType<{ className?: string }>;

/**
 * One Ad-Lib Value Proposition: the Strategyzer ad-lib sentence with a blank
 * under each connector word. Draggable by anything but the blanks themselves,
 * which carry `nodrag` so a click lands the caret instead of starting a drag.
 */
function AdLibCardNodeInner({ id, data }: NodeProps<AdLibCardNodeType>) {
  const { readOnly, requestDeleteCard } = useAdLibContext();
  const card = useStorage(
    (root) => root.adLibCards.find((c) => c.id === id) ?? null,
  );

  // The node outlives its storage entry by a sync tick at most — after a delete.
  if (!card) return null;

  return (
    <div
      style={{ width: ADLIB_CARD_WIDTH }}
      className="group/card rounded-xl border-2 border-[#B9BDC9] bg-white px-10 pt-6 pb-10 shadow-[0_1px_3px_0_rgba(16,24,40,0.06),0_6px_14px_-2px_rgba(16,24,40,0.12)]"
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#B9BDC9] pb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-wide text-[#111827]">
            Value Proposition Ad-Lib
          </span>
          <span className="text-lg font-semibold text-[#6A35FF]">
            · Version {data.version}
          </span>
        </div>
        {/* Hover-only, like the journey cards' delete. */}
        {!readOnly && (
          <button
            type="button"
            onClick={() => requestDeleteCard(id)}
            title="Delete version"
            className="nodrag flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-gray-600 opacity-0 transition-opacity group-hover/card:opacity-100 hover:bg-red-50 hover:text-red-500"
          >
            <Trash2Icon className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="mt-6 flex flex-col gap-7">
        <Clause word="Our">
          <Blank
            cardId={id}
            field="productsAndServices"
            value={card.productsAndServices}
            caption="Products and Services"
            Icon={ProductsIcon}
          />
        </Clause>

        <Clause word="help(s)">
          <Blank
            cardId={id}
            field="customerSegment"
            value={card.customerSegment}
            caption="Customer Segment"
            Icon={SegmentIcon}
          />
        </Clause>

        <Clause word="who wants to">
          <Blank
            cardId={id}
            field="jobsToBeDone"
            value={card.jobsToBeDone}
            caption="jobs to be done"
            Icon={JobsIcon}
          />
        </Clause>

        <Clause word="by">
          <Blank
            cardId={id}
            field="painVerb"
            value={card.painVerb}
            caption="verb (e.g. reducing, avoiding)"
          />
          <Blank
            cardId={id}
            field="pain"
            value={card.pain}
            caption="and a customer pain"
            Icon={PainIcon}
          />
        </Clause>

        <Clause word="and">
          <Blank
            cardId={id}
            field="gainVerb"
            value={card.gainVerb}
            caption="verb (e.g. increasing, enabling)"
          />
          <Blank
            cardId={id}
            field="gain"
            value={card.gain}
            caption="and a customer gain"
            Icon={GainIcon}
          />
        </Clause>

        {/* Greyed as in the template: the comparison is the optional last clause. */}
        <Clause word="unlike" muted>
          <Blank
            cardId={id}
            field="competingValueProp"
            value={card.competingValueProp}
            caption="competing value proposition"
            Icon={CompetingIcon}
            muted
          />
        </Clause>
      </div>
    </div>
  );
}

export const AdLibCardNode = memo(AdLibCardNodeInner);

interface ClauseProps {
  word: string;
  muted?: boolean;
  /** One blank, or two side by side (verb + pain/gain). */
  children: ReactNode;
}

function Clause({ word, muted = false, children }: ClauseProps) {
  return (
    <div>
      <div
        className={cn(
          "text-[36px] leading-[1.3] tracking-tight",
          muted ? "text-[#6E7689]" : "text-[#111827]",
        )}
      >
        {word}
      </div>
      <div className="mt-3 flex gap-8">{children}</div>
    </div>
  );
}

interface BlankProps {
  cardId: string;
  field: AdLibField;
  value: string;
  caption: string;
  Icon?: IconComponent;
  muted?: boolean;
}

function Blank({
  cardId,
  field,
  value,
  caption,
  Icon,
  muted = false,
}: BlankProps) {
  const { readOnly, updateCardField } = useAdLibContext();

  const commit = useCallback(
    (next: string) => updateCardField(cardId, field, next),
    [updateCardField, cardId, field],
  );
  const [draft, handleChange] = useNodeContentDraft(value, commit);

  // A blank fills in part of a sentence, so it wraps but never breaks: Enter is
  // swallowed, and line breaks in pasted text become spaces.
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter") event.preventDefault();
    },
    [],
  );
  const handleBlankChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const { value: typed } = event.target;
      if (/[\r\n]/.test(typed)) {
        event.target.value = typed.replace(/\r?\n|\r/g, " ");
      }
      handleChange(event);
    },
    [handleChange],
  );

  return (
    // Side-by-side blanks stretch to the taller one, and the textarea grows to
    // fill its column, so the two underlines and captions stay level when only
    // one of them wraps.
    <label className="flex min-w-0 flex-1 flex-col">
      <textarea
        rows={1}
        value={draft}
        readOnly={readOnly}
        onChange={handleBlankChange}
        onKeyDown={handleKeyDown}
        aria-label={caption}
        className={cn(
          "nodrag field-sizing-content w-full flex-1 resize-none overflow-hidden border-0 border-b-2 bg-transparent px-0 py-1.5 text-[28px] leading-snug text-[#111827] outline-none transition-colors",
          muted ? "border-[#9CA3AF]" : "border-[#111827]",
          !readOnly && "focus:border-[#6A35FF]",
        )}
      />
      <span className="mt-2 flex items-center gap-2 text-[22px] leading-snug text-[#4E5566]">
        {Icon && <Icon className="h-[22px] w-[22px] shrink-0" />}
        {caption}
      </span>
    </label>
  );
}
