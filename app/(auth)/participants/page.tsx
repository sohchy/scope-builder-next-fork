import { Button } from "@/components/ui/button";
import ParticipantsTable from "./_components/ParticipantsTable";
import AddParticipant from "./_components/AddParticipant";
import { getParticipants, getParticipantTags } from "@/services/participants";
import { getJobTitles } from "@/services/jobTitles";
import ParticipantsKanbanView from "./interviews/_components/ParticipantsKanbanView";

export default async function ParticipantsPage() {
  const tags = await getParticipantTags();
  const jobTitles = await getJobTitles();
  const participants = await getParticipants();

  return (
    <div className="p-8 h-full">
      <div className="border-2 rounded-2xl bg-white p-8">
        <header className="flex flex-row items-center justify-between mb-8">
          <div>
            <h3 className="font-semibold text-2xl text-[#111827]">
              Interview Participants
            </h3>
            <span className="text-sm font-bold text-[#111827] opacity-60">
              Manage your interview pipeline and scheduling
            </span>
          </div>
          <AddParticipant tags={tags} jobTitles={jobTitles} />
        </header>

        <ParticipantsTable data={participants} tags={tags} jobTitles={jobTitles} />

        {/* <ParticipantsKanbanView /> */}
      </div>
    </div>
  );
}
