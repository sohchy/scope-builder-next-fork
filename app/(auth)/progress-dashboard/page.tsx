import { getTopicProgress, getTopics } from "@/services/topics";
import Topic from "./_components/Topic";

/*
Task Table  
  task_id
  topic_id
  type
  subtype
  order

Topics Table
  topic_id
  name
  description
  topic_type
  deadline
  order

TopicProgress Table
  org_id
  task_id optional
  topic_id optional
  completed
*/

export default async function ProgressDashboardPage() {
  const topics = await getTopics();
  const topicProgress = await getTopicProgress();

  const topicWithProgress = topics.map((topic) => {
    const progress = topicProgress.find((tp) => tp.topic_id === topic.id);
    const isCompleted = !!progress?.completed;

    return {
      id: topic.id,
      name: topic.name,
      type: topic.type,
      deadline: topic.deadline,
      description: topic.description,
      isDone: isCompleted,
      concept_tasks: topic.topic_tasks
        .filter((t) => t.type === "concept")
        .map((t) => {
          const taskProgress = topicProgress.find((tp) => tp.task_id === t.id);
          return {
            id: t.id,
            subtype: t.subtype,
            completed: !!taskProgress?.completed,
          };
        }),
      excercises_tasks: topic.topic_tasks
        .filter((t) => t.type === "exercise")
        .map((t) => {
          const taskProgress = topicProgress.find((tp) => tp.task_id === t.id);
          return {
            id: t.id,
            subtype: t.subtype,
            completed: !!taskProgress?.completed,
          };
        }),
      startup_tasks: topic.topic_tasks
        .filter((t) => t.type === "startup")
        .map((t) => {
          const taskProgress = topicProgress.find((tp) => tp.task_id === t.id);
          return {
            id: t.id,
            subtype: t.subtype,
            completed: !!taskProgress?.completed,
          };
        }),
    };
  });

  return (
    <div className="p-8 h-full bg-[#F0F1F5] flex justify-center">
      <div className="flex flex-col gap-5 max-w-[1182px] h-full">
        <div className="grid grid-cols-7 pr-8 gap-8">
          <h1 className="text-[#111827]  text-2xl font-semibold col-span-2"></h1>
          <div className="grid grid-cols-3 h-[34px] col-span-5 bg-[#2E3545] text-white text-sm font-semibold border border-[#EFF0F4] rounded-[4px]">
            <div className="border-r border-[#F0F1F5] flex items-center px-4">
              Concept
            </div>
            <div className="border-r border-[#F0F1F5] flex items-center px-4">
              Practice exercises
            </div>
            <div className="border-r border-[#F0F1F5] flex items-center px-4  ">
              My startup
            </div>
          </div>
        </div>

        <div className="bg-white px-3.5 py-8 rounded-2xl w-full flex-1">
          {topicWithProgress.map((topic) => (
            <Topic key={topic.id} topic={topic} />
          ))}
        </div>
      </div>
    </div>
  );
}
