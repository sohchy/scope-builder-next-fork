import Link from "next/link";

import {
  SidebarMenu,
  SidebarGroup,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";
import { usePathname } from "next/navigation";

interface SecondarySidebarProps {
  isAdminOrMentor: boolean;
  items: { name: string; url: string }[];
}

export default function SecondarySidebar({
  items,
  isAdminOrMentor,
}: SecondarySidebarProps) {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {isAdminOrMentor && (
          <SidebarMenuItem key={"startups"}>
            <SidebarMenuButton
              asChild
              style={{
                opacity: pathname === "/startups" ? 1 : 0.6,
                color: pathname === "/startups" ? "#6A35FF" : "#697288",
                backgroundColor: pathname === "/startups" ? "#F4F0FF" : "",
                fontFamily: "Manrope",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "20px",
                letterSpacing: "0%",
              }}
            >
              <Link href={"/startups"} data-sidebar-link>
                <span>{`Startups`}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {isAdminOrMentor && (
          <SidebarMenuItem key={"admin-panel"}>
            <SidebarMenuButton
              asChild
              style={{
                opacity: pathname === "/admin-panel" ? 1 : 0.6,
                color: pathname === "/admin-panel" ? "#6A35FF" : "#697288",
                backgroundColor: pathname === "/admin-panel" ? "#F4F0FF" : "",
                fontFamily: "Manrope",
                fontWeight: 700,
                fontSize: "14px",
                lineHeight: "20px",
                letterSpacing: "0%",
              }}
            >
              <Link href={"/admin-panel"} data-sidebar-link>
                <span>{`Admin Panel`}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
        {items.map((item) => {
          const isActive = pathname === item.url;
          return (
            <SidebarMenuItem key={item.name}>
              <SidebarMenuButton
                asChild
                style={{
                  opacity: isActive ? 1 : 0.6,
                  color: isActive ? "#6A35FF" : "#697288",
                  backgroundColor: isActive ? "#F4F0FF" : "",
                  fontFamily: "Manrope",
                  fontWeight: 700,
                  fontSize: "14px",
                  lineHeight: "20px",
                  letterSpacing: "0%",
                }}
              >
                <Link href={item.url} data-sidebar-link>
                  <span>{item.name}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
