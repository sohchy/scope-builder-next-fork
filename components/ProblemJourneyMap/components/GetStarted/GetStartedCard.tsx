"use client";

import Link from "next/link";
import {
  BookOpen,
  ChevronDown,
  ExternalLink,
  ImageIcon,
  ListChecks,
  PlayCircle,
} from "lucide-react";
import { YouTubeEmbed } from "@next/third-parties/google";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import {
  Accordion,
  AccordionItem,
  AccordionContent,
} from "@/components/ui/accordion";
import { getYouTubeVideoId } from "@/lib/youtube";
import { detectVideoSource, getVimeoVideoId } from "@/lib/video";
import type { GetStartedCardWithData } from "@/services/getStarted";
import { ReviewedToggle } from "./ReviewedToggle";

interface GetStartedCardProps {
  card: GetStartedCardWithData;
  /** Whole-card reviewed state (used by every type except `steps`). */
  cardReviewed: boolean;
  /** Per-item reviewed state keyed by item id (used by `steps`). */
  itemReviewed: Record<number, boolean>;
  onToggleCard: (cardId: number, next: boolean) => void;
  onToggleItem: (itemId: number, next: boolean) => void;
  /** When this startup submitted the milestone; null while unsubmitted. */
  milestoneSubmittedAt?: Date | null;
  /**
   * Submits the milestone for review — only the `steps` card renders a button
   * for it, and leaving this off omits the button entirely.
   */
  onSubmitMilestone?: () => void;
  /** Reviewed toggles are shown but disabled (Examples pages). */
  readOnly?: boolean;
}

/**
 * Typography for the authored card body. The markup arrives as a raw string, so
 * the tags inside it can only be reached with child selectors — same approach as
 * the help popover, kept in one place because the list is long.
 */
const BODY_HTML_CLASSNAME =
  "text-base leading-relaxed break-words text-[#4E5566] [&_a]:text-[#6A35FF] [&_a]:underline [&_a]:underline-offset-2 [&_strong]:font-semibold [&_strong]:text-[#1F2430] [&_em]:italic [&_ul]:mt-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mt-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_p+p]:mt-2 [&_:is(h1,h2,h3,h4)]:mt-3 [&_:is(h1,h2,h3,h4)]:font-semibold [&_:is(h1,h2,h3,h4)]:text-[#1F2430]";

export function GetStartedCard({
  card,
  cardReviewed,
  itemReviewed,
  onToggleCard,
  onToggleItem,
  milestoneSubmittedAt = null,
  onSubmitMilestone,
  readOnly = false,
}: GetStartedCardProps) {
  /**
   * A steps card can carry an authored intro (text and/or a video) above its
   * checklist; when it does the first row keeps its padding and gets a divider.
   */
  const hasStepsIntro = !!(card.body || card.url);

  /**
   * Shared tail for the authored card types: the optional body text plus the one
   * whole-card Reviewed checkmark. `steps` is the only card with per-item marks.
   */
  const body = (
    <>
      {card.body && (
        // Authored in /admin-panel and rendered as markup, so a div rather than
        // a p — the value may carry block-level tags. Same trust model as the
        // other authored html in the app (see components/ui/help-popover.tsx):
        // only admins can write it, so it goes in unsanitized.
        <div
          className={BODY_HTML_CLASSNAME}
          dangerouslySetInnerHTML={{ __html: card.body }}
        />
      )}
      <div className="mt-4">
        <ReviewedToggle
          reviewed={cardReviewed}
          onToggle={(next) => onToggleCard(card.id, next)}
          readOnly={readOnly}
        />
      </div>
    </>
  );

  return (
    <div className="flex flex-col rounded-2xl bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <CardIcon type={card.type} />
        <h3 className="text-base font-semibold text-[#1F2430]">{card.title}</h3>
      </div>

      {card.type === "paragraph" && body}

      {card.type === "image" && (
        <>
          {card.url && (
            // Plain <img>, not next/image: admins paste arbitrary urls and
            // next.config.ts only whitelists clerk + supabase hosts.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={card.url}
              alt={card.title}
              className="mb-4 w-full rounded-xl object-cover"
            />
          )}
          {body}
        </>
      )}

      {card.type === "video" && (
        <>
          <div className="mb-4 overflow-hidden rounded-xl bg-black">
            <VideoPlayer url={card.url ?? ""} title={card.title} />
          </div>
          {body}
        </>
      )}

      {card.type === "steps" && (
        <>
          {/* Optional intro authored in /admin-panel — text, then a video, then
              the checklist. The sub-steps themselves come from the seed. */}
          {card.body && (
            <div
              className={cn("mb-4", BODY_HTML_CLASSNAME)}
              dangerouslySetInnerHTML={{ __html: card.body }}
            />
          )}

          {card.url && (
            <div className="mb-4 overflow-hidden rounded-xl bg-black">
              <VideoPlayer url={card.url} title={card.title} />
            </div>
          )}

          {/* One sub-step open at a time — the card lives in a masonry grid
              that re-measures on every height change. */}
          <Accordion
            type="single"
            collapsible
            className={cn(
              "flex flex-col divide-y divide-[#D8DBE3]",
              hasStepsIntro && "border-t border-[#D8DBE3]",
            )}
          >
            {card.items.map((item, index) => (
              <AccordionItem
                key={item.id}
                value={String(item.id)}
                className="border-b-0"
              >
                <div
                  className={cn(
                    "flex items-start justify-between gap-3 py-3",
                    // Without an intro above it the first row hugs the header.
                    !hasStepsIntro && index === 0 && "pt-0",
                  )}
                >
                  {/* Composed from the primitives rather than <AccordionTrigger>
                      so the chevron sits on the left and the Header itself can
                      shrink — shadcn's wrapper Header has no min-w-0, which lets
                      long labels push the Reviewed toggle out of the card. */}
                  <AccordionPrimitive.Header className="flex min-w-0 flex-1">
                    <AccordionPrimitive.Trigger className="group flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left outline-none">
                      <ChevronDown className="mt-0.5 size-4 shrink-0 text-[#6E7689] transition-transform duration-200 group-data-[state=open]:rotate-180" />
                      <span className="min-w-0 text-base font-medium text-[#2E3545]">
                        {item.title}
                      </span>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>

                  {/* Text-only today; an item that gains a url shows a link out
                      beside the toggle, so the card can carry reading material
                      later without nesting an <a> inside the trigger button. */}
                  {item.url && (
                    <Link
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 shrink-0 text-[#6E7689] hover:text-[#6A35FF]"
                    >
                      <ExternalLink className="size-3.5" />
                    </Link>
                  )}

                  {/* Outside the trigger so ticking a step off doesn't expand it. */}
                  <ReviewedToggle
                    reviewed={!!itemReviewed[item.id]}
                    onToggle={(next) => onToggleItem(item.id, next)}
                    readOnly={readOnly}
                  />
                </div>

                {item.description && (
                  <AccordionContent className="pt-0 pb-3">
                    {/* pl-6 lines the text up under the label, past the chevron. */}
                    <p className="whitespace-pre-line pl-6 text-base leading-relaxed text-[#4E5566]">
                      {item.description}
                    </p>
                  </AccordionContent>
                )}
              </AccordionItem>
            ))}
          </Accordion>

          {/* Submitting is one-way: it puts the milestone in the instructor's
              Pending Review queue on /startups. Not gated on the checklist. */}
          {onSubmitMilestone && (
            <Button
              type="button"
              className="mt-5 w-full cursor-pointer bg-[#6A35FF] hover:bg-[#5A2BE0]"
              disabled={readOnly || !!milestoneSubmittedAt}
              onClick={onSubmitMilestone}
            >
              {milestoneSubmittedAt
                ? `Submitted for Review ${formatSubmittedAt(milestoneSubmittedAt)}`
                : "Submit for Review"}
            </Button>
          )}
        </>
      )}
    </div>
  );
}

/** "Submitted Jul 30, 2026" — short enough to sit inside the button. */
function formatSubmittedAt(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Picks the player from the url shape — see lib/video.ts. */
function VideoPlayer({ url, title }: { url: string; title: string }) {
  const source = detectVideoSource(url);

  if (source === "youtube") {
    return (
      <YouTubeEmbed params="controls=1" videoid={getYouTubeVideoId(url)} />
    );
  }

  if (source === "vimeo") {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${getVimeoVideoId(url)}`}
        title={title}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full"
      />
    );
  }

  return <video src={url} controls className="aspect-video w-full" />;
}

function CardIcon({ type }: { type: string }) {
  const Icon =
    type === "video"
      ? PlayCircle
      : type === "image"
        ? ImageIcon
        : type === "steps"
          ? ListChecks
          : BookOpen;
  return (
    <span className="flex size-6 items-center justify-center rounded-md bg-[#F1ECFF] text-[#6A35FF]">
      <Icon className="size-3.5" />
    </span>
  );
}
