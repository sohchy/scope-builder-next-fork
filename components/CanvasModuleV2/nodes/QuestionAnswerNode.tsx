'use client';

import dynamic from 'next/dynamic';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  LayoutDashboardIcon,
  LayoutListIcon,
  ChevronDown,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';

import { useRealtimeShapes } from '@/components/CanvasModule/hooks/realtime/useRealtimeShapes';
import type { Shape as IShape } from '@/components/CanvasModule/types';

const RteEditor = dynamic(
  () => import('react-draft-wysiwyg').then((m) => m.Editor),
  { ssr: false },
);

export function QuestionAnswerNode({ data, selected }: NodeProps) {
  const shape = data as unknown as IShape;
  const { updateShape } = useRealtimeShapes();

  const commit = (patch: Partial<IShape>) => {
    updateShape(shape.id, (s) => ({ ...s, ...patch }));
  };

  const question_answers = shape.question_answers || [];

  const [view, setView] = useState<'slide' | 'board'>('slide');
  const [currentAnswer, setCurrentAnswer] = useState(0);
  const userToggledRef = useRef(false);
  const questionsRef = useRef<HTMLDivElement | null>(null);
  const [detailCollapsed, setDetailCollapsed] = useState(true);
  const [editingBody, setEditingBody] = useState(true);
  const [showToolbar, setShowToolbar] = useState(false);

  const initialEditorState = useMemo(() => {
    try {
      if (shape.draftRaw) return EditorState.createWithContent(convertFromRaw(JSON.parse(shape.draftRaw)));
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const initialSummaryEditorState = useMemo(() => {
    try {
      if (shape.analysisRaw) return EditorState.createWithContent(convertFromRaw(JSON.parse(shape.analysisRaw)));
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const initialAnswerEditorState = useMemo(() => {
    try {
      if (shape.question_answers?.length) {
        return EditorState.createWithContent(convertFromRaw(JSON.parse(shape.question_answers[0].draftRaw)));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState] = useState<EditorState>(initialEditorState);
  const [summaryEditorState, setSummaryEditorState] = useState<EditorState>(initialSummaryEditorState);
  const [answerEditorState, setAnswerEditorState] = useState<EditorState>(initialAnswerEditorState);

  useEffect(() => {
    if (editingBody) return;
    try {
      if (shape.analysisRaw) {
        setSummaryEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(shape.analysisRaw))));
      } else {
        setSummaryEditorState(EditorState.createEmpty());
      }
    } catch {}
  }, [shape.analysisRaw, editingBody]);

  useEffect(() => {
    try {
      if (question_answers[currentAnswer]?.draftRaw) {
        setAnswerEditorState(EditorState.createWithContent(convertFromRaw(JSON.parse(question_answers[currentAnswer].draftRaw))));
      } else {
        setAnswerEditorState(EditorState.createEmpty());
      }
    } catch {}
  }, [currentAnswer]);

  useEffect(() => {
    if (!editingBody) return;
    const t = setTimeout(() => {
      const raw = convertToRaw(summaryEditorState.getCurrentContent());
      commit({ analysisRaw: JSON.stringify(raw) });
    }, 500);
    return () => clearTimeout(t);
  }, [summaryEditorState, editingBody]);

  const previewText = useMemo(() => {
    const content = editorState.getCurrentContent();
    return content.hasText() ? content.getPlainText('\n') : '';
  }, [editorState]);

  const isEmpty = !previewText.trim();

  function outerHeight(el: HTMLElement | null) {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);
    return rect.height + parseFloat(cs.marginTop || '0') + parseFloat(cs.marginBottom || '0');
  }

  const MIN_HEIGHT = 75;

  function adjustHeight(delta: number) {
    const current = shape.height ?? 200;
    const next = Math.max(MIN_HEIGHT, Math.round(current + delta));
    if (Math.abs(next - current) > 1) commit({ height: next });
  }

  function toggleDetailCollapsed() {
    userToggledRef.current = true;
    if (!detailCollapsed) {
      adjustHeight(-outerHeight(questionsRef.current));
      setDetailCollapsed(true);
    } else {
      setDetailCollapsed(false);
      requestAnimationFrame(() => adjustHeight(outerHeight(questionsRef.current)));
    }
  }

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={800} minHeight={75} />

      <Handle type="source" position={Position.Top}    id="top"    className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right}  id="right"  className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left}   id="left"   className="opacity-0 hover:opacity-100" />

      <div className="w-full h-full bg-[#DDE1F2] border border-[#B4B9C9] rounded-lg shadow-lg flex flex-row overflow-hidden">
        {/* Left: question + summary */}
        <div className="flex-[3] h-full flex flex-col overflow-hidden px-6 py-6 gap-4 border-r border-[#B4B9C9]">
          <h3 className="text-sm font-medium text-black-600">Question</h3>
          <h2 className="text-lg font-bold text-gray-900">{shape.questionTitle}</h2>

          <div className="pt-4">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleDetailCollapsed(); }}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ChevronDown className={`w-4 h-4 transition-transform ${detailCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                Details
              </span>
            </button>
          </div>

          {!detailCollapsed && (
            <RteEditor
              editorState={editorState}
              toolbarHidden
              toolbarClassName="border-b px-2 text-[14px] pb-0 mb-0 bg-transparent opacity-0"
              editorClassName="px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope font-medium text-[#2E3545] bg-transparent"
              wrapperClassName="rdw-editor-wrapper"
              placeholder="Type your text here..."
            />
          )}

          <div className="pt-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">Summary</span>
          </div>

          <div className="flex-1 overflow-auto">
            {isEmpty && !editingBody && (
              <div className="mt-5 p-4 bg-white border border-red-200 rounded-lg">
                <p className="text-sm text-gray-500 text-center">Click to add interview notes...</p>
              </div>
            )}
            <div className="nodrag nopan nowheel rounded-[8px]" onMouseDown={(e) => e.stopPropagation()}>
              <RteEditor
                onBlur={() => {
                  setShowToolbar(false);
                  const raw = convertToRaw(summaryEditorState.getCurrentContent());
                  commit({ analysisRaw: JSON.stringify(raw) });
                }}
                onFocus={() => setShowToolbar(true)}
                editorState={summaryEditorState}
                onEditorStateChange={setSummaryEditorState}
                toolbar={{
                  options: ['inline', 'list', 'link'],
                  inline: { options: ['bold', 'italic', 'underline', 'strikethrough'] },
                  list: { options: ['unordered', 'ordered'] },
                }}
                toolbarClassName={`border-b px-2 ${editingBody ? 'bg-white' : 'bg-transparent opacity-0'}`}
                editorClassName={`px-2 py-2 min-h-[120px] ${editingBody ? 'bg-[#FFFFFF66] rounded' : 'bg-transparent'}`}
                wrapperClassName=""
              />
            </div>
          </div>
        </div>

        {/* Right: answers */}
        <div className="flex-[8] h-full flex flex-col overflow-hidden px-6 py-6 gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-black-600">Answers</h3>
            <div className="flex items-center gap-2">
              {view === 'slide' ? (
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setView('board'); }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Switch to board view"
                >
                  <LayoutListIcon size={18} className="text-gray-600" />
                </button>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setView('slide'); }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Switch to slide view"
                >
                  <LayoutDashboardIcon size={18} className="text-gray-600" />
                </button>
              )}
            </div>
          </div>

          {view === 'slide' && (
            <>
              <div className="flex items-center">
                <div className="h-[40px] w-[40px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
                  <UserIcon className="h-[26px] w-[26px] text-[#6376F2]" />
                </div>
                <div className="flex flex-col ml-5">
                  <span className="text-[#111827] text-[14px] font-medium">
                    {question_answers[currentAnswer]?.name || 'Interviewee'}
                  </span>
                  <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                    Role: {question_answers[currentAnswer]?.role || 'UX/UI designer'}
                  </span>
                  <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                    Market Segment: {question_answers[currentAnswer]?.market_segment || ' '}
                  </span>
                </div>
              </div>

              <div className="nodrag nopan nowheel flex-1 overflow-auto">
                <div className="mt-5 rounded-[8px] bg-[#FFFFFF66]" onMouseDown={(e) => e.stopPropagation()}>
                  <RteEditor
                    editorState={answerEditorState}
                    readOnly
                    toolbarHidden
                    toolbarClassName="border-b px-2"
                    editorClassName="px-2 py-2 min-h-[120px]"
                    wrapperClassName=""
                  />
                </div>
              </div>

              <div className="flex flex-row justify-between items-center">
                <button
                  className="flex items-center justify-center rounded-full h-[30px] w-[30px] border border-[#B4B9C9] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentAnswer((p) => Math.max(p - 1, 0)); }}
                  disabled={currentAnswer === 0}
                >
                  <ChevronLeftIcon className="h-4 w-4 text-[#8B92A1]" />
                </button>
                <div className="text-[11px] font-medium text-[#8B93A1]">
                  <span className="mr-[1px]">Answer</span>
                  <span className="text-black font-bold text-[12px]"> {currentAnswer + 1}</span>
                  <span className="font-semibold text-[12px]"> / </span>
                  <span className="font-bold text-[12px]">{question_answers.length}</span>
                </div>
                <button
                  className="flex items-center justify-center rounded-full h-[30px] w-[30px] border border-[#B4B9C9] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); setCurrentAnswer((p) => Math.min(p + 1, question_answers.length - 1)); }}
                  disabled={currentAnswer >= question_answers.length - 1}
                >
                  <ChevronRightIcon className="h-4 w-4 text-[#8B92A1]" />
                </button>
              </div>
            </>
          )}

          {view === 'board' && (
            <div className="nodrag nopan nowheel grid grid-cols-2 gap-4 max-h-full overflow-y-auto">
              {question_answers.map((answer, index) => {
                let boardEditorState = EditorState.createEmpty();
                try {
                  if (answer.draftRaw) {
                    boardEditorState = EditorState.createWithContent(convertFromRaw(JSON.parse(answer.draftRaw)));
                  }
                } catch {}
                return (
                  <div key={index} className="bg-[#EDEBFE] border border-[#B4B9C9] px-6 py-4 rounded-lg w-full min-h-[200px] flex flex-col">
                    <div className="flex items-center mb-4">
                      <div className="h-[40px] w-[40px] bg-[#F4F0FF] rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-[26px] w-[26px] text-[#6376F2]" />
                      </div>
                      <div className="flex flex-col ml-5 flex-1 min-w-0">
                        <span className="text-[#111827] text-[14px] font-medium">{answer.name || 'Interviewee'}</span>
                        <span className="text-[#111827] opacity-50 text-[11px] font-medium">Role: {answer.role || 'UX/UI designer'}</span>
                        <span className="text-[#111827] opacity-50 text-[11px] font-medium">Market Segment: {answer.market_segment || ' '}</span>
                      </div>
                    </div>
                    <div className="bg-[#FFFFFF66] rounded-lg flex-1 min-h-[150px]">
                      <RteEditor
                        editorState={boardEditorState}
                        readOnly
                        toolbarHidden
                        toolbarClassName="border-b px-2"
                        editorClassName="px-2 py-2 min-h-[120px] h-full"
                        wrapperClassName="h-full"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
