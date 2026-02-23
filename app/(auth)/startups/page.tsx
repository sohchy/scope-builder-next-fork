import { redirect } from "next/navigation";

import { checkFounderOfMultipleStartups, checkRole } from "@/lib/auth";
import { auth, currentUser } from "@clerk/nextjs/server";
import StartupsTable from "./_components/StartupsTable";
import Startups from "./_components/Startups";

export default async function StartupsPage() {
  const isAdminOrMentor =
    (await checkRole("admin")) || (await checkRole("mentor"));

  const isfounderOfMultipleStartups = await checkFounderOfMultipleStartups();

  if (!isAdminOrMentor && !isfounderOfMultipleStartups) {
    redirect("/");
  }

  const user = await currentUser();
  const { orgPermissions } = await auth();

  return (
    <div className="p-8 h-full">
      <div className="border-2 rounded-2xl bg-white p-8">
        <header className="flex flex-row items-center justify-between mb-8">
          <div>
            <h3 className="font-semibold text-2xl text-[#111827]">Startups</h3>
            <span className="text-sm font-bold text-[#111827] opacity-60">
              Here is the list of startups
            </span>
          </div>
        </header>

        <Startups />
      </div>
    </div>
  );
}
