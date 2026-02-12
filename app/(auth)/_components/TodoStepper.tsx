import { Task } from "@/lib/generated/prisma";

type Section = {
  section_title: string;
  section_index: number;
  is_completed: boolean;
  tasks: Task[];
};

type Step = {
  step_title: string;
  step_index: number;
  is_completed: boolean;
  step_sections: Section[];
};

interface TodoStepperProps {
  steps: Step[];
}

export default function TodoStepper({ steps }: TodoStepperProps) {
  return (
    <div className="h-full w-full flex flex-row gap-6">
      {steps.map((step) => {
        return <div key={step.step_index} className="w-[285px]"></div>;
      })}
    </div>
  );
}
