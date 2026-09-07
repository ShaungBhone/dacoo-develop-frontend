"use client"

import {
  BotIcon,
  DatabaseIcon,
  FileTextIcon,
  MessageSquareIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "@/components/ui/icons"
import { cn } from "@/lib/utils"

export type AgentSection =
  | "overview"
  | "all"
  | "persona"
  | "messages"
  | "guidance"
  | "sources"

export const AGENT_SECTION_LABELS: Record<AgentSection, string> = {
  overview: "Overview",
  all: "All Settings",
  persona: "Persona",
  messages: "Messages",
  guidance: "Guidance",
  sources: "Knowledge Sources",
}

type NavItem = {
  key: AgentSection
  label: string
  icon: LucideIcon
  count?: number
}

interface AgentSettingsNavProps {
  section: AgentSection
  onSectionChange: (section: AgentSection) => void
  guidanceCount: number
  sourceCount: number
  className?: string
}

export function AgentSettingsNav({
  section,
  onSectionChange,
  guidanceCount,
  sourceCount,
  className,
}: AgentSettingsNavProps) {
  const items: NavItem[] = [
    { key: "overview", label: AGENT_SECTION_LABELS.overview, icon: FileTextIcon },
    { key: "all", label: AGENT_SECTION_LABELS.all, icon: SlidersHorizontalIcon },
    { key: "persona", label: AGENT_SECTION_LABELS.persona, icon: BotIcon },
    {
      key: "messages",
      label: AGENT_SECTION_LABELS.messages,
      icon: MessageSquareIcon,
    },
    {
      key: "guidance",
      label: AGENT_SECTION_LABELS.guidance,
      icon: ShieldCheckIcon,
      count: guidanceCount,
    },
    {
      key: "sources",
      label: AGENT_SECTION_LABELS.sources,
      icon: DatabaseIcon,
      count: sourceCount,
    },
  ]

  return (
    <nav
      aria-label="Agent settings sections"
      className={cn("flex flex-col gap-0.5", className)}
    >
      {items.map((item) => {
        const Icon = item.icon
        const isActive = section === item.key
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onSectionChange(item.key)}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "flex h-9 w-full items-center gap-2 rounded-md px-2 text-sm transition-colors cursor-pointer",
              isActive
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Icon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 truncate text-start">
              {item.label}
            </span>
            {typeof item.count === "number" && (
              <span className="shrink-0 text-xs font-normal text-muted-foreground tabular-nums">
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}
