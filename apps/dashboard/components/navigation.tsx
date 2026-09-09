"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ChevronRightIcon,
  MoreHorizontalIcon,
  FolderIcon,
  ArrowRightIcon,
  Trash2Icon,
} from "@/components/ui/icons"

export type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  isActive?: boolean
  items?: {
    title: string
    url: string
  }[]
}

export type NavGroup = {
  group: string
  action?: React.ReactNode
  items: NavItem[]
}

export type Project = {
  name: string
  url: string
  icon: React.ReactNode
}

export interface NavigationProps {
  navGroups: NavGroup[]
  projects?: Project[]
}

const appSidebarActiveIndicator =
  "h-8 py-1 text-sm [&>svg]:size-4 [&_svg]:stroke-[1.5] hover:py-1 data-active:relative data-active:overflow-visible data-active:rounded-xl data-active:bg-white data-active:py-1 data-active:text-sidebar-primary data-active:shadow-sm data-active:shadow-black/5 data-active:border data-active:border-sidebar-border/60 data-active:hover:bg-white data-active:hover:text-sidebar-primary data-active:before:absolute data-active:before:-left-2 data-active:before:top-1 data-active:before:bottom-1 data-active:before:w-[3px] data-active:before:rounded-full data-active:before:bg-sidebar-primary"

/**
 * Unified Navigation Component
 * Consolidates the sidebar navigation groups and optional project links.
 */
export function Navigation({ navGroups, projects = [] }: NavigationProps) {
  const pathname = usePathname()
  const { isMobile } = useSidebar()

  const renderNavItem = (item: NavItem) => {
    const isChildActive = item.items?.some(
      (subItem) => pathname === subItem.url
    )
    const isActive = pathname === item.url || item.isActive
    const isOpen = isActive || isChildActive

    if (!item.items || item.items.length === 0) {
      return (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton
            render={<Link href={item.url} />}
            tooltip={item.title}
            isActive={isActive}
            className={appSidebarActiveIndicator}
          >
            {item.icon}
            <span>{item.title}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      )
    }

    return (
      <Collapsible
        key={item.title}
        render={<SidebarMenuItem />}
        defaultOpen={isOpen}
        className="group/collapsible"
      >
        <CollapsibleTrigger
          render={
            <SidebarMenuButton
              tooltip={item.title}
              isActive={isActive}
              className={appSidebarActiveIndicator}
            />
          }
        >
          {item.icon}
          <span>{item.title}</span>
          <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {item.items.map((subItem) => (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  render={<Link href={subItem.url} />}
                  isActive={pathname === subItem.url}
                  className={appSidebarActiveIndicator}
                >
                  <span>{subItem.title}</span>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            ))}
          </SidebarMenuSub>
        </CollapsibleContent>
      </Collapsible>
    )
  }

  return (
    <>
      {/* Navigation Groups */}
      {navGroups.map((navGroup) => (
        <SidebarGroup key={navGroup.group}>
          <SidebarGroupLabel>{navGroup.group}</SidebarGroupLabel>
          {navGroup.action}
          <SidebarMenu>
            {navGroup.items.map((item) => renderNavItem(item))}
          </SidebarMenu>
        </SidebarGroup>
      ))}

      {/* Projects Section */}
      {projects.length > 0 && (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Projects</SidebarGroupLabel>
          <SidebarMenu>
            {projects.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton render={<a href={item.url} />}>
                  {item.icon}
                  <span>{item.name}</span>
                </SidebarMenuButton>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <SidebarMenuAction
                        showOnHover
                        className="aria-expanded:bg-muted"
                      />
                    }
                  >
                    <MoreHorizontalIcon />
                    <span className="sr-only">More</span>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-fit"
                    side={isMobile ? "bottom" : "right"}
                    align={isMobile ? "end" : "start"}
                  >
                    <DropdownMenuItem>
                      <FolderIcon />
                      <span>View Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ArrowRightIcon />
                      <span>Share Project</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem variant="destructive">
                      <Trash2Icon />
                      <span>Delete Project</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton className="text-sidebar-foreground/70">
                <MoreHorizontalIcon className="text-sidebar-foreground/70" />
                <span>More</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      )}
    </>
  )
}
