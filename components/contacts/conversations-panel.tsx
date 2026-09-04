"use client"

import {
  MessageSquareIcon,
  MailIcon,
  ChevronRightIcon,
} from "@/components/ui/icons"
import Link from "next/link"

import { cn } from "@/lib/utils"
import { TypographyH4 } from "@/components/ui/typography"
import type {
  Conversation,
  ConversationStatus,
} from "@/components/contacts/data"
import { formatRelative } from "@/components/contacts/format"

const STATUS_DOT: Record<ConversationStatus, string> = {
  open: "bg-emerald-500",
  pending: "bg-chart-3",
  snoozed: "bg-muted-foreground",
  closed: "bg-border",
}

const STATUS_LABEL: Record<ConversationStatus, string> = {
  open: "Open",
  pending: "Pending",
  snoozed: "Snoozed",
  closed: "Closed",
}

const CHANNEL_ICON: Record<Conversation["channel"], typeof MessageSquareIcon> = {
  chat: MessageSquareIcon,
  email: MailIcon,
  whatsapp: MessageSquareIcon,
}

const CHANNEL_LABEL: Record<Conversation["channel"], string> = {
  chat: "Live chat",
  email: "Email",
  whatsapp: "WhatsApp",
}

export function ConversationsPanel({
  conversations,
}: {
  conversations: Conversation[]
}) {
  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <header className="flex items-center justify-between gap-2 border-b border-border px-5 py-3.5">
        <TypographyH4 className="text-foreground">
          Recent conversations
        </TypographyH4>
        <Link
          href="/activity"
          className="text-xs font-medium text-primary hover:underline"
        >
          View all
        </Link>
      </header>

      <ul className="divide-y divide-border">
        {conversations.map((conv) => {
          const ChannelIcon = CHANNEL_ICON[conv.channel]
          return (
            <li key={conv.id}>
              <Link
                href={`/activity?conversation=${conv.id}`}
                className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30"
              >
                <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-muted">
                  <ChannelIcon
                    className="size-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>

                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <span
                        className={cn(
                          "size-1.5 rounded-full",
                          STATUS_DOT[conv.status]
                        )}
                        aria-hidden="true"
                      />
                      {STATUS_LABEL[conv.status]}
                    </span>
                    <span className="text-xs text-muted-foreground/60">·</span>
                    <span className="text-xs text-muted-foreground">
                      {CHANNEL_LABEL[conv.channel]}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatRelative(conv.timestamp)}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-sm leading-relaxed text-pretty text-foreground/90">
                    {conv.preview}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    Handled by {conv.agent}
                  </span>
                </div>

                <ChevronRightIcon
                  className="mt-1 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
