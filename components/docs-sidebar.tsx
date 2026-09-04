"use client"

import * as React from "react"
import { useDocsSearch } from "@/contexts/docs-search-context"
import { useAuth } from "@/contexts/auth-context"
import { TeamSwitcher } from "@/components/team-switcher"
import { NavUser } from "@/components/nav-user"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarInput,
  SidebarFooter,
} from "@/components/ui/sidebar"
import {
  ArrowLeftIcon,
  SearchIcon,
  GalleryVerticalEndIcon,
  AudioLinesIcon,
  TerminalIcon,
} from "@/components/ui/icons"

// Document sections data matching the RAG Playground docs
const navMainData = [
  {
    id: "getting-started",
    title: "Getting Started",
    url: "#getting-started",
    items: [
      {
        title: "Overview & Steps",
        url: "#getting-started",
      },
    ],
  },
  {
    id: "concepts",
    title: "Core Concepts",
    url: "#concepts",
    items: [
      {
        title: "Chunk & Embedding",
        url: "#concepts",
      },
      {
        title: "Top-K & Reranking",
        url: "#concepts",
      },
      {
        title: "Faithfulness",
        url: "#concepts",
      },
    ],
  },
  {
    id: "playground",
    title: "Playground",
    url: "#playground",
    items: [
      {
        title: "Testing Console",
        url: "#playground",
      },
      {
        title: "Retrieval Config",
        url: "#playground",
      },
      {
        title: "Citation Badges",
        url: "#playground",
      },
    ],
  },
  {
    id: "datasets",
    title: "Datasets",
    url: "#datasets",
    items: [
      {
        title: "Managing Collections",
        url: "#datasets",
      },
      {
        title: "Indexing Status",
        url: "#datasets",
      },
    ],
  },
  {
    id: "experiments",
    title: "Experiments",
    url: "#experiments",
    items: [
      {
        title: "Leaderboard & Metrics",
        url: "#experiments",
      },
      {
        title: "Comparing Runs",
        url: "#experiments",
      },
    ],
  },
  {
    id: "logs",
    title: "Logs",
    url: "#logs",
    items: [
      {
        title: "Live Query Stream",
        url: "#logs",
      },
      {
        title: "Trace Details",
        url: "#logs",
      },
    ],
  },
  {
    id: "api",
    title: "API Access",
    url: "#api",
    items: [
      {
        title: "cURL Examples",
        url: "#api",
      },
      {
        title: "Rotating API Keys",
        url: "#api",
      },
    ],
  },
]

export function DocsSidebar({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  const { query, setQuery, activeSectionId } = useDocsSearch()
  const { user, isLoading } = useAuth()

  const teams = React.useMemo(() => {
    if (isLoading && !user) return []
    if (!user?.organizations || user.organizations.length === 0) {
      return [
        {
          id: -1,
          name: "Personal Workspace",
          logo: <GalleryVerticalEndIcon />,
          plan: "Free",
        },
      ]
    }
    return user.organizations.map((org, index) => {
      const Logos = [GalleryVerticalEndIcon, AudioLinesIcon, TerminalIcon]
      const LogoIcon = Logos[index % Logos.length]
      return {
        id: org.id,
        name: org.name,
        logo: <LogoIcon />,
        plan: org.owner_id === user.id ? "Owner" : "Member",
      }
    })
  }, [user, isLoading])

  const sidebarUser = React.useMemo(() => {
    return {
      name: user?.name || "User",
      email: user?.email || "",
      avatar: `https://avatar.vercel.sh/${user?.email || "user"}.png`,
    }
  }, [user])

  const filteredNav = navMainData.filter((group) => {
    // If search is active, show sections that match the query
    const groupMatches = group.title.toLowerCase().includes(query.toLowerCase())
    const subMatches = group.items.some((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    )
    return groupMatches || subMatches
  })

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={teams} />
        {/* Localized search input directly wired to DocsSearchContext */}
        <div className="px-2 py-1">
          <div className="relative">
            <Label htmlFor="docs-sidebar-search" className="sr-only">
              Search guide
            </Label>
            <SidebarInput
              id="docs-sidebar-search"
              placeholder="Search guide..."
              className="bg-sidebar-background h-8 pl-8 text-xs"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 opacity-50 select-none" />
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {/* Back to App Link */}
            <SidebarMenuItem>
              <SidebarMenuButton
                className="font-medium text-primary hover:bg-primary/5 hover:text-primary"
                render={
                  <a href="/dashboard" className="flex items-center gap-2" />
                }
              >
                <ArrowLeftIcon className="size-4" />
                <span>Back to App</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <div className="my-1 px-1">
              <Separator />
            </div>

            {filteredNav.map((item) => {
              const isGroupActive = item.id === activeSectionId
              return (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    isActive={isGroupActive}
                    className={
                      isGroupActive
                        ? "bg-primary/5 font-medium text-primary hover:bg-primary/10 hover:text-primary"
                        : "font-medium"
                    }
                    render={<a href={item.url} />}
                  >
                    {item.title}
                  </SidebarMenuButton>
                  {item.items?.length ? (
                    <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            isActive={isGroupActive}
                            className={
                              isGroupActive
                                ? "text-primary/95"
                                : "text-muted-foreground"
                            }
                            render={<a href={subItem.url} />}
                          >
                            {subItem.title}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              )
            })}
            {filteredNav.length === 0 && (
              <p className="px-3 py-2 text-center text-xs text-muted-foreground">
                No matching sections.
              </p>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={sidebarUser} />
      </SidebarFooter>
    </Sidebar>
  )
}
