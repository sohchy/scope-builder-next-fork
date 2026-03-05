"use client";

import { toast } from "sonner";
import { useMemo, useState } from "react";
import { BadgeQuestionMarkIcon, HourglassIcon, StarIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createExerciseResponse } from "@/services/exercises";

export type QuizResponseType =
  | "trueFalse"
  | "multipleChoiceCheckbox"
  | "multipleChoiceRadio"
  | "text";

type QuizAnswerValue = string | string[];

export type QuizResponse = Record<string, QuizAnswerValue>;

interface IndividualQuizData {
  id: number;
  options: {};
  question: string;
  correctResponse: string[];
  responseType: QuizResponseType;
}

interface BaseQuizQuestion {
  id: number;
  question: string;
  responseType: QuizResponseType;
}

interface OptionsQuizQuestion extends BaseQuizQuestion {
  options: Record<string, string>;
  correctResponse?: string[];
}

interface TextQuizQuestion extends BaseQuizQuestion {
  responseType: "text";
  options?: never;
  correctResponse?: undefined;
}

export type QuizQuestion = OptionsQuizQuestion | TextQuizQuestion;

interface QuizCardProps {
  quizData: QuizQuestion[];
  responses?: QuizResponse;
}

// const quizData: QuizQuestion[] = [
//   {
//     id: 1,
//     question:
//       "Why should entrepreneurs avoid pitching their idea during customer discovery interviews?",
//     responseType: QuizResponseType.MULTIPLE_CHOICE_RADIO,
//     options: {
//       A: "Because customers dislike hearing about new ideas",
//       B: "Because the goal is to listen and learn from customers, not to sell",
//     },
//     correctResponse: [
//       "Because the goal is to listen and learn from customers, not to sell",
//     ],
//   },
//   {
//     id: 2,
//     question:
//       "A value proposition should always be customer-centric and focus solely on the customer's needs and desires.",
//     responseType: QuizResponseType.TRUE_FALSE,
//     options: {
//       T: "True",
//       F: "False",
//     },
//     correctResponse: ["True"],
//   },
//   {
//     id: 3,
//     question:
//       "What is the main goal of customer discovery according to the text?",
//     responseType: QuizResponseType.TEXT,
//   },
//   {
//     id: 4,
//     question:
//       "Which of the following statements are true about customer discovery? (Select all that apply)",
//     responseType: QuizResponseType.MULTIPLE_CHOICE_CHECKBOX,
//     options: {
//       A: "It helps identify real customer problems",
//       B: "Customer support equals willingness to pay",
//       C: "Interviewing customers is a key method",
//     },
//     correctResponse: [
//       "It helps identify real customer problems",
//       "Interviewing customers is a key method",
//     ],
//   },
// ];

const makeKeyForIndex = (index: number) => `question-${index + 1}`;

export const DynamicQuizCard = ({ responses, quizData }: QuizCardProps) => {
  const initialState: QuizResponse = useMemo(() => {
    const state: QuizResponse = {};

    quizData.forEach((question, index) => {
      const key = makeKeyForIndex(index);
      const prevValue = responses?.[key];

      if (question.responseType === "multipleChoiceCheckbox") {
        // ensure it's always an array
        state[key] = Array.isArray(prevValue) ? prevValue : [];
      } else {
        // radio, true/false, text -> ensure it's a string
        state[key] = typeof prevValue === "string" ? prevValue : "";
      }
    });

    return state;
  }, [quizData, responses]);

  const [quizResponses, setQuizResponses] =
    useState<QuizResponse>(initialState);

  const onSubmit = async () => {
    try {
      await createExerciseResponse(1, quizResponses);
      toast.success("Quiz submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit the quiz. Please try again.");
    }
  };

  const setAnswer = (key: string, value: QuizAnswerValue) => {
    setQuizResponses((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const toggleCheckboxAnswer = (
    key: string,
    optionValue: string,
    checked: boolean,
  ) => {
    setQuizResponses((prev) => {
      const current = Array.isArray(prev[key]) ? (prev[key] as string[]) : [];

      if (checked) {
        if (current.includes(optionValue)) return prev;
        return { ...prev, [key]: [...current, optionValue] };
      }

      return {
        ...prev,
        [key]: current.filter((v) => v !== optionValue),
      };
    });
  };

  const isOptionSelected = (key: string, optionValue: string): boolean => {
    const answer = quizResponses[key];

    if (Array.isArray(answer)) {
      return answer.includes(optionValue);
    }

    return answer === optionValue;
  };

  const isOptionCorrect = (question: QuizQuestion, optionValue: string) => {
    if (!("correctResponse" in question) || !question.correctResponse)
      return false;
    return question.correctResponse.includes(optionValue);
  };

  const getOptionClassName = (
    question: QuizQuestion,
    key: string,
    optionValue: string,
  ) => {
    if (!isSubmitted) return "";

    const selected = isOptionSelected(key, optionValue);
    const correct = isOptionCorrect(question, optionValue);

    if (correct) {
      return "bg-[#E8F7EC] text-[#0A7347] rounded-[8px]";
    }
    if (selected && !correct) {
      return "bg-[#FEEAEA] text-[#9B1C1C] rounded-[8px]";
    }
    return "";
  };

  const isSubmitted = Boolean(responses);

  return (
    <div className="h-full rounded-2xl flex flex-col bg-white">
      {/* Header */}
      <div className="py-6 px-8 border-b border-[#E4E5ED]">
        <h1 className="flex items-center flex-row text-xl font-semibold gap-2.5">
          <div className="w-[30px] h-[30px] bg-[#F4F0FF] rounded-full flex items-center justify-center">
            <BadgeQuestionMarkIcon className="text-[#6A35FF]" size={20} />
          </div>
          <div className="flex flex-row items-center justify-between w-full">
            <div>Quiz</div>
            <div className="flex flex-row gap-6">
              <span className="text-[#697288] text-sm flex flex-row items-center gap-1.5">
                {/* <StarIcon size={16} className="text-[#03BB6E] fill-[#D1E9D7]" /> */}
                <SplitStar filled={0.6} />
                <span>4.5</span>
              </span>
              <span className="flex flex-row items-center text-[#697288] text-sm gap-1.5">
                <HourglassIcon size={16} />
                15 min
              </span>
            </div>
          </div>
        </h1>
      </div>

      {/* Content*/}
      <div className="py-6 px-8 flex flex-col gap-8 h-full">
        {quizData.map((question, index) => {
          const questionNumber = index + 1;
          const key = makeKeyForIndex(index);
          const currentAnswer = quizResponses[key];

          console.log("question", question);

          // TEXT question
          if (question.responseType === "text") {
            return (
              <div className="flex flex-col gap-5" key={question.id}>
                <h3 className="text-sm font-bold">
                  <span className="text-[#6A35FF]">{questionNumber}. </span>
                  {question.question}
                </h3>

                <Textarea
                  id={key}
                  disabled={isSubmitted}
                  value={(currentAnswer as string) ?? ""}
                  onChange={(e) => setAnswer(key, e.target.value)}
                />
              </div>
            );
          }

          // RADIO / TRUE_FALSE question
          if (
            question.responseType === "multipleChoiceRadio" ||
            question.responseType === "trueFalse"
          ) {
            const options = (question as any).options as Record<string, string>;

            return (
              <div className="flex flex-col gap-5" key={question.id}>
                <h3 className="text-sm font-bold">
                  <span className="text-[#6A35FF]">{questionNumber}. </span>
                  {question.question}
                </h3>

                <RadioGroup
                  id={key}
                  disabled={isSubmitted}
                  className="flex flex-col gap-2"
                  value={(currentAnswer as string) ?? ""}
                  onValueChange={(value) => setAnswer(key, value)}
                >
                  {Object.values(options).map((optionText) => {
                    const optionId = `${key}-${optionText}`;

                    return (
                      <div
                        key={optionId}
                        className={`flex items-center gap-3 p-2.5 ${getOptionClassName(
                          question,
                          key,
                          optionText,
                        )}`}
                      >
                        <RadioGroupItem value={optionText} id={optionId} />
                        <Label>{optionText}</Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </div>
            );
          }

          // CHECKBOX question
          if (question.responseType === "multipleChoiceCheckbox") {
            const options = (question as any).options as Record<string, string>;
            const answerArray = Array.isArray(currentAnswer)
              ? (currentAnswer as string[])
              : [];

            return (
              <div className="flex flex-col gap-5" key={question.id}>
                <h3 className="text-sm font-bold">
                  <span className="text-[#6A35FF]">{questionNumber}. </span>
                  {question.question}
                </h3>

                <div className="flex flex-col gap-2">
                  {Object.values(options).map((optionText) => {
                    const optionId = `${key}-${optionText}`;
                    const checked = answerArray.includes(optionText);

                    return (
                      <div
                        key={optionId}
                        className={`flex items-center gap-3 p-2.5 ${getOptionClassName(
                          question,
                          key,
                          optionText,
                        )}`}
                      >
                        <Checkbox
                          id={optionId}
                          disabled={isSubmitted}
                          checked={checked}
                          value={optionText}
                          onCheckedChange={(checkedVal) =>
                            toggleCheckboxAnswer(key, optionText, !!checkedVal)
                          }
                        />
                        <Label>{optionText}</Label>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return null;
        })}

        <Button
          onClick={onSubmit}
          disabled={isSubmitted}
          className="bg-[#6A35FF] hover:bg-[#6133e0] text-white mt-auto cursor-pointer"
        >
          Submit Quiz
        </Button>
      </div>
    </div>
  );
};

type SplitStarProps = {
  filled?: number;
};

const SplitStar = ({ filled = 0.5 }: SplitStarProps) => {
  const clamped = Math.max(0, Math.min(1, filled));
  const rightClip = (1 - clamped) * 100; // percentage to hide from the right

  return (
    <div className="relative inline-flex w-5 h-5">
      {/* Background star (light green) */}
      <StarIcon
        size={16}
        className="w-full h-full"
        fill="#D1E9D7" // light green
        strokeWidth={0} // remove stroke so it's just fill
      />

      {/* Foreground star (dark green, clipped) */}
      <StarIcon
        size={16}
        className="w-full h-full absolute inset-0"
        fill="#03BB6E" // darker green
        strokeWidth={0}
        style={{
          // inset: top right bottom left
          // we hide some of the right side so it “fills” from left to right
          clipPath: `inset(0 ${rightClip}% 0 0)`,
        }}
      />
    </div>
  );
};
