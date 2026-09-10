"use client"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Item,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  BotIcon,
  ClockIcon,
  FileEditIcon,
  FilePlusIcon,
  FolderPlusIcon,
  GitBranchIcon,
  LayersIcon,
  MessageSquareIcon,
  PhoneIcon,
  RadioTowerIcon,
  SearchIcon,
  SendIcon,
  TerminalIcon,
  XIcon,
} from "lucide-react"
import { useMemo, useState } from "react"

export type TriggerDefinition = {
  id: string
  title: string
  description?: string
  category: "Records" | "Collections" | "Data" | "Messaging & Inbound" | "Schedule"
  icon: typeof FilePlusIcon
  iconName: string
  typeLabel: string
  typeClassName: string
  tone: "trigger" | "action" | "condition" | "ai" | "channel"
  config?: Record<string, unknown>
}

const triggerCatalog: TriggerDefinition[] = [
  // Records
  {
    id: "record.command",
    title: "Record command",
    description: "Trigger manually via an action button on a record",
    category: "Records",
    icon: TerminalIcon,
    iconName: "Terminal",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "record.command" },
  },
  {
    id: "record.created",
    title: "Record created",
    description: "Trigger when a new record is created in an object",
    category: "Records",
    icon: FilePlusIcon,
    iconName: "FilePlus",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "record.created" },
  },
  {
    id: "record.updated",
    title: "Record updated",
    description: "Trigger when attributes or values change on a record",
    category: "Records",
    icon: FileEditIcon,
    iconName: "FileEdit",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "record.updated" },
  },

  // Collections (Lists)
  {
    id: "collection.command",
    title: "List entry command",
    description: "Trigger manually from a list entry view",
    category: "Collections",
    icon: TerminalIcon,
    iconName: "Terminal",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "collection.command" },
  },
  {
    id: "collection.entry_updated",
    title: "List entry updated",
    description: "Trigger when a list item or status changes",
    category: "Collections",
    icon: LayersIcon,
    iconName: "Layers",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "collection.entry_updated" },
  },
  {
    id: "collection.record_added",
    title: "Record added to list",
    description: "Trigger when a record enters or is added to a list",
    category: "Collections",
    icon: FolderPlusIcon,
    iconName: "FolderPlus",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "collection.record_added" },
  },

  // Data
  {
    id: "data.attribute_updated",
    title: "Attribute updated",
    description: "Trigger when a specific attribute value changes",
    category: "Data",
    icon: FileEditIcon,
    iconName: "FileEdit",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "data.attribute_updated" },
  },

  // Messaging & Inbound
  {
    id: "webhook.inbound",
    title: "Inbound webhook",
    description: "Trigger when external systems send JSON to a webhook URL",
    category: "Messaging & Inbound",
    icon: RadioTowerIcon,
    iconName: "RadioTower",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "webhook.inbound" },
  },
  {
    id: "messenger.message",
    title: "Messenger message received",
    description: "Trigger when an incoming Facebook Messenger message arrives",
    category: "Messaging & Inbound",
    icon: MessageSquareIcon,
    iconName: "MessageSquare",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "messenger.message", channel: "messenger" },
  },
  {
    id: "telegram.message",
    title: "Telegram message received",
    description: "Trigger when an incoming message arrives via Telegram bot",
    category: "Messaging & Inbound",
    icon: SendIcon,
    iconName: "Send",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "telegram.message", channel: "telegram" },
  },
  {
    id: "viber.message",
    title: "Viber message received",
    description: "Trigger when a customer message is received via Viber",
    category: "Messaging & Inbound",
    icon: PhoneIcon,
    iconName: "Phone",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "viber.message", channel: "viber" },
  },

  // Schedule
  {
    id: "schedule.cron",
    title: "Run on schedule",
    description: "Trigger at recurring fixed intervals or specific times of day",
    category: "Schedule",
    icon: ClockIcon,
    iconName: "Clock",
    typeLabel: "Trigger",
    typeClassName:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-300",
    tone: "trigger",
    config: { event: "schedule.cron" },
  },
]

export type StepDefinition = {
  id: string
  title: string
  description: string
  category: "Records" | "Logic" | "AI" | "Messaging"
  icon: typeof FilePlusIcon
  tone: Exclude<TriggerDefinition["tone"], "trigger">
}

const stepCatalog: StepDefinition[] = [
  {
    id: "record.action",
    title: "Record Action",
    description: "Create or update CRM records",
    category: "Records",
    icon: FilePlusIcon,
    tone: "action",
  },
  {
    id: "condition.branch",
    title: "Condition Branch",
    description: "True / False conditional routing",
    category: "Logic",
    icon: GitBranchIcon,
    tone: "condition",
  },
  {
    id: "ai.specialist",
    title: "AI Specialist",
    description: "Extract fields and generate responses",
    category: "AI",
    icon: BotIcon,
    tone: "ai",
  },
  {
    id: "channel.message",
    title: "Channel Message",
    description: "Post to Viber, Telegram, or Messenger",
    category: "Messaging",
    icon: SendIcon,
    tone: "channel",
  },
]

type WorkflowBlockSelectionSidebarProps = {
  open: boolean
  mode: "all" | "step"
  onClose: () => void
  onSelectTrigger: (trigger: TriggerDefinition) => void
  onSelectStep: (step: StepDefinition) => void
}

export function WorkflowBlockSelectionSidebar({
  open,
  mode,
  onClose,
  onSelectTrigger,
  onSelectStep,
}: WorkflowBlockSelectionSidebarProps) {
  const [search, setSearch] = useState("")

  const categories = useMemo(() => {
    const q = search.trim().toLowerCase()
    const entries: Array<
      | { kind: "trigger"; item: TriggerDefinition }
      | { kind: "step"; item: StepDefinition }
    > = [
      ...(mode === "all"
        ? triggerCatalog.map((item) => ({ kind: "trigger" as const, item }))
        : []),
      ...stepCatalog.map((item) => ({ kind: "step" as const, item })),
    ]
    const categoryOrder = [
      "Records",
      "Lists",
      "Data",
      "Logic",
      "AI",
      "Messaging",
      "Schedule",
    ]
    const categoryMap = new Map<string, typeof entries>()

    for (const entry of entries) {
      const category =
        entry.item.category === "Collections"
          ? "Lists"
          : entry.item.category === "Messaging & Inbound"
            ? "Messaging"
            : entry.item.category
      const matchesSearch =
        !q ||
        entry.item.title.toLowerCase().includes(q) ||
        Boolean(entry.item.description?.toLowerCase().includes(q)) ||
        category.toLowerCase().includes(q)

      if (matchesSearch) {
        const categoryEntries = categoryMap.get(category) ?? []
        categoryEntries.push(entry)
        categoryMap.set(category, categoryEntries)
      }
    }

    return categoryOrder
      .filter((category) => categoryMap.has(category))
      .map((category) => [category, categoryMap.get(category)!] as const)
  }, [mode, search])

  if (!open) return null

  return (
    <aside
      aria-label={
        mode === "all" ? "Add block sidebar" : "Add next step sidebar"
      }
      className="flex flex-col w-80 shrink-0 border-l border-border bg-background/95 backdrop-blur-xs transition-all duration-200 overflow-hidden"
    >
      {/* Unified Header & Search matching Attio */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground tracking-tight">
              {mode === "all" ? "Add block" : "Add next step"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "all"
                ? "Select a trigger or step"
                : "Select the next step in this path"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close selection sidebar"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Dacoo InputGroup Search Input */}
        <InputGroup className="h-8 mt-3 bg-card/60">
          <InputGroupAddon>
            <SearchIcon className="size-3.5 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              mode === "all" ? "Search blocks…" : "Search steps…"
            }
            className="text-xs"
          />
        </InputGroup>
      </div>

      {/* Grouped workflow items */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-thin">
        {categories.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No matching blocks found.
          </div>
        ) : (
          categories.map(([category, entries]) => (
            <section key={category}>
              <h3 className="px-1 text-xs font-normal text-muted-foreground/80 mb-1.5 mt-2">
                {category}
              </h3>

              <TooltipProvider delay={200}>
                <ItemGroup className="gap-1.5">
                  {entries.map((entry) => {
                    const Icon = entry.item.icon

                    return (
                      <Tooltip key={`${entry.kind}-${entry.item.id}`}>
                        <TooltipTrigger
                          render={
                            <Item
                              variant="outline"
                              size="sm"
                              render={<button type="button" />}
                              onClick={() => {
                                if (entry.kind === "trigger") {
                                  onSelectTrigger(entry.item)
                                } else {
                                  onSelectStep(entry.item)
                                }
                              }}
                              className="cursor-pointer flex-nowrap text-left hover:bg-muted/70"
                            >
                              <ItemMedia variant="icon">
                                <Icon className="size-4 text-muted-foreground" />
                              </ItemMedia>
                              <ItemContent>
                                <ItemTitle>{entry.item.title}</ItemTitle>
                              </ItemContent>
                            </Item>
                          }
                        />
                        {entry.item.description ? (
                          <TooltipContent
                            side="left"
                            align="center"
                            className="max-w-64"
                          >
                            {entry.item.description}
                          </TooltipContent>
                        ) : null}
                      </Tooltip>
                    )
                  })}
                </ItemGroup>
              </TooltipProvider>
            </section>
          ))
        )}
      </div>
    </aside>
  )
}
