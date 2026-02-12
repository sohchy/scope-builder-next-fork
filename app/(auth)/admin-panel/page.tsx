import { getTopics, getTopicTasks } from "@/services/topics";
import TopicsTable from "./_components/TopicsTable";
import TopicTasksTable from "./_components/TopicTasksTable";

export default async function AdminPanelPage() {
  const topics = await getTopics();
  const topicTasks = await getTopicTasks();

  const topicTasksWithTopicName = topicTasks.map((task) => ({
    ...task,
    topic_name: task.topic.name,
  }));

  return (
    <div className="p-8 h-full flex flex-col gap-3">
      <TopicsTable data={topics} />
      <TopicTasksTable data={topicTasksWithTopicName} topics={topics} />
    </div>
  );
}
