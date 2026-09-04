"use client"

import * as React from "react"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/auth-context"
import { fetchConversations, type Conversation } from "./api"
import { ConversationListView } from "./conversation-list-view"
import { ConversationDetailView } from "./conversation-detail-view"
import { InboxFilterRail, type InboxFilter } from "./inbox-filter-rail"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { MessageSquareDashedIcon } from "@/components/ui/icons"

export function InboxView() {
  const organization = useActiveOrganization()
  const isMobile = useIsMobile()
  const { user } = useAuth()
  const [conversations, setConversations] = React.useState<Conversation[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [selectedConversationId, setSelectedConversationId] = React.useState<
    number | string | null
  >(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [isFilterOpen, setIsFilterOpen] = React.useState(false)
  const [activeFilter, setActiveFilter] = React.useState<InboxFilter>({
    type: "inbox",
    key: "all",
  })

  React.useEffect(() => {
    let isCurrent = true

    void Promise.resolve().then(() => {
      if (!isCurrent) return

      if (!organization) {
        setConversations([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setError(null)

      fetchConversations(organization.id)
        .then((data) => {
          if (!isCurrent) return
          setConversations(data)
        })
        .catch(() => {
          if (isCurrent) setError("Couldn't load your inbox. Please try again.")
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false)
        })
    })

    return () => {
      isCurrent = false
    }
  }, [organization])

  const visibleConversations = React.useMemo(() => {
    let list = conversations
    const userId = user?.id

    if (activeFilter.type === "inbox") {
      switch (activeFilter.key) {
        case "your_inbox":
          list = list.filter((c) => userId && c.assignee?.id === userId)
          break
        case "mentions":
          list = list.filter((c) => userId && c.assignee?.id === userId)
          break
        case "created_by_you":
          list = list.filter((c) => userId && c.assignee?.id === userId)
          break
        case "unassigned":
          list = list.filter((c) => !c.assignee && c.aiHandler === "human")
          break
        case "spam":
          list = list.filter(
            (c) => c.status === "closed" && c.priority === "low"
          )
          break
        case "all":
        default:
          break
      }
    } else if (activeFilter.type === "view") {
      switch (activeFilter.key) {
        case "starred":
          list = list.filter((c) => c.priority === "urgent")
          break
        case "high_priority":
          list = list.filter(
            (c) => c.priority === "high" || c.priority === "urgent"
          )
          break
        case "snoozed":
          list = list.filter((c) => c.status === "pending")
          break
      }
    } else if (activeFilter.type === "channel") {
      list = list.filter(
        (c) =>
          c.inbox.name === activeFilter.name ||
          String(c.inbox.id) === activeFilter.key
      )
    }

    if (!searchQuery) return list

    const query = searchQuery.toLowerCase()
    return list.filter(
      (conversation) =>
        conversation.customer.displayName.toLowerCase().includes(query) ||
        conversation.lastMessagePreview?.toLowerCase().includes(query)
    )
  }, [activeFilter, searchQuery, conversations, user])

  const selectedConversation =
    conversations.find(
      (conversation) => conversation.id === selectedConversationId
    ) ?? null

  const handleMessageSent = (
    conversationId: number | string,
    preview: string
  ) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              lastMessagePreview: preview,
              lastMessageAt: new Date().toISOString(),
            }
          : conversation
      )
    )
  }

  const handleConversationUpdate = (updated: Conversation) => {
    setConversations((current) =>
      current.map((conversation) =>
        conversation.id === updated.id ? updated : conversation
      )
    )
  }

  React.useEffect(() => {
    const hasActiveAi = conversations.some((c) => c.aiHandler === "ai-active")
    if (!hasActiveAi || !organization) return

    const interval = setInterval(async () => {
      try {
        const freshConversations = await fetchConversations(organization.id)
        setConversations(freshConversations)
      } catch {
        // Silently fail - will retry on next interval
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [conversations, organization])

  const filterRail = (
    <InboxFilterRail
      conversations={conversations}
      activeFilter={activeFilter}
      onSelectFilter={setActiveFilter}
    />
  )

  const inboxContent = (
    <div className="flex h-full min-h-0 min-w-0 flex-1 overflow-hidden">
      {(!isMobile || !selectedConversation) && (
        <ConversationListView
          conversations={visibleConversations}
          selectedConversation={selectedConversation}
          onSelectConversation={(conversation) =>
            setSelectedConversationId(conversation.id)
          }
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          isFilterOpen={isFilterOpen}
          onFilterToggle={() => setIsFilterOpen((open) => !open)}
          filterRail={isMobile ? filterRail : undefined}
          isLoading={isLoading}
          error={error}
        />
      )}

      {selectedConversation ? (
        <ConversationDetailView
          key={selectedConversation.id}
          conversation={selectedConversation}
          conversations={conversations}
          organizationId={organization?.id ?? 0}
          onMessageSent={handleMessageSent}
          onConversationUpdate={handleConversationUpdate}
          onSelectConversation={(conversation) =>
            setSelectedConversationId(conversation.id)
          }
          onBack={isMobile ? () => setSelectedConversationId(null) : undefined}
        />
      ) : (
        !isMobile && (
          <div className="flex flex-1 items-center justify-center bg-muted/10 p-8">
            <Empty className="max-w-md border-border/50 bg-background/50 backdrop-blur-xs">
              <EmptyMedia variant="outline">
                <MessageSquareDashedIcon />
              </EmptyMedia>
              <EmptyHeader>
                <EmptyTitle>No conversation selected</EmptyTitle>
                <EmptyDescription>
                  Select a conversation from the list to view messages.
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          </div>
        )
      )}
    </div>
  )

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden bg-background text-foreground">
      {!isMobile && isFilterOpen ? (
        <ResizablePanelGroup className="min-h-0 flex-1 overflow-hidden">
          <ResizablePanel
            id="inbox-filters-panel"
            defaultSize="20%"
            minSize="12%"
            maxSize="32%"
            className="min-w-0"
          >
            <aside className="flex h-full flex-col bg-sidebar">
              <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
                {filterRail}
              </div>
            </aside>
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel id="inbox-content" className="min-h-0 min-w-0">
            {inboxContent}
          </ResizablePanel>
        </ResizablePanelGroup>
      ) : (
        inboxContent
      )}
    </div>
  )
}
