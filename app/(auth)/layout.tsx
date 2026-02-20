import AppHeader from "@/components/AppHeader";
import { AppSidebar } from "@/components/AppSidebar";
import SetActiveOrg from "@/components/SetActiveOrg";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { checkFounderOfMultipleStartups, checkRole } from "@/lib/auth";
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isAdminOrMentor =
    (await checkRole("admin")) || (await checkRole("mentor"));

  const isfounderOfMultipleStartups = await checkFounderOfMultipleStartups();

  return (
    <>
      <SidebarProvider>
        <AppSidebar
          isAdminOrMentor={isAdminOrMentor || isfounderOfMultipleStartups}
        />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <div className="bg-[#EFF0F4] flex-1 w-full overflow-y-auto">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </>
  );
}
