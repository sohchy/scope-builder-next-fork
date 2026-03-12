import Image from "next/image";

import { getExerciseResponse } from "@/services/exercises";
import {
  QuizQuestion,
  QuizResponseType,
  DynamicQuizCard,
  QuizResponse,
} from "../exercise-1/_components/DynamicQuizCard";

export default async function Exercise4Page() {
  const exerciseResponse = await getExerciseResponse(4);

  const quizData: QuizQuestion[] = [
    {
      id: 1,
      question: "What is the primary goal of customer discovery?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "To secure funding",
        B: "To gather data",
        C: "To build a prototype",
        D: "To identify competitors",
      },
      correctResponse: ["To gather data"],
    },
    {
      id: 2,
      question:
        "When should you start customer discovery in the product development process?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "After the product is built",
        B: "Before any product development",
        C: "During the alpha testing phase",
        D: "Once you have a minimum viable product (MVP)",
      },
      correctResponse: ["Before any product development"],
    },
    {
      id: 3,
      question: "What is a pivot in the context of customer discovery?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "A document summarizing customer feedback",
        B: "A sudden shift in your company's focus and strategy",
        C: "A customer discovery tool",
        D: "An agreement with potential customers",
      },
      correctResponse: ["A sudden shift in your company's focus and strategy"],
    },
    {
      id: 4,
      question:
        'During customer discovery, what is the role of the "problem-solution fit"?',
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "Identifying the right customers",
        B: "Validating customer segments",
        C: "Ensuring your solution addresses a real problem",
        D: "An agreement with potential customers",
      },
      correctResponse: [
        "Identifying the right customers",
        "Validating customer segments",
        "Ensuring your solution addresses a real problem",
        "An agreement with potential customers",
      ],
    },
    {
      id: 5,
      question:
        "Which of the following is NOT a common method for conducting customer discovery interviews?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "Online surveys",
        B: "Focus groups",
        C: "In-depth one-on-one interviews",
        D: "Observing customer behavior",
      },
      correctResponse: ["Online surveys"],
    },
    {
      id: 6,
      question:
        "What should be the attitude of an entrepreneur during customer discovery interviews?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "Convincing potential customers to buy the product",
        B: "Open and receptive to feedback and learning",
        C: "Defending their product idea",
        D: "Controlling the conversation and not letting the customer talk much",
      },
      correctResponse: ["Open and receptive to feedback and learning"],
    },
    {
      id: 7,
      question:
        "What is the key benefit of conducting customer discovery for a startup?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "To demonstrate technical prowess",
        B: "To impress competitors",
        C: "To reduce costs",
        D: "To mitigate the risk of building something nobody wants",
      },
      correctResponse: [
        "To mitigate the risk of building something nobody wants",
      ],
    },
    {
      id: 8,
      question:
        'What is the role of a "problem hypothesis" in customer discovery?',
      responseType: "multipleChoiceRadio",
      options: {
        A: "To state the solution to the customer's problem",
        B: "To outline the challenges in product development",
        C: "To articulate the problem you believe potential customers are facing",
        D: "To estimate the cost of the product",
      },
      correctResponse: [
        "To articulate the problem you believe potential customers are facing",
      ],
    },
    {
      id: 9,
      question:
        "What should a startup aim to achieve through customer discovery before moving forward with product development?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "To secure a patent for their idea",
        B: "To convince investors to fund the company",
        C: 'To achieve "product-market fit"',
        D: "To complete a detailed business plan",
      },
      correctResponse: ['To achieve "product-market fit"'],
    },
    {
      id: 10,
      question:
        "How often should a startup revisit and continue customer discovery after an initial round of interviews?",
      responseType: "multipleChoiceRadio",
      options: {
        A: "Only when the product is near completion",
        B: "Periodically, throughout the product's lifecycle",
        C: "Only when encountering problems during product development",
        D: "Once at the beginning and once at the end of development",
      },
      correctResponse: ["Periodically, throughout the product's lifecycle"],
    },
  ];

  return (
    <div className="p-8 w-full h-full grid grid-cols-4 gap-4">
      <div className="col-start-2 col-end-4">
        <DynamicQuizCard
          quizData={quizData}
          excerciseNumber={4}
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
