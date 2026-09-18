'use client';

import { useCallback, useMemo, type MouseEvent } from 'react';

import { useJourneyContext } from '../JourneyContext';

/**
 * Halo on a card that's part of the multi-selection.
 *
 * Deliberately not purple: `border-purple-500` already marks the card whose
 * problem is open in the sheet, and `ring-[#6A35FF]` marks the selected problem
 * inside a card. This sits *outside* the card's 2px border, so a card can be both
 * without the two readings fighting.
 */
export const CARD_SELECTION_RING =
  'ring-[3px] ring-[#111827] ring-offset-2 ring-offset-white';

// React Flow's own modifier for adding to a selection (`multiSelectionKeyCode`
// defaults to Meta on macOS, Control elsewhere). Matched by hand rather than
// imported: `@xyflow/system` isn't a real dependency here, only `@xyflow/react`.
function isMultiSelectEvent(event: { metaKey: boolean; ctrlKey: boolean }) {
  const isMacOs =
    typeof navigator !== 'undefined' && navigator.userAgent.indexOf('Mac') >= 0;
  return isMacOs ? event.metaKey : event.ctrlKey;
}

/**
 * Props every journey card spreads on its root element, so Cmd/Ctrl+click toggles
 * the card in the multi-selection while a plain click goes on behaving exactly as
 * it always has.
 *
 * Three handlers rather than one, because React Flow selects a node from an
 * `onClick` on the wrapper it renders each card into:
 *
 *   • onClick stops propagation, so a plain click never reaches that wrapper and
 *     never selects. It must not preventDefault — the caret still has to land
 *     where the user clicked.
 *   • onMouseDownCapture preventDefaults the modifier-click before focus moves,
 *     so Cmd-clicking several cards doesn't leave the caret in a textarea (which
 *     would then swallow the Delete key that deletes the selection).
 *   • onClickCapture runs ahead of the card's own handlers — the problem cards,
 *     the trash button — so a modifier-click toggles selection instead of opening
 *     the sheet. Stopping it in the capture phase also stops React Flow's
 *     handler, which is why the toggle is done here rather than left to it.
 */
export function useCardSelection(nodeId: string) {
  const { toggleNodeSelected } = useJourneyContext();

  const onClick = useCallback((event: MouseEvent<HTMLElement>) => {
    event.stopPropagation();
  }, []);

  const onMouseDownCapture = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!isMultiSelectEvent(event)) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const onClickCapture = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (!isMultiSelectEvent(event)) return;
      event.preventDefault();
      event.stopPropagation();
      toggleNodeSelected(nodeId);
    },
    [toggleNodeSelected, nodeId]
  );

  return useMemo(
    () => ({ onClick, onMouseDownCapture, onClickCapture }),
    [onClick, onMouseDownCapture, onClickCapture]
  );
}
