'use client';

import React from 'react';

const PALETTE = [
  '#ffffff',
  '#f8fafc',
  '#fee2e2',
  '#ffedd5',
  '#fef3c7',
  '#dcfce7',
  '#dbeafe',
  '#e9d5ff',
  '#fce7f3',
  '#000000',
];

export function PalettePopover({
  onPick,
  selectedHex,
}: {
  onPick: (c: string) => void;
  selectedHex?: string;
}) {
  return (
    <div
      className="absolute w-max top-full left-0 mt-1 z-50 p-2 bg-white border rounded-xl shadow grid grid-cols-5 gap-1"
      onMouseDown={(e) => e.stopPropagation()}
    >
      {PALETTE.map((c) => (
        <button
          key={c}
          title={c}
          className={`w-6 h-6 rounded border hover:scale-105 transition ${
            selectedHex === c ? 'ring-2 ring-blue-500' : ''
          }`}
          style={{ backgroundColor: c }}
          onClick={(e) => {
            e.stopPropagation();
            onPick(c);
          }}
        />
      ))}
    </div>
  );
}
