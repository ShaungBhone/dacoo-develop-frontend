"use client"

import { usePathname, useSearchParams } from "next/navigation"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SETTINGS_TABS } from "@/components/settings/settings-tabs"

const LABELS: Record<string, string> = {
  "/home": "Home",
  "/dashboard": "Dashboard",
  "/playground": "Playground",
  "/agents": "Agents",
  "/datasets": "Datasets",
  "/kanban": "Kanban",
  "/deals": "Deals",
  // "/experiments": "Experiments",
  "/activity": "Activity",
  "/billing": "Billing",
  "/contacts": "Contacts",
  "/companies": "Companies",
  "/inbox": "Inbox",
  "/balance": "Balance",
  "/cards": "Cards",
  "/transactions": "Transactions",
  "/ai-usage": "AI Usage",
  "/organization": "Organization",
}

function toLabel(segment: string) {
  return decodeURIComponent(segment)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function getPageLabel(pathname: string) {
  const exactLabel = LABELS[pathname]
  if (exactLabel) return exactLabel

  const segments = pathname.split("/").filter(Boolean)
  const [section, detail] = segments

  if (section === "records") {
    return detail ? toLabel(detail) : "Records"
  }

  return detail ? toLabel(detail) : toLabel(section ?? "dashboard")
}

export function PageBreadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Settings: /settings/[tab] → Settings › <Tab label>
  if (pathname.startsWith("/settings")) {
    const settingsTab = pathname.split("/")[2] ?? searchParams.get("tab")
    const tabLabel = SETTINGS_TABS.find(
      (tab) => tab.slug === settingsTab
    )?.label

    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">Dacoo Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          {tabLabel ? (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{tabLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>Settings</BreadcrumbPage>
            </BreadcrumbItem>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Contact profile: /contacts/[id] → Contacts › Profile
  if (pathname.startsWith("/contacts/")) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">Dacoo Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/contacts">Contacts</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  // Agent settings: /agents/[id] → Agents › Settings
  if (pathname.startsWith("/agents/")) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/dashboard">Dacoo Workspace</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem className="hidden md:block">
            <BreadcrumbLink href="/agents">Agents</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="hidden md:block" />
          <BreadcrumbItem>
            <BreadcrumbPage>Settings</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    )
  }

  const label = getPageLabel(pathname)

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink href="/dashboard">Dacoo Workspace</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        <BreadcrumbItem>
          <BreadcrumbPage>{label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}
