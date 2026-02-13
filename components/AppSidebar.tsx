"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ChevronRight,
  DotIcon,
  FolderClosedIcon,
  FolderIcon,
  Rocket,
} from "lucide-react";

import {
  Sidebar,
  SidebarMenu,
  SidebarRail,
  SidebarGroup,
  SidebarHeader,
  SidebarContent,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarGroupContent,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useOrganization, UserButton, useUser } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import SecondarySidebar from "./SecondarySidebar";
import CollapsibleSidebar from "./MainSidebar";

// This is sample data.
const data = {
  subMain: [
    {
      name: "Leaderboard",
      url: "/teams-dashboard",
      //icon: Frame,
      conditionalMenu: true,
    },
    {
      name: "My Progress",
      //url: "/teams-dashboard",
      url: "/progress-dashboard",
      //icon: Frame,
      conditionalMenu: false,
    },
    {
      name: "Brainstorm",
      url: "/idea-brainstorm",
      //icon: PieChart,
      conditionalMenu: true,
    },
    {
      name: "Value Prop Canvas",
      url: "/value-proposition-canvas",
      //icon: PieChart,
      conditionalMenu: true,
    },
    {
      name: "Hypothesis",
      url: "/hypotheses",
      //icon: PieChart,
      conditionalMenu: true,
    },
    {
      name: "Participants & Interviews",
      url: "/participants",
      //icon: PieChart,
      conditionalMenu: true,
    },
  ],
  navMain: [
    // {
    //   title: "Hypothesize",
    //   items: [
    //     {
    //       title: "Segments",
    //       url: "/segments",
    //     },
    //     {
    //       title: "Value Proposition",
    //       url: "/value-proposition",
    //     },
    //     {
    //       title: "Ecosystem Map",
    //       url: "/ecosystem-map",
    //     },
    //     {
    //       title: "Hypotheses",
    //       url: "/hypotheses",
    //     },
    //   ],
    // },
    // {
    //   title: "Validate",
    //   items: [
    //     {
    //       title: "Questions",
    //       url: "/questions",
    //       isActive: true,
    //     },
    //     {
    //       title: "Participants",
    //       url: "/participants",
    //     },
    //     // {
    //     //   title: "Interviews",
    //     //   url: "/interviews",
    //     // },
    //     {
    //       title: "Analysis",
    //       url: "/analysis",
    //     },
    //   ],
    // },
    {
      title: "Resources",
      items: [
        {
          title: "Customer Discovery",
          url: "/customer-discovery",
        },
        {
          title: "Interview Prep",
          url: "/interview-preparation",
        },
        {
          title: "Common Vocabulary",
          url: "/common-vocabulary",
        },
      ],
    },
    // {
    //   title: "Excercises",
    //   items: [
    //     {
    //       title: "Excercise 1",
    //       url: "/excercises/excercise-1",
    //     },
    //     {
    //       title: "Excercise 2",
    //       url: "/excercises/excercise-2",
    //     },
    //   ],
    // },
    // {
    //   title: "Examples",
    //   items: [
    //     {
    //       title: "Pickup Truck",
    //       url: "/examples/pickup-truck",
    //     },
    //     {
    //       title: "Laptop",
    //       url: "/examples/laptop",
    //     },
    //     {
    //       title: "Ecosystem Maps",
    //       url: "/examples/ecosystem-maps",
    //     },
    //   ],
    // },
    // {
    //   title: "Needs",
    //   url: "/needs",
    //   items: [],
    // },
    // {
    //   title: "Solutions",
    //   items: [],
    // },
    // {
    //   title: "Traction",
    //   url: "/",
    //   items: [],
    // },
    // {
    //   title: "Features",
    //   url: "/",
    //   items: [],
    // },
  ],
};

export function AppSidebar({
  isAdminOrMentor,
  ...props
}: React.ComponentProps<typeof Sidebar> & { isAdminOrMentor: boolean }) {
  const { user } = useUser();
  const { organization } = useOrganization();

  const showAllPages = process.env.NEXT_PUBLIC_SHOW_ALL_PAGES === "true";

  return (
    <Sidebar className="bg-white" {...props}>
      <SidebarHeader className="bg-white p-3 flex gap-4">
        <Link href={"/"} className="flex flex-col gap-2 items-center">
          <Image
            width={200}
            height={50}
            src={"/nutech_logo.jpg"}
            alt="Nutech Ventures"
          />

          <div className="h-[0.5px] bg-gray-300 w-full" />

          <Image width={200} height={50} src={"/nsf_logo.jpg"} alt="NSF" />
        </Link>

        <div className="h-8 rounded-[8px] flex flex-row gap-2.5 items-center px-2">
          {isAdminOrMentor ? (
            <Link
              href={"/startups"}
              className="flex flex-row gap-2.5 items-center w-full"
            >
              <Image
                width={32}
                height={32}
                src={"/icons8-startup-64.png"}
                alt="Startup"
              />
              <span
                className="text-lg font-bold"
                style={{
                  fontFamily: "Manrope",
                  fontWeight: 700,
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0%",
                  color: "#111827",
                }}
              >
                {organization?.name}
              </span>
            </Link>
          ) : (
            <>
              <Image
                width={32}
                height={32}
                src={"/icons8-startup-64.png"}
                alt="Startup"
              />
              <span
                className="text-lg font-bold"
                style={{
                  fontFamily: "Manrope",
                  fontWeight: 700,
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0%",
                  color: "#111827",
                }}
              >
                {organization?.name}
              </span>
            </>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="p-3 bg-white border-t flex justify-between">
        <div>
          <SecondarySidebar
            items={data.subMain.filter((item) => {
              if (showAllPages) return true;

              if (!showAllPages && item.conditionalMenu && !isAdminOrMentor)
                return false;

              return true;
            })}
            isAdminOrMentor={isAdminOrMentor}
          />
          <CollapsibleSidebar items={data.navMain} />
        </div>
        {/* We create a collapsible SidebarGroup for each parent. */}
        {/* <div>
          <div className="px-2">
            <Link
              href="/progress"
              className="text-[#111827] opacity-60 text-[12px] font-medium block p-2 cursor-pointer"
            >
              Progress
            </Link>
          </div>

          <div className="px-2">
            <Link
              href="/value-proposition"
              className="text-[#111827] opacity-60 text-[12px] font-medium block p-2 cursor-pointer"
            >
              Value Proposition
            </Link>
          </div>

          {data.navMain.map((item) => (
            <Collapsible
              key={item.title}
              title={item.title}
              defaultOpen
              className="group/collapsible"
            >
              <SidebarGroup>
                <SidebarGroupLabel
                  asChild
                  className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
                >
                  <CollapsibleTrigger className="text-[#111827] opacity-60 text-[12px] font-bold">
                    {item.title}{" "}
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {item.items.map((item) => {
                        const isActive =
                          pathname.includes(item.url) && pathname !== "/";
                        return (
                          <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild isActive={isActive}>
                              <div
                                className={`text-[12px] font-bold`}
                                style={{
                                  opacity: isActive ? 1 : 0.6,
                                  color: isActive ? "#6A35FF" : "#111827",
                                  backgroundColor: isActive ? "#F4F0FF" : "",
                                }}
                              >
                                <DotIcon height={4} width={4} />
                                <Link href={item.url}>{item.title}</Link>
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>
          ))}
        </div> */}

        {/* <div className="flex items-center flex-row gap-2.5">
          <UserButton />
          <span className="text-xs font-bold text-[#111827]">
            {user?.fullName}
          </span>
        </div> */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
