import Image from "next/image";

// import { QuizCard, QuizResponse } from "./_components/QuizCard";
import {
  QuizQuestion,
  QuizResponse,
  DynamicQuizCard,
  QuizResponseType,
} from "./_components/DynamicQuizCard";
import { getExerciseResponse } from "@/services/exercises";

export default async function Exercise1Page() {
  const exerciseResponse = await getExerciseResponse(1);

  const quizData: QuizQuestion[] = [
    {
      id: 1,
      question: "What is a value proposition?",
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "Technical specification of a product",
        B: "Statement of the unique benefits a product or service provides to the customer",
        C: "Pricing strategy for a product",
        D: "List of competitors in the market",
      },
      correctResponse: [
        "Statement of the unique benefits a product or service provides to the customer",
      ],
    },
    {
      id: 2,
      question:
        "Which of the following best describes the primary focus of a value proposition?",
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "The features of a product",
        B: "The emotions of the customer",
        C: "The unique benefits a product offers",
        D: "The cost of production",
      },
      correctResponse: ["The unique benefits a product offers"],
    },
    {
      id: 3,
      question: "Why is it important to have a strong value proposition?",
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "It helps with product manufacturing",
        B: "It attracts venture capital funding",
        C: "It communicates the product's unique value to customers",
        D: "It increases the number of employees in a company",
      },
      correctResponse: [
        "It communicates the product's unique value to customers",
      ],
    },
    {
      id: 4,
      question:
        "Which of the following is NOT a typical component of a value proposition?",
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "Customer testimonials",
        B: "A description of the problem the product solves",
        C: "A statement of the product's unique selling points",
        D: "A list of technical specifications",
      },
      correctResponse: ["A list of technical specifications"],
    },
    {
      id: 5,
      question:
        "When crafting a value proposition, who is the primary audience in mind?",
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "Competitors",
        B: "Investors",
        C: "Employees",
        D: "Customers",
      },
      correctResponse: ["Customers"],
    },
    {
      id: 6,
      question:
        "Which statement best reflects the relationship between features and value propositions?",
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "Features and value propositions are the same thing",
        B: "Features explain how a product works, while a value proposition explains why a customer should choose it",
        C: "Features are more important than value propositions in marketing",
        D: "Value propositions are specific to product development, while features are for marketing",
      },
      correctResponse: [
        "Features explain how a product works, while a value proposition explains why a customer should choose it",
      ],
    },
    {
      id: 7,
      question:
        "When developing a value proposition, what is the primary goal?",
      responseType: "multipleChoiceCheckbox",
      options: {
        A: "To be more cost-effective than competitors",
        B: "To list as many product features as possible",
        C: "To communicate the product's unique value to customers",
        D: "To maintain the same value proposition throughout the product's lifecycle",
      },
      correctResponse: [
        "To communicate the product's unique value to customers",
      ],
    },
  ];

  return (
    <div className="p-8 w-full h-full grid grid-cols-4 gap-4">
      {/* <div className="col-span-2">
        <ContentCard />
      </div> */}
      {/* <div className="col-span-1"> */}
      <div className="col-start-2 col-end-4">
        <DynamicQuizCard
          excerciseNumber={1}
          quizData={quizData}
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
