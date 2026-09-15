// Shared by the Ad-Lib Value Prop canvas (client) and the service that seeds its
// room (server), so a card is shaped and placed the same way on both sides.

import type { AdLibCardStorage } from "@/liveblocks.config";

/** Fixed card width. New cards are placed off it before they've been measured. */
export const ADLIB_CARD_WIDTH = 600;

/** Horizontal space between one card and the next in the auto row. */
export const ADLIB_CARD_GAP = 80;

/** Liveblocks room holding an org's ad-lib cards. */
export function adLibRoomId(orgId: string): string {
  return `adlib-value-prop-${orgId}`;
}

export function buildAdLibCard(
  id: string,
  version: number,
  position: { x: number; y: number },
): AdLibCardStorage {
  return {
    id,
    version,
    position,
    productsAndServices: "",
    customerSegment: "",
    jobsToBeDone: "",
    painVerb: "",
    pain: "",
    gainVerb: "",
    gain: "",
    competingValueProp: "",
  };
}

/**
 * One past the highest version ever used — numbers are never reused, even after
 * the card holding one is deleted. `lastVersion` is the room's counter; the cards
 * still on the canvas cover rooms from before the counter existed.
 */
export function nextAdLibVersion(
  cards: ReadonlyArray<Pick<AdLibCardStorage, "version">>,
  lastVersion: number | undefined,
): number {
  return (
    cards.reduce((max, card) => Math.max(max, card.version), lastVersion ?? 0) +
    1
  );
}

/**
 * Where a new card goes: to the right of the rightmost card, on its row. Rightmost
 * rather than latest, because cards can be dragged — a card dropped back over an
 * older one would otherwise put the next card on top of a third.
 */
export function nextAdLibPosition(
  cards: ReadonlyArray<Pick<AdLibCardStorage, "position">>,
): { x: number; y: number } {
  if (cards.length === 0) return { x: 0, y: 0 };
  const rightmost = cards.reduce((a, b) =>
    b.position.x > a.position.x ? b : a,
  );
  return {
    x: rightmost.position.x + ADLIB_CARD_WIDTH + ADLIB_CARD_GAP,
    y: rightmost.position.y,
  };
}
