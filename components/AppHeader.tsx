"use client";

import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import { getParticipant } from "@/services/participants";
import Link from "next/link";
import { useEffect, useState } from "react";
import Notes from "./Notes";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { InfoIcon } from "lucide-react";

export default function AppHeader() {
  const { user } = useUser();
  const pathname = usePathname();
  const [header, setHeader] = useState<any>(null);
  const [content, setContent] = useState<any>(null);

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
    if (pathname.includes("/teams-dashboard")) title = "Leaderboard";
    if (pathname.includes("/excercises/excercise-1")) title = "Excercise 1";
    if (pathname.includes("/excercises/excercise-2")) title = "Excercise 2";

    // if (
    //   pathname.includes("/participants/") ||
    //   pathname.includes("/interview")
    // ) {
    //   const path = pathname.split("/");

    //   const participantId = pathname.includes("/interview") ? path[2] : path[1];
    //   const participant = await getParticipant(participantId);

    //   setHeader(
    //     <div>
    //       <Link href={"/participants"}>{title}</Link>
    //       <span>{" > "}</span>
    //       <span>{participant?.name}</span>
    //     </div>,
    //   );
    // } else {
    //   setHeader(title);
    // }
    setHeader(title);
  };

  const renderInfo = (pathname: string) => {
    let content;
    //let alertDialogTitle = '';

    if (pathname === "/") {
      //alertDialogTitle = 'Quick tutorial on how to use the My Progress page:';
      content = (
        <>
          <b>Quick tutorial on how to use the My Progress page:</b>
          <br/>
          <i>Forgot to include in the tutorial video, you can also complete the main milestone itself once all tasks in that milestone are done.</i>
          <br/><br/>
          <video
            controls
            className="w-full"
            src={
              "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/attachments/videos/2026-02-19/Spring2026%20-%20My%20Progress%20-%20Tutorial.mp4"
            }
          />
        </>
      );
    }

    if (pathname === "/idea-brainstorm") {
      content = (
        <>
          <b>Quick tutorial on how to use the Idea Brainstorm page:</b>
          <br/><br/>
          <video
            controls
            className="w-full"
            src={
              "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/attachments/videos/2026-02-19/Spring2026%20-%20Idea%20Brainstorm%20-%20Tutorial.mp4"
            }
          />
        </>
      );
    }

    if (pathname === "/value-proposition-canvas") {
      content = (
        <>
          <b>Quick tutorial on how to use the Value Proposition Canvas page:</b>
          <br/><br/>
          <video
            controls
            className="w-full"
            src={
              "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/attachments/videos/2026-02-19/Spring2026%20-%20ValuePropCanvas%20-%20Tutorial.mp4"
            }
          />
        </>
      );
    }
    
    if (pathname.includes("/hypotheses")) {
      content = (
        <>
          <b>Quick tutorial on how to use the Hypotheses page:</b>
          <br/><br/>
          <video
            controls
            className="w-full"
            src={
              "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/attachments/videos/2026-02-19/Spring2026%20-%20Hypothesis%20-%20Tutorial.mp4"
            }
          />
        </>
      );
    }

     if (pathname === "/participants") {
      content = (
        <>
          <b>Quick tutorial on how to use the Interview Participants page:</b>
          <br/><br/>
          <video
            controls
            className="w-full"
            src={
              "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/attachments/videos/2026-02-19/Spring2026%20-%20Participants%20-%20Tutorial.mp4"
            }
          />
        </>
      );
    }

    if (pathname === "/teams-dashboard") {
      content = (
        <>
          <b>Quick tutorial on how to use the Leaderboard page:</b>
          <br/><br/>
          <video
            controls
            className="w-full"
            src={
              "https://zuazpraxvbtqlpkzayfj.supabase.co/storage/v1/object/public/attachments/videos/2026-02-19/Spring2026%20-%20Leaderboard%20-%20Tutorial.mp4"
            }
          />
        </>
      );
    }

    setContent(content);
  };

  useEffect(() => {
    renderInfo(pathname);
    renderTitle(pathname);
  }, [pathname]);

  return (
    <header className="flex items-center px-4 h-[46px] bg-white border-b-[0.5px] border-b-[#E4E5ED] justify-between font-semibold text-lg text-[#111827]">
      {header}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon" className="ml-4">
            <InfoIcon size={18} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="w-[750px] min-w-[750px]">
          <AlertDialogHeader>
            {/* <AlertDialogTitle>{alertDialogTitle}</AlertDialogTitle> */}
            <AlertDialogTitle></AlertDialogTitle>
            <AlertDialogDescription>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>{content}</div>
          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex items-center flex-row gap-2.5 ml-auto">
        <Notes />
        <UserButton />
        <span className="text-xs font-bold text-[#111827]">
          {user?.fullName || user?.primaryEmailAddress?.emailAddress}
        </span>
      </div>
    </header>
  );
}
