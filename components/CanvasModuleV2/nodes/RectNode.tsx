'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Handle,
  NodeResizer,
  NodeToolbar,
  Position,
  type NodeProps,
} from '@xyflow/react';

import { useRealtimeShapes } from '@/components/CanvasModule/hooks/realtime/useRealtimeShapes';
import type { Shape as IShape } from '@/components/CanvasModule/types';
import { PalettePopover } from './PalettePopover';

const SIZES = [10, 12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 60, 80, 100, 120];

export function RectNode({ data, selected }: NodeProps) {
  const shape = data as unknown as IShape;
  const { updateShape } = useRealtimeShapes();
  const commit = (patch: Partial<IShape>) =>
    updateShape(shape.id, (s) => ({ ...s, ...patch }));

  const [openPicker, setOpenPicker] = useState<null | 'bg' | 'fg' | 'fs'>(null);

  // Close dropdowns when deselected
  useEffect(() => {
    if (!selected) {
      setOpenPicker(null);
      setIsEditing(false);
    }
  }, [selected]);

  // Text editing
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState<string>(shape.text ?? '');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isEditing) setText(shape.text ?? '');
  }, [shape.text, isEditing]);

  const beginEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    requestAnimationFrame(() => {
      taRef.current?.focus();
      const el = taRef.current!;
      el.setSelectionRange(el.value.length, el.value.length);
    });
  };

  const commitText = () => {
    if ((shape.text ?? '') !== text) commit({ text });
  };

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={80} minHeight={40} />

      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="nodrag nopan flex items-center gap-2 px-2 py-1 rounded-lg border bg-white shadow text-sm">
          {/* BG color */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPicker(openPicker === 'bg' ? null : 'bg');
              }}
            >
              <span className="text-gray-500">BG</span>
              <span
                className="w-4 h-4 rounded border"
                style={{ backgroundColor: shape.color || '#ffffff' }}
              />
            </button>
            {openPicker === 'bg' && (
              <PalettePopover
                selectedHex={shape.color}
                onPick={(c) => {
                  commit({ color: c });
                  setOpenPicker(null);
                }}
              />
            )}
          </div>

          {/* Text color */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPicker(openPicker === 'fg' ? null : 'fg');
              }}
            >
              <span className="text-gray-500">Text</span>
              <span
                className="w-4 h-4 rounded border grid place-items-center"
                style={{ color: shape.textColor || '#0f172a' }}
              >
                A
              </span>
            </button>
            {openPicker === 'fg' && (
              <PalettePopover
                selectedHex={shape.textColor}
                onPick={(c) => {
                  commit({ textColor: c });
                  setOpenPicker(null);
                }}
              />
            )}
          </div>

          {/* Font size */}
          <div className="relative">
            <button
              className="px-2 h-[26px] rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => {
                e.stopPropagation();
                setOpenPicker(openPicker === 'fs' ? null : 'fs');
              }}
            >
              <span className="text-gray-500">Size</span>
              <span className="min-w-[2.75rem] px-1 py-0.5 rounded border bg-white text-xs text-gray-700 grid place-items-center">
                {(shape.textSize ?? 14) + 'px'}
              </span>
            </button>
            {openPicker === 'fs' && (
              <div
                className="absolute z-50 mt-1 w-32 rounded-md border bg-white shadow-lg"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="max-h-48 overflow-auto py-1">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 flex items-center justify-between"
                      onClick={() => {
                        commit({ textSize: s });
                        setOpenPicker(null);
                      }}
                    >
                      <span>{s}px</span>
                      {s === (shape.textSize ?? 14) && <span>✓</span>}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Font style */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Style</span>
            <button
              className="px-2 py-1 rounded bg-gray-200"
              onClick={() => commit({ textStyle: 'normal', textWeight: 'normal' })}
            >
              N
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200 font-bold"
              onClick={() => commit({ textWeight: 'bold' })}
            >
              B
            </button>
            <button
              className="px-2 py-1 rounded bg-gray-200 italic"
              onClick={() => commit({ textStyle: 'italic' })}
            >
              I
            </button>
          </div>
        </div>
      </NodeToolbar>

      <Handle type="source" position={Position.Top}    id="top"    className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right}  id="right"  className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left}   id="left"   className="opacity-0 hover:opacity-100" />

      <div
        onDoubleClick={beginEdit}
        className="w-full h-full flex items-center justify-center rounded border border-gray-400 shadow-[0px_4px_33.3px_0px_rgba(30,39,143,0.2)]"
        style={{
          borderRadius: 6,
          backgroundColor: shape.color || '#EAFBE3',
        }}
      >
        {!isEditing && (
          <div
            className="flex flex-row items-center justify-center p-2 text-center pointer-events-none whitespace-pre-wrap break-words flex-wrap"
            style={{
              color: shape.textColor || '#0f172a',
              lineHeight: 1.25,
              fontSize: shape.textSize || 14,
              fontStyle: shape.textStyle,
              fontWeight: shape.textWeight,
            }}
          >
            <span>{text || ''}</span>
          </div>
        )}

        {isEditing && (
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={() => {
              commitText();
              setIsEditing(false);
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            placeholder="Add text…"
            className="nodrag w-full h-full bg-transparent outline-none resize-none p-2 text-center"
            style={{
              lineHeight: 1.25,
              color: shape.textColor || '#0f172a',
              fontSize: shape.textSize || 14,
              fontStyle: shape.textStyle,
              fontWeight: shape.textWeight,
            }}
          />
        )}
      </div>
    </>
  );
}
