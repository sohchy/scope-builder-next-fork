import { redirect } from "next/navigation";

import { checkFounderOfMultipleStartups, checkRole } from "@/lib/auth";

export default async function HomePage() {
  const isAdminOrMentor =
    (await checkRole("admin")) || (await checkRole("mentor"));

  const isfounderOfMultipleStartups = await checkFounderOfMultipleStartups();

  if (isAdminOrMentor || isfounderOfMultipleStartups) {
    return redirect("/startups");
  }

  return redirect("/user-journey-map");

  return null;
}
