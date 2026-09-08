"use client"

import * as React from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"
import { toast } from "sonner"
import { useAuth } from "@/contexts/auth-context"
import { useEcho } from "@/contexts/echo-context"
import { useIsMobile } from "@/hooks/use-mobile"
import { Button } from "@/components/ui/button"
import { ShieldAlertIcon } from "@/components/ui/icons"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  type Conversation,
  type ConversationMessage,
  type MessageAttachment,
  type OrganizationMember,
  createConversationNote,
  fetchConversationMessages,
  fetchConversationNotes,
  fetchConversations,
  fetchOrganizationMembers,
  markConversationRead,
  sendConversationMessage,
  updateConversation,
} from "./api"
import { AssignAiDialog } from "./assign-ai-dialog"
import { AssignMemberDialog } from "./assign-member-dialog"
import { ConversationMessages } from "./conversation-messages"
import { type MessageType, ReplyComposer } from "./reply-composer"
import { InboxCustomerPanel } from "./inbox-customer-panel"
import { ConversationDetailHeader } from "./conversation-detail-header"

interface ConversationDetailViewProps {
  conversation: Conversation
  conversations: Conversation[]
  organizationId: number | string
  onMessageSent: (conversationId: number | string, preview: string) => void
  onConversationUpdate: (conversation: Conversation) => void
  onConversationDeleted?: (conversationId: number | string) => void
  onSelectConversation: (conversation: Conversation) => void
  onBack?: () => void
}

export function ConversationDetailView({
  conversation,
  conversations,
  organizationId,
  onMessageSent,
  onConversationUpdate,
  onConversationDeleted,
  onSelectConversation,
  onBack,
}: ConversationDetailViewProps) {
  const { user } = useAuth()
  const { echo } = useEcho()
  const [messages, setMessages] = React.useState<ConversationMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(true)
  const [isLoadingOlderMessages, setIsLoadingOlderMessages] =
    React.useState(false)
  const [nextMessageCursor, setNextMessageCursor] = React.useState<
    string | null
  >(null)
  const [isSending, setIsSending] = React.useState(false)
  const [sendError, setSendError] = React.useState<string | null>(null)
  const [isAssignMemberOpen, setIsAssignMemberOpen] = React.useState(false)
  const [preselectedAssigneeId, setPreselectedAssigneeId] = React.useState<
    number | string | null
  >(null)
  const [members, setMembers] = React.useState<OrganizationMember[] | null>(
    null
  )
  const [isAssignAiOpen, setIsAssignAiOpen] = React.useState(false)
  const scrollContainerRef = React.useRef<HTMLDivElement>(null)
  const isLoadingOlderMessagesRef = React.useRef(false)
  const shouldScrollToBottomRef = React.useRef(true)
  const pendingScrollAdjustmentRef = React.useRef<{
    scrollHeight: number
    scrollTop: number
  } | null>(null)

  const isMobile = useIsMobile()
  const panelRef = React.useRef<PanelImperativeHandle | null>(null)
  const [isPanelOpen, setIsPanelOpen] = React.useState(true)
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = React.useState(false)

  const togglePanel = () => {
    if (isMobile) {
      setIsDetailsSheetOpen((open) => !open)
      return
    }
    const panel = panelRef.current
    if (!panel) {
      setIsPanelOpen((open) => !open)
      return
    }

    if (panel.isCollapsed()) panel.expand()
    else panel.collapse()
  }

  const closePanel = () => {
    if (isMobile) {
      setIsDetailsSheetOpen(false)
      return
    }
    panelRef.current?.collapse()
  }

  const openAssignMemberDialog = (memberId?: number | string) => {
    setPreselectedAssigneeId(memberId ?? conversation.assignee?.id ?? null)
    setIsAssignMemberOpen(true)
  }

  React.useEffect(() => {
    let isCurrent = true

    if (!organizationId) {
      void Promise.resolve().then(() => {
        if (isCurrent) setMembers([])
      })
      return () => {
        isCurrent = false
      }
    }

    void Promise.resolve().then(() => {
      if (isCurrent) setMembers(null)
    })

    fetchOrganizationMembers(organizationId)
      .then((data) => {
        if (isCurrent) setMembers(data)
      })
      .catch(() => {
        if (isCurrent) setMembers([])
      })

    return () => {
      isCurrent = false
    }
  }, [organizationId])

  React.useEffect(() => {
    let isCurrent = true

    void Promise.resolve().then(() => {
      if (isCurrent) {
        setIsLoadingMessages(true)
        setNextMessageCursor(null)
      }
    })

    Promise.all([
      fetchConversationMessages(organizationId, conversation.id),
      fetchConversationNotes(organizationId, conversation.id).catch(() => []),
    ])
      .then(([messagePage, notes]) => {
        if (isCurrent) {
          shouldScrollToBottomRef.current = true
          setNextMessageCursor(messagePage.nextCursor)
          setMessages(
            [...messagePage.messages, ...notes].sort(
              (a, b) =>
                new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
            )
          )
        }
      })
      .catch(() => {
        if (isCurrent) setMessages([])
      })
      .finally(() => {
        if (isCurrent) setIsLoadingMessages(false)
      })

    return () => {
      isCurrent = false
    }
  }, [organizationId, conversation.id])

  React.useLayoutEffect(() => {
    const container = scrollContainerRef.current

    if (!container || isLoadingMessages) return

    const adjustment = pendingScrollAdjustmentRef.current
    if (adjustment) {
      container.scrollTop =
        container.scrollHeight - adjustment.scrollHeight + adjustment.scrollTop
      pendingScrollAdjustmentRef.current = null
      return
    }

    if (shouldScrollToBottomRef.current) {
      container.scrollTop = container.scrollHeight
      shouldScrollToBottomRef.current = false
      requestAnimationFrame(() => {
        if (container) {
          container.scrollTop = container.scrollHeight
        }
      })
    }
  }, [isLoadingMessages, messages])

  const loadOlderMessages = React.useCallback(async () => {
    if (!nextMessageCursor || isLoadingOlderMessagesRef.current) return

    isLoadingOlderMessagesRef.current = true
    setIsLoadingOlderMessages(true)

    try {
      const page = await fetchConversationMessages(
        organizationId,
        conversation.id,
        nextMessageCursor
      )
      const container = scrollContainerRef.current

      if (container) {
        pendingScrollAdjustmentRef.current = {
          scrollHeight: container.scrollHeight,
          scrollTop: container.scrollTop,
        }
      }

      shouldScrollToBottomRef.current = false
      setNextMessageCursor(page.nextCursor)
      setMessages((current) => {
        const existingIds = new Set(current.map((message) => message.id))
        const olderMessages = page.messages.filter(
          (message) => !existingIds.has(message.id)
        )

        return [...olderMessages, ...current].sort(
          (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime()
        )
      })
    } catch {
      // ignore
    } finally {
      isLoadingOlderMessagesRef.current = false
      setIsLoadingOlderMessages(false)
    }
  }, [conversation.id, nextMessageCursor, organizationId])

  const handleMessageScroll = React.useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      if (event.currentTarget.scrollTop <= 80) {
        void loadOlderMessages()
      }
    },
    [loadOlderMessages]
  )

  React.useEffect(() => {
    if (conversation.unreadCount === 0) return
    let isCurrent = true

    markConversationRead(organizationId, conversation.id)
      .then(() => {
        if (isCurrent) onConversationUpdate({ ...conversation, unreadCount: 0 })
      })
      .catch(() => {
        // Silently fail - badge just remains until the next successful attempt
      })

    return () => {
      isCurrent = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, conversation.id])

  React.useEffect(() => {
    if (!echo) return

    const channelName = `conversation.${conversation.id}`
    const channel = echo.private(channelName)

    channel.listen(
      "MessageSent",
      (event: {
        message_id: number
        direction: "inbound" | "outbound"
        body: string
        status: string
        type: string
        attachments?: {
          id: number
          filename: string
          url: string
          media_type: string | null
          size: number | null
        }[]
        sent_at: string
      }) => {
        shouldScrollToBottomRef.current = true
        setMessages((current) => {
          if (current.some((m) => m.id === event.message_id)) return current
          const attachments: MessageAttachment[] = (
            event.attachments ?? []
          ).map((a) => ({
            id: a.id,
            filename: a.filename,
            url: a.url,
            mediaType: a.media_type,
            size: a.size,
          }))
          return [
            ...current,
            {
              id: event.message_id,
              direction: event.direction,
              sender: null,
              body: event.body,
              status: event.status,
              type: event.type,
              attachments,
              sentAt: event.sent_at,
            },
          ]
        })
      }
    )

    channel.listen("ConversationUpdated", () => {
      fetchConversations(organizationId).then((convs) => {
        const freshConversation = convs.find((c) => c.id === conversation.id)
        if (freshConversation) onConversationUpdate(freshConversation)
      })
    })

    return () => {
      channel.stopListening("MessageSent")
      channel.stopListening("ConversationUpdated")
      echo.leave(channelName)
    }
  }, [echo, conversation.id, organizationId, onConversationUpdate])

  const handleReply = async (
    content: string,
    type: MessageType,
    files: File[]
  ) => {
    setIsSending(true)
    setSendError(null)
    try {
      if (type === "internal_note" && files.length > 0) {
        throw new Error("Attachments are not supported for internal notes.")
      }

      const message =
        type === "internal_note"
          ? await createConversationNote(
              organizationId,
              conversation.id,
              content
            )
          : await sendConversationMessage(organizationId, conversation.id, {
              body: content,
              files: files.length > 0 ? files : undefined,
            })
      shouldScrollToBottomRef.current = true
      setMessages((current) => [...current, message])
      if (type === "reply") onMessageSent(conversation.id, message.body)
    } catch {
      setSendError("Couldn't send that message. Please try again.")
    } finally {
      setIsSending(false)
    }
  }

  const handleTakeOver = async () => {
    try {
      const updated = await updateConversation(
        organizationId,
        conversation.id,
        {
          ai_handler: "human",
        }
      )
      onConversationUpdate(updated)
    } catch {
      setSendError("Couldn't take over the conversation. Please try again.")
    }
  }

  const handleAssignToMe = async () => {
    if (!user) return
    try {
      const updated = await updateConversation(
        organizationId,
        conversation.id,
        {
          assigned_to_user_id: user.id,
        }
      )
      onConversationUpdate(updated)
    } catch {
      setSendError("Couldn't assign the conversation. Please try again.")
    }
  }

  const handleUnmarkSpam = async () => {
    try {
      const updated = await updateConversation(
        organizationId,
        conversation.id,
        {
          status: "open",
        }
      )
      onConversationUpdate(updated)
      toast.success("Unmarked as spam")
    } catch {
      toast.error("Couldn't unmark as spam")
    }
  }

  const conversationColumn = (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <ConversationDetailHeader
        conversation={conversation}
        organizationId={organizationId}
        members={members}
        isPanelOpen={isMobile ? isDetailsSheetOpen : isPanelOpen}
        onTogglePanel={togglePanel}
        onAssignClick={openAssignMemberDialog}
        onAssignAiClick={() => setIsAssignAiOpen(true)}
        onConversationUpdate={onConversationUpdate}
        onConversationDeleted={onConversationDeleted}
        onBack={onBack}
      />

      {conversation.status === "spam" && (
        <div className="flex items-center justify-between gap-3 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-xs text-destructive">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldAlertIcon className="size-4 shrink-0" />
            <span className="font-medium truncate">
              This conversation is marked as spam.
            </span>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-7 shrink-0 text-xs font-medium"
            onClick={handleUnmarkSpam}
          >
            Not spam
          </Button>
        </div>
      )}

      <div
        ref={scrollContainerRef}
        onScroll={handleMessageScroll}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto bg-muted/50"
      >
        <ConversationMessages
          messages={messages}
          isLoading={isLoadingMessages}
          isLoadingOlder={isLoadingOlderMessages}
          contactAvatarUrl={conversation.customer.avatarUrl}
          contactName={conversation.customer.displayName}
          aiHandler={conversation.aiHandler}
          aiStateReason={conversation.aiStateReason}
          aiStateHistory={conversation.aiStateHistory}
          onAssignToMe={handleAssignToMe}
          onAssignToTeam={openAssignMemberDialog}
        />
      </div>

      {sendError ? (
        <p className="px-5 pt-2 text-xs text-destructive">{sendError}</p>
      ) : null}
      <ReplyComposer
        onSubmit={handleReply}
        isLoading={isSending}
        aiHandler={conversation.aiHandler}
        aiStateReason={conversation.aiStateReason}
        onTakeOver={handleTakeOver}
      />
    </div>
  )

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      {isMobile ? (
        <div className="flex flex-1 overflow-hidden">
          {conversationColumn}
          <InboxCustomerPanel
            isMobile
            conversation={conversation}
            conversations={conversations}
            organizationId={organizationId}
            onSelectConversation={onSelectConversation}
            onConversationUpdate={onConversationUpdate}
            onClose={closePanel}
            openMobile={isDetailsSheetOpen}
            onOpenMobileChange={setIsDetailsSheetOpen}
          />
        </div>
      ) : (
        <ResizablePanelGroup className="flex-1 overflow-hidden">
          <ResizablePanel
            id="conversation-column"
            defaultSize="60%"
            minSize="40%"
            className="min-w-0"
          >
            {conversationColumn}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <InboxCustomerPanel
            isMobile={false}
            conversation={conversation}
            conversations={conversations}
            organizationId={organizationId}
            onSelectConversation={onSelectConversation}
            onConversationUpdate={onConversationUpdate}
            onClose={closePanel}
            panelRef={panelRef}
            onResize={(size) => {
              if (size.asPercentage <= 0) setIsPanelOpen(false)
              else setIsPanelOpen(true)
            }}
          />
        </ResizablePanelGroup>
      )}

      <AssignMemberDialog
        open={isAssignMemberOpen}
        onOpenChange={(open) => {
          setIsAssignMemberOpen(open)
          if (!open) setPreselectedAssigneeId(null)
        }}
        organizationId={organizationId}
        conversationId={conversation.id}
        assignedToUserId={conversation.assignee?.id ?? null}
        preselectedUserId={preselectedAssigneeId}
        members={members}
        onAssigned={onConversationUpdate}
        onAssignAi={() => setIsAssignAiOpen(true)}
      />

      <AssignAiDialog
        open={isAssignAiOpen}
        onOpenChange={setIsAssignAiOpen}
        organizationId={organizationId}
        conversationId={conversation.id}
        onActivated={onConversationUpdate}
      />
    </div>
  )
}
