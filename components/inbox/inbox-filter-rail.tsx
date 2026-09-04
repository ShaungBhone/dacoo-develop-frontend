"use client"

import * as React from "react"
import {
  AtSignIcon,
  CircleDashedIcon,
  Clock3Icon,
  FlameIcon,
  InboxIcon,
  MessageSquareIcon,
  ShieldAlertIcon,
  SquarePenIcon,
  StarIcon,
  type LucideIcon,
} from "@/components/ui/icons"
import { useAuth } from "@/contexts/auth-context"
import { getChannelMeta } from "./channel-icon"
import type { Conversation } from "./api"
import { cn } from "@/lib/utils"

export type InboxFilter =
  | { type: "inbox"; key: "your_inbox" | "mentions" | "created_by_you" | "all" | "unassigned" | "spam" }
  | { type: "view"; key: "starred" | "high_priority" | "snoozed" }
  | { type: "channel"; key: string; name: string }

interface InboxFilterRailProps {
  conversations: Conversation[]
  activeFilter?: InboxFilter
  onSelectFilter?: (filter: InboxFilter) => void
}

interface NavItemProps {
  icon?: LucideIcon | React.ComponentType<{ className?: string }>
  label: string
  count: number
  isCurrent?: boolean
  onClick?: () => void
}

function InboxNavigationItem({
  icon: Icon,
  label,
  count,
  isCurrent = false,
  onClick,
}: NavItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        aria-current={isCurrent ? "page" : undefined}
        className={cn(
          "flex h-9 w-full items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors text-foreground hover:bg-muted/80",
          isCurrent && "bg-muted font-medium text-foreground"
        )}
      >
        {Icon ? (
          <Icon
            className={cn(
              "size-4 shrink-0",
              isCurrent ? "text-foreground" : "text-muted-foreground"
            )}
            aria-hidden="true"
          />
        ) : null}
        <span className="min-w-0 flex-1 truncate text-left">{label}</span>
        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      </button>
    </li>
  )
}

function InboxNavigationSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section
      aria-labelledby={`inbox-navigation-${title.toLowerCase().replaceAll(" ", "-")}`}
    >
      <h2
        id={`inbox-navigation-${title.toLowerCase().replaceAll(" ", "-")}`}
        className="px-2.5 pb-2 text-xs font-medium text-muted-foreground"
      >
        {title}
      </h2>
      <ul className="flex flex-col gap-0.5">{children}</ul>
    </section>
  )
}

export function InboxFilterRail({
  conversations,
  activeFilter = { type: "inbox", key: "all" },
  onSelectFilter,
}: InboxFilterRailProps) {
  const { user } = useAuth()

  // Dynamic counts for primary inbox filters
  const counts = React.useMemo(() => {
    const userId = user?.id

    const yourInbox = conversations.filter(
      (c) => userId && c.assignee?.id === userId
    ).length

    const mentions = conversations.filter(
      (c) => userId && c.assignee?.id === userId
    ).length

    const createdByYou = conversations.filter(
      (c) => userId && c.assignee?.id === userId
    ).length

    const all = conversations.length

    const unassigned = conversations.filter(
      (c) => !c.assignee && c.aiHandler === "human"
    ).length

    const spam = conversations.filter(
      (c) => c.status === "closed" && c.priority === "low"
    ).length

    const starred = conversations.filter(
      (c) => c.priority === "urgent"
    ).length

    const highPriority = conversations.filter(
      (c) => c.priority === "high" || c.priority === "urgent"
    ).length

    const snoozed = conversations.filter(
      (c) => c.status === "pending"
    ).length

    return {
      yourInbox,
      mentions,
      createdByYou,
      all,
      unassigned,
      spam,
      starred,
      highPriority,
      snoozed,
    }
  }, [conversations, user])

  // Extract dynamic connected team inboxes with channel brand icons and live counts
  const teamInboxes = React.useMemo(() => {
    const map = new Map<
      string,
      { id: number | string; name: string; provider: string; count: number }
    >()

    for (const conversation of conversations) {
      const key = conversation.inbox.name || String(conversation.inbox.id)
      const existing = map.get(key)
      if (existing) {
        existing.count++
      } else {
        map.set(key, {
          id: conversation.inbox.id,
          name: conversation.inbox.name,
          provider: conversation.inbox.provider,
          count: 1,
        })
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    )
  }, [conversations])

  const inboxItems: {
    key: "your_inbox" | "mentions" | "created_by_you" | "all" | "unassigned" | "spam"
    label: string
    count: number
    icon: LucideIcon
  }[] = [
    { key: "your_inbox", label: "Your inbox", count: counts.yourInbox, icon: InboxIcon },
    { key: "mentions", label: "Mentions", count: counts.mentions, icon: AtSignIcon },
    { key: "created_by_you", label: "Created by you", count: counts.createdByYou, icon: SquarePenIcon },
    { key: "all", label: "All", count: counts.all, icon: MessageSquareIcon },
    { key: "unassigned", label: "Unassigned", count: counts.unassigned, icon: CircleDashedIcon },
    { key: "spam", label: "Spam", count: counts.spam, icon: ShieldAlertIcon },
  ]

  const viewItems: {
    key: "starred" | "high_priority" | "snoozed"
    label: string
    count: number
    icon: LucideIcon
  }[] = [
    { key: "starred", label: "Starred", count: counts.starred, icon: StarIcon },
    { key: "high_priority", label: "High priority", count: counts.highPriority, icon: FlameIcon },
    { key: "snoozed", label: "Snoozed", count: counts.snoozed, icon: Clock3Icon },
  ]

  return (
    <nav
      id="inbox-filters"
      aria-label="Inbox navigation"
      className="flex w-full flex-col gap-5 p-3"
    >
      <ul className="flex flex-col gap-0.5">
        {inboxItems.map((item) => (
          <InboxNavigationItem
            key={item.key}
            label={item.label}
            count={item.count}
            icon={item.icon}
            isCurrent={
              activeFilter.type === "inbox" && activeFilter.key === item.key
            }
            onClick={() =>
              onSelectFilter?.({ type: "inbox", key: item.key })
            }
          />
        ))}
      </ul>

      <InboxNavigationSection title="Views">
        {viewItems.map((item) => (
          <InboxNavigationItem
            key={item.key}
            label={item.label}
            count={item.count}
            icon={item.icon}
            isCurrent={
              activeFilter.type === "view" && activeFilter.key === item.key
            }
            onClick={() =>
              onSelectFilter?.({ type: "view", key: item.key })
            }
          />
        ))}
      </InboxNavigationSection>

      {teamInboxes.length > 0 ? (
        <InboxNavigationSection title="Team inboxes">
          {teamInboxes.map((inbox) => {
            const channelMeta = getChannelMeta(inbox.provider)
            return (
              <InboxNavigationItem
                key={inbox.name}
                label={inbox.name}
                count={inbox.count}
                icon={channelMeta.Icon}
                isCurrent={
                  activeFilter.type === "channel" &&
                  activeFilter.key === inbox.name
                }
                onClick={() =>
                  onSelectFilter?.({
                    type: "channel",
                    key: inbox.name,
                    name: inbox.name,
                  })
                }
              />
            )
          })}
        </InboxNavigationSection>
      ) : null}
    </nav>
  )
}
