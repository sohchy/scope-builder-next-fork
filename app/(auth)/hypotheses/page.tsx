import { getHypothesis, getInterviewResponses } from "@/services/hypothesis";
import HypothesesCard from "./_components/HypothesesCard";
import CreateHypothesisButton from "./_components/CreateHypothesisButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import HypothesesList from "./_components/HypothesesList";

export default async function HypothesesPage() {
  const hypotheses = await getHypothesis();
  const interviewResponses = await getInterviewResponses();

  const interviewResponsesData = interviewResponses.map((response) => ({
    id: response.id,
    questionId: response.question_id,
    content: response.response_content,
    interviewee: response.participant.name,
    hypothesysId: response.question.hypothesis_id,
  }));

  const hypothesesData = hypotheses.map((hypothesis) => ({
    id: hypothesis.id,
    type: hypothesis.type,
    title: hypothesis.title,
    order: hypothesis.order,
    priority: hypothesis.priority,
    description: hypothesis.description,
    interviews: interviewResponsesData
      .filter((response) => response.hypothesysId === hypothesis.id)
      .map((response) => response.interviewee),
    questions: hypothesis.questions.map((question) => ({
      id: question.id,
      title: question.title,
      responses: interviewResponsesData
        .filter((response) => response.questionId === question.id)
        .map((response) => response),
    })),
    conclusion_content: hypothesis.conclusion_content,
    conclusion_status: hypothesis.conclusion_status,
  }));

  const hypothesesExampleData = [
    {
      id: 1,
      order: 0,
      title: "This is an example hypothesis",
      priority: 1,
      description:
        "This is an example description for the hypothesis. It should give more details about the hypothesis and what it entails.",
      interviews: ["John Doe", "Jane Smith"],
      questions: [
        {
          id: 1,
          title: "What do you think about this hypothesis?",
          responses: [
            {
              id: 1,
              questionId: 1,
              content: "I think it's a great hypothesis!",
              interviewee: "John Doe",
              hypothesysId: 1,
            },
          ],
        },
      ],
      conclusion_content:
        "This is an example conclusion for the hypothesis. It should summarize the findings from the interviews and whether the hypothesis was validated or not.",
      conclusion_status: "Validated",
    },
    {
      id: 2,
      order: 1,
      title: "This is an another example hypothesis",
      priority: 0,
      description:
        "This is an example description for the hypothesis. It should give more details about the hypothesis and what it entails.",
      interviews: ["John Doe", "Jane Smith"],
      questions: [],
      conclusion_content:
        "This is an example conclusion for the hypothesis. It should summarize the findings from the interviews and whether the hypothesis was validated or not.",
      conclusion_status: "Testing",
    },
  ];

  const getMaxOrder = () => {
    if (hypothesesData.length === 0) return 0;
    return Math.max(...hypothesesData.map((hypothesis) => hypothesis.order));
  };

  return (
    <div className="flex flex-col p-4 gap-4 ">
      <Tabs defaultValue="hypothesis" className="h-full">
        <TabsList>
          <TabsTrigger value="hypothesis">Hypothesis</TabsTrigger>
          <TabsTrigger value="examples">Examples</TabsTrigger>
        </TabsList>
        <TabsContent value="hypothesis" className="h-full flex flex-col gap-4">
          <CreateHypothesisButton maxOrder={getMaxOrder()} />
          {/* <div className="flex flex-col gap-4">
            {hypothesesData.map((hypothesis) => (
              <HypothesesCard key={hypothesis.id} hypothesis={hypothesis} />
            ))}
          </div> */}
          <HypothesesList hypotheses={hypothesesData} />
        </TabsContent>

        <TabsContent value="examples" className="h-full flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {hypothesesExampleData.map((hypothesis) => (
              <HypothesesCard
                example
                key={hypothesis.id}
                hypothesis={hypothesis}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
