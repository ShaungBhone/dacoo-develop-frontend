"use client"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import {
  ClockIcon,
  FileEditIcon,
  FilePlusIcon,
  FolderPlusIcon,
  LayersIcon,
  MessageSquareIcon,
  PhoneIcon,
  RadioTowerIcon,
  SearchIcon,
  SendIcon,
  TerminalIcon,
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

type TriggerSelectionSidebarProps = {
  open: boolean
  onClose?: () => void
  onSelectTrigger: (trigger: TriggerDefinition) => void
}

export function TriggerSelectionSidebar({
  open,
  onSelectTrigger,
}: TriggerSelectionSidebarProps) {
  const [search, setSearch] = useState("")

  const filteredTriggers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return triggerCatalog
    return triggerCatalog.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        item.category.toLowerCase().includes(q)
    )
  }, [search])

  const categories = useMemo(() => {
    const order: TriggerDefinition["category"][] = [
      "Records",
      "Collections",
      "Data",
      "Messaging & Inbound",
      "Schedule",
    ]
    const map = new Map<string, TriggerDefinition[]>()
    for (const item of filteredTriggers) {
      const list = map.get(item.category) ?? []
      list.push(item)
      map.set(item.category, list)
    }
    return order
      .filter((cat) => map.has(cat))
      .map((cat) => [cat, map.get(cat)!] as const)
  }, [filteredTriggers])

  if (!open) return null

  return (
    <aside
      aria-label="Select trigger sidebar"
      className="flex flex-col w-80 shrink-0 border-l border-border bg-background/95 backdrop-blur-xs transition-all duration-200 overflow-hidden"
    >
      {/* Unified Header & Search matching Attio */}
      <div className="p-4 pb-2">
        <h2 className="text-sm font-semibold text-foreground tracking-tight">
          Select trigger
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Pick an event to start this workflow
        </p>

        {/* Dacoo InputGroup Search Input */}
        <InputGroup className="h-8 mt-3 bg-card/60">
          <InputGroupAddon>
            <SearchIcon className="size-3.5 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search triggers…"
            className="text-xs"
          />
        </InputGroup>
      </div>

      {/* Grouped Trigger Items matching Attio single-line card pills */}
      <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-3 scrollbar-thin">
        {categories.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted-foreground">
            No matching triggers found.
          </div>
        ) : (
          categories.map(([category, items]) => (
            <div key={category}>
              {/* Soft Title Case Category Header */}
              <div className="px-1 text-xs font-normal text-muted-foreground/80 mb-1.5 mt-2">
                {category === "Collections" ? "Lists" : category}
              </div>

              {/* Stack of Attio-style Card Pills */}
              <div className="space-y-1.5">
                {items.map((item) => {
                  const Icon = item.icon
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTrigger(item)}
                      className={cn(
                        "w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-border/60 bg-card",
                        "hover:bg-muted/70 hover:border-border transition-colors cursor-pointer group shadow-2xs"
                      )}
                    >
                      <Icon className="size-4 text-foreground/80 shrink-0 transition-transform group-hover:scale-105" />
                      <span className="text-xs font-medium text-foreground truncate flex-1">
                        {item.title}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  )
}
