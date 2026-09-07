"use client"

import * as React from "react"
import {
  ActivityIcon,
  CalendarPlusIcon,
  CheckSquareIcon,
  ChevronDownIcon,
  FileIcon,
  LayoutGridIcon,
  ListFilterIcon,
  LockIcon,
  MailIcon,
  MessageSquareIcon,
  PencilLineIcon,
  PhoneIcon,
  StickyNoteIcon,
  UsersIcon,
  type LucideIcon,
} from "@/components/ui/icons"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import type { Attribute, RecordItem } from "@/components/records/api"
import { AttributeIcon } from "@/components/records/attribute-icon"
import { CompanyTeamPanel } from "@/components/records/company-team-panel"
import { RecordValueDisplay } from "@/components/records/record-value-display"
import { Badge } from "@/components/reui/badge"
import {
  Filters,
  type Filter,
  type FilterFieldConfig,
} from "@/components/reui/filters"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/** How many tabs stay on the bar before the rest collapse into "+N more". */
const VISIBLE_TAB_COUNT = 7

interface TabSpec {
  key: string
  label: string
  icon: LucideIcon
}

/**
 * Every tab the record page offers. Overview, Activity, and a Company's Team
 * have data today; the rest render an empty state until their data arrives.
 */
const TABS: TabSpec[] = [
  { key: "overview", label: "Overview", icon: LayoutGridIcon },
  { key: "activity", label: "Activity", icon: ActivityIcon },
  { key: "emails", label: "Emails", icon: MailIcon },
  { key: "calls", label: "Calls", icon: PhoneIcon },
  { key: "team", label: "Team", icon: UsersIcon },
  { key: "notes", label: "Notes", icon: StickyNoteIcon },
  { key: "tasks", label: "Tasks", icon: CheckSquareIcon },
  { key: "files", label: "Files", icon: FileIcon },
  { key: "comments", label: "Comments", icon: MessageSquareIcon },
  { key: "meetings", label: "Meetings", icon: CalendarPlusIcon },
]

/** Attribute types the filter bar can meaningfully express. */
function filterFieldFor(attribute: Attribute): FilterFieldConfig | null {
  const base = {
    key: attribute.slug,
    label: attribute.title,
    icon: <AttributeIcon attribute={attribute} className="size-3.5" />,
  }

  if (attribute.type === "select" || attribute.type === "status") {
    return {
      ...base,
      type: "multiselect",
      className: "w-[200px]",
      options: attribute.selectOptions
        .filter((option) => !option.isArchived)
        .map((option) => ({ value: option.slug, label: option.title })),
    }
  }

  if (
    attribute.type === "text" ||
    attribute.type === "domain" ||
    attribute.type === "email-address" ||
    attribute.type === "personal-name" ||
    attribute.type === "location"
  ) {
    return {
      ...base,
      type: "text",
      className: "w-40",
      placeholder: `Search ${attribute.title.toLowerCase()}…`,
    }
  }

  return null
}

function TabEmptyState({ tab }: { tab: TabSpec }) {
  return (
    <Empty className="border-0 py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <tab.icon />
        </EmptyMedia>
        <EmptyTitle>No {tab.label.toLowerCase()} yet</EmptyTitle>
        <EmptyDescription>
          {tab.label} aren&apos;t connected to records yet. They&apos;ll appear
          here once the workspace starts capturing them.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="sm"
          onClick={() => toast.info(`${tab.label} aren't available yet.`)}
        >
          Learn more
        </Button>
      </EmptyContent>
    </Empty>
  )
}

/** Populated attribute values, as a scannable summary. */
function OverviewPanel({
  record,
  attributes,
}: {
  record: RecordItem
  attributes: Attribute[]
}) {
  const populated = attributes.filter((attribute) => {
    const value = record.values[attribute.slug]
    if (value == null || value === "") return false
    return !Array.isArray(value) || value.length > 0
  })

  if (populated.length === 0) {
    return (
      <Empty className="border-0 py-12">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <LayoutGridIcon />
          </EmptyMedia>
          <EmptyTitle>Nothing filled in yet</EmptyTitle>
          <EmptyDescription>
            Values you set on the left appear here as a summary.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  // auto-fit rather than `sm:grid-cols-2`: the breakpoint tracks the viewport,
  // but this panel's width is set by the resizable handle, so a narrow panel on
  // a wide screen would still get two columns and overlap.
  return (
    <dl className="grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-x-6 gap-y-4">
      {populated.map((attribute) => (
        <div
          key={attribute.id}
          className="flex min-w-0 flex-col gap-1 overflow-hidden"
        >
          <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {attribute.title}
          </dt>
          <dd className="min-w-0">
            <RecordValueDisplay
              attribute={attribute}
              value={record.values[attribute.slug]}
            />
          </dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * What the record engine actually knows about this record's history: when it
 * was created and when it last changed. Real per-event activity needs a
 * backend feed that doesn't exist yet.
 */
function activityEvents(record: RecordItem) {
  return [
    {
      key: "updated",
      title: "Record updated",
      at: record.updatedAt,
      icon: PencilLineIcon,
    },
    {
      key: "created",
      title: "Record created",
      at: record.createdAt,
      icon: CalendarPlusIcon,
    },
  ].filter((event) => !Number.isNaN(new Date(event.at).getTime()))
}

function ActivityPanel({ record }: { record: RecordItem }) {
  const events = activityEvents(record)

  return (
    <ItemGroup>
      {events.map((event) => (
        <Item key={event.key} variant="outline" size="xs">
          <ItemMedia>
            <span className="flex size-7 items-center justify-center rounded-full border bg-muted/50">
              <event.icon className="size-3.5 text-muted-foreground" />
            </span>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{event.title}</ItemTitle>
            <ItemDescription>
              {new Date(event.at).toLocaleString()}
            </ItemDescription>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}

/**
 * The record's related content, one tab per kind.
 */
export function RecordDetailTabs({
  record,
  attributes,
  organizationId,
  onTeamChanged,
}: {
  record: RecordItem
  attributes: Attribute[]
  organizationId: number | string
  onTeamChanged: () => Promise<void>
}) {
  const [active, setActive] = React.useState(TABS[0].key)
  const [filters, setFilters] = React.useState<Filter[]>([])
  const isCompany = record.object === "company"
  const tabs = React.useMemo(
    () => (isCompany ? TABS : TABS.filter((tab) => tab.key !== "team")),
    [isCompany]
  )

  const filterFields = React.useMemo(
    () =>
      attributes
        .map(filterFieldFor)
        .filter((field): field is FilterFieldConfig => field !== null),
    [attributes]
  )

  // Overflow tabs are still selectable from the dropdown; when one is chosen it
  // takes the last visible slot so the active tab is never hidden.
  const { visible, overflow } = React.useMemo(() => {
    const head = tabs.slice(0, VISIBLE_TAB_COUNT)
    const tail = tabs.slice(VISIBLE_TAB_COUNT)
    const activeInTail = tail.find((tab) => tab.key === active)

    if (!activeInTail) return { visible: head, overflow: tail }

    return {
      visible: [...head.slice(0, VISIBLE_TAB_COUNT - 1), activeInTail],
      overflow: [
        ...tail.filter((tab) => tab.key !== active),
        head[VISIBLE_TAB_COUNT - 1],
      ],
    }
  }, [active, tabs])

  const activeTab = tabs.find((tab) => tab.key === active) ?? tabs[0]

  // Only the tabs with a backend can report a real count; the rest sit at 0
  // until there is something to count.
  const counts: Record<string, number> = {
    activity: activityEvents(record).length,
    team: record.team?.length ?? 0,
  }

  return (
    <Tabs
      value={active}
      onValueChange={(value) => setActive(value as string)}
      className="flex h-full min-h-0 flex-col gap-0"
    >
      <div className="flex items-center gap-1 overflow-x-auto border-b px-4">
        <TabsList variant="line" className="h-auto border-0">
          {visible.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key} className="gap-1.5">
              <tab.icon className="size-3.5" aria-hidden="true" />
              {tab.label}
              {tab.key !== "overview" && (
                <Badge
                  variant={counts[tab.key] ? "primary-light" : "secondary"}
                  size="sm"
                >
                  {counts[tab.key] ?? 0}
                </Badge>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {overflow.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground transition-colors outline-none hover:text-foreground"
                >
                  +{overflow.length} more
                  <ChevronDownIcon className="size-3.5" aria-hidden="true" />
                </button>
              }
            />
            <DropdownMenuContent align="end">
              {overflow.map((tab) => (
                <DropdownMenuItem
                  key={tab.key}
                  onClick={() => setActive(tab.key)}
                >
                  <tab.icon className="size-4" aria-hidden="true" />
                  {tab.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 px-6 py-3.5">
        <h2 className="text-base font-semibold text-foreground">
          {activeTab.label}
        </h2>
        {active !== "team" ? (
          <div className="flex items-center gap-2">
            <Filters
              filters={filters}
              fields={filterFields}
              size="sm"
              onChange={setFilters}
              trigger={
                <Button variant="outline" size="sm">
                  <ListFilterIcon aria-hidden="true" />
                  Filters
                </Button>
              }
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info("Access control isn't available yet.")}
            >
              <LockIcon aria-hidden="true" />
              Manage access
            </Button>
          </div>
        ) : null}
      </div>

      <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 pb-6")}>
        {tabs.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            {tab.key === "overview" ? (
              <OverviewPanel record={record} attributes={attributes} />
            ) : tab.key === "activity" ? (
              <ActivityPanel record={record} />
            ) : tab.key === "team" ? (
              <CompanyTeamPanel
                active={active === "team"}
                company={record}
                organizationId={organizationId}
                onTeamChanged={onTeamChanged}
              />
            ) : (
              <TabEmptyState tab={tab} />
            )}
          </TabsContent>
        ))}
      </div>
    </Tabs>
  )
}
