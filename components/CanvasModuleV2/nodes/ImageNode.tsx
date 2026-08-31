'use client';

import React from 'react';
import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from '@xyflow/react';

import type { Shape as IShape } from '@/components/CanvasModule/types';

export function ImageNode({ data, selected }: NodeProps) {
  const shape = data as unknown as IShape;

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={80} minHeight={60} />

      <Handle type="source" position={Position.Top}    id="top"    className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right}  id="right"  className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left}   id="left"   className="opacity-0 hover:opacity-100" />

      <div className="w-full h-full bg-white rounded-xl shadow overflow-hidden relative">
        {shape.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={shape.src}
            alt=""
            draggable={false}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-500">
            Drop an image
          </div>
        )}
      </div>
    </>
  );
}
