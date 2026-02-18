"use client";
import dynamic from "next/dynamic";
import { ChevronDown, EllipsisIcon, MicIcon } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { EditorState, convertFromRaw, convertToRaw } from "draft-js";

import "react-draft-wysiwyg/dist/react-draft-wysiwyg.css";

import {
  Select,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectValue,
  SelectTrigger,
  SelectContent,
} from "@/components/ui/select";
import { Shape as IShape } from "../../types";
import { ShapeFrame, ShapeFrameProps } from "../BlockFrame";
import { useQuestions } from "../../questions/QuestionsProvider";
import { CardFrame } from "../CardFrame";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { trimTo50 } from "@/lib/utils";

type GainsProps = Omit<ShapeFrameProps, "children" | "shape"> & {
  shape: IShape;
  onCommitStyle?: (id: string, patch: Partial<IShape>) => void;
};

// SSR-safe import (react-draft-wysiwyg touches window)
const RteEditor = dynamic(
  () => import("react-draft-wysiwyg").then((m) => m.Editor),
  { ssr: false },
);

export const Gains: React.FC<GainsProps> = (props) => {
  const { segments } = useQuestions();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      const target = textareaRef.current;
      target.style.height = "auto";
      target.style.height = target.scrollHeight + "px";
    }
  }, [props.shape.cardTitle]);

  const questions = [
    {
      id: "gain_question_1",
      card_type: "card",
      question: "(2) What sort of Gain is it?",
      question_options: [
        "Required (basic expectation without which the solution wouldn't work; for eg: login to work timesheet app)",
        "Expected (common expectation set by current competitor solutions; for eg: app is desktop + mobile friendly)",
        "Desired (great to have; for eg: app reminds me 1hr before my shift)",
        "Unexpected (goes beyond stakeholder expectations and desires; for eg: app calculates daily my share of tips)",
      ],
      question_type: "dropdown",
    },
    {
      id: "gain_question_2",
      card_type: "card",
      question:
        "(3) How concrete does this Gain need to be for the stakeholder? For example, approximate dollar amount or time saved, number of leads generated, etc",
      question_type: "text-area",
    },
    {
      id: "gain_question_3",
      card_type: "card",
      question:
        "(4) How would this Gain make the stakeholder feel? For example, delight, relief, calm, motivated, etc.",
      question_type: "text-area",
    },
    {
      id: "gain_question_4",
      card_type: "card",
      question:
        "(5) On a scale of 1-10, 10 being highest, in your opinion what is the significance of this Gain to the customer/user?",
      question_options: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      question_type: "slider",
    },
  ];
  const { shape, onCommitStyle } = props;

  const tags: string[] = Array.isArray((shape as any).cardTags)
    ? ((shape as any).cardTags as string[])
    : ["", "", "", ""];

  const commit = (patch: Partial<IShape>) => {
    onCommitStyle?.(shape.id, patch);
  };

  function addTag(name: string, idx: number) {
    if (!name) return;
    const next = [...tags];
    next[idx] = name;
    commit({ cardTags: next });
  }

  const fiQuestions = useMemo(
    () => questions.filter((q) => q.card_type === "card"),
    [questions],
  );

  const answeredCount = fiQuestions.reduce(
    (n, _q, i) => n + (tags[i] ? 1 : 0),
    0,
  );

  const allAnswered =
    fiQuestions.length > 0 && answeredCount === fiQuestions.length;

  // Collapsed state: default closed only if already complete;
  // afterwards, user can toggle freely (no auto-collapse).
  // const [collapsed, setCollapsed] = useState<boolean>(allAnswered);
  const [collapsed, setCollapsed] = useState<boolean>(true);

  const userToggledRef = useRef(false);
  useEffect(() => {
    // If data loads after mount and user hasn't toggled yet,
    // sync the initial state once.
    //if (!userToggledRef.current) setCollapsed(allAnswered);
  }, [allAnswered]);

  const questionsRef = useRef<HTMLDivElement | null>(null);

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

  const initialEditorState = useMemo(() => {
    try {
      if (shape.draftRaw) {
        const raw = JSON.parse(shape.draftRaw);
        return EditorState.createWithContent(convertFromRaw(raw));
      }
    } catch {}
    return EditorState.createEmpty();
  }, []);

  const [editorState, setEditorState] =
    useState<EditorState>(initialEditorState);
  const [editingBody, setEditingBody] = useState(false);
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
  const [currentValue, setCurrentValue] = useState<number>(0);

  const handleCardClick = (e: React.MouseEvent) => {
    if (editingBody) {
      const target = e.target as HTMLElement;
      const isEditorClick =
        target.closest(".rdw-editor-wrapper") ||
        target.closest(".rdw-editor-toolbar") ||
        target.closest('button[class*="text-purple"]');

      if (!isEditorClick) {
        setEditingBody(false);
        setShowToolbar(false);
      }
    }
  };

  const formatSegmentsStructure = () => {
    if (!segments) return {};

    const options: any = {};

    segments
      .filter((item: any) => item.subtype)
      .forEach((item: any) => {
        if (options[item.subtype]) {
          options[item.subtype].push(item);
        } else {
          options[item.subtype] = [item];
        }
      });

    return options;
  };

  const formattedSegments = formatSegmentsStructure();

  const editorText = editorState.getCurrentContent().getPlainText().trim();
  const hasContent =
    (shape.draftRaw && editorText.length > 0) ||
    (!shape.draftRaw && editorText.length > 0);
  const isEmpty = !hasContent && !editingBody;

  const firtQuestionsOrder = [
    {
      key: "industry_market_segment_card",
      label: "Industry Market Segment",
    },
    {
      key: "customer_card",
      label: "Customer",
    },
    {
      key: "end_user_card",
      label: "End User",
    },
  ];

  const getTitle = (subtype: string) => {
    switch (subtype) {
      case "customer_card":
        return "Customer";
      case "end_user_card":
        return "End User";
      case "industry_market_segment_card":
        return "Industry Market Segment";
      default:
        return "Unknown";
    }
  };

  const updateCheckTags = (id: string, checked: boolean) => {
    let nextTags = shape.segmentsTags ? [...shape.segmentsTags] : [];
    if (checked) {
      if (!nextTags.includes(id)) {
        nextTags.push(id);
      }
    } else {
      nextTags = nextTags.filter((tag) => tag !== id);
    }
    commit({ segmentsTags: nextTags });
  };

  return (
    <div className="flex-1 overflow-auto">
      <div
        className="shadow-lg bg-[#FFCBAF]"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={handleCardClick}
      >
        <div className="p-6 pt-0">
          <div className="mb-4">
            <textarea
              ref={textareaRef}
              placeholder={"Type Gain here.."}
              className="w-full bg-transparent border-none outline-none font-manrope font-extrabold text-[24px] leading-[115%] tracking-[0%] text-[#111827] placeholder:text-[#858b9b] placeholder:font-extrabold placeholder:text-[24px] placeholder:leading-[115%] resize-none overflow-hidden"
              defaultValue={shape.cardTitle || ""}
              onBlur={(e) => {
                if (e.target.value !== shape.cardTitle) {
                  commit({ cardTitle: e.target.value });
                }
              }}
              onMouseDown={(e) => e.stopPropagation()}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = target.scrollHeight + "px";
              }}
            />
          </div>
          <div className="mb-6">
            {isEmpty ? (
              <div className="flex items-center">
                <button
                  onClick={() => {
                    setEditingBody(true);
                    setShowToolbar(true);
                  }}
                  className="text-black-600 underline hover:text-purple-800 text-sm font-medium transition-colors cursor-pointer"
                >
                  + add more details
                </button>
              </div>
            ) : (
              <RteEditor
                onBlur={() => {
                  setShowToolbar(false);
                  setEditingBody(false);
                  const contentState = editorState.getCurrentContent();
                  const hasText = contentState.hasText();
                  if (!hasText) {
                    setEditorState(EditorState.createEmpty());
                    commit({ draftRaw: undefined });
                  } else {
                    const raw = convertToRaw(contentState);
                    commit({ draftRaw: JSON.stringify(raw) });
                  }
                }}
                onFocus={() => {
                  setShowToolbar(true);
                  setEditingBody(true);
                }}
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
                  editingBody ? "bg-[#FFE5D6] rounded" : "bg-transparent"
                }`}
                wrapperClassName="rdw-editor-wrapper"
                placeholder="Type your text here..."
              />
            )}
          </div>

          {/* <div className="pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleCollapsed();
              }}
              data-nodrag="true"
              className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-gray-900 transition-colors"
            >
              <span className="flex items-center gap-2 font-manrope font-bold text-[#111827] text-[14px]">
                {collapsed
                  ? `Meta questions (${fiQuestions.length + 1})`
                  : `Meta questions (${fiQuestions.length + 1})`}
                <ChevronDown
                  className={`w-4 h-4 transition-transform text-[#80889D] ${
                    collapsed ? "-rotate-0" : "rotate-180"
                  }`}
                />
              </span>
            
            </button>

            {!collapsed && (
              <div
                ref={questionsRef}
                className="mt-4 p-4 rounded-lg  bg-[#FFE5D6]"
              >
                <h3 className="font-semibold text-sm text-gray-800 mb-3">
                  (1) Please pick from the Segments you've added. If you have
                  not added any on the Segments canvas yet, they will show up
                  here as empty for now.
                </h3>

                {firtQuestionsOrder.map(({ key, label }) => {
                  const segment = formattedSegments[key];

                  return (
                    <div key={key} className="mb-5">
                      <h3 className="font-semibold text-sm text-gray-800 mb-3">
                        {getTitle(key)}
                      </h3>
                      <div className="flex flex-col gap-2">
                        {segment?.map((item: any) => {
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

                            largeText = editor
                              .getCurrentContent()
                              .getPlainText();
                          }

                          // const largeText = editor
                          //   .getCurrentContent()
                          //   .getPlainText();

                          const text = `${item.cardTitle} ${largeText}`;
                          //const text = `${item.cardTitle}`;

                          if (text.trim().length === 0) return null;

                          return (
                            <div
                              className="flex items-center gap-3"
                              key={item.id}
                            >
                              <Checkbox
                                key={item.id}
                                checked={shape.segmentsTags?.includes(
                                  `${key}::${text}`
                                )}
                                className="bg-white border-gray-300"
                                onCheckedChange={(checked) => {
                                  updateCheckTags(`${key}::${text}`, !!checked);
                                }}
                              />
                              <Label className="text-sm text-gray-700">
                                {item.cardTitle && (
                                  <span className="font-bold">
                                    {item.cardTitle}
                                  </span>
                                )}
                                {trimTo50(largeText)}
                              </Label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {fiQuestions.map((q, idx) => (
                  <div className="flex flex-col mb-4" key={q.id}>
                    <div className="flex flex-col gap-4">
                      <h3 className="font-semibold text-sm text-gray-800">
                        {q.question}
                      </h3>

                      <div
                        data-nodrag="true"
                        onMouseDown={(e) => e.stopPropagation()}
                        className="w-full"
                      >
                        {q.question_type === "text-area" && (
                          <Textarea
                            value={tags[idx] ?? ""}
                            onChange={(e) => addTag(e.target.value, idx)}
                            className="border-[#B4B9C9] rounded-lg"
                          />
                        )}
                        {q.question_type === "dropdown" && (
                          <Select
                            value={tags[idx] ?? ""}
                            onValueChange={(value) => addTag(value, idx)}
                          >
                            <SelectTrigger className="w-full bg-white">
                              <SelectValue placeholder="Select an option" />
                            </SelectTrigger>
                            <SelectContent
                              onMouseDown={(e) => e.stopPropagation()}
                            >
                              {q.question_options!.map((option) => (
                                <SelectItem value={option} key={option}>
                                  {option}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                        {q.question_type === "slider" && (
                          <div className="flex flex-col gap-2 items-center">
                            <Slider
                              min={0}
                              max={10}
                              step={1}
                              defaultValue={[parseInt(tags[idx]) || 0]}
                              value={
                                parseInt(tags[idx])
                                  ? [parseInt(tags[idx])]
                                  : undefined
                              }
                              onValueCommit={(value) =>
                                addTag(value[0].toString(), idx)
                              }
                              onValueChange={(value) =>
                                addTag(value[0].toString(), idx)
                              }
                              className="w-full"
                            />
                            <span className="text-xs font-medium text-gray-700">
                              {parseInt(tags[idx]) || 0}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div> */}

          {/* Significance Score Display */}
          {/* {tags.length > 0 && (
            <div className="mt-4 flex flex-row gap-2 items-center">
              <span className="text-sm text-gray-600">Significance Score:</span>
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800 border border-orange-200"
                >
                  {t}
                </span>
              ))}
            </div>
          )} */}
        </div>
      </div>
    </div>
  );
};
