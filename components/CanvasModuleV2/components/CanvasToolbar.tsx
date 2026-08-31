'use client';

import { CircleIcon, LightbulbIcon, MessageSquareIcon, MessageSquareTextIcon, SquareIcon, TypeIcon } from 'lucide-react';
import type { ShapeType } from '@/components/CanvasModule/types';

interface ToolbarOptions {
  card?: boolean;
  text?: boolean;
  table?: boolean;
  answer?: boolean;
  ellipse?: boolean;
  feature?: boolean;
  question?: boolean;
  rectangle?: boolean;
  interview?: boolean;
}

interface CanvasToolbarProps {
  toolbarOptions?: ToolbarOptions;
  onAddShape: (type: ShapeType) => void;
}

function ToolButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
    >
      {children}
    </button>
  );
}

export function CanvasToolbar({ toolbarOptions, onAddShape }: CanvasToolbarProps) {
  return (
    <div className="p-2 bg-white rounded-2xl shadow flex flex-col gap-3 items-center">
      {toolbarOptions?.rectangle && (
        <ToolButton title="Add Rectangle" onClick={() => onAddShape('rect')}>
          <SquareIcon className="w-5 h-5" />
        </ToolButton>
      )}
      {toolbarOptions?.ellipse && (
        <ToolButton title="Add Ellipse" onClick={() => onAddShape('ellipse')}>
          <CircleIcon className="w-5 h-5" />
        </ToolButton>
      )}
      {toolbarOptions?.text && (
        <ToolButton title="Add Text" onClick={() => onAddShape('text')}>
          <TypeIcon className="w-5 h-5" />
        </ToolButton>
      )}
      {toolbarOptions?.question && (
        <ToolButton title="Add Question" onClick={() => onAddShape('question')}>
          <MessageSquareIcon className="w-5 h-5" />
        </ToolButton>
      )}
      {toolbarOptions?.answer && (
        <ToolButton title="Add Q&A" onClick={() => onAddShape('question_answer')}>
          <MessageSquareTextIcon className="w-5 h-5" />
        </ToolButton>
      )}
      {toolbarOptions?.feature && (
        <ToolButton title="Add Feature Idea" onClick={() => onAddShape('feature_idea')}>
          <LightbulbIcon className="w-5 h-5" />
        </ToolButton>
      )}
    </div>
  );
}
