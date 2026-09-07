"use client"

import { ListFilterIcon, SearchIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import type { Conversation } from "./api"
import { ConversationListItem } from "./conversation-list-item"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Skeleton } from "@/components/ui/skeleton"

function ConversationListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <Skeleton className="size-10 shrink-0 rounded-full" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3.5 w-48" />
      </div>
    </div>
  )
}

interface ConversationListViewProps {
  conversations: Conversation[]
  selectedConversation: Conversation | null
  onSelectConversation: (conversation: Conversation) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  isFilterOpen: boolean
  onFilterToggle: () => void
  filterRail?: React.ReactNode
  isLoading: boolean
  error: string | null
}

export function ConversationListView({
  conversations,
  selectedConversation,
  onSelectConversation,
  searchQuery,
  onSearchChange,
  isFilterOpen,
  onFilterToggle,
  filterRail,
  isLoading,
  error,
}: ConversationListViewProps) {
  const visibleConversations = [...conversations].sort((first, second) => {
    const firstTime = first.lastMessageAt
      ? new Date(first.lastMessageAt).getTime()
      : 0
    const secondTime = second.lastMessageAt
      ? new Date(second.lastMessageAt).getTime()
      : 0
    return secondTime - firstTime
  })
  const emptyStateDescription = searchQuery
    ? "Try a different search"
    : "Your inbox is all caught up!"

  return (
    <aside className="flex w-full shrink-0 flex-col overflow-hidden border-r border-border bg-background md:w-80">
      <div className="p-3">
        <div className="flex items-center gap-2">
          <InputGroup>
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Search conversations"
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
            />
          </InputGroup>
          <Button
            type="button"
            variant={isFilterOpen ? "secondary" : "ghost"}
            size="icon"
            aria-label={isFilterOpen ? "Hide filters" : "Show filters"}
            aria-controls="inbox-filters"
            aria-expanded={isFilterOpen}
            onClick={onFilterToggle}
          >
            <ListFilterIcon />
          </Button>
        </div>
      </div>

      {isFilterOpen && filterRail ? (
        <div className="scrollbar-thin max-h-72 shrink-0 overflow-y-auto border-b border-border">
          {filterRail}
        </div>
      ) : null}

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col">
            {[0, 1, 2, 3].map((index) => (
              <ConversationListItemSkeleton key={index} />
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">{error}</p>
          </div>
        ) : visibleConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
            <p className="text-sm font-medium text-foreground">
              No conversations found
            </p>
            <p className="text-xs text-muted-foreground">
              {emptyStateDescription}
            </p>
          </div>
        ) : (
          <ul>
            {visibleConversations.map((conversation) => (
              <li key={conversation.id}>
                <ConversationListItem
                  conversation={conversation}
                  isSelected={selectedConversation?.id === conversation.id}
                  onSelect={() => onSelectConversation(conversation)}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
