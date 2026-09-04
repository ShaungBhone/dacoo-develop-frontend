"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  BellIcon,
  Clock3Icon,
  PanelLeftIcon,
  ShieldCheckIcon,
  UserRoundCheckIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { BillingView } from "@/components/billing-view"
import { CurrencyView } from "@/components/settings/currency-view"
import { IntegrationsView } from "@/components/settings/integrations-view"
import {
  SETTINGS_TAB_GROUPS,
  SETTINGS_TABS,
  type SettingsTabSlug,
} from "@/components/settings/settings-tabs"
import { ObjectsView } from "@/components/settings/objects-view"
import { ProfileView } from "@/components/settings/profile-view"
import { RecordTemplatesView } from "@/components/settings/record-templates-view"
import { SavedRepliesView } from "@/components/settings/saved-replies-view"
import { SettingsStub } from "@/components/settings/settings-stub"
import { TagsView } from "@/components/settings/tags-view"
import { TeamView } from "@/components/settings/team-view"
import { WorkspaceProfileView } from "@/components/settings/workspace-profile-view"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { TypographyH3, TypographyMuted } from "@/components/ui/typography"

type SettingsTab = SettingsTabSlug

function isSettingsTab(value: string | null): value is SettingsTab {
  return value !== null && SETTINGS_TABS.some((tab) => tab.slug === value)
}

function getSettingsTabHref(tab: SettingsTab) {
  return tab === "general" ? "/settings" : `/settings?tab=${tab}`
}

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col gap-1">
      <TypographyH3>{title}</TypographyH3>
      <TypographyMuted>{description}</TypographyMuted>
    </div>
  )
}

function SettingsNavigation({
  activeTab,
  className,
  onNavigate,
}: {
  activeTab: SettingsTab
  className?: string
  onNavigate?: () => void
}) {
  return (
    <nav
      aria-label="Settings sections"
      className={cn("flex flex-col gap-5", className)}
    >
      {SETTINGS_TAB_GROUPS.map((group) => (
        <section
          key={group.label}
          aria-labelledby={`settings-navigation-${group.label.toLowerCase()}`}
        >
          <h2
            id={`settings-navigation-${group.label.toLowerCase()}`}
            className="px-2 pb-2 text-xs font-medium text-muted-foreground"
          >
            {group.label}
          </h2>
          <ul className="flex flex-col gap-0.5">
            {group.tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <li key={tab.slug}>
                  <Link
                    href={getSettingsTabHref(tab.slug)}
                    scroll={false}
                    aria-current={activeTab === tab.slug ? "page" : undefined}
                    onClick={onNavigate}
                    className={cn(
                      "flex h-9 items-center gap-2 rounded-md px-2 text-sm text-foreground transition-colors hover:bg-muted",
                      activeTab === tab.slug && "bg-muted font-medium"
                    )}
                  >
                    <Icon
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                    {tab.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </nav>
  )
}

function SettingsContent({ activeTab }: { activeTab: SettingsTab }) {
  if (activeTab === "currency") {
    return (
      <section className="flex flex-col gap-6">
        <SectionHeading
          title="Currency"
          description="Choose how monetary amounts display across your organization."
        />
        <CurrencyView />
      </section>
    )
  }

  if (activeTab === "billing") {
    return (
      <section className="flex flex-col gap-6">
        <SectionHeading
          title="Billing & plan"
          description="Review your subscription, invoices, and available plan changes."
        />
        <BillingView embedded />
      </section>
    )
  }

  if (activeTab === "teammate") {
    return <TeamView />
  }

  if (activeTab === "integrations") {
    return <IntegrationsView />
  }

  if (activeTab === "profile") {
    return <ProfileView />
  }

  if (activeTab === "saved-replies") {
    return <SavedRepliesView />
  }

  if (activeTab === "tags") {
    return <TagsView />
  }

  if (activeTab === "objects") {
    return <ObjectsView />
  }

  if (activeTab === "templates") {
    return <RecordTemplatesView />
  }

  const stubs = {
    "office-hours": { icon: Clock3Icon, title: "Office hours" },
    security: { icon: ShieldCheckIcon, title: "Security" },
    assignments: { icon: UserRoundCheckIcon, title: "Assignments" },
    notifications: { icon: BellIcon, title: "Notifications" },
  } as const

  if (activeTab in stubs) {
    const { icon, title } = stubs[activeTab as keyof typeof stubs]
    return <SettingsStub icon={icon} title={title} />
  }

  return <WorkspaceProfileView />
}

export function SettingsWorkspace() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const isMobile = useIsMobile()
  const [navigationOpen, setNavigationOpen] = useState(false)
  const requestedTab = searchParams.get("tab")
  const activeTab: SettingsTab =
    requestedTab === "preferences"
      ? "currency"
      : requestedTab === "users"
        ? "teammate"
        : requestedTab === "messenger"
          ? "integrations"
          : isSettingsTab(requestedTab)
            ? requestedTab
            : "general"

  useEffect(() => {
    if (requestedTab === "preferences") {
      router.replace("/settings?tab=currency", { scroll: false })
    } else if (requestedTab === "users") {
      router.replace("/settings?tab=teammate", { scroll: false })
    } else if (requestedTab === "messenger") {
      router.replace("/settings?tab=integrations", { scroll: false })
    }
  }, [requestedTab, router])

  const isFullHeightTableTab =
    activeTab === "teammate" ||
    activeTab === "tags" ||
    activeTab === "objects"

  const settingsContent = (
    <div
      className={cn(
        "flex scrollbar-thin h-full min-h-0 w-full min-w-0 flex-1 flex-col",
        isFullHeightTableTab
          ? "overflow-hidden"
          : "overflow-y-auto px-4 py-6 lg:px-6"
      )}
    >
      <div
        className={cn(
          "mx-auto flex min-h-0 w-full flex-1 flex-col",
          !isFullHeightTableTab && "gap-6"
        )}
      >
        {isMobile && (
          <Sheet open={navigationOpen} onOpenChange={setNavigationOpen}>
            <SheetTrigger
              render={
                <Button
                  variant="outline"
                  className={cn(
                    "self-start",
                    isFullHeightTableTab && "m-4 mb-0"
                  )}
                />
              }
            >
              <PanelLeftIcon data-icon="inline-start" />
              Settings sections
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Settings</SheetTitle>
                <SheetDescription>
                  Choose a section to manage your workspace settings.
                </SheetDescription>
              </SheetHeader>
              <SettingsNavigation
                activeTab={activeTab}
                className="px-4 pb-6"
                onNavigate={() => setNavigationOpen(false)}
              />
            </SheetContent>
          </Sheet>
        )}

        <main className="flex min-h-0 min-w-0 flex-1 flex-col">
          <SettingsContent activeTab={activeTab} />
        </main>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-background text-foreground">
      {!isMobile ? (
        <ResizablePanelGroup className="min-h-0 flex-1 overflow-hidden">
          <ResizablePanel
            id="settings-nav-panel"
            defaultSize="20%"
            minSize="12%"
            maxSize="32%"
            className="min-w-0"
          >
            <aside className="flex h-full flex-col bg-sidebar">
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto p-3">
                <SettingsNavigation activeTab={activeTab} />
              </div>
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="settings-content" className="min-h-0 min-w-0">
            {settingsContent}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        settingsContent
      )}
    </div>
  )
}
