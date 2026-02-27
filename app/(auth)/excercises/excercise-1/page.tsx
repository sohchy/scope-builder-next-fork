import Image from "next/image";

// import { QuizCard, QuizResponse } from "./_components/QuizCard";
import {
  QuizQuestion,
  QuizResponse,
  DynamicQuizCard,
  QuizResponseType,
} from "./_components/DynamicQuizCard";
import { getExcerciseResponse } from "@/services/excercises";

export default async function Excercise1Page() {
  const excerciseResponse = await getExcerciseResponse(1);

  const quizData: QuizQuestion[] = [
    {
      id: 1,
      question:
        "Why should entrepreneurs avoid pitching their idea during customer discovery interviews?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "Because customers dislike hearing about new ideas",
        B: "Because the goal is to listen and learn from customers, not to sell",
      },
      correctResponse: [
        "Because the goal is to listen and learn from customers, not to sell",
      ],
    },
    {
      id: 2,
      question:
        "A value proposition should always be customer-centric and focus solely on the customer's needs and desires.",
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
        "What is the main goal of customer discovery according to the text?",
      responseType: "text",
    },
    {
      id: 4,
      question:
        "Which of the following statements are true about customer discovery? (Select all that apply)",
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "It helps identify real customer problems",
        B: "Customer support equals willingness to pay",
        C: "Interviewing customers is a key method",
      },
      correctResponse: [
        "It helps identify real customer problems",
        "Interviewing customers is a key method",
      ],
    },
  ];

  return (
    <div className="p-8 w-full h-full grid grid-cols-3 gap-4">
      <div className="col-span-2">
        <ContentCard />
      </div>
      <div className="col-span-1">
        <DynamicQuizCard
          quizData={quizData}
          responses={excerciseResponse?.responses as QuizResponse}
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
            alt="Excercise 1"
            src={"/excercise1.png"}
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
