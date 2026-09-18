'use client';

import { useEffect, useRef } from 'react';
import { useStoreApi } from '@xyflow/react';

// React Flow's own key handling is off on this canvas (`deleteKeyCode={null}`)
// and stays off: nothing may delete a card without the confirmation dialog. This
// hook only *asks*.
//
// A window listener rather than `useKeyPress`: that hook reports a key as a
// boolean, which turns a keypress into a state transition to debounce, and it
// knows nothing about an open dialog — a Radix sheet portals to <body>, so its
// keydown reaches the document like any other. We also need `event.target` for
// the typing guard and `preventDefault` so Backspace doesn't navigate back.

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return target.closest('[contenteditable=""],[contenteditable="true"]') !== null;
}

// Any Radix overlay that's open — the problem sheet, a confirmation dialog, the
// stakeholder picker, a select menu, a help popover. Radix unmounts closed
// content, so finding one means one is open, and the canvas shouldn't be reading
// keys while the user is somewhere else.
function hasOpenOverlay(): boolean {
  return (
    document.querySelector(
      '[role="dialog"],[role="alertdialog"],[role="listbox"],[role="menu"]'
    ) !== null
  );
}

/**
 * Delete/Backspace asks to delete the current multi-selection.
 *
 * @param enabled  false on the read-only canvas, and while the dialog is already up.
 * @param onRequest called with the selected ids; opens the confirmation dialog.
 */
export function useDeleteSelectionShortcut(
  enabled: boolean,
  onRequest: (ids: string[]) => void
) {
  const store = useStoreApi();
  const onRequestRef = useRef(onRequest);
  onRequestRef.current = onRequest;

  useEffect(() => {
    if (!enabled) return;

    const handler = (event: KeyboardEvent) => {
      if (event.key !== 'Delete' && event.key !== 'Backspace') return;
      if (event.defaultPrevented) return;
      // A modifier means the user is after some other shortcut.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;
      if (hasOpenOverlay()) return;

      // Read the selection at keypress time rather than closing over it, so the
      // listener is attached once and can never act on a stale set.
      const selected: string[] = [];
      for (const node of store.getState().nodeLookup.values()) {
        if (node.selected) selected.push(node.id);
      }
      if (selected.length === 0) return;

      event.preventDefault();
      onRequestRef.current(selected);
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled, store]);
}
