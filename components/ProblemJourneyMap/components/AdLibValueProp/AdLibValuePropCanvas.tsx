"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  BackgroundVariant,
  Controls,
  Panel,
  useReactFlow,
} from "@xyflow/react";
import { PlusIcon } from "lucide-react";
import "@xyflow/react/dist/style.css";

import { ADLIB_CARD_WIDTH } from "@/lib/adLibValueProp";
import {
  ADLIB_VALUE_PROP_SUB_STEP,
  isSubStepUnlocked,
} from "@/lib/milestones";
import { useSubStepProgress } from "../../SubStepProgressContext";
import { LockedRegion, SubStepLockBadge } from "../LockedRegion";
import { AdLibContext } from "./AdLibContext";
import { DeleteAdLibCardDialog } from "./DeleteAdLibCardDialog";
import { adLibNodeTypes } from "./nodeTypes";
import { useAdLibCards } from "./useAdLibCards";

interface AdLibValuePropCanvasProps {
  /** Render the canvas as a read-only viewer (Examples pages). */
  readOnly?: boolean;
  /**
   * Milestone numbers the startup has unlocked. Half of the
   * `ADLIB_VALUE_PROP_SUB_STEP` gate — the team's own "Reviewed" toggle is the
   * other half, read from `SubStepProgressContext`. Until both are in, the
   * canvas renders greyed and read-only behind its badge. Omit to lock nothing
   * — same convention as `JourneyMapTabs`.
   */
  availableMilestones?: number[];
}

interface CanvasInnerProps {
  readOnly: boolean;
  locked: boolean;
}

/** Used to centre a new card only until one on the canvas has been measured —
 * every card has the same fixed layout, so any measured card gives the height. */
const FALLBACK_CARD_HEIGHT = 800;

const noop = () => {};

function CanvasInner({ readOnly: viewerOnly, locked }: CanvasInnerProps) {
  // A locked canvas is a read-only canvas as far as every write below is
  // concerned; the greying on top of it is `LockedRegion`'s job.
  const readOnly = viewerOnly || locked;

  const {
    cards,
    nodes,
    onNodesChange,
    onNodeDragStop,
    addCard,
    deleteCard,
    updateCardField,
  } = useAdLibCards();
  const { getNodes, getZoom, setCenter } = useReactFlow();

  const handleAddCard = useCallback(() => {
    if (readOnly) return;
    const card = addCard();
    const height =
      getNodes().find((node) => node.measured?.height)?.measured?.height ??
      FALLBACK_CARD_HEIGHT;
    // Keeps the current zoom — the user has picked it — and only pans.
    setCenter(
      card.position.x + ADLIB_CARD_WIDTH / 2,
      card.position.y + height / 2,
      { zoom: getZoom(), duration: 400 },
    );
  }, [readOnly, addCard, getNodes, getZoom, setCenter]);

  // Id of the card whose delete was requested — the confirmation dialog is open
  // while it resolves to a card. Looked up live, so a collaborator deleting the
  // same card first just closes the dialog.
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const pendingDeleteCard =
    cards.find((card) => card.id === pendingDeleteId) ?? null;

  const confirmDeleteCard = useCallback(() => {
    if (readOnly || !pendingDeleteId) return;
    deleteCard(pendingDeleteId);
    setPendingDeleteId(null);
  }, [readOnly, pendingDeleteId, deleteCard]);

  const onDeleteDialogOpenChange = useCallback((open: boolean) => {
    if (!open) setPendingDeleteId(null);
  }, []);

  const contextValue = useMemo(
    () => ({
      readOnly,
      // Hard no-ops in read-only mode so nothing can write to the shared example
      // room even if a control were somehow reachable.
      updateCardField: readOnly ? noop : updateCardField,
      requestDeleteCard: readOnly ? noop : setPendingDeleteId,
    }),
    [readOnly, updateCardField],
  );

  return (
    <AdLibContext.Provider value={contextValue}>
      <div className="relative h-full w-full">
        <LockedRegion locked={locked} className="h-full w-full">
          <ReactFlow
            nodes={nodes}
            onNodesChange={onNodesChange}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={adLibNodeTypes}
            nodesDraggable={!readOnly}
            nodesConnectable={false}
            elementsSelectable={false}
            deleteKeyCode={null}
            zoomOnDoubleClick={false}
            fitView
            fitViewOptions={{ maxZoom: 1, padding: 0.15 }}
            minZoom={0.2}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Background
              variant={BackgroundVariant.Dots}
              gap={24}
              color="#e5e7eb"
            />
            <Controls showInteractive={false} />
            {!readOnly && (
              <Panel position="top-right">
                <button
                  type="button"
                  onClick={handleAddCard}
                  className="flex items-center gap-2 rounded-lg bg-[#6A35FF] px-3 py-2 text-sm font-medium text-white shadow transition-colors hover:bg-[#5a2de0]"
                >
                  <PlusIcon className="h-3.5 w-3.5" />
                  Add version
                </button>
              </Panel>
            )}
          </ReactFlow>
        </LockedRegion>

        {/* Outside the dimmed region so it stays legible. */}
        {locked && (
          <div className="absolute top-4 left-4 z-10">
            <SubStepLockBadge subStep={ADLIB_VALUE_PROP_SUB_STEP} />
          </div>
        )}

        {/* Only the Examples copy says anything while locked: a locked team's own
            canvas has no Add version to point at. */}
        {nodes.length === 0 && (viewerOnly || !locked) && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-[#4E5566]">
              {viewerOnly
                ? "No value propositions in this example yet."
                : "No versions yet. Click Add version to start one."}
            </p>
          </div>
        )}
      </div>

      <DeleteAdLibCardDialog
        card={pendingDeleteCard}
        onOpenChange={onDeleteDialogOpenChange}
        onConfirm={confirmDeleteCard}
      />
    </AdLibContext.Provider>
  );
}

export function AdLibValuePropCanvas({
  readOnly = false,
  availableMilestones,
}: AdLibValuePropCanvasProps) {
  const { progress } = useSubStepProgress();

  const locked = !isSubStepUnlocked(
    ADLIB_VALUE_PROP_SUB_STEP,
    progress,
    availableMilestones ? new Set(availableMilestones) : null,
  );

  return (
    <ReactFlowProvider>
      <CanvasInner readOnly={readOnly} locked={locked} />
    </ReactFlowProvider>
  );
}
