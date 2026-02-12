"use client";

import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { getParticipant } from "@/services/participants";
import Link from "next/link";
import { useEffect, useState } from "react";
import Notes from "./Notes";

export default function AppHeader() {
  const { user } = useUser();
  const pathname = usePathname();
  const [header, setHeader] = useState<any>(null);

  const renderTitle = async (pathname: string) => {
    let title = "";

    if (pathname === "/") title = "My Progress";
    if (pathname === "/startups") title = "Startups";
    if (pathname.includes("/analysis")) title = "Interview Response Analysis";
    if (pathname.includes("/questions")) title = "Interview Questions";
    if (pathname.includes("/participants")) title = "Interview Participants";
    if (pathname.includes("/segments"))
      title = "Market/Customer/End-User Segments";
    if (pathname.includes("/progress")) title = "Progress snapshot";
    if (pathname.includes("/progress-dashboard")) title = "My Progress";
    if (pathname.includes("/ecosystem-map")) title = "Ecosystem Map";
    if (pathname.includes("/idea-brainstorm")) title = "Idea Brainstorm";
    if (pathname.includes("/value-proposition")) title = "Value Proposition";
    if (pathname.includes("/value-proposition-canvas"))
      title = "Value Proposition Canvas";
    if (pathname.includes("/customer-discovery")) title = "Customer Discovery";
    if (pathname.includes("/common-vocabulary")) title = "Common Vocabulary";
    if (pathname.includes("/examples/laptop"))
      title = "Laptop Value Prop Example";
    if (pathname.includes("/examples/pickup-truck"))
      title = "Pickup Truck Value Prop Example";
    if (pathname.includes("/examples/ecosystem-maps"))
      title = "Ecosystem Map Examples";
    if (pathname.includes("/hypotheses")) title = "Hypotheses";
    if (pathname.includes("/admin-panel")) title = "Admin Panel";
    if (pathname.includes("/todos")) title = "Tasks & Todos";

    if (
      pathname.includes("/participants/") ||
      pathname.includes("/interview")
    ) {
      const path = pathname.split("/");

      const participantId = pathname.includes("/interview") ? path[2] : path[1];
      const participant = await getParticipant(participantId);

      setHeader(
        <div>
          <Link href={"/participants"}>{title}</Link>
          <span>{" > "}</span>
          <span>{participant?.name}</span>
        </div>,
      );
    } else {
      setHeader(title);
    }
  };

  useEffect(() => {
    renderTitle(pathname);
  }, [pathname]);

  return (
    <header className="flex items-center px-4 h-[46px] bg-white border-b-[0.5px] border-b-[#E4E5ED] justify-between font-semibold text-lg text-[#111827]">
      {header}

      <div className="flex items-center flex-row gap-2.5 ml-auto">
        <UserButton />
        <span className="text-xs font-bold text-[#111827]">
          {user?.fullName || user?.primaryEmailAddress?.emailAddress}
        </span>
        <Notes />
      </div>
    </header>
  );
}
