'use client';

import dynamic from 'next/dynamic';
import { ChevronDown, EllipsisIcon } from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';

import {
  Handle,
  NodeResizer,
  Position,
  type NodeProps,
} from '@xyflow/react';

import { useRealtimeShapes } from '@/components/CanvasModule/hooks/realtime/useRealtimeShapes';
import { useValueProp } from '@/app/(auth)/questions/_components/ValuePropProvider';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LoadingText } from '@/components/ui/loader';
import type { Shape as IShape } from '@/components/CanvasModule/types';

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import('react-draft-wysiwyg').then((m) => m.Editor),
  { ssr: false },
);

export function QuestionNode({ data, selected }: NodeProps) {
  // RF passes data as Record<string, unknown> — cast back to our domain type
  const shape = data as unknown as IShape;

  const { updateShape } = useRealtimeShapes();

  const commit = (patch: Partial<IShape>) => {
    updateShape(shape.id, (s) => ({ ...s, ...patch }));
  };

  const { valuePropData } = useValueProp();

  const fallbackTitle = 'Type question here';
  const title = (shape as any).questionTitle ?? fallbackTitle;

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  useEffect(() => {
    if (!editingTitle) setDraftTitle(title);
  }, [title, editingTitle]);

  const startTitleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTitle(true);
  };
  const commitTitle = () => {
    const next = draftTitle.trim() || fallbackTitle;
    setEditingTitle(false);
    commit({ questionTitle: next });
  };
  const cancelTitle = () => {
    setEditingTitle(false);
    setDraftTitle(title);
  };

  const initialEditorState = useMemo(() => {
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const initialDetailEditorState = useMemo(() => {
    try {
      if (shape.metadata?.questionDetails) {
        const raw = JSON.parse(shape.metadata.questionDetails);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] = useState<EditorState>(initialEditorState);
  const [detailEditorState] = useState<EditorState>(initialDetailEditorState);
  const [editingBody, setEditingBody] = useState(true);
  const [showToolbar, setShowToolbar] = useState(false);

  useEffect(() => {
    if (editingBody) return;
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        setEditorState(EditorState.createWithContent(convertFromRaw(raw)));
      } else {
        setEditorState(EditorState.createEmpty());
      }
    } catch {}
  }, [shape.draftRaw, editingBody]);

  useEffect(() => {
    if (!editingBody) return;
    const t = setTimeout(() => {
      const raw = convertToRaw(editorState.getCurrentContent());
      commit({ draftRaw: JSON.stringify(raw) });
    }, 500);
    return () => clearTimeout(t);
  }, [editorState, editingBody]);

  const hasContent = shape.draftRaw;
  const isEmpty = !hasContent;

  const previewText = useMemo(() => {
    const content = editorState.getCurrentContent();
    const text = content.hasText() ? content.getPlainText('\n') : '';
    return text.length ? text : 'Write interview notes here…';
  }, [editorState]);

  const formatValuePropStructure = () => {
    if (!valuePropData) return {};
    const options: any = {};
    valuePropData.forEach((item: any) => {
      if (options[item.subtype]) {
        options[item.subtype].push(item);
      } else {
        options[item.subtype] = [item];
      }
    });
    return options;
  };

  const formattedValuePropData = formatValuePropStructure();

  const userToggledRef = useRef(false);
  const questionsRef = useRef<HTMLDivElement | null>(null);
  const [collapsed, setCollapsed] = useState<boolean>(true);
  const [detailCollapsed, setDetailCollapsed] = useState<boolean>(false);

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
    if (Math.abs(next - current) > 1) {
      commit({ height: next });
    }
  }

  function toggleCollapsed() {
    userToggledRef.current = true;
    if (!collapsed) {
      const dh = -outerHeight(questionsRef.current);
      adjustHeight(dh);
      setCollapsed(true);
    } else {
      setCollapsed(false);
      requestAnimationFrame(() => {
        const dh = outerHeight(questionsRef.current);
        adjustHeight(dh);
      });
    }
  }

  function toggleDetailCollapsed() {
    userToggledRef.current = true;
    if (!detailCollapsed) {
      const dh = -outerHeight(questionsRef.current);
      adjustHeight(dh);
      setDetailCollapsed(true);
    } else {
      setDetailCollapsed(false);
      requestAnimationFrame(() => {
        const dh = outerHeight(questionsRef.current);
        adjustHeight(dh);
      });
    }
  }

  const getTitle = (subtype: string) => {
    switch (subtype) {
      case 'solution_card':           return 'Solution';
      case 'interview_card':          return 'Interview';
      case 'assumption_card':         return 'Assumption';
      case 'problem_statement_card':  return 'Problem Statement';
      case 'jobs_to_be_done_card':    return 'Jobs To Be Done';
      case 'pains_card':              return 'Pains';
      case 'gains_card':              return 'Gains';
      case 'products_services_card':  return 'Products & Services';
      case 'pain_relievers_card':     return 'Pain Relievers';
      case 'gain_creators_card':      return 'Gain Creators';
      case 'summary_card':            return 'Summary';
      case 'select_subtype':          return 'Select Card Type';
      default:                        return 'Unknown';
    }
  };

  const updateCheckTags = (id: string, checked: boolean) => {
    let nextTags = (shape as any).questionTags ? [...(shape as any).questionTags] : [];
    if (checked) {
      if (!nextTags.includes(id)) nextTags.push(id);
    } else {
      nextTags = nextTags.filter((tag: string) => tag !== id);
    }
    commit({ questionTags: nextTags } as any);
  };

  const firtQuestionsOrder = [
    { key: 'jobs_to_be_done_card', label: 'Jobs to be Done' },
    { key: 'pains_card',           label: 'Pains' },
    { key: 'gains_card',           label: 'Gains' },
  ];

  const secondQuestionsOrder = [
    { key: 'products_services_card', label: 'Products & Services' },
    { key: 'pain_relievers_card',    label: 'Pain Relievers' },
    { key: 'gain_creators_card',     label: 'Gain Creators' },
  ];

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={440} minHeight={75} />

      <Handle type="source" position={Position.Top}    id="top"    className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right}  id="right"  className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left}   id="left"   className="opacity-0 hover:opacity-100" />

      <div className="w-full h-full overflow-auto bg-[#E6CFFF] border border-[#B4B9C9] rounded-lg shadow-lg flex flex-col px-6 py-6 gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-black-600">Question</h3>
          <EllipsisIcon className="w-4 h-4 text-gray-600" />
        </div>

        {(shape as any).questionTags && (shape as any).questionTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(shape as any).questionTags.map((tag: string) => (
              <Badge key={tag} className="bg-indigo-100 text-black max-w-[190px]">
                <span className="block whitespace-normal break-words leading-tight">{tag}</span>
              </Badge>
            ))}
          </div>
        )}

        <h2 className="font-bold text-lg text-gray-900" onDoubleClick={startTitleEdit}>
          {!editingTitle ? (
            <span>{title}</span>
          ) : (
            <input
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') { e.preventDefault(); commitTitle(); }
                else if (e.key === 'Escape') { e.preventDefault(); cancelTitle(); }
              }}
              className="w-full bg-transparent outline-none text-lg font-bold text-gray-900 placeholder:text-[#2E3545]"
            />
          )}
        </h2>

        {shape.metadata?.questionId && (
          <div className="pt-4">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); toggleDetailCollapsed(); }}
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ChevronDown className={`w-4 h-4 transition-transform ${detailCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                Question details
              </span>
            </button>
          </div>
        )}

        {shape.metadata?.questionDetails && !detailCollapsed && (
          <div className="nodrag nopan nowheel">
          <RteEditor
            editorState={detailEditorState}
            toolbarHidden
            toolbarClassName="border-b px-2 text-[14px] pb-0 mb-0 bg-transparent opacity-0"
            editorClassName="px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope font-medium text-[#2E3545] bg-transparent"
            wrapperClassName="rdw-editor-wrapper"
            placeholder="Type your text here..."
          />
          </div>
        )}

        {isEmpty && !editingBody && (
          <div className="mt-4 p-4 bg-white border border-red-200 rounded-lg">
            <LoadingText text="Click to add interview notes..." showLoader={false} centered />
          </div>
        )}

        <div className="nodrag nopan nowheel mt-4 rounded-lg" onMouseDown={(e) => e.stopPropagation()}>
          <RteEditor
            onBlur={() => {
              setShowToolbar(false);
              const raw = convertToRaw(editorState.getCurrentContent());
              commit({ draftRaw: JSON.stringify(raw) });
            }}
            onFocus={() => setShowToolbar(true)}
            editorState={editorState}
            onEditorStateChange={setEditorState}
            toolbar={{
              options: ['inline', 'list', 'link'],
              inline: { options: ['bold', 'italic', 'underline', 'strikethrough'] },
              list: { options: ['unordered', 'ordered'] },
            }}
            toolbarClassName={`border-b px-2 text-[14px] pb-0 mb-0 ${editingBody ? 'bg-white' : 'bg-transparent opacity-0'}`}
            editorClassName={`px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope font-medium text-[#2E3545] ${editingBody ? 'bg-[#F0E2FF] rounded' : 'bg-transparent'}`}
            wrapperClassName="rdw-editor-wrapper"
            placeholder="Type your text here..."
          />
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); toggleCollapsed(); }}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ChevronDown className={`w-4 h-4 transition-transform ${collapsed ? '-rotate-90' : 'rotate-0'}`} />
              Meta questions
            </span>
          </button>
        </div>

        {!collapsed && (
          <div ref={questionsRef} className="nodrag nopan nowheel mt-4 p-4 rounded-lg border border-[#B4B9C9] bg-[#EDEBFE]">
            <div className="mb-4">
              <h3 className="font-semibold text-sm text-gray-800 mb-3">(1) Why do you want to ask this question?</h3>
              <div className="flex flex-col gap-2">
                {['Basic fact-finding / understand context', 'Validate my Hypothesis'].map((tag) => (
                  <div key={tag} className="flex items-center gap-3">
                    <Checkbox
                      checked={(shape as any).questionTags?.includes(tag)}
                      className="bg-white border-gray-300"
                      onCheckedChange={(checked) => updateCheckTags(tag, !!checked)}
                    />
                    <Label className="text-sm text-gray-700">{tag}</Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-gray-300 my-4" />

            <h3 className="font-semibold text-sm text-gray-800 mb-3">
              (2) If relevant, please pick from your Value Proposition assumptions.
            </h3>

            {firtQuestionsOrder.map(({ key }) => {
              const valueProp = formattedValuePropData[key];
              return (
                <div key={key} className="mb-4">
                  <h3 className="font-semibold text-sm text-gray-800 mb-3">{getTitle(key)}</h3>
                  <div className="flex flex-col gap-2">
                    {valueProp?.map((item: any) => {
                      const text = `${item.cardTitle}`;
                      if (text.trim().length === 0) return null;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <Checkbox
                            checked={(shape as any).questionTags?.includes(`${key}::${text}`)}
                            className="bg-white border-gray-300"
                            onCheckedChange={(checked) => updateCheckTags(`${key}::${text}`, !!checked)}
                          />
                          <Label className="text-sm text-gray-700">
                            {item.cardTitle && <span className="font-bold">{item.cardTitle}</span>}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="border-t border-gray-300 my-4" />

            {secondQuestionsOrder.map(({ key }) => {
              const valueProp = formattedValuePropData[key];
              return (
                <div key={key} className="mb-5">
                  <h3 className="font-semibold text-sm text-gray-800 mb-3">{getTitle(key)}</h3>
                  <div className="flex flex-col gap-2">
                    {valueProp?.map((item: any) => {
                      if (!item.draftRaw) return null;
                      const raw = JSON.parse(item.draftRaw);
                      const editor = EditorState.createWithContent(convertFromRaw(raw));
                      const text = editor.getCurrentContent().getPlainText();
                      if (text.trim().length === 0) return null;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <Checkbox
                            checked={(shape as any).questionTags?.includes(`${key}::${text}`)}
                            className="bg-white border-gray-300"
                            onCheckedChange={(checked) => updateCheckTags(`${key}::${text}`, !!checked)}
                          />
                          <Label className="text-sm text-gray-700">{text}</Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
