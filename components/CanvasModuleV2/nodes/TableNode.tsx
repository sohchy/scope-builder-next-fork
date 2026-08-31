'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Handle, NodeResizer, NodeToolbar, Position, type NodeProps } from '@xyflow/react';

import { useRealtimeShapes } from '@/components/CanvasModule/hooks/realtime/useRealtimeShapes';
import type { Shape as IShape } from '@/components/CanvasModule/types';

type FontStyle = 'normal' | 'bold' | 'italic';
type Scope = 'cell' | 'row' | 'col';

const PALETTE = [
  '#ffffff', '#f8fafc', '#fee2e2', '#ffedd5', '#fef3c7',
  '#dcfce7', '#dbeafe', '#e9d5ff', '#fce7f3', '#000000',
];
const FONT_SIZES = [12, 14, 16, 18, 20, 24];

function makeEmpty<T>(rows: number, cols: number, v: T): T[][] {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => v));
}

function normalizeGrid<T>(grid: T[][] | undefined, rows: number, cols: number, fill: T): T[][] {
  let g = Array.isArray(grid) ? grid.map((r) => r.slice()) : [];
  if (g.length < rows) g = g.concat(makeEmpty(rows - g.length, Math.max(cols, g[0]?.length ?? cols), fill));
  if (g.length > rows) g = g.slice(0, rows);
  for (let r = 0; r < g.length; r++) {
    const row = g[r];
    if (row.length < cols) g[r] = row.concat(Array.from({ length: cols - row.length }, () => fill));
    if (row.length > cols) g[r] = row.slice(0, cols);
  }
  return g;
}

function normalizeData(data: string[][] | undefined, rows: number, cols: number) {
  return normalizeGrid<string>(data, rows, cols, '');
}

function PalettePopover({ onPick }: { onPick: (c: string) => void }) {
  return (
    <div
      className="absolute w-max top-full left-0 mt-1 z-50 p-2 bg-white border rounded-xl shadow grid grid-cols-5 gap-1"
      data-nodrag="true"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {PALETTE.map((c) => (
        <button
          key={c}
          title={c}
          className="w-6 h-6 rounded border hover:scale-105 transition"
          style={{ backgroundColor: c }}
          onClick={(e) => { e.stopPropagation(); onPick(c); }}
        />
      ))}
    </div>
  );
}

export function TableNode({ data, selected }: NodeProps) {
  const shape = data as unknown as IShape;
  const { updateShape } = useRealtimeShapes();
  const commit = (patch: Partial<IShape>) => updateShape(shape.id, (s) => ({ ...s, ...patch }));

  const rows = Math.max(1, (shape as any).tableRows ?? 3);
  const cols = Math.max(1, (shape as any).tableCols ?? 3);

  const [data_grid, setData] = useState<string[][]>(() =>
    normalizeData((shape as any).tableData, rows, cols)
  );
  const [bg, setBg] = useState<string[][]>(() =>
    normalizeGrid<string>((shape as any).tableBg, rows, cols, '#ffffff')
  );
  const [font, setFont] = useState<FontStyle[][]>(() =>
    normalizeGrid<FontStyle>((shape as any).tableFont, rows, cols, 'normal')
  );
  const [fg, setFg] = useState<string[][]>(() =>
    normalizeGrid<string>((shape as any).tableFontColor, rows, cols, '#0f172a')
  );
  const [fs, setFs] = useState<number[][]>(() =>
    normalizeGrid<number>((shape as any).tableFontSize, rows, cols, 14)
  );

  const [drag, setDrag] = useState<null | { kind: 'col' | 'row'; from: number }>(null);
  const [over, setOver] = useState<number | null>(null);
  const [pointer, setPointer] = useState<{ x: number; y: number } | null>(null);

  const colBarRef = useRef<HTMLDivElement>(null);
  const rowBarRef = useRef<HTMLDivElement>(null);

  function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
  }

  function colIndexFromClientX(clientX: number) {
    const bar = colBarRef.current;
    if (!bar) return null;
    const rect = bar.getBoundingClientRect();
    if (rect.width <= 0) return null;
    return clamp(Math.floor(((clientX - rect.left) / rect.width) * cols), 0, cols - 1);
  }

  function rowIndexFromClientY(clientY: number) {
    const bar = rowBarRef.current;
    if (!bar) return null;
    const rect = bar.getBoundingClientRect();
    if (rect.height <= 0) return null;
    return clamp(Math.floor(((clientY - rect.top) / rect.height) * rows), 0, rows - 1);
  }

  function moveIndex<T>(arr: T[], from: number, to: number) {
    const copy = arr.slice();
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  }

  function remapIndex(idx: number, from: number, to: number) {
    if (from === to) return idx;
    if (idx === from) return to;
    if (from < to && idx > from && idx <= to) return idx - 1;
    if (from > to && idx >= to && idx < from) return idx + 1;
    return idx;
  }

  function reorderCols(from: number, to: number) {
    if (from === to) return;
    const remapRow = (row: any[]) => moveIndex(row, from, to);
    const nextData = data_grid.map(remapRow);
    const nextBg = bg.map(remapRow);
    const nextFont = font.map(remapRow);
    const nextFg = fg.map(remapRow);
    const nextFs = fs.map(remapRow);
    setData(nextData); setBg(nextBg); setFont(nextFont); setFg(nextFg); setFs(nextFs);
    setActive((a) => (a ? { r: a.r, c: remapIndex(a.c, from, to) } : a));
    commit({ tableData: nextData, tableBg: nextBg, tableFont: nextFont, tableFontColor: nextFg, tableFontSize: nextFs } as Partial<IShape>);
  }

  function reorderRows(from: number, to: number) {
    if (from === to) return;
    const move = <T,>(grid: T[][]) => moveIndex(grid, from, to);
    const nextData = move(data_grid);
    const nextBg = move(bg);
    const nextFont = move(font);
    const nextFg = move(fg);
    const nextFs = move(fs);
    setData(nextData); setBg(nextBg); setFont(nextFont); setFg(nextFg); setFs(nextFs);
    setActive((a) => (a ? { r: remapIndex(a.r, from, to), c: a.c } : a));
    commit({ tableData: nextData, tableBg: nextBg, tableFont: nextFont, tableFontColor: nextFg, tableFontSize: nextFs } as Partial<IShape>);
  }

  useEffect(() => {
    setData(normalizeData((shape as any).tableData, rows, cols));
    setBg(normalizeGrid<string>((shape as any).tableBg, rows, cols, '#ffffff'));
    setFont(normalizeGrid<FontStyle>((shape as any).tableFont, rows, cols, 'normal'));
    setFg(normalizeGrid<string>((shape as any).tableFontColor, rows, cols, '#0f172a'));
    setFs(normalizeGrid<number>((shape as any).tableFontSize, rows, cols, 14));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [(shape as any).tableData, (shape as any).tableBg, (shape as any).tableFont, (shape as any).tableFontColor, (shape as any).tableFontSize, rows, cols]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: MouseEvent) => {
      setPointer({ x: e.clientX, y: e.clientY });
      if (drag.kind === 'col') setOver(colIndexFromClientX(e.clientX) ?? drag.from);
      else setOver(rowIndexFromClientY(e.clientY) ?? drag.from);
    };
    const onUp = (e: MouseEvent) => {
      const dropIdx = drag.kind === 'col' ? colIndexFromClientX(e.clientX) : rowIndexFromClientY(e.clientY);
      if (dropIdx !== null) {
        if (drag.kind === 'col') reorderCols(drag.from, dropIdx);
        else reorderRows(drag.from, dropIdx);
      }
      setDrag(null); setOver(null); setPointer(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [drag]);

  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [scope, setScope] = useState<Scope>('cell');
  const [openPicker, setOpenPicker] = useState<null | 'bg' | 'fg'>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!openPicker) return;
      if (!toolbarRef.current) return setOpenPicker(null);
      if (!toolbarRef.current.contains(e.target as Node)) setOpenPicker(null);
    };
    window.addEventListener('mousedown', onDown);
    return () => window.removeEventListener('mousedown', onDown);
  }, [openPicker]);

  const cellRefs = useRef<Map<string, HTMLTextAreaElement | null>>(new Map());
  const setCellRef = (r: number, c: number) => (el: HTMLTextAreaElement | null) => {
    cellRefs.current.set(`${r}-${c}`, el);
  };
  const focusCell = (r: number, c: number) => {
    setTimeout(() => {
      const el = cellRefs.current.get(`${r}-${c}`);
      if (el) { el.focus(); const len = el.value.length; el.setSelectionRange(len, len); }
    }, 0);
  };

  const gridTemplateColumns = useMemo(() => `repeat(${cols}, 1fr)`, [cols]);

  const insertRowAt = (i: number) => {
    const idx = Math.max(0, Math.min(i, rows));
    const emptyRow = Array.from({ length: cols }, () => '');
    const emptyBg = Array.from({ length: cols }, () => '#ffffff');
    const emptyFont = Array.from({ length: cols }, () => 'normal' as const);
    const emptyFg = Array.from({ length: cols }, () => '#0f172a');
    const emptyFs = Array.from({ length: cols }, () => 14);
    const nextData = [...data_grid.slice(0, idx), emptyRow, ...data_grid.slice(idx)];
    const nextBg = [...bg.slice(0, idx), emptyBg, ...bg.slice(idx)];
    const nextFont = [...font.slice(0, idx), emptyFont, ...font.slice(idx)];
    const nextFg = [...fg.slice(0, idx), emptyFg, ...fg.slice(idx)];
    const nextFs = [...fs.slice(0, idx), emptyFs, ...fs.slice(idx)];
    setData(nextData); setBg(nextBg); setFont(nextFont); setFg(nextFg); setFs(nextFs);
    commit({ tableRows: rows + 1, tableCols: cols, tableData: nextData, tableBg: nextBg, tableFont: nextFont, tableFontColor: nextFg, tableFontSize: nextFs } as Partial<IShape>);
    const newR = idx, newC = active ? Math.min(active.c, cols - 1) : 0;
    setActive({ r: newR, c: newC }); focusCell(newR, newC);
  };

  const insertColAt = (j: number) => {
    const idx = Math.max(0, Math.min(j, cols));
    const nextData = data_grid.map((row) => { const copy = row.slice(); copy.splice(idx, 0, ''); return copy; });
    const nextBg = bg.map((row) => { const copy = row.slice(); copy.splice(idx, 0, '#ffffff'); return copy; });
    const nextFont = font.map((row) => { const copy = row.slice(); copy.splice(idx, 0, 'normal'); return copy; });
    const nextFg = fg.map((row) => { const copy = row.slice(); copy.splice(idx, 0, '#0f172a'); return copy; });
    const nextFs = fs.map((row) => { const copy = row.slice(); copy.splice(idx, 0, 14); return copy; });
    setData(nextData); setBg(nextBg); setFont(nextFont); setFg(nextFg); setFs(nextFs);
    commit({ tableRows: rows, tableCols: cols + 1, tableData: nextData, tableBg: nextBg, tableFont: nextFont, tableFontColor: nextFg, tableFontSize: nextFs } as Partial<IShape>);
    const newR = active ? Math.min(active.r, rows - 1) : 0, newC = idx;
    setActive({ r: newR, c: newC }); focusCell(newR, newC);
  };

  const removeRowAt = (i: number) => {
    if (rows <= 1) return;
    const idx = Math.max(0, Math.min(i, rows - 1));
    const nextData = data_grid.slice(0, idx).concat(data_grid.slice(idx + 1));
    const nextBg = bg.slice(0, idx).concat(bg.slice(idx + 1));
    const nextFont = font.slice(0, idx).concat(font.slice(idx + 1));
    const nextFg = fg.slice(0, idx).concat(fg.slice(idx + 1));
    const nextFs = fs.slice(0, idx).concat(fs.slice(idx + 1));
    setData(nextData); setBg(nextBg); setFont(nextFont); setFg(nextFg); setFs(nextFs);
    commit({ tableRows: rows - 1, tableCols: cols, tableData: nextData, tableBg: nextBg, tableFont: nextFont, tableFontColor: nextFg, tableFontSize: nextFs } as Partial<IShape>);
    if (!nextData.length) return setActive(null);
    const newR = Math.min(idx, rows - 2), newC = active ? Math.min(active.c, cols - 1) : 0;
    setActive({ r: newR, c: newC }); focusCell(newR, newC);
  };

  const removeColAt = (j: number) => {
    if (cols <= 1) return;
    const idx = Math.max(0, Math.min(j, cols - 1));
    const nextData = data_grid.map((row) => row.slice(0, idx).concat(row.slice(idx + 1)));
    const nextBg = bg.map((row) => row.slice(0, idx).concat(row.slice(idx + 1)));
    const nextFont = font.map((row) => row.slice(0, idx).concat(row.slice(idx + 1)));
    const nextFg = fg.map((row) => row.slice(0, idx).concat(row.slice(idx + 1)));
    const nextFs = fs.map((row) => row.slice(0, idx).concat(row.slice(idx + 1)));
    setData(nextData); setBg(nextBg); setFont(nextFont); setFg(nextFg); setFs(nextFs);
    commit({ tableRows: rows, tableCols: cols - 1, tableData: nextData, tableBg: nextBg, tableFont: nextFont, tableFontColor: nextFg, tableFontSize: nextFs } as Partial<IShape>);
    const newC = Math.min(idx, cols - 2), newR = active ? Math.min(active.r, rows - 1) : 0;
    setActive({ r: newR, c: Math.max(0, newC) }); focusCell(newR, Math.max(0, newC));
  };

  const addRowAbove = () => insertRowAt(active ? active.r : 0);
  const addRowBelow = () => insertRowAt((active ? active.r : rows - 1) + 1);
  const addColLeft = () => insertColAt(active ? active.c : 0);
  const addColRight = () => insertColAt((active ? active.c : cols - 1) + 1);
  const removeRow = () => removeRowAt(active ? active.r : rows - 1);
  const removeCol = () => removeColAt(active ? active.c : cols - 1);

  const setCell = (r: number, c: number, text: string) => {
    setData((prev) => { const next = prev.map((row) => row.slice()); next[r][c] = text; return next; });
  };
  const commitCell = () => commit({ tableData: data_grid } as Partial<IShape>);

  const applyBg = (color: string) => {
    if (!active) return;
    setBg((prev) => {
      const next = prev.map((row) => row.slice());
      if (scope === 'cell') next[active.r][active.c] = color;
      else if (scope === 'row') for (let j = 0; j < cols; j++) next[active.r][j] = color;
      else for (let i = 0; i < rows; i++) next[i][active.c] = color;
      commit({ tableBg: next } as Partial<IShape>);
      return next;
    });
    setOpenPicker(null);
  };

  const applyFg = (color: string) => {
    if (!active) return;
    setFg((prev) => {
      const next = prev.map((row) => row.slice());
      if (scope === 'cell') next[active.r][active.c] = color;
      else if (scope === 'row') for (let j = 0; j < cols; j++) next[active.r][j] = color;
      else for (let i = 0; i < rows; i++) next[i][active.c] = color;
      commit({ tableFontColor: next } as Partial<IShape>);
      return next;
    });
    setOpenPicker(null);
  };

  const applyFontStyle = (style: FontStyle) => {
    if (!active) return;
    setFont((prev) => {
      const next = prev.map((row) => row.slice());
      if (scope === 'cell') next[active.r][active.c] = style;
      else if (scope === 'row') for (let j = 0; j < cols; j++) next[active.r][j] = style;
      else for (let i = 0; i < rows; i++) next[i][active.c] = style;
      commit({ tableFont: next } as Partial<IShape>);
      return next;
    });
  };

  function moveTo(r: number, c: number) {
    const nr = Math.max(0, Math.min(r, rows - 1));
    const nc = Math.max(0, Math.min(c, cols - 1));
    setActive({ r: nr, c: nc });
    focusCell(nr, nc);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>, r: number, c: number) {
    if (e.key === 'Enter' && e.altKey) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      if (e.shiftKey) { if (c > 0) moveTo(r, c - 1); else if (r > 0) moveTo(r - 1, cols - 1); }
      else { if (c < cols - 1) moveTo(r, c + 1); else if (r < rows - 1) moveTo(r + 1, 0); else { insertRowAt(rows); setTimeout(() => moveTo(rows, 0), 0); } }
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) { if (r > 0) moveTo(r - 1, c); }
      else { if (r < rows - 1) moveTo(r + 1, c); else { insertRowAt(rows); setTimeout(() => moveTo(rows, c), 0); } }
    }
  }

  function Arrow({ dir }: { dir: 'left' | 'right' | 'up' | 'down' }) {
    const d = dir === 'left' ? 'M15 6l-6 6 6 6' : dir === 'right' ? 'M9 6l6 6-6 6' : dir === 'up' ? 'M6 15l6-6 6 6' : 'M6 9l6 6 6-6';
    return (
      <svg width="12" height="12" viewBox="0 0 24 24" className="text-blue-600">
        <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={200} minHeight={150} />

      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div ref={toolbarRef} className="nodrag nopan flex flex-wrap items-center gap-2 px-2 py-1 rounded-lg border bg-white shadow text-sm">
          {/* Rows */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Row</span>
            <button className="px-2 py-1 rounded bg-gray-200" title="Add above" onClick={(e) => { e.stopPropagation(); addRowAbove(); }}>+ ↑</button>
            <button className="px-2 py-1 rounded bg-gray-200" title="Add below" onClick={(e) => { e.stopPropagation(); addRowBelow(); }}>+ ↓</button>
            <button className="px-2 py-1 rounded bg-gray-200 disabled:opacity-40" disabled={rows <= 1} title="Remove row" onClick={(e) => { e.stopPropagation(); removeRow(); }}>−</button>
          </div>

          {/* Columns */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Col</span>
            <button className="px-2 py-1 rounded bg-gray-200" title="Add left" onClick={(e) => { e.stopPropagation(); addColLeft(); }}>+ ←</button>
            <button className="px-2 py-1 rounded bg-gray-200" title="Add right" onClick={(e) => { e.stopPropagation(); addColRight(); }}>+ →</button>
            <button className="px-2 py-1 rounded bg-gray-200 disabled:opacity-40" disabled={cols <= 1} title="Remove column" onClick={(e) => { e.stopPropagation(); removeCol(); }}>−</button>
          </div>

          {/* Scope */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Apply to</span>
            <div className="inline-flex rounded-lg overflow-hidden border">
              {(['cell', 'row', 'col'] as Scope[]).map((s) => (
                <button key={s} className={`px-2 py-1 ${scope === s ? 'bg-blue-200' : 'bg-gray-100'}`} onClick={(e) => { e.stopPropagation(); setScope(s); }}>
                  {s === 'cell' ? 'Cell' : s === 'row' ? 'Row' : 'Col'}
                </button>
              ))}
            </div>
          </div>

          {/* BG picker */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => { e.stopPropagation(); setOpenPicker(openPicker === 'bg' ? null : 'bg'); }}
            >
              <span className="text-gray-500">BG</span>
              <span className="w-4 h-4 rounded border" style={{ backgroundColor: active ? bg[active.r][active.c] : '#ffffff' }} />
            </button>
            {openPicker === 'bg' && <PalettePopover onPick={applyBg} />}
          </div>

          {/* Text picker */}
          <div className="relative">
            <button
              className="px-2 py-1 rounded bg-gray-100 border flex items-center gap-1"
              onClick={(e) => { e.stopPropagation(); setOpenPicker(openPicker === 'fg' ? null : 'fg'); }}
            >
              <span className="text-gray-500">Text</span>
              <span className="w-4 h-4 rounded border grid place-items-center" style={{ color: active ? fg[active.r][active.c] : '#0f172a' }}>A</span>
            </button>
            {openPicker === 'fg' && <PalettePopover onPick={applyFg} />}
          </div>

          {/* Font style */}
          <div className="flex items-center gap-1">
            <span className="text-gray-500">Style</span>
            <button className="px-2 py-1 rounded bg-gray-200" onClick={(e) => { e.stopPropagation(); applyFontStyle('normal'); }}>N</button>
            <button className="px-2 py-1 rounded bg-gray-200 font-bold" onClick={(e) => { e.stopPropagation(); applyFontStyle('bold'); }}>B</button>
            <button className="px-2 py-1 rounded bg-gray-200 italic" onClick={(e) => { e.stopPropagation(); applyFontStyle('italic'); }}>I</button>
          </div>
        </div>
      </NodeToolbar>

      <Handle type="source" position={Position.Top}    id="top"    className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right}  id="right"  className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left}   id="left"   className="opacity-0 hover:opacity-100" />

      <div className="w-full h-full bg-white rounded-xl shadow flex flex-col overflow-visible">
        <div className="flex-1 p-2 overflow-visible">
          <div className="relative w-full h-full">
            {/* Grid */}
            <div
              className="absolute inset-0 grid w-full h-full bg-gray-300 gap-[1px]"
              style={{ gridTemplateColumns, gridAutoRows: '1fr' }}
            >
              {data_grid.map((row, r) =>
                row.map((val, c) => {
                  const cellBg = bg[r][c] || '#ffffff';
                  const cellFont = font[r][c] || 'normal';
                  const cellFg = fg[r][c] || '#0f172a';
                  const cellFs = fs[r][c] || 14;
                  const fontWeight = cellFont === 'bold' ? 700 : 400;
                  const fontStyle = cellFont === 'italic' ? 'italic' : 'normal';
                  const ring = active
                    ? scope === 'cell' ? active.r === r && active.c === c
                    : scope === 'row' ? active.r === r
                    : active.c === c
                    : false;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`min-w-0 min-h-0 ${ring ? 'ring-1 ring-blue-300' : ''}`}
                      style={{ backgroundColor: cellBg }}
                    >
                      <textarea
                        ref={setCellRef(r, c)}
                        value={val}
                        onChange={(e) => setCell(r, c, e.target.value)}
                        onBlur={commitCell}
                        onFocus={() => setActive({ r, c })}
                        onClick={() => setActive({ r, c })}
                        data-nodrag="true"
                        onKeyDown={(e) => { e.stopPropagation(); handleKeyDown(e, r, c); }}
                        className="nodrag w-full h-full p-2 text-sm resize-none bg-transparent outline-none"
                        style={{ color: cellFg, fontWeight, fontStyle, fontSize: `${cellFs}px` }}
                        placeholder=""
                      />
                    </div>
                  );
                })
              )}
            </div>

            {/* Drag overlay */}
            {drag && over !== null && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ display: 'grid', gridTemplateColumns, gridAutoRows: '1fr', gap: '1px', zIndex: 5 }}
              >
                {drag.kind === 'col' && Array.from({ length: cols }).map((_, c) => (
                  <div key={`col-overlay-${c}`} className={c === over ? 'bg-blue-200/25' : 'bg-transparent'} />
                ))}
                {drag.kind === 'row' && Array.from({ length: rows * cols }).map((_, i) => {
                  const r = Math.floor(i / cols);
                  return <div key={`row-overlay-${i}`} className={r === over ? 'bg-blue-200/25' : 'bg-transparent'} />;
                })}
                <div
                  className="pointer-events-none absolute"
                  style={
                    drag.kind === 'col'
                      ? { top: 0, bottom: 0, width: '2px', background: '#3B82F6', left: `calc((100% / ${cols}) * ${over})` }
                      : { left: 0, right: 0, height: '2px', background: '#3B82F6', top: `calc((100% / ${rows}) * ${over})` }
                  }
                />
              </div>
            )}

            {/* Drag handles — only when singly selected */}
            {selected && (
              <>
                {/* Column handles */}
                <div
                  ref={colBarRef}
                  className="absolute left-0 right-0 -bottom-10 h-5 pointer-events-none grid overflow-visible"
                  style={{ gridTemplateColumns }}
                >
                  {Array.from({ length: cols }).map((_, c) => {
                    const isDragging = drag?.kind === 'col' && drag.from === c;
                    const isActiveSlot = drag?.kind === 'col' && (over ?? drag.from) === c;
                    return (
                      <div key={`col-pill-${c}`} className="relative flex items-center justify-center overflow-visible" style={{ pointerEvents: 'auto' }}>
                        <button
                          data-nodrag="true"
                          aria-label={`Drag column ${c + 1}`}
                          title="Drag to reorder column"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDrag({ kind: 'col', from: c }); setOver(c); setPointer({ x: e.clientX, y: e.clientY }); }}
                          className={['h-5 px-2 rounded-full border shadow-sm transition flex items-center gap-1 leading-none text-[10px]',
                            isDragging ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105 cursor-grabbing'
                            : isActiveSlot ? 'bg-blue-100 text-blue-700 border-blue-300 cursor-grab'
                            : 'bg-white/95 text-gray-700 border-gray-300 hover:bg-gray-50 cursor-grab',
                          ].join(' ')}
                        >
                          <span className="inline-flex gap-[3px]">
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="w-1 h-1 rounded-full bg-current" />
                          </span>
                        </button>
                        {isDragging && (
                          <>
                            <span className="absolute left-[-14px] top-1/2 -translate-y-1/2"><Arrow dir="left" /></span>
                            <span className="absolute right-[-14px] top-1/2 -translate-y-1/2"><Arrow dir="right" /></span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Row handles */}
                <div
                  ref={rowBarRef}
                  className="absolute top-0 bottom-0 -left-13 w-5 pointer-events-none grid overflow-visible"
                  style={{ gridTemplateRows: `repeat(${rows}, 1fr)` }}
                >
                  {Array.from({ length: rows }).map((_, r) => {
                    const isDragging = drag?.kind === 'row' && drag.from === r;
                    const isActiveSlot = drag?.kind === 'row' && (over ?? drag.from) === r;
                    return (
                      <div key={`row-pill-${r}`} className="relative flex items-center justify-center overflow-visible" style={{ pointerEvents: 'auto' }}>
                        <button
                          data-nodrag="true"
                          aria-label={`Drag row ${r + 1}`}
                          title="Drag to reorder row"
                          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); setDrag({ kind: 'row', from: r }); setOver(r); setPointer({ x: e.clientX, y: e.clientY }); }}
                          className={['w-5 h-5 rounded-full border shadow-sm transition grid place-items-center text-[10px] leading-none',
                            isDragging ? 'bg-blue-600 text-white border-blue-600 shadow-lg scale-105 cursor-grabbing'
                            : isActiveSlot ? 'bg-blue-100 text-blue-700 border-blue-300 cursor-grab'
                            : 'bg-white/95 text-gray-700 border-gray-300 hover:bg-gray-50 cursor-grab',
                          ].join(' ')}
                        >
                          <span className="inline-flex flex-col gap-[3px]">
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="w-1 h-1 rounded-full bg-current" />
                            <span className="w-1 h-1 rounded-full bg-current" />
                          </span>
                        </button>
                        {isDragging && (
                          <>
                            <span className="absolute top-[-14px] left-1/2 -translate-x-1/2"><Arrow dir="up" /></span>
                            <span className="absolute bottom-[-14px] left-1/2 -translate-x-1/2"><Arrow dir="down" /></span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
