"use client"

import { CheckCheckIcon, FileTextIcon } from "@/components/ui/icons"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Bubble, BubbleContent } from "@/components/ui/bubble"
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
  MessageHeader,
} from "@/components/ui/message"
import { cn } from "@/lib/utils"
import { AiEscalationCard, AiTimelineEvent } from "./ai-handoff"
import type {
  AiHandlerState,
  AiStateHistoryEntry,
  ConversationMessage,
  MessageAttachment,
} from "./api"

interface ConversationMessagesProps {
  messages: ConversationMessage[]
  isLoading: boolean
  isLoadingOlder?: boolean
  contactAvatarUrl: string | null
  contactName: string
  aiHandler: AiHandlerState
  aiStateReason: string | null
  aiStateHistory: AiStateHistoryEntry[]
  onAssignToMe: () => void
  onAssignToTeam: () => void
}

function ConversationMessageSkeleton({
  align = "start",
}: {
  align?: "start" | "end"
}) {
  const isEnd = align === "end"

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isEnd ? "justify-end" : "justify-start"
      )}
    >
      {!isEnd ? <Skeleton className="size-8 shrink-0 rounded-full" /> : null}
      <div
        className={cn(
          "flex w-2/3 flex-col gap-2",
          isEnd ? "items-end" : "items-start"
        )}
      >
        {!isEnd ? <Skeleton className="h-3 w-24" /> : null}
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-3 w-12" />
      </div>
    </div>
  )
}

function timeLabel(timestamp: string) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp))
}

function dayKey(timestamp: string) {
  return new Date(timestamp).toDateString()
}

function dayLabel(timestamp: string) {
  const date = new Date(timestamp)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)

  if (date.toDateString() === today.toDateString()) return "Today"
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday"

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  }).format(date)
}

function isImageAttachment(mediaType: string | null): boolean {
  return !!mediaType && mediaType.startsWith("image/")
}

function MessageAttachments({ attachments }: { attachments: MessageAttachment[] }) {
  if (attachments.length === 0) return null

  const images = attachments.filter((a) => isImageAttachment(a.mediaType))
  const files = attachments.filter((a) => !isImageAttachment(a.mediaType))

  return (
    <div className="flex flex-col gap-2 mt-1.5">
      {images.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {images.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block overflow-hidden rounded-lg border border-border"
            >
              <img
                alt={attachment.filename}
                className="size-20 object-cover"
                height={80}
                src={attachment.url}
                width={80}
              />
            </a>
          ))}
        </div>
      ) : null}
      {files.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {files.map((attachment) => (
            <a
              key={attachment.id}
              href={attachment.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Badge variant="outline" className="gap-1.5 font-normal">
                <FileTextIcon className="size-3" />
                {attachment.filename}
              </Badge>
            </a>
          ))}
        </div>
      ) : null}
    </div>
  )
}

type Row =
  | { kind: "message"; timestamp: string; message: ConversationMessage }
  | { kind: "event"; timestamp: string; event: AiStateHistoryEntry }

export function ConversationMessages({
  messages,
  isLoading,
  isLoadingOlder,
  contactAvatarUrl,
  contactName,
  aiHandler,
  aiStateReason,
  aiStateHistory,
  onAssignToMe,
  onAssignToTeam,
}: ConversationMessagesProps) {
  if (isLoading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading messages"
        className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-7 px-6"
      >
        <ConversationMessageSkeleton />
        <ConversationMessageSkeleton align="end" />
        <ConversationMessageSkeleton />
      </div>
    )
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">No messages yet</p>
      </div>
    )
  }

  const timelineEvents = aiStateHistory.filter(
    (entry) => entry.to === "ai-active" || entry.to === "human"
  )

  const timeline: Row[] = [
    ...messages.map((message): Row => ({
      kind: "message",
      timestamp: message.sentAt,
      message,
    })),
    ...timelineEvents.map((event): Row => ({
      kind: "event",
      timestamp: event.changedAt,
      event,
    })),
  ].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  )

  const rows = timeline.reduce<{ row: Row; showDivider: boolean }[]>(
    (rows, row) => {
      const previousKey = rows.at(-1)
        ? dayKey(rows.at(-1)!.row.timestamp)
        : null
      rows.push({ row, showDivider: dayKey(row.timestamp) !== previousKey })
      return rows
    },
    []
  )

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 py-7 px-6">
      {isLoadingOlder ? (
        <div className="flex justify-center py-2" aria-live="polite">
          <Spinner className="text-muted-foreground" />
          <span className="sr-only">Loading older messages</span>
        </div>
      ) : null}
      <MessageGroup className="gap-6">
        {rows.map(({ row, showDivider }) => {
          if (row.kind === "event") {
            return (
              <div
                key={`event-${row.event.changedAt}-${row.event.to}`}
                className="flex flex-col gap-6"
              >
                {showDivider ? (
                  <p className="text-center text-xs text-muted-foreground">
                    {dayLabel(row.timestamp)}
                  </p>
                ) : null}
                <AiTimelineEvent
                  type={row.event.to === "ai-active" ? "handoff" : "reclaimed"}
                  changedAt={row.event.changedAt}
                  agentName={row.event.changedBy?.name}
                />
              </div>
            )
          }

          const message = row.message
          const isAgent = message.direction === "outbound"
          const isInternalNote = message.type === "internal_note"
          const align = isAgent ? "end" : "start"

          return (
            <div key={message.id} className="flex flex-col gap-6">
              {showDivider ? (
                <p className="text-center text-xs text-muted-foreground">
                  {dayLabel(message.sentAt)}
                </p>
              ) : null}
              <Message align={align}>
                {!isAgent ? (
                  <MessageAvatar>
                    <Avatar className="size-8">
                      {contactAvatarUrl ? (
                        <AvatarImage src={contactAvatarUrl} alt="" />
                      ) : null}
                      <AvatarFallback>{contactName.slice(0, 1)}</AvatarFallback>
                    </Avatar>
                  </MessageAvatar>
                ) : null}
                <MessageContent>
                  {!isAgent ? (
                    <MessageHeader>{contactName}</MessageHeader>
                  ) : message.sender ? (
                    <MessageHeader>
                      {message.sender.name}
                      {isInternalNote ? (
                        <Badge
                          variant="outline"
                          className="ml-2 border-amber-300 text-amber-700 dark:border-amber-600 dark:text-amber-400"
                        >
                          Internal note
                        </Badge>
                      ) : null}
                    </MessageHeader>
                  ) : null}
                  <Bubble
                    align={align}
                    variant={isInternalNote ? "outline" : isAgent ? "tinted" : "outline"}
                    className={
                      isInternalNote
                        ? "[&>[data-slot=bubble-content]]:bg-amber-50 [&>[data-slot=bubble-content]]:border-amber-200 dark:[&>[data-slot=bubble-content]]:bg-amber-950/30 dark:[&>[data-slot=bubble-content]]:border-amber-700"
                        : undefined
                    }
                  >
                    <BubbleContent>
                      <p className="whitespace-pre-wrap">{message.body}</p>
                      <MessageAttachments attachments={message.attachments} />
                    </BubbleContent>
                  </Bubble>
                  <MessageFooter>
                    <span
                      suppressHydrationWarning
                      className="flex items-center gap-1"
                    >
                      {timeLabel(message.sentAt)}
                      {isAgent &&
                      !isInternalNote &&
                      (message.status === "delivered" ||
                        message.status === "read") ? (
                        <CheckCheckIcon className="size-3.5" />
                      ) : null}
                    </span>
                  </MessageFooter>
                </MessageContent>
              </Message>
            </div>
          )
        })}
      </MessageGroup>

      {aiHandler === "needs-attention" ? (
        <AiEscalationCard
          reason={aiStateReason}
          onAssignToMe={onAssignToMe}
          onAssignToTeam={onAssignToTeam}
        />
      ) : null}
    </div>
  )
}
