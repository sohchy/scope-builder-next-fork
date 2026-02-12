"use client";
import dynamic from "next/dynamic";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  Ellipsis,
  EllipsisIcon,
  UserIcon,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { CardFrame } from "../CardFrame";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";

type FeatureIdeaProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitInterview?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const FeatureIdea: React.FC<FeatureIdeaProps> = (props) => {
  const { shape, onCommitInterview } = props;

  const commit = (patch: Partial<IShape>) => {
    onCommitInterview?.(shape.id, patch);
  };

  // --- DraftJS editor state ---
  const initialEditorState = useMemo(() => {
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  // --- DraftJS editor state ---
  const initialFeatureIdeaEditorState = useMemo(() => {
    try {
      if (shape.featureIdeaDraftRaw) {
        const raw = JSON.parse(shape.featureIdeaDraftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] =
    useState<EditorState>(initialEditorState);
  const [editingBody, setEditingBody] = useState(false);

  const [featureIdeaEditorState, setFeatureIdeaEditorState] =
    useState<EditorState>(initialFeatureIdeaEditorState);

  useEffect(() => {
    if (editingBody) return;
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        setEditorState(EditorState.createWithContent(convertFromRaw(raw)));
      } else {
        setEditorState(EditorState.createEmpty());
      }
    } catch {
      // ignore bad JSON
    }
  }, [shape.draftRaw, editingBody]);

  useEffect(() => {
    try {
      if (shape.featureIdeaDraftRaw) {
        const raw = JSON.parse(shape.featureIdeaDraftRaw);
        setFeatureIdeaEditorState(
          EditorState.createWithContent(convertFromRaw(raw))
        );
      } else {
        setFeatureIdeaEditorState(EditorState.createEmpty());
      }
    } catch {}
  }, [shape.featureIdeaDraftRaw]);

  useEffect(() => {
    if (!editingBody) return;
    const t = setTimeout(() => {
      const raw = convertToRaw(editorState.getCurrentContent());
      const featureIdeaRaw = convertToRaw(
        featureIdeaEditorState.getCurrentContent()
      );
      commit({
        draftRaw: JSON.stringify(raw),
        featureIdeaDraftRaw: JSON.stringify(featureIdeaRaw),
      });
    }, 500);
    return () => clearTimeout(t);
  }, [editorState, featureIdeaEditorState, editingBody]);

  const [showToolbarFeature, setShowToolbarFeature] = useState(false);
  const [showToolbarWhyFeature, setShowToolbarWhyFeature] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if (editingBody) {
      const target = e.target as HTMLElement;
      const isEditorClick =
        target.closest(".rdw-editor-wrapper") ||
        target.closest(".rdw-editor-toolbar") ||
        target.closest('button[class*="text-purple"]');

      if (!isEditorClick) {
        setEditingBody(false);
        setShowToolbarFeature(false);
        setShowToolbarWhyFeature(false);
      }
    }
  };

  const editorText = featureIdeaEditorState
    .getCurrentContent()
    .getPlainText()
    .trim();
  const hasContent =
    (shape.draftRaw && editorText.length > 0) ||
    (!shape.draftRaw && editorText.length > 0);
  const isEmpty = !hasContent && !editingBody;

  return (
    <CardFrame
      {...props}
      resizable={false}
      useAttachments={true}
      headerTextColor={"#DDE1F2"}
      headerBg={"#DDE1F2"}
      onClick={handleCardClick}
      header={
        <div className="w-full grid grid-cols-12 items-center">
          <div className="col-span-6 flex items-center justify-start pl-5 border-r border-[#B4B9C9] pr-3">
            <span className="font-manrope font-semibold text-[14px] text-[#697288]">
              {"Feature Idea"}
            </span>
          </div>
          <div className="col-span-6 flex items-center justify-end pl-3 pr-3">
            {/* <DropdownMenu defaultOpen={false}>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open</span>
                  <Ellipsis className="h-10 w-10 text-[#8B92A1]" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="absolute -top-11 left-5 p-1.5 w-[216px]"
              ></DropdownMenuContent>
            </DropdownMenu> */}
          </div>
        </div>
      }
      body={
        <div className="h-full flex flex-row bg-[#DDE1F2]">
          <div className="w-full h-full flex flex-col overflow-hidden px-8 py-6 gap-4 border-r border-[#B4B9C9] ">
            {/* <h3 className="text-[14px] font-bold text-black">Feature Idea</h3> */}
            <div className="mb-4">
              <input
                type="text"
                placeholder={"Type a feature idea.."}
                className="w-full bg-transparent border-none outline-none font-manrope font-extrabold text-[24px] leading-[115%] tracking-[0%] text-[#111827] placeholder:text-[#858b9b] placeholder:font-extrabold placeholder:text-[24px] placeholder:leading-[115%]"
                // defaultValue={shape.cardTitle || ""}
                // onBlur={(e) => {
                //   if (e.target.value !== shape.cardTitle) {
                //     commit({ cardTitle: e.target.value });
                //   }
                // }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            {/* Body */}
            <div className="flex-1 overflow-auto">
              <div
                className="rounded-[8px] "
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="mb-6">
                  {isEmpty ? (
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setEditingBody(true);
                          setShowToolbarFeature(true);
                        }}
                        className="text-black-600 underline hover:text-purple-800 text-sm font-medium transition-colors cursor-pointer"
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
                        options: ["inline", "list", "link"],
                        inline: {
                          options: [
                            "bold",
                            "italic",
                            "underline",
                            "strikethrough",
                          ],
                        },
                        list: { options: ["unordered", "ordered"] },
                      }}
                      toolbarHidden={!showToolbarFeature}
                      toolbarClassName={`border-b px-2 text-[14px] pb-0 mb-0 ${
                        editingBody ? "bg-white" : "bg-transparent"
                      }`}
                      editorClassName={`px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope  font-medium text-[#2E3545] ${
                        editingBody ? "bg-white rounded" : "bg-transparent"
                      }`}
                      wrapperClassName="rdw-editor-wrapper"
                      placeholder="Add more details..."
                    />
                  ) : (
                    <div
                      className="px-2 py-2 min-h-[120px] text-[14px] font-manrope font-medium text-[#2E3545] bg-transparent cursor-pointer"
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
          <div className="w-full h-full flex flex-col overflow-hidden px-8 py-6 gap-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder={"Why is this feature necessary.."}
                className="w-full bg-transparent border-none outline-none font-manrope font-extrabold text-[24px] leading-[115%] tracking-[0%] text-[#111827] placeholder:text-[#858b9b] placeholder:font-extrabold placeholder:text-[24px] placeholder:leading-[115%]"
                // defaultValue={shape.cardTitle || ""}
                // onBlur={(e) => {
                //   if (e.target.value !== shape.cardTitle) {
                //     commit({ cardTitle: e.target.value });
                //   }
                // }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            </div>
            {/* Body */}
            <div className="flex-1 overflow-auto">
              <div
                className="rounded-[8px] "
                onMouseDown={(e) => e.stopPropagation()}
              >
                <div className="mb-6">
                  {isEmpty ? (
                    <div className="flex items-center">
                      <button
                        onClick={() => {
                          setEditingBody(true);
                          setShowToolbarWhyFeature(true);
                        }}
                        className="ttext-black-600 underline hover:text-purple-800 text-sm font-medium transition-colors cursor-pointer"
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
                        options: ["inline", "list", "link"],
                        inline: {
                          options: [
                            "bold",
                            "italic",
                            "underline",
                            "strikethrough",
                          ],
                        },
                        list: { options: ["unordered", "ordered"] },
                      }}
                      //toolbarHidden={!showToolbarWhyFeature}
                      toolbarClassName={`border-b px-2 text-[14px] ${
                        editingBody ? "bg-white" : "bg-transparent"
                      }`}
                      editorClassName={`px-2 py-2 min-h-[120px] text-[14px] ${
                        editingBody
                          ? "bg-white rounded"
                          : "bg-transparent opacity-0"
                      } placeholder:text-gray-500 `}
                      wrapperClassName=""
                      placeholder="Add more details..."
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    />
  );
};
