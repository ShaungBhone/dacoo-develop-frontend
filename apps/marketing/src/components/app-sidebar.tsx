"use client"

import * as React from "react"
import Link from "next/link"

import { Logo } from "@/components/logo"
import { NavMain } from "@/components/nav-main"
import { SidebarFooterContent } from "@/components/sidebar-footer"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { BadgeDollarSignIcon, BotIcon, LifeBuoyIcon, SendIcon, SparklesIcon, TerminalSquareIcon, WaypointsIcon } from "lucide-react"

const data = {
  navMain: [
    {
      title: "Features",
      url: "/features",
      icon: (
        <SparklesIcon />
      ),
    },
    {
      title: "AI Support",
      url: "/ai-support",
      icon: <BotIcon />,
    },
    {
      title: "Pricing",
      url: "/pricing",
      icon: <BadgeDollarSignIcon />,
    },
    {
      title: "Integrations",
      url: "/integrations",
      icon: <WaypointsIcon />,
    },
    {
      title: "Workflow",
      url: "/playground/workflow",
      icon: <TerminalSquareIcon />,
    },
    {
      title: "FAQs",
      url: "/faq",
      icon: <LifeBuoyIcon />,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: <SendIcon />,
    },
  ],
}
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip="Dacoo" render={<Link href="/" />}>
              <Logo className="h-7 w-auto" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarFooterContent />
      </SidebarFooter>
    </Sidebar>
  )
}
