import { v4 as uuidv4 } from "uuid";
import { redirect } from "next/navigation";

import {
  Todo as ITodo,
  Task,
  TaskList,
  TaskSectionTitle,
  TodoType,
} from "@/lib/generated/prisma";
import {
  getCompletedTasks,
  getTasks,
  TaskWithListAndSection,
} from "@/services/tasks";

import { StepClip } from "@/components/Stepper";
import { Progress } from "@/components/ui/progress";
import { CheckIcon, CircleCheckIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TaskCard from "../_components/Task";

type GroupedTasks = Array<{
  task_list: TaskList;
  sections: Array<{
    section_title: TaskSectionTitle;
    tasks: TaskWithListAndSection[];
  }>;
}>;

export default async function Todos({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tasks = await getTasks();
  const completedTasks = await getCompletedTasks();
  const groupedTasks = groupTasksByListAndSection(tasks || []);

  const stepsWithMeta = groupedTasks.map((taskList) => {
    const totalTasks = taskList.sections.reduce(
      (sum, section) => sum + section.tasks.length,
      0,
    );

    const completedTasksCount = taskList.sections.reduce((sum, section) => {
      const completedInSection = section.tasks.filter((task) =>
        completedTasks.some((ct) => ct.task_id === task.id && ct.completed),
      ).length;
      return sum + completedInSection;
    }, 0);

    // If you prefer that "no tasks" means "not completed", keep this as is
    const isCompleted = totalTasks > 0 && completedTasksCount === totalTasks;

    return {
      ...taskList,
      totalTasks,
      completedTasksCount,
      isCompleted,
    };
  });

  // 👉 2) Decide which step is active
  let activeStepIndex = stepsWithMeta.findIndex((step) => !step.isCompleted);

  if (activeStepIndex === -1) {
    // All steps completed → keep the last one active
    activeStepIndex = stepsWithMeta.length > 0 ? stepsWithMeta.length - 1 : -1;
  }

  return (
    <div className="flex flex-row p-10 gap-3 w-full pb-20">
      {stepsWithMeta.map((taskList, index) => {
        // const totalTasks = taskList.sections.reduce(
        //   (sum, section) => sum + section.tasks.length,
        //   0
        // );
        // const completedTasksCount = taskList.sections.reduce((sum, section) => {
        //   const completedInSection = section.tasks.filter((task) =>
        //     completedTasks.some((ct) => ct.task_id === task.id && ct.completed)
        //   ).length;
        //   return sum + completedInSection;
        // }, 0);

        // const currentStep = 1;
        // const isCompleted = totalTasks === completedTasksCount;
        // const isActive = currentStep === index;
        const { totalTasks, completedTasksCount, isCompleted } = taskList;
        const isActive = index === activeStepIndex;

        return (
          <div
            key={taskList.task_list.id}
            className="w-[345px] min-w-[345px] h-full max-h-600"
          >
            <StepClip
              variant={index === 0 ? "first" : "middle"}
              completed={isCompleted}
              active={isActive}
            >
              <div className="w-[80%] flex flex-col items-center gap-1">
                <div className="flex flex-row items-center gap-2.5">
                  {isCompleted && (
                    <div
                      className={`size-4 min-w-4 rounded-full text-[#B5BCCC] border flex items-center justify-center bg-[#42BC5C] border-[#42BC5C]`}
                    >
                      <CheckIcon className="size-2 text-white " />
                    </div>
                  )}
                  <span
                    className={`text-xs font-bold text-[#111827] ${
                      isCompleted && "line-through"
                    } ${isActive && !isCompleted ? "text-white" : ""}`}
                  >
                    {taskList.task_list.title}
                  </span>
                </div>
                <Progress
                  className="w-1/4"
                  progressClassname={
                    isCompleted ? "bg-[#6A35FF]" : isActive ? "bg-white" : ""
                  }
                  value={(completedTasksCount / totalTasks) * 100}
                />
              </div>
            </StepClip>
            <div className="px-[12px] py-[12px] flex flex-col gap-4">
              <Accordion
                type="multiple"
                defaultValue={taskList.sections.map(
                  (section) => section.section_title.title,
                )}
              >
                {taskList.sections.map((section) => (
                  <AccordionItem
                    value={section.section_title.title}
                    key={section.section_title.id}
                  >
                    <AccordionTrigger>
                      <h5 className="text-[14px] text-[#111827] font-medium opacity-70 mb-3">
                        {section.section_title.title}
                      </h5>
                    </AccordionTrigger>
                    <AccordionContent>
                      <ul className="flex gap-1 flex-col">
                        {section.tasks.map((task) => {
                          const isCompleted = completedTasks.some(
                            (ct) => ct.task_id === task.id && ct.completed,
                          );
                          const completedTask = completedTasks.find(
                            (ct) => ct.task_id === task.id,
                          );

                          return (
                            <TaskCard
                              task={task}
                              key={task.id}
                              isCompleted={isCompleted}
                              data={
                                completedTask
                                  ? (completedTask.data as Record<string, any>)
                                  : {}
                              }
                            />
                          );
                        })}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                  // <div key={section.section_title.id}>
                  // <h5 className="text-[14px] text-[#111827] font-medium opacity-70 mb-3">
                  //   {section.section_title.title}
                  // </h5>
                  // <ul className="flex gap-1 flex-col">
                  //   {section.tasks.map((task) => {
                  //     const isCompleted = completedTasks.some(
                  //       (ct) => ct.task_id === task.id && ct.completed
                  //     );
                  //     const completedTask = completedTasks.find(
                  //       (ct) => ct.task_id === task.id
                  //     );

                  //     return (
                  //       <TaskCard
                  //         task={task}
                  //         key={task.id}
                  //         isCompleted={isCompleted}
                  //         data={
                  //           completedTask
                  //             ? (completedTask.data as Record<string, any>)
                  //             : {}
                  //         }
                  //       />
                  //     );
                  //   })}
                  // </ul>
                  // </div>
                ))}
              </Accordion>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function groupTasksByListAndSection(
  tasks: TaskWithListAndSection[],
): GroupedTasks {
  // First, build nested maps to avoid O(n^2) scans
  const listMap = new Map<
    number,
    {
      task_list: TaskList;
      sections: Map<
        number | null,
        {
          section_title: TaskSectionTitle;
          tasks: Task[];
        }
      >;
    }
  >();

  for (const t of tasks) {
    const tl = t.task_list!;
    if (!listMap.has(tl.id)) {
      listMap.set(tl.id, {
        task_list: tl,
        sections: new Map(),
      });
    }
    const listEntry = listMap.get(tl.id)!;

    const st = t.section_title ?? null; // allow null/undefined
    const sectionKey = st?.id ?? null;

    if (!listEntry.sections.has(sectionKey)) {
      listEntry.sections.set(sectionKey, {
        section_title: st ?? {
          id: null as any,
          title: "Unsectioned",
          order: Number.MAX_SAFE_INTEGER,
        },
        tasks: [],
      });
    }
    listEntry.sections.get(sectionKey)!.tasks.push(t);
  }

  // Now materialize into sorted arrays
  //@ts-ignore
  const result: GroupedTasks = Array.from(listMap.values())
    .sort((a, b) => (a.task_list.order ?? 0) - (b.task_list.order ?? 0))
    .map(({ task_list, sections }) => ({
      task_list,
      sections: Array.from(sections.values())
        .sort(
          (a, b) => (a.section_title.order ?? 0) - (b.section_title.order ?? 0),
        )
        .map(({ section_title, tasks }) => ({
          section_title,
          tasks: tasks.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
        })),
    }));

  return result;
}
