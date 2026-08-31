'use client';

import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useState } from 'react';
import { EditorState, convertFromRaw, convertToRaw } from 'draft-js';
import 'react-draft-wysiwyg/dist/react-draft-wysiwyg.css';
import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react';

import { useRealtimeShapes } from '@/components/CanvasModule/hooks/realtime/useRealtimeShapes';
import type { Shape as IShape } from '@/components/CanvasModule/types';

const RteEditor = dynamic(
  () => import('react-draft-wysiwyg').then((m) => m.Editor),
  { ssr: false }
);

export function FeatureIdeaNode({ data, selected }: NodeProps) {
  const shape = data as unknown as IShape;
  const { updateShape } = useRealtimeShapes();
  const commit = (patch: Partial<IShape>) =>
    updateShape(shape.id, (s) => ({ ...s, ...patch }));

  const initialEditorState = useMemo(() => {
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const initialFeatureIdeaEditorState = useMemo(() => {
    try {
      if ((shape as any).featureIdeaDraftRaw) {
        const raw = JSON.parse((shape as any).featureIdeaDraftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] = useState<EditorState>(initialEditorState);
  const [featureIdeaEditorState, setFeatureIdeaEditorState] =
    useState<EditorState>(initialFeatureIdeaEditorState);
  const [editingBody, setEditingBody] = useState(false);
  const [showToolbarFeature, setShowToolbarFeature] = useState(false);
  const [showToolbarWhyFeature, setShowToolbarWhyFeature] = useState(false);

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
    try {
      if ((shape as any).featureIdeaDraftRaw) {
        const raw = JSON.parse((shape as any).featureIdeaDraftRaw);
        setFeatureIdeaEditorState(EditorState.createWithContent(convertFromRaw(raw)));
      } else {
        setFeatureIdeaEditorState(EditorState.createEmpty());
      }
    } catch {}
  }, [(shape as any).featureIdeaDraftRaw]);

  useEffect(() => {
    if (!editingBody) return;
    const t = setTimeout(() => {
      const raw = convertToRaw(editorState.getCurrentContent());
      const featureIdeaRaw = convertToRaw(featureIdeaEditorState.getCurrentContent());
      commit({
        draftRaw: JSON.stringify(raw),
        featureIdeaDraftRaw: JSON.stringify(featureIdeaRaw),
      } as Partial<IShape>);
    }, 500);
    return () => clearTimeout(t);
  }, [editorState, featureIdeaEditorState, editingBody]);

  const handleCardClick = (e: React.MouseEvent) => {
    if (!editingBody) return;
    const target = e.target as HTMLElement;
    const isEditorClick =
      target.closest('.rdw-editor-wrapper') ||
      target.closest('.rdw-editor-toolbar') ||
      target.closest('button[class*="text-purple"]');
    if (!isEditorClick) {
      setEditingBody(false);
      setShowToolbarFeature(false);
      setShowToolbarWhyFeature(false);
    }
  };

  const editorText = featureIdeaEditorState.getCurrentContent().getPlainText().trim();
  const hasContent =
    (shape.draftRaw && editorText.length > 0) || (!shape.draftRaw && editorText.length > 0);
  const isEmpty = !hasContent && !editingBody;

  return (
    <>
      <NodeResizer isVisible={selected} minWidth={300} minHeight={200} />

      <Handle type="source" position={Position.Top}    id="top"    className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Right}  id="right"  className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="opacity-0 hover:opacity-100" />
      <Handle type="source" position={Position.Left}   id="left"   className="opacity-0 hover:opacity-100" />

      <div
        className="w-full h-full bg-white border border-[#B4B9C9] rounded-xl flex flex-col overflow-hidden shadow-[0px_4px_33.3px_0px_rgba(30,39,143,0.2)]"
        onClick={handleCardClick}
      >
        {/* Header */}
        <div
          className="px-3 py-2 font-semibold text-[14px] flex items-start justify-between break-words whitespace-normal"
          style={{ backgroundColor: '#DDE1F2' }}
        >
          <div className="w-full grid grid-cols-12 items-center">
            <div className="col-span-6 flex items-center justify-start pl-5 border-r border-[#B4B9C9] pr-3">
              <span className="font-manrope font-semibold text-[14px] text-[#697288]">
                Feature Idea
              </span>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 flex flex-row bg-[#DDE1F2] min-h-0">
          {/* Left column */}
          <div className="w-full h-full flex flex-col overflow-hidden px-8 py-6 gap-4 border-r border-[#B4B9C9]">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Type a feature idea.."
                className="nodrag w-full bg-transparent border-none outline-none font-manrope font-extrabold text-[24px] leading-[115%] tracking-[0%] text-[#111827] placeholder:text-[#858b9b] placeholder:font-extrabold placeholder:text-[24px] placeholder:leading-[115%]"
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex-1 overflow-auto">
              <div className="rounded-[8px]" onMouseDown={(e) => e.stopPropagation()}>
                <div className="mb-6">
                  {isEmpty ? (
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setEditingBody(true);
                          setShowToolbarFeature(true);
                        }}
                        className="nodrag text-black-600 underline hover:text-purple-800 text-sm font-medium transition-colors cursor-pointer"
                      >
                        + add more details
                      </button>
                    </div>
                  ) : editingBody ? (
                    <RteEditor
                      onBlur={() => setShowToolbarFeature(false)}
                      onFocus={() => setShowToolbarFeature(true)}
                      editorState={editorState}
                      onEditorStateChange={setEditorState}
                      toolbar={{
                        options: ['inline', 'list', 'link'],
                        inline: { options: ['bold', 'italic', 'underline', 'strikethrough'] },
                        list: { options: ['unordered', 'ordered'] },
                      }}
                      toolbarHidden={!showToolbarFeature}
                      toolbarClassName={`border-b px-2 text-[14px] pb-0 mb-0 ${editingBody ? 'bg-white' : 'bg-transparent'}`}
                      editorClassName={`px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope font-medium text-[#2E3545] ${editingBody ? 'bg-white rounded' : 'bg-transparent'}`}
                      wrapperClassName="rdw-editor-wrapper"
                      placeholder="Add more details..."
                    />
                  ) : (
                    <div
                      className="nodrag px-2 py-2 min-h-[120px] text-[14px] font-manrope font-medium text-[#2E3545] bg-transparent cursor-pointer"
                      onClick={() => {
                        setEditingBody(true);
                        setShowToolbarFeature(true);
                      }}
                    >
                      {editorState.getCurrentContent().getPlainText()}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="w-full h-full flex flex-col overflow-hidden px-8 py-6 gap-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Why is this feature necessary.."
                className="nodrag w-full bg-transparent border-none outline-none font-manrope font-extrabold text-[24px] leading-[115%] tracking-[0%] text-[#111827] placeholder:text-[#858b9b] placeholder:font-extrabold placeholder:text-[24px] placeholder:leading-[115%]"
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex-1 overflow-auto">
              <div className="rounded-[8px]" onMouseDown={(e) => e.stopPropagation()}>
                <div className="mb-6">
                  {isEmpty ? (
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setEditingBody(true);
                          setShowToolbarWhyFeature(true);
                        }}
                        className="nodrag text-black-600 underline hover:text-purple-800 text-sm font-medium transition-colors cursor-pointer"
                      >
                        + add more details
                      </button>
                    </div>
                  ) : (
                    <RteEditor
                      onBlur={() => setShowToolbarWhyFeature(false)}
                      onFocus={() => setShowToolbarWhyFeature(true)}
                      editorState={featureIdeaEditorState}
                      onEditorStateChange={setFeatureIdeaEditorState}
                      toolbar={{
                        options: ['inline', 'list', 'link'],
                        inline: { options: ['bold', 'italic', 'underline', 'strikethrough'] },
                        list: { options: ['unordered', 'ordered'] },
                      }}
                      toolbarClassName={`border-b px-2 text-[14px] ${editingBody ? 'bg-white' : 'bg-transparent'}`}
                      editorClassName={`px-2 py-2 min-h-[120px] text-[14px] ${editingBody ? 'bg-white rounded' : 'bg-transparent opacity-0'} placeholder:text-gray-500`}
                      wrapperClassName=""
                      placeholder="Add more details..."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
