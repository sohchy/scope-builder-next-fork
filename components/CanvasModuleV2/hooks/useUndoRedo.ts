'use client';

// Adapted from .claude/examples/react-flow/undo-redo-pro-example/src/useUndoRedo.ts
// Uses Liveblocks history instead of an RF-side snapshot stack so that undo/redo
// is persisted across refreshes and shared across collaborators.

import { useState, useEffect } from 'react';
import { useKeyPress, type KeyCode } from '@xyflow/react';
import { useUndo, useRedo, useCanUndo, useCanRedo } from '@liveblocks/react';

// Verbatim from RF Pro copy-paste example — handles key-held-down deduplication
function useShortcut(keyCode: KeyCode, callback: () => void): void {
  const [didRun, setDidRun] = useState(false);
  const shouldRun = useKeyPress(keyCode, {
    actInsideInputWithModifier: false,
    preventDefault: false,
  });

  useEffect(() => {
    if (shouldRun && !didRun) {
      callback();
      setDidRun(true);
    } else {
      setDidRun(shouldRun);
    }
  }, [shouldRun, didRun, callback]);
}

export function useUndoRedo() {
  const undo = useUndo();
  const redo = useRedo();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  useShortcut(['Meta+z', 'Control+z'], undo);
  // When Shift is held, event.key is uppercase 'Z', so match 'Meta+Z' not 'Meta+Shift+z'
  useShortcut(['Meta+Z', 'Control+Z'], redo);
  useShortcut(['Control+y', 'Meta+y'], redo);

  return { undo, redo, canUndo, canRedo };
}
