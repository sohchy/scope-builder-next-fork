"use client";

import { useState } from "react";
import { BadgeQuestionMarkIcon, HourglassIcon, StarIcon } from "lucide-react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createExcerciseResponse } from "@/services/excercises";
import { toast } from "sonner";

export type QuizResponse = {
  ["question-1"]: string;
  ["question-2"]: string;
  ["question-3"]: string[];
};

interface QuizCardProps {
  responses?: QuizResponse;
}

const QUESTION_1_ANSWER = "Because customers dislike hearing about new ideas";
const QUESTION_3_ANSWER = ["Interviewing customers is a key method"];

export const QuizCard = ({ responses }: QuizCardProps) => {
  const [quizResponses, setQuizResponses] = useState<QuizResponse>({
    "question-1": responses?.["question-1"] || "",
    "question-2": responses?.["question-2"] || "",
    "question-3": responses?.["question-3"] || [],
  });

  const onSubmit = async () => {
    try {
      await createExcerciseResponse(1, quizResponses);
      toast.success("Quiz submitted successfully!");
    } catch (error) {
      toast.error("Failed to submit the quiz. Please try again.");
    }
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
        {/* Question */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold">
            <span className="text-[#6A35FF]">1. </span>
            Why should entrepreneurs avoid pitching their idea during customer
            discovery interviews?
          </h3>

          <RadioGroup
            id="question-1"
            disabled={isSubmitted}
            className="flex flex-col gap-2"
            value={quizResponses["question-1"]}
            onValueChange={(value) =>
              setQuizResponses((prev) => ({ ...prev, "question-1": value }))
            }
          >
            <div
              className={`flex items-center gap-3 p-2.5 ${isSubmitted ? "bg-[#E8F7EC] text-[#0A7347] rounded-[8px]" : ""}`}
            >
              <RadioGroupItem
                value="Because customers dislike hearing about new ideas"
                id="question1-option1"
              />
              <Label>Because customers dislike hearing about new ideas</Label>
            </div>

            <div
              className={`flex items-center gap-3 p-2.5 ${isSubmitted && quizResponses["question-1"] !== QUESTION_1_ANSWER ? "bg-[#FEEAEA] text-[#9B1C1C] rounded-[8px]" : ""}`}
            >
              <RadioGroupItem
                value="Because the goal is to listen and learn from customers, not to sell"
                id="question1-option2"
              />
              <Label>
                Because the goal is to listen and learn from customers, not to
                sell
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Question */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold">
            <span className="text-[#6A35FF]">2. </span>
            What is the main goal of customer discovery according to the text?
          </h3>

          <Textarea
            id="question2"
            disabled={isSubmitted}
            onChange={(e) =>
              setQuizResponses((prev) => ({
                ...prev,
                "question-2": e.target.value,
              }))
            }
            value={quizResponses["question-2"]}
          />
        </div>

        {/* Question */}
        <div className="flex flex-col gap-5">
          <h3 className="text-sm font-bold">
            <span className="text-[#6A35FF]">3. </span>
            Which of the following statements are true about customer discovery?
            (Select all that apply)
          </h3>

          <div className="flex flex-col gap-2">
            <div
              className={`flex items-center gap-3 p-2.5 ${isSubmitted && quizResponses["question-3"].includes("It helps identify real customer problems") && !QUESTION_3_ANSWER.some((answer) => !quizResponses["question-3"].includes(answer)) ? "bg-[#FEEAEA] text-[#9B1C1C] rounded-[8px]" : ""}`}
            >
              <Checkbox
                id="question3-option1"
                disabled={isSubmitted}
                value={"It helps identify real customer problems"}
                checked={quizResponses["question-3"].includes(
                  "It helps identify real customer problems",
                )}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setQuizResponses((prev) => ({
                      ...prev,
                      "question-3": [
                        ...prev["question-3"],
                        "It helps identify real customer problems",
                      ],
                    }));
                  } else {
                    setQuizResponses((prev) => ({
                      ...prev,
                      "question-3": prev["question-3"].filter(
                        (item) =>
                          item !== "It helps identify real customer problems",
                      ),
                    }));
                  }
                }}
              />
              <Label>It helps identify real customer problems</Label>
            </div>

            <div
              className={`flex items-center gap-3 p-2.5 ${isSubmitted && quizResponses["question-3"].includes("Customer support equals willingness to pay") && !QUESTION_3_ANSWER.some((answer) => !quizResponses["question-3"].includes(answer)) ? "bg-[#FEEAEA] text-[#9B1C1C] rounded-[8px]" : ""}`}
            >
              <Checkbox
                id="question3-option2"
                disabled={isSubmitted}
                checked={quizResponses["question-3"].includes(
                  "Customer support equals willingness to pay",
                )}
                value={"Customer support equals willingness to pay"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setQuizResponses((prev) => ({
                      ...prev,
                      "question-3": [
                        ...prev["question-3"],
                        "Customer support equals willingness to pay",
                      ],
                    }));
                  } else {
                    setQuizResponses((prev) => ({
                      ...prev,
                      "question-3": prev["question-3"].filter(
                        (item) =>
                          item !== "Customer support equals willingness to pay",
                      ),
                    }));
                  }
                }}
              />
              <Label>Customer support equals willingness to pay</Label>
            </div>

            <div
              className={`flex items-center gap-3 p-2.5 ${isSubmitted ? "bg-[#E8F7EC] text-[#0A7347] rounded-[8px]" : ""}`}
            >
              <Checkbox
                id="question3-option3"
                disabled={isSubmitted}
                checked={quizResponses["question-3"].includes(
                  "Interviewing customers is a key method",
                )}
                value={"Interviewing customers is a key method"}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setQuizResponses((prev) => ({
                      ...prev,
                      "question-3": [
                        ...prev["question-3"],
                        "Interviewing customers is a key method",
                      ],
                    }));
                  } else {
                    setQuizResponses((prev) => ({
                      ...prev,
                      "question-3": prev["question-3"].filter(
                        (item) =>
                          item !== "Interviewing customers is a key method",
                      ),
                    }));
                  }
                }}
              />
              <Label>Interviewing customers is a key method</Label>
            </div>
          </div>
        </div>

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
