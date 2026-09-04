"use client"

import { cn } from "@/lib/utils"
import { getTagColor } from "@/lib/tag-colors"
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCheckIcon } from "@/components/ui/icons"
import type { Conversation } from "./api"
import { getChannelMeta } from "./channel-icon"
import { formatRelative } from "@/components/contacts/format"

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

interface ConversationListItemProps {
  conversation: Conversation
  isSelected: boolean
  onSelect: () => void
}

export function ConversationListItem({
  conversation,
  isSelected,
  onSelect,
}: ConversationListItemProps) {
  const channel = getChannelMeta(conversation.inbox.provider)

  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60",
        isSelected && "bg-muted"
      )}
    >
      <Avatar className="size-10 shrink-0">
        {conversation.customer.avatarUrl ? (
          <AvatarImage
            src={conversation.customer.avatarUrl}
            alt={conversation.customer.displayName}
          />
        ) : null}
        <AvatarFallback className="text-xs font-medium">
          {initials(conversation.customer.displayName)}
        </AvatarFallback>
        <AvatarBadge
          className={
            conversation.customer.isOnline ? "bg-emerald-500" : "bg-muted-foreground/40"
          }
          aria-label={conversation.customer.isOnline ? "Online" : "Offline"}
        />
      </Avatar>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">
            {conversation.customer.displayName}
          </span>
          {conversation.unreadCount === 0 ? (
            <CheckCheckIcon className="size-3.5 text-primary" />
          ) : (
            <span className="flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {conversation.unreadCount > 99 ? "99+" : conversation.unreadCount}
            </span>
          )}
          {conversation.lastMessageAt ? (
            <span
              className="ml-auto shrink-0 text-[11px] text-muted-foreground"
              suppressHydrationWarning
            >
              {formatRelative(conversation.lastMessageAt)}
            </span>
          ) : null}
        </div>

        <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">
          {conversation.lastMessagePreview ?? "No messages yet"}
        </p>

        <div className="flex min-w-0 items-center justify-between gap-2 pt-0.5">
          <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
            <channel.Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{channel.label}</span>
          </div>

          {conversation.tags.length > 0 ? (
            <div className="flex shrink-0 items-center gap-1">
              {conversation.tags.slice(0, 2).map((tag) => {
                const color = getTagColor(tag.name, tag.color)
                return (
                  <span
                    key={tag.id}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm border px-1.5 py-0 text-[10px] font-medium leading-4",
                      color.bg,
                      color.text,
                      color.border
                    )}
                  >
                    <span className={cn("size-1 rounded-full", color.dot)} />
                    <span className="max-w-[60px] truncate">{tag.name}</span>
                  </span>
                )
              })}
              {conversation.tags.length > 2 ? (
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  +{conversation.tags.length - 2}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </button>
  )
}
