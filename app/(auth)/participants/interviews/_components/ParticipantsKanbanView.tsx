"use client";

import { Participant } from "@/lib/generated/prisma";
import {
  completeInterviewReview,
  getParticipants,
} from "@/services/participants";
import { getExampleParticipants } from "@/services/examples";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pencil, Plus } from "lucide-react";
import AddParticipant from "@/app/(auth)/participants/_components/AddParticipant";
import EditParticipantForm from "@/app/(auth)/participants/_components/EditParticipantForm";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { InterviewAnswersView } from "./InterviewAnswers/InterviewAnswersView";
import {
  RELATIONSHIP_OPTIONS,
  relationshipLabel,
} from "@/schemas/participant";

const PROGRESS_COLUMNS = [
  { key: "need_to_schedule", label: "Interviewee" },
  { key: "scheduled", label: "Scheduled" },
  { key: "complete", label: "Conducted" },
  { key: "documented", label: "Documented" },
];

// Each column carries two tints of one hue: `card` for the cards inside it, `header`
// one perceptual notch darker so the header still reads as a header against them.
type ColumnColors = { card: string; header: string };

const FALLBACK_COLORS: ColumnColors = { card: "#F5F5F8", header: "#E2E2E8" };

const PROGRESS_COLORS: Record<string, ColumnColors> = {
  need_to_schedule: { card: "#F5F5F8", header: "#E2E2E8" },
  scheduled: { card: "#FFF3E6", header: "#F5DFC6" },
  complete: { card: "#F4F0FF", header: "#E6DEFA" },
  documented: { card: "#F0FDF4", header: "#D2EAD9" },
};

// Derived from the shared options so the board and the participant sheets can't drift.
const RELATIONSHIP_COLUMNS = RELATIONSHIP_OPTIONS.map(({ value, label }) => ({
  key: value,
  label,
}));

const RELATIONSHIP_COLORS: Record<string, ColumnColors> = {
  family_friends_colleagues: { card: "#F5F5F8", header: "#E2E2E8" },
  friend_of_friend: { card: "#FFF3E6", header: "#F5DFC6" },
  cold_connections: { card: "#F4F0FF", header: "#E6DEFA" },
  networking_event: { card: "#F0FDF4", header: "#D2EAD9" },
};

/**
 * One label/value row on a card. The row is always rendered — a participant with
 * nothing filled in still shows every label with an empty value, so cards stay the
 * same shape and a missing field reads as "not answered yet" rather than absent.
 */
function CardField({
  label,
  value,
  asBadge = false,
  badgeColor,
}: {
  label: string;
  value?: string | null;
  asBadge?: boolean;
  /** Column header tint, so the bubble reads as belonging to its column. */
  badgeColor?: string;
}) {
  const filled = value != null && value.trim() !== "";
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-sm font-semibold shrink-0">{label}:</span>
      {asBadge && filled ? (
        // The base Badge is `whitespace-nowrap shrink-0`, which pushes long labels
        // past the card edge — let this one wrap and shrink instead. It must keep
        // its automatic min-width though: `min-w-0` here let the box shrink below
        // its longest word, and the base `overflow-hidden` then clipped the text
        // mid-letter. Shrinking stops at min-content, so it wraps instead.
        <Badge
          style={badgeColor ? { backgroundColor: badgeColor } : undefined}
          className="bg-[#EEEFF5] text-[#111827] shrink whitespace-normal break-words text-right leading-snug"
        >
          {value}
        </Badge>
      ) : (
        <span className="text-xs font-semibold text-[#70747D] min-w-0 text-right break-words">
          {filled ? value : "—"}
        </span>
      )}
    </div>
  );
}

function ParticipantCard({
  participant,
  color,
  headerColor,
  hideRelationship = false,
  onCardClick,
  onEditClick,
  onReviewClick,
}: {
  participant: Participant;
  /** Card tint for the column the card sits in. */
  color: string;
  /** That column's header tint — used for the relationship bubble. */
  headerColor?: string;
  hideRelationship?: boolean;
  onCardClick?: () => void;
  onEditClick?: () => void;
  onReviewClick?: () => void;
}) {
  return (
    <div
      onClick={onCardClick}
      style={{ backgroundColor: color }}
      className="rounded-lg w-full border border-[#C9CAD4] p-3 hover:shadow-md transition-shadow cursor-pointer space-y-2"
    >
      {/* Pending review rides alongside the status rather than in it, so it gets a
          badge on the Conducted card instead of a column of its own. */}
      {participant.pending_review && (
        <div className="flex items-center justify-between gap-2">
          <Badge className="bg-[#FFF3E6] text-[#9A3412]">Pending Review</Badge>
          {/* Instructors only — opens the interview locked, with Complete Review. */}
          {onReviewClick && (
            <button
              // Same reason as the edit button below: the card's own onClick sits on
              // the wrapping div and would open the editable interview too.
              onClick={(e) => {
                e.stopPropagation();
                onReviewClick();
              }}
              className="shrink-0 rounded-md bg-[#111827] px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-[#374151]"
            >
              Review
            </button>
          )}
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="font-semibold text-[16px] text-[#111827] min-w-0 break-words">
          {participant.name}
        </p>
        {onEditClick && (
          <button
            // The card's own onClick sits on the wrapping div, so without this an
            // edit click would open the interview view too.
            onClick={(e) => {
              e.stopPropagation();
              onEditClick();
            }}
            aria-label={`Edit ${participant.name}`}
            className="shrink-0 text-[#70747D] hover:text-[#111827]"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <CardField label="Organization" value={participant.organization} />
      <CardField label="Title" value={participant.job_title} />
      <CardField label="Stakeholder" value={participant.role} />
      {!hideRelationship && (
        <CardField
          label="Relationship to Founder"
          value={relationshipLabel(participant.relationship)}
          asBadge
          badgeColor={headerColor}
        />
      )}
      {!participant.scheduled_date && (
        <p className="text-[12px] font-medium text-[#70747D]">Not scheduled</p>
      )}
      {participant.scheduled_date && (
        <p className="text-[12px] font-medium text-[#70747D]">
          {participant.status === "complete" &&
            `Interviewed: ${format(new Date(participant.scheduled_date), "MMM d, k:mm")}`}
          {participant.status === "scheduled" &&
            `Scheduled for: ${format(new Date(participant.scheduled_date), "MMM d, k:mm")}`}
        </p>
      )}
    </div>
  );
}

function KanbanBoard({
  columns,
  getColumnCards,
  getColumnColors,
  hideRelationship = false,
  onAddClick,
  onCardClick,
  onEditClick,
  onReviewClick,
}: {
  columns: { key: string; label: string }[];
  getColumnCards: (key: string) => Participant[];
  getColumnColors: (key: string) => ColumnColors;
  hideRelationship?: boolean;
  onAddClick?: () => void;
  onCardClick?: (participant: Participant) => void;
  onEditClick?: (participant: Participant) => void;
  onReviewClick?: (participant: Participant) => void;
}) {
  return (
    // The scroller is the outer div and the row is `w-max mx-auto`: with room to
    // spare the auto margins centre the board, and once the columns outgrow the
    // viewport they collapse to zero so the whole row stays scrollable from its
    // left edge. `justify-center` here would make that left overflow unreachable.
    <div className="overflow-x-auto h-full">
      <div className="flex flex-row gap-4 h-full w-max mx-auto">
        {columns.map(({ key, label }, index) => {
          const cards = getColumnCards(key);
          const colors = getColumnColors(key);
          const isFirst = index === 0;
          return (
            <div
              key={key}
              // Fixed, not `min-w`: a flex item sizes to its content above the
              // floor, so the fullest column — usually Documented — used to
              // outgrow its neighbours.
              className="flex flex-col w-[340px] shrink-0 bg-[#FFFFFF] rounded-xl border-2 border-[#B9BDC9] overflow-hidden h-full"
            >
              <div
                style={{ backgroundColor: colors.header }}
                className="flex items-center justify-between px-3 h-10 border-b border-gray-200"
              >
                <span className="text-xs font-semibold text-[#111827]">
                  {label}
                </span>
                {isFirst && onAddClick && (
                  <button
                    onClick={onAddClick}
                    className="w-6 h-6 rounded-full bg-[#111827] text-white flex items-center justify-center hover:bg-[#374151] transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex flex-col gap-2 p-4 overflow-y-auto flex-1 min-h-0">
                {cards.map((participant) => (
                  <ParticipantCard
                    key={participant.id}
                    participant={participant}
                    color={colors.card}
                    headerColor={colors.header}
                    hideRelationship={hideRelationship}
                    onCardClick={() => onCardClick?.(participant)}
                    onEditClick={
                      onEditClick ? () => onEditClick(participant) : undefined
                    }
                    onReviewClick={
                      onReviewClick
                        ? () => onReviewClick(participant)
                        : undefined
                    }
                  />
                ))}
                {cards.length === 0 && (
                  <p className="text-xs text-gray-400 text-center mt-4">
                    No participants
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function ParticipantsKanbanView({
  tags,
  jobTitles,
  readOnly = false,
  canReview = false,
  exampleNumber,
}: {
  tags: string[];
  jobTitles: string[];
  readOnly?: boolean;
  canReview?: boolean;
  exampleNumber?: number;
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editParticipant, setEditParticipant] = useState<Participant | null>(
    null,
  );
  const [interviewParticipant, setInterviewParticipant] =
    useState<Participant | null>(null);
  // Reviewing opens the same interview view as a card click, but locked and with
  // Complete Review in place of Save.
  const [reviewing, setReviewing] = useState(false);
  // Controlled so swapping to the interview view and back doesn't remount the tabs
  // and silently drop the user from Relationship back to Progress.
  const [boardTab, setBoardTab] = useState("progress");

  const refetch = () =>
    (exampleNumber != null
      ? getExampleParticipants(exampleNumber)
      : getParticipants()
    ).then((next) => {
      setParticipants(next);
      // The interview view holds a snapshot, so re-point it at the fresh row after an
      // edit made from its own header — and drop it if the participant is gone.
      setInterviewParticipant((current) =>
        current ? (next.find((p) => p.id === current.id) ?? null) : null,
      );
    });

  useEffect(() => {
    refetch();
  }, []);

  const closeInterview = () => {
    setInterviewParticipant(null);
    setReviewing(false);
  };

  const openInterview = (participant: Participant) => {
    setInterviewParticipant(participant);
    setReviewing(false);
  };

  const openReview = (participant: Participant) => {
    setInterviewParticipant(participant);
    setReviewing(true);
  };

  const handleCompleteReview = async () => {
    if (!interviewParticipant) return;
    await completeInterviewReview(interviewParticipant.id);
    closeInterview();
    refetch();
    // The milestone header's payer count is server-rendered off `documented`, so it
    // goes stale the moment this review lands.
    router.refresh();
  };

  const groupedByStatus = PROGRESS_COLUMNS.reduce<
    Record<string, Participant[]>
  >((acc, { key }) => {
    acc[key] = participants.filter((p) => p.status === key);
    return acc;
  }, {});

  const groupedByRelationship = RELATIONSHIP_COLUMNS.reduce<
    Record<string, Participant[]>
  >((acc, { key }) => {
    acc[key] = participants.filter((p) => p.relationship === key);
    return acc;
  }, {});

  return (
    <>
      {/* Add/Edit affordances only exist on the real page — examples are read-only. */}
      {!readOnly && (
        <>
          <AddParticipant
            tags={tags}
            jobTitles={jobTitles}
            open={sheetOpen}
            onOpenChange={setSheetOpen}
            onSuccess={refetch}
          />
          <Sheet
            open={editParticipant !== null}
            onOpenChange={(open) => {
              if (!open) setEditParticipant(null);
            }}
          >
            <SheetContent>
              <SheetHeader className="border-b p-3">
                <SheetTitle className="text-[20px] font-medium text-[#111827]">
                  {editParticipant?.name}
                </SheetTitle>
              </SheetHeader>
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden p-4">
                {editParticipant && (
                  <EditParticipantForm
                    participant={editParticipant}
                    tags={tags}
                    jobTitles={jobTitles}
                    onSuccess={() => {
                      refetch();
                      setEditParticipant(null);
                    }}
                  />
                )}
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
      {interviewParticipant ? (
        <InterviewAnswersView
          participant={interviewParticipant}
          readOnly={readOnly || reviewing}
          onCompleteReview={reviewing ? handleCompleteReview : undefined}
          exampleNumber={exampleNumber}
          onBack={closeInterview}
          onSaved={() => {
            closeInterview();
            refetch();
            // The milestone header's payer count is server-rendered, so re-sync it here
            // rather than leaving a stale number behind after an interview session.
            router.refresh();
          }}
        />
      ) : (
        <Tabs
          value={boardTab}
          onValueChange={setBoardTab}
          className="flex flex-col h-full"
        >
          <TabsList>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="relationship">Relationship</TabsTrigger>
          </TabsList>
          <TabsContent
            value="progress"
            className="flex-1 min-h-0 overflow-hidden mt-4"
          >
            <KanbanBoard
              columns={PROGRESS_COLUMNS}
              getColumnCards={(key) => groupedByStatus[key] ?? []}
              getColumnColors={(key) => PROGRESS_COLORS[key] ?? FALLBACK_COLORS}
              onAddClick={readOnly ? undefined : () => setSheetOpen(true)}
              onCardClick={openInterview}
              onEditClick={readOnly ? undefined : setEditParticipant}
              onReviewClick={canReview ? openReview : undefined}
            />
          </TabsContent>
          <TabsContent
            value="relationship"
            className="flex-1 min-h-0 overflow-hidden mt-4"
          >
            <KanbanBoard
              columns={RELATIONSHIP_COLUMNS}
              getColumnCards={(key) => groupedByRelationship[key] ?? []}
              getColumnColors={(key) =>
                RELATIONSHIP_COLORS[key] ?? FALLBACK_COLORS
              }
              hideRelationship
              onAddClick={readOnly ? undefined : () => setSheetOpen(true)}
              onCardClick={openInterview}
              onEditClick={readOnly ? undefined : setEditParticipant}
              onReviewClick={canReview ? openReview : undefined}
            />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
}
