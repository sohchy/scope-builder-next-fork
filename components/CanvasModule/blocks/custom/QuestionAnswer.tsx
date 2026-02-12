"use client";
import dynamic from "next/dynamic";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisIcon,
  UserIcon,
  LayoutDashboardIcon,
  LayoutListIcon,
  ChevronDown,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";

type QuestionAnswerProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitInterview?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false }
);

export const QuestionAnswer: React.FC<QuestionAnswerProps> = (props) => {
  const { shape, onCommitInterview } = props;

  const question_answers = shape.question_answers || [];

  const [view, setView] = useState<"slide" | "board">("slide");
  const [currentAnswer, setCurrentAnswer] = useState<number>(0);
  const userToggledRef = useRef(false);
  const questionsRef = useRef<HTMLDivElement | null>(null);
  const [detailCollapsed, setDetailCollapsed] = useState<boolean>(true);

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
  const initialSummaryEditorState = useMemo(() => {
    try {
      if (shape.analysisRaw) {
        const raw = JSON.parse(shape.analysisRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const initialAnswerEditorState = useMemo(() => {
    try {
      if (shape.question_answers?.length) {
        const raw = JSON.parse(shape.question_answers[0].draftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] =
    useState<EditorState>(initialEditorState);
  const [summaryEditorState, setSummaryEditorState] = useState<EditorState>(
    initialSummaryEditorState
  );
  const [editingBody, setEditingBody] = useState(true);
  const [showToolbar, setShowToolbar] = useState(false);

  const [answerEditorState, setAnswerEditorState] = useState<EditorState>(
    initialAnswerEditorState
  );

  useEffect(() => {
    if (editingBody) return;
    try {
      if (shape.analysisRaw) {
        const raw = JSON.parse(shape.analysisRaw);
        setSummaryEditorState(
          EditorState.createWithContent(convertFromRaw(raw))
        );
      } else {
        setSummaryEditorState(EditorState.createEmpty());
      }
    } catch {
      // ignore bad JSON
    }
  }, [shape.analysisRaw, editingBody]);

  useEffect(() => {
    try {
      if (question_answers[currentAnswer]?.draftRaw) {
        const raw = JSON.parse(question_answers[currentAnswer]?.draftRaw);
        setAnswerEditorState(
          EditorState.createWithContent(convertFromRaw(raw))
        );
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

  const startBodyEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingBody(true);
  };
  const stopBodyEdit = () => setEditingBody(false);

  // Plain-text preview when not editing
  const previewText = useMemo(() => {
    const content = editorState.getCurrentContent();
    const text = content.hasText() ? content.getPlainText("\n") : "";
    return text.length ? text : "";
  }, [editorState]);

  const isEmpty = !previewText.trim();

  const getNextAnswer = () => {
    setCurrentAnswer((prev) => {
      if (prev === undefined) return 0;
      return Math.min(prev + 1, question_answers.length - 1);
    });
  };

  const getPreviousAnswer = () => {
    setCurrentAnswer((prev) => {
      if (prev === undefined) return 0;
      return Math.max(prev - 1, 0);
    });
  };

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

  return (
    <ShapeFrame
      {...props}
      resizable={false}
      showConnectors={props.isSelected && props.selectedCount === 1}
    >
      <div className="w-full h-full bg-[#DDE1F2] border border-[#B4B9C9] rounded-lg shadow-lg flex flex-row overflow-hidden">
        <div className="flex-[3] h-full flex flex-col overflow-hidden px-6 py-6 gap-4 border-r border-[#B4B9C9]">
          <h3 className="text-sm font-medium text-black-600">Question</h3>
          <h2 className="text-lg font-bold text-gray-900">
            {shape.questionTitle}
          </h2>

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
                Details
                {/* firtQuestionsOrder.length + secondQuestionsOrder.length + 1 */}
              </span>
              {/* <span className="ml-2 text-gray-400">
              ({answeredCount}/{fiQuestions.length})
            </span> */}
            </button>
          </div>

          {!detailCollapsed && (
            <RteEditor
              editorState={editorState}
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
                editingBody ? "bg-[#FFFFFF66] rounded" : "bg-transparent"
              }`}
              wrapperClassName="rdw-editor-wrapper"
              placeholder="Type your text here..."
            />
          )}

          <div className="pt-4">
            <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              Summary
            </span>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto">
            {isEmpty && !editingBody && (
              <div className="mt-5 p-4 bg-white border border-red-200 rounded-lg">
                <p className="text-sm text-gray-500 text-center">
                  Click to add interview notes...
                </p>
              </div>
            )}
            <div
              className="rounded-[8px] "
              onMouseDown={(e) => e.stopPropagation()}
            >
              <RteEditor
                onBlur={() => {
                  setShowToolbar(false);
                  const raw = convertToRaw(
                    summaryEditorState.getCurrentContent()
                  );
                  commit({ analysisRaw: JSON.stringify(raw) });
                }}
                onFocus={() => setShowToolbar(true)}
                editorState={summaryEditorState}
                onEditorStateChange={setSummaryEditorState}
                toolbar={{
                  options: ["inline", "list", "link"],
                  inline: {
                    options: ["bold", "italic", "underline", "strikethrough"],
                  },
                  list: { options: ["unordered", "ordered"] },
                }}
                //toolbarHidden={!showToolbar}
                toolbarClassName={`border-b px-2 ${
                  editingBody ? "bg-white" : "bg-transparent opacity-0"
                }`}
                editorClassName={`px-2 py-2 min-h-[120px] ${
                  editingBody ? "bg-[#FFFFFF66] rounded" : "bg-transparent"
                }`}
                wrapperClassName=""
              />
            </div>
          </div>
        </div>
        <div className="flex-[8] h-full flex flex-col overflow-hidden px-6 py-6 gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-black-600">Answers</h3>
            <div className="flex items-center gap-2">
              {view === "slide" ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setView("board");
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Switch to board view"
                >
                  <LayoutListIcon size={18} className="text-gray-600" />
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setView("slide");
                  }}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                  title="Switch to slide view"
                >
                  <LayoutDashboardIcon size={18} className="text-gray-600" />
                </button>
              )}
            </div>
          </div>
          {view === "slide" && (
            <>
              <div className="flex items-center">
                <div className="h-[40px] w-[40px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
                  <UserIcon className="h-[26px] w-[26px] text-[#6376F2]" />
                </div>

                {/* Interviewer */}
                <div className="flex flex-col ml-5">
                  <span className="text-[#111827] text-[14px] font-medium">
                    {question_answers[currentAnswer]?.name || "Interviewee"}
                  </span>
                  <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                    Role:{" "}
                    {question_answers[currentAnswer]?.role || "UX/UI designer"}
                  </span>
                  <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                    Market Segment:{" "}
                    {question_answers[currentAnswer]?.market_segment || " "}
                  </span>
                </div>
              </div>
              {/* Body */}
              <div className="flex-1 overflow-auto">
                <div
                  className="mt-5 rounded-[8px] bg-[#FFFFFF66]"
                  onMouseDown={(e) => e.stopPropagation()}
                >
                  <RteEditor
                    editorState={answerEditorState}
                    readOnly={true}
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
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    getPreviousAnswer();
                  }}
                  disabled={currentAnswer === 0}
                  data-nodrag="true"
                >
                  <ChevronLeftIcon className="h-4 w-4 text-[#8B92A1]" />
                </button>

                <div className="text-[11px] font-medium text-[#8B93A1]">
                  <span className="mr-[1px]">Answer</span>
                  <span className="text-black font-bold text-[12px]">
                    {" "}
                    {(currentAnswer || 0) + 1}
                  </span>
                  <span className="font-semibold text-[12px]"> / </span>
                  <span className="font-bold text-[12px]">
                    {question_answers.length}
                  </span>
                </div>

                <button
                  className="flex items-center justify-center rounded-full h-[30px] w-[30px] border border-[#B4B9C9] hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    getNextAnswer();
                  }}
                  disabled={currentAnswer >= question_answers.length - 1}
                  data-nodrag="true"
                >
                  <ChevronRightIcon className="h-4 w-4 text-[#8B92A1]" />
                </button>
              </div>
            </>
          )}

          {view == "board" && (
            <div className="grid grid-cols-2 gap-4 max-h-full overflow-y-auto">
              {question_answers.map((answer, index) => {
                const raw = JSON.parse(answer.draftRaw);
                const individualAnswerEditorState =
                  EditorState.createWithContent(convertFromRaw(raw));
                return (
                  <div
                    key={index}
                    className="bg-[#EDEBFE] border border-[#B4B9C9] px-6 py-4 rounded-lg w-full min-h-[200px] flex flex-col"
                  >
                    <div className="flex items-center mb-4">
                      <div className="h-[40px] w-[40px] bg-[#F4F0FF] rounded-full flex items-center justify-center flex-shrink-0">
                        <UserIcon className="h-[26px] w-[26px] text-[#6376F2]" />
                      </div>

                      {/* Interviewer */}
                      <div className="flex flex-col ml-5 flex-1 min-w-0">
                        <span className="text-[#111827] text-[14px] font-medium">
                          {answer.name || "Interviewee"}
                        </span>
                        <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                          Role: {answer.role || "UX/UI designer"}
                        </span>
                        <span className="text-[#111827] opacity-50 text-[11px] font-medium">
                          Market Segment: {answer.market_segment || " "}
                        </span>
                      </div>
                    </div>

                    <div className="bg-[#FFFFFF66] rounded-lg flex-1 min-h-[150px]">
                      <RteEditor
                        editorState={individualAnswerEditorState}
                        readOnly={true}
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
                        toolbarHidden
                        toolbarClassName="border-b px-2"
                        editorClassName="px-2 py-2 min-h-[1=0px] h-full"
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
    </ShapeFrame>
  );
};
