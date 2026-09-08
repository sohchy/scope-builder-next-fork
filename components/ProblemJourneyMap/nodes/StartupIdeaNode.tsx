"use client";

import { memo, useCallback } from "react";
import type { NodeProps } from "@xyflow/react";
import { LightbulbIcon } from "lucide-react";

import { useJourneyContext, type JourneyNodeData } from "../JourneyContext";
import { useNodeContentDraft } from "../hooks/useNodeContentDraft";
import { Textarea } from "@/components/ui/textarea";

/**
 * The Startup Idea card: one per canvas, parked to the left of the first Trigger
 * and joined to nothing. It is seeded server-side (with the org's default text
 * where there is one) rather than added from a card's "+" menu, so it carries
 * none of the affordances the journey cards do — no type menu, no delete, no
 * handles. `useLayout` keeps it out of the tree and positions it against the
 * first Trigger instead.
 *
 * Same 370px width as the journey cards for the same reason they are fixed: the
 * textarea sizes to its content, so on an auto-width card every character would
 * re-run the tree layout mid-keystroke. Pinned, the text wraps and only the
 * height grows — which the layout does follow, via its measured-height selector.
 */
function StartupIdeaNodeInner({ id, data }: NodeProps) {
  const nodeData = data as unknown as JourneyNodeData;
  const { readOnly, updateNodeData } = useJourneyContext();

  const commitContent = useCallback(
    (value: string) => updateNodeData(id, { content: value }),
    [updateNodeData, id],
  );
  const [content, handleContentChange] = useNodeContentDraft(
    nodeData.content ?? "",
    commitContent,
  );

  return (
    <div className="group/card nopan nodrag pointer-events-auto w-[370px] bg-white border-2 border-[#B9BDC9] rounded-xl p-4 relative shadow-[0_1px_3px_0_rgba(16,24,40,0.06),0_6px_14px_-2px_rgba(16,24,40,0.12)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-[30px] h-[30px] bg-[#F4F0FF] rounded-full flex items-center justify-center flex-shrink-0">
          <LightbulbIcon className="w-4 h-4 text-[#6A35FF]" />
        </div>
        <span className="text-lg font-semibold text-[#111827] tracking-wide">
          Startup Idea
        </span>
      </div>

      <Textarea
        value={content}
        placeholder="Describe your startup idea..."
        readOnly={readOnly}
        className="nodrag nopan w-full text-base md:text-base text-gray-800 bg-transparent border-[#B9BDC9] resize-none placeholder-gray-500 focus:outline-none leading-snug"
        onChange={handleContentChange}
      />
    </div>
  );
}

export const StartupIdeaNode = memo(StartupIdeaNodeInner);
