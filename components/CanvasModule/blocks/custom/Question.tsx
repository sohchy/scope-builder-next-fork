"use client";
import dynamic from "next/dynamic";
import { ChevronDown, EllipsisIcon, MicIcon, ShieldPlus } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useValueProp } from "@/app/(auth)/questions/_components/ValuePropProvider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { LoadingText } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { text } from "stream/consumers";
import { trimTo50 } from "@/lib/utils";

type QuestionProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitInterview?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const Question: React.FC<QuestionProps> = (props) => {
  const { shape, onCommitInterview } = props;

  const fallbackTitle = "Type question here";
  const title = (shape as any).questionTitle ?? fallbackTitle;

  const { valuePropData } = useValueProp();

  const [editingTitle, setEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);

  const commit = (patch: Partial<IShape>) => {
    onCommitInterview?.(shape.id, patch);
  };

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
  const initialDetailEditorState = useMemo(() => {
    try {
      if (shape.metadata.questionDetails) {
        const raw = JSON.parse(shape.metadata.questionDetails);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] =
    useState<EditorState>(initialEditorState);
  const [detailEditorState, setDetailEditorState] = useState<EditorState>(
    initialDetailEditorState
  );
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
    } catch {
      // ignore bad JSON
    }
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

  const startBodyEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBody(true);
  };
  const stopBodyEdit = () => setEditingBody(false);

  // Plain-text preview when not editing
  const previewText = useMemo(() => {
    const content = editorState.getCurrentContent();
    const text = content.hasText() ? content.getPlainText("\n") : "";
    return text.length ? text : "Write interview notes here…";
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
    const mt = parseFloat(cs.marginTop || "0");
    const mb = parseFloat(cs.marginBottom || "0");
    return rect.height + mt + mb;
  }

  const MIN_HEIGHT = 75;

  function adjustHeight(delta: number) {
    // Only adjust if there is a visible change
    const current = shape.height ?? 200;
    const next = Math.max(MIN_HEIGHT, Math.round(current + delta));
    if (Math.abs(next - current) > 1) {
      commit({ height: next });
    }
  }

  function toggleCollapsed() {
    userToggledRef.current = true;
    // setCollapsed((c) => !c);
    if (!collapsed) {
      // Going to collapse: measure BEFORE hiding and shrink now
      const dh = -outerHeight(questionsRef.current);
      adjustHeight(dh);
      setCollapsed(true);
    } else {
      // Going to expand: first show, then measure and grow
      setCollapsed(false);
      // wait for layout to flush
      requestAnimationFrame(() => {
        const dh = outerHeight(questionsRef.current);
        adjustHeight(dh);
      });
    }
  }

  function toggleDetailCollapsed() {
    userToggledRef.current = true;
    // setCollapsed((c) => !c);
    if (!detailCollapsed) {
      // Going to collapse: measure BEFORE hiding and shrink now
      const dh = -outerHeight(questionsRef.current);
      adjustHeight(dh);
      setDetailCollapsed(true);
    } else {
      // Going to expand: first show, then measure and grow
      setDetailCollapsed(false);
      // wait for layout to flush
      requestAnimationFrame(() => {
        const dh = outerHeight(questionsRef.current);
        adjustHeight(dh);
      });
    }
  }

  const getTitle = (subtype: string) => {
    switch (subtype) {
      case "solution_card":
        return "Solution";
      case "interview_card":
        return "Interview";
      case "assumption_card":
        return "Assumption";
      case "problem_statement_card":
        return "Problem Statement";
      case "jobs_to_be_done_card":
        return "Jobs To Be Done";
      case "pains_card":
        return "Pains";
      case "gains_card":
        return "Gains";
      case "products_services_card":
        return "Products & Services";
      case "pain_relievers_card":
        return "Pain Relievers";
      case "gain_creators_card":
        return "Gain Creators";
      case "summary_card":
        return "Summary";
      case "select_subtype":
        return "Select Card Type";
      default:
        return "Unknown";
    }
  };

  const updateCheckTags = (id: string, checked: boolean) => {
    let nextTags = shape.questionTags ? [...shape.questionTags] : [];
    if (checked) {
      if (!nextTags.includes(id)) {
        nextTags.push(id);
      }
    } else {
      nextTags = nextTags.filter((tag) => tag !== id);
    }
    commit({ questionTags: nextTags });
  };

  const firtQuestionsOrder = [
    {
      key: "jobs_to_be_done_card",
      label: "Jobs to be Done",
    },
    {
      key: "pains_card",
      label: "Pains",
    },
    {
      key: "gains_card",
      label: "Gains",
    },
  ];

  const secondQuestionsOrder = [
    {
      key: "products_services_card",
      label: "Products & Services",
    },
    {
      key: "pain_relievers_card",
      label: "Pain Relivers",
    },
    {
      key: "gain_creators_card",
      label: "Gain Creators",
    },
  ];

  return (
    <ShapeFrame
      {...props}
      resizable={false}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full bg-[#E6CFFF] border border-[#B4B9C9] rounded-lg shadow-lg flex flex-col overflow-hidden px-6 py-6 gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-black-600">Question</h3>
          <EllipsisIcon className="w-4 h-4 text-gray-600" />
        </div>
        {shape.questionTags && shape.questionTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {shape.questionTags.map((tag) => (
              <Badge
                key={tag}
                className="bg-indigo-100 text-black max-w-[190px]"
              >
                <span className="block whitespace-normal break-words leading-tight">
                  {tag}
                </span>
              </Badge>
            ))}
          </div>
        )}
        {/* <h2 className="font-extrabold text-[14px] text-[#111827]">
          <span className="text-[#8B93A1] mr-1">1.</span>
          How much time does your team spend on project research?
        </h2> */}

        <h2
          className="font-bold text-lg text-gray-900"
          onDoubleClick={startTitleEdit}
        >
          {/* <span className="text-[#8B93A1] mr-1">1.</span> */}
          {!editingTitle ? (
            <span>{title}</span>
          ) : (
            <input
              data-nodrag="true"
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onBlur={commitTitle}
              onMouseDown={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitTitle();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  cancelTitle();
                }
              }}
              className="w-full bg-transparent outline-none text-lg font-bold text-gray-900 placeholder:text-[#2E3545]"
              // ^ small underline to hint edit mode; tweak styles as you wish
            />
          )}
        </h2>

        {shape.metadata?.questionId && (
          <div className="pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleDetailCollapsed();
              }}
              data-nodrag="true"
              className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span className="flex items-center gap-2">
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    detailCollapsed ? "-rotate-90" : "rotate-0"
                  }`}
                />
                Question details
                {/* firtQuestionsOrder.length + secondQuestionsOrder.length + 1 */}
              </span>
              {/* <span className="ml-2 text-gray-400">
              ({answeredCount}/{fiQuestions.length})
            </span> */}
            </button>
          </div>
        )}

        {shape.metadata?.questionDetails && !detailCollapsed && (
          <RteEditor
            editorState={detailEditorState}
            //onEditorStateChange={setEditorState}
            toolbar={{
              options: ["inline", "list", "link"],
              inline: {
                options: ["bold", "italic", "underline", "strikethrough"],
              },
              list: { options: ["unordered", "ordered"] },
            }}
            //toolbarHidden={!showToolbar}
            toolbarHidden
            toolbarClassName={`border-b px-2 text-[14px] pb-0 mb-0 ${
              editingBody ? "bg-white" : "bg-transparent opacity-0"
            }`}
            editorClassName={`px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope  font-medium text-[#2E3545] ${
              editingBody ? "bg-[#F0E2FF] rounded" : "bg-transparent"
            }`}
            wrapperClassName="rdw-editor-wrapper"
            placeholder="Type your text here..."
          />
        )}

        {/* Body */}
        {isEmpty && !editingBody && (
          <div className="mt-4 p-4 bg-white border border-red-200 rounded-lg">
            <LoadingText
              text="Click to add interview notes..."
              showLoader={false}
              centered={true}
            />
          </div>
        )}
        <div
          className="mt-4 rounded-lg"
          onMouseDown={(e) => e.stopPropagation()}
        >
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
              options: ["inline", "list", "link"],
              inline: {
                options: ["bold", "italic", "underline", "strikethrough"],
              },
              list: { options: ["unordered", "ordered"] },
            }}
            //toolbarHidden={!showToolbar}
            toolbarClassName={`border-b px-2 text-[14px] pb-0 mb-0 ${
              editingBody ? "bg-white" : "bg-transparent opacity-0"
            }`}
            editorClassName={`px-2 pt-0 pb-2 min-h-[120px] text-[14px] mt-0 font-manrope  font-medium text-[#2E3545] ${
              editingBody ? "bg-[#F0E2FF] rounded" : "bg-transparent"
            }`}
            wrapperClassName="rdw-editor-wrapper"
            placeholder="Type your text here..."
          />
        </div>

        <div className="pt-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleCollapsed();
            }}
            data-nodrag="true"
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
          >
            <span className="flex items-center gap-2">
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  collapsed ? "-rotate-90" : "rotate-0"
                }`}
              />
              Meta questions
              {/* firtQuestionsOrder.length + secondQuestionsOrder.length + 1 */}
            </span>
            {/* <span className="ml-2 text-gray-400">
              ({answeredCount}/{fiQuestions.length})
            </span> */}
          </button>
        </div>

        {!collapsed && (
          <div
            ref={questionsRef}
            className="mt-4 p-4 rounded-lg border border-[#B4B9C9] bg-[#EDEBFE]"
          >
            <div className="mb-4 ">
              <h3 className="font-semibold text-sm text-gray-800 mb-3">
                (1) Why do you want to ask this question?
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={shape.questionTags?.includes(
                      "Basic fact-finding / understand context"
                    )}
                    className="bg-white border-gray-300"
                    onCheckedChange={(checked) => {
                      updateCheckTags(
                        "Basic fact-finding / understand context",
                        !!checked
                      );
                    }}
                  />
                  <Label className="text-sm text-gray-700">
                    Basic fact-finding / understand context
                  </Label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={shape.questionTags?.includes(
                      "Validate my Hypothesis"
                    )}
                    className="bg-white border-gray-300"
                    onCheckedChange={(checked) => {
                      updateCheckTags("Validate my Hypothesis", !!checked);
                    }}
                  />
                  <Label className="text-sm text-gray-700">
                    Validate my Hypothesis
                  </Label>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-300 my-4" />

            <h3 className="font-semibold text-sm text-gray-800 mb-3">
              (2) If relevant, please pick from your Value Proposition
              assumptions. If you have not added any on the Value Prop canvas
              yet, they will show up here as empty for now.
            </h3>
            {firtQuestionsOrder.map(({ key, label }) => {
              const valueProp = formattedValuePropData[key];

              return (
                <div key={key} className="mb-4 ">
                  <h3 className="font-semibold text-sm text-gray-800 mb-3">
                    {getTitle(key)}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {valueProp?.map((item: any) => {
                      // if (!item.draftRaw) return null;
                      // const raw = JSON.parse(item.draftRaw);
                      // const editor = EditorState.createWithContent(
                      //   convertFromRaw(raw)
                      // );

                      let largeText = "";
                      if (item.draftRaw) {
                        const raw = JSON.parse(item.draftRaw);
                        const editor = EditorState.createWithContent(
                          convertFromRaw(raw)
                        );

                        largeText = editor.getCurrentContent().getPlainText();
                      }

                      // const largeText = editor
                      //   .getCurrentContent()
                      //   .getPlainText();

                      // const text = `${item.cardTitle} ${largeText}`;
                      const text = `${item.cardTitle}`;

                      if (text.trim().length === 0) return null;

                      return (
                        <div className="flex items-center gap-3" key={item.id}>
                          <Checkbox
                            key={item.id}
                            checked={shape.questionTags?.includes(
                              `${key}::${text}`
                            )}
                            className="bg-white border-gray-300"
                            onCheckedChange={(checked) => {
                              updateCheckTags(`${key}::${text}`, !!checked);
                            }}
                          />
                          <Label className="text-sm text-gray-700">
                            {/* {text} */}
                            {item.cardTitle && (
                              <span className="font-bold">
                                {item.cardTitle}
                              </span>
                            )}
                            {/* {trimTo50(largeText)} */}
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="border-t border-gray-300 my-4" />

            {secondQuestionsOrder.map(({ key, label }) => {
              const valueProp = formattedValuePropData[key];

              return (
                <div key={key} className="mb-5">
                  <h3 className="font-semibold text-sm text-gray-800 mb-3">
                    {getTitle(key)}
                  </h3>
                  <div className="flex flex-col gap-2">
                    {valueProp?.map((item: any) => {
                      if (!item.draftRaw) return null;
                      const raw = JSON.parse(item.draftRaw);
                      const editor = EditorState.createWithContent(
                        convertFromRaw(raw)
                      );
                      const text = editor.getCurrentContent().getPlainText();

                      if (text.trim().length === 0) return null;

                      return (
                        <div className="flex items-center gap-3" key={item.id}>
                          <Checkbox
                            key={item.id}
                            checked={shape.questionTags?.includes(
                              `${key}::${text}`
                            )}
                            className="bg-white border-gray-300"
                            onCheckedChange={(checked) => {
                              updateCheckTags(`${key}::${text}`, !!checked);
                            }}
                          />
                          <Label className="text-sm text-gray-700">
                            {text}
                          </Label>
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
    </ShapeFrame>
  );
};
