'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';

/**
 * Local mirror of a card's `content`, for the textareas on the Trigger and
 * Action nodes.
 *
 * A card can't drive its textarea straight off `data.content`. React Flow's
 * `StoreUpdater` copies the `nodes` prop into its own store from a *passive*
 * effect, and the card reads its data back out of that store — so the commit
 * that a keystroke triggers finishes before the card has the new text. React's
 * controlled-input restore runs at the end of that commit, finds the DOM value
 * ahead of the `value` prop the textarea still has, and rewrites the element to
 * match. Rewriting a textarea's value drops the caret at the end of the text.
 *
 * The character itself survives (the store lands a tick later and re-renders
 * with it), so the caret is the whole symptom: invisible while you type at the
 * end, obvious the moment you click into the middle of the text and keep going.
 *
 * Holding the text in local state puts `value` back in lockstep with the DOM,
 * so there is never anything to rewrite. Upstream still wins whenever it
 * carries something this card didn't type — a collaborator's edit, or the same
 * node edited from the Action sheet.
 */
export function useNodeContentDraft(
  content: string,
  commit: (value: string) => void
): [string, (event: ChangeEvent<HTMLTextAreaElement>) => void] {
  const [draft, setDraft] = useState(content);

  // The last value this card sent upstream. Anything arriving that differs from
  // it came from somewhere else, and replaces the draft; anything equal to it is
  // our own keystroke echoing back and is ignored.
  const sentRef = useRef(content);

  useEffect(() => {
    if (content === sentRef.current) return;
    sentRef.current = content;
    setDraft(content);
  }, [content]);

  const onChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const { value } = event.target;
      sentRef.current = value;
      setDraft(value);
      commit(value);
    },
    [commit]
  );

  return [draft, onChange];
}
