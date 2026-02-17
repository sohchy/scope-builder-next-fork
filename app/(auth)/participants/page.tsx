import { Button } from "@/components/ui/button";
import ParticipantsTable from "./_components/ParticipantsTable";
import AddParticipant from "./_components/AddParticipant";
import { getParticipants, getParticipantTags } from "@/services/participants";
import { getSegments } from "@/services/segments";

export default async function ParticipantsPage() {
  // const marketSegments = await getSegments();
  const tags = await getParticipantTags();
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
          <AddParticipant tags={tags} />
        </header>

        <ParticipantsTable data={participants} tags={tags} />
      </div>
    </div>
  );
}
