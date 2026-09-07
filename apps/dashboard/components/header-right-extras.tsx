"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import { useActiveOrganization } from "@/hooks/use-active-organization"
import {
  fetchConversations,
  type Conversation,
} from "@/components/inbox/api"
import { formatRelative } from "@/components/contacts/format"
import { Badge } from "@/components/reui/badge"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { BellIcon, BookOpenIcon } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RightSidebarTrigger } from "@/components/right-sidebar"

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function HeaderRightExtras() {
  const pathname = usePathname()
  const organization = useActiveOrganization()
  const [conversations, setConversations] = React.useState<Conversation[]>([])

  React.useEffect(() => {
    let isCurrent = true

    if (!organization) {
      setConversations([])
      return () => {
        isCurrent = false
      }
    }

    fetchConversations(organization.id)
      .then((data) => {
        if (isCurrent) setConversations(data)
      })
      .catch(() => {
        if (isCurrent) setConversations([])
      })

    return () => {
      isCurrent = false
    }
  }, [organization])

  const unreadCount = conversations.filter((c) => c.unreadCount > 0).length
  const recent = [...conversations]
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 5)

  return (
    <div className="ml-auto flex items-center gap-2">
      <Button
        variant="ghost"
        size="sm"
        nativeButton={false}
        render={<Link href="/docs/access" />}
        className="gap-1.5"
      >
        <BookOpenIcon />
        <span>Documentation</span>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="outline"
              size="icon"
              className="relative"
              aria-label={`Notifications (${unreadCount})`}
            />
          }
        >
          <BellIcon aria-hidden="true" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              size="sm"
              className="absolute -top-1.5 -right-2 rounded-full px-1"
              aria-hidden="true"
            >
              {unreadCount}
            </Badge>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80" align="end" sideOffset={8}>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {recent.length > 0 ? (
              <DropdownMenuGroup>
                {recent.map((conversation) => (
                  <DropdownMenuItem
                    key={conversation.id}
                    className="flex items-start gap-2 py-1"
                    render={
                      <Link href={`/inbox?conversation=${conversation.id}`} />
                    }
                  >
                    <Avatar className="size-8 shrink-0">
                      {conversation.customer.avatarUrl ? (
                        <AvatarImage
                          src={conversation.customer.avatarUrl}
                          alt={conversation.customer.displayName}
                        />
                      ) : null}
                      <AvatarFallback className="text-xs font-medium">
                        {initials(conversation.customer.displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex min-w-0 flex-1 flex-col gap-px">
                      <p className="truncate leading-snug">
                        <span className="font-medium">
                          {conversation.customer.displayName}
                        </span>{" "}
                        <span className="text-muted-foreground">
                          {conversation.lastMessagePreview ?? "sent a message"}
                        </span>
                      </p>
                      {conversation.lastMessageAt ? (
                        <span className="text-muted-foreground">
                          {formatRelative(conversation.lastMessageAt)}
                        </span>
                      ) : null}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="bg-primary mt-2 size-1.5 shrink-0 rounded-full" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            ) : (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="justify-center"
              render={<Link href="/inbox" />}
            >
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      {pathname === "/dashboard" && <RightSidebarTrigger />}
    </div>
  )
}
