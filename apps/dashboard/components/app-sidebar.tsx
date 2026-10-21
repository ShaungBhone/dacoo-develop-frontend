"use client"

import * as React from "react"
import { HomeIcon, MessageSquareIcon, SettingsIcon } from "lucide-react"
import { HeaderProfileMenu } from "@/components/header-profile-menu"
import { Navigation } from "@/components/navigation"
import { SidebarProfile } from "@/components/sidebar-profile"
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar"

export function AppSidebar(props: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarProfile />
      </SidebarHeader>
      <SidebarContent>
        <Navigation
          navGroups={[
            {
              group: "Workspace",
              items: [
                { title: "Home", url: "/home", icon: <HomeIcon /> },
                { title: "Inbox", url: "/inbox", icon: <MessageSquareIcon /> },
                { title: "Settings", url: "/settings", icon: <SettingsIcon /> },
              ],
            },
          ]}
        />
      </SidebarContent>
      <SidebarFooter>
        <HeaderProfileMenu />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
