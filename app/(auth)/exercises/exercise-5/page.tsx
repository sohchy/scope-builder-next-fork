import Image from "next/image";

import { getExerciseResponse } from "@/services/exercises";
import {
  QuizQuestion,
  QuizResponseType,
  DynamicQuizCard,
  QuizResponse,
} from "../exercise-1/_components/DynamicQuizCard";

export default async function Exercise5Page() {
  const exerciseResponse = await getExerciseResponse(5);

  const quizData: QuizQuestion[] = [
    {
      id: 1,
      question:
        "An ecosystem map is simply a list of all the people and organizations that have a stake in your innovation.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["False"],
    },
    {
      id: 2,
      question:
        "It is important to understand the decision processes of your stakeholders.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["True"],
    },
    {
      id: 3,
      question:
        "You can use an ecosystem map to identify potential partners and customers.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["True"],
    },
    {
      id: 4,
      question:
        "An ecosystem map is a static document that should never be updated.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["False"],
    },
    {
      id: 5,
      question:
        "Stakeholder mapping is an ongoing process that should be regularly updated to reflect changes in the business environment.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["True"],
    },
    {
      id: 6,
      question:
        "Primary stakeholders are not defined solely by financial interest; they are typically those who have a direct interest in the organization's activities and are directly affected by its actions.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["True"],
    },
    {
      id: 7,
      question:
        "Ecosystem mapping is just about identifying competitors and threats.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["False"],
    },
    {
      id: 8,
      question:
        "Stakeholder mapping is relevant to organizations of all sizes, including small businesses and startups.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["True"],
    },
    {
      id: 9,
      question:
        "All customers are stakeholders, but not all stakeholders are customers.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["True"],
    },
    {
      id: 10,
      question:
        "A stakeholder/customer ecosystem map can reveal hidden opportunities for collaboration and innovation.",
      responseType: "trueFalse",
      options: {
        T: "True",
        F: "False",
      },
      correctResponse: ["True"],
    },
  ];

  return (
    <div className="p-8 w-full h-full grid grid-cols-4 gap-4">
      <div className="col-start-2 col-end-4">
        <DynamicQuizCard
          quizData={quizData}
          excerciseNumber={5}
          responses={exerciseResponse?.responses as QuizResponse}
        />
      </div>
    </div>
  );
}

const ContentCard = () => {
  return (
    <div className="h-full border-2 border-white rounded-2xl flex flex-col">
      {/* Header */}
      <div className="py-6 px-12 bg-[#6A35FF] border border-white rounded-tl-2xl rounded-tr-2xl">
        <h1 className="text-white text-2xl font-extrabold">
          3 Tips to Improve Your Customer Discovery
        </h1>
      </div>

      {/* Content*/}
      <div className="bg-white py-6 px-12 rounded-bl-2xl rounded-br-2xl flex-1 flex flex-col gap-4">
        <div className="flex flex-row items-center gap-7">
          <Image
            width={318}
            height={264}
            alt="Exercise 1"
            src={"/exercise1.png"}
          />
          <p className="text-sm">
            When talking to your customers, it can be extremely tempting to
            pitch your business idea. However, it is important to listen and
            learn from your customer; not the other way around. People will
            generally be supportive of your idea. This could be{" "}
            <span className="bg-[#E8F7EC] font-semibold">
              misinterpreted as them confirming{" "}
            </span>
            that they would pay for your product or service.{" "}
            <span className="bg-[#E8F7EC] font-semibold">
              Being supportive of your idea and being willing to pay for it are
              two very different things
            </span>
            . The goal of customer discovery is to learn, not pitch your idea.
            There will be plenty of opportunities to pitch your ideas. Customer
            discovery is not it.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          <h3 className="flex items-center flex-row gap-4 font-extrabold">
            <div className="w-[32px] h-[32px] rounded-full bg-[#6435ff] flex items-center justify-center text-white ">
              2
            </div>
            Learn about your customer - don't pitch your business idea
          </h3>

          <p className="text-sm">
            When talking to your customers, it can be extremely tempting to
            pitch your business idea. However, it is important to listen and
            learn from your customer; not the other way around. People will
            generally be supportive of your idea. This could be misinterpreted
            as them confirming that they would pay for your product or service.
            Being supportive of your idea and being willing to pay for it are
            two very different things.{" "}
            <span className="bg-[#E8F7EC] ">
              The goal of customer discovery is to learn, not pitch your idea.
              There will be plenty of opportunities to pitch your ideas{" "}
            </span>
            . Customer discovery is not it.
            <br />
            <br />
            When talking to your customers, it can be extremely tempting to
            pitch your business idea. However, it is important to listen and
            learn from your customer; not the other way around. People will
            generally be supportive of your idea. This could be misinterpreted
            as them confirming that they would pay for your product or service.
            Being supportive of your idea and being willing to pay for it are
            two very different things. The goal of customer discovery is to
            learn, not pitch your idea. There will be plenty of opportunities to
            pitch your ideas. Customer discovery is not it.
            <br />
            <br />
            When talking to your customers, it can be extremely tempting to
            pitch your business idea. However, it is important to listen and
            learn from your customer; not the other way around. People will
            generally be supportive of your idea. This could be misinterpreted
            as them confirming that they would pay for your product or service.
            Being supportive of your idea and being willing to pay for it are
            two very different things. The goal of customer discovery is to
            learn, not pitch your idea. There will be plenty of opportunities to
            pitch your ideas. Customer discovery is not it.
          </p>
        </div>
      </div>
    </div>
  );
};
