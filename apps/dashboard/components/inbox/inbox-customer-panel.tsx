"use client"

import Link from "next/link"
import type { PanelImperativeHandle } from "react-resizable-panels"
import { SparklesIcon, XIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ResizablePanel } from "@/components/ui/resizable"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import type { Conversation } from "./api"

interface InboxCustomerPanelProps {
  conversation: Conversation
  conversations: Conversation[]
  organizationId: number | string
  onSelectConversation: (conversation: Conversation) => void
  onConversationUpdate?: (conversation: Conversation) => void
  onClose: () => void
  isMobile: boolean
  panelRef?: React.RefObject<PanelImperativeHandle | null>
  onResize?: (size: { asPercentage: number }) => void
  openMobile?: boolean
  onOpenMobileChange?: (open: boolean) => void
}

const sheetPortalGuards: object = {
  onPointerDownOutside: (event: {
    target: EventTarget | null
    preventDefault: () => void
  }) => {
    const target = event.target as HTMLElement | null
    const isOverlay =
      target?.getAttribute?.("data-slot") === "sheet-overlay" ||
      target?.classList?.contains("bg-black/30")
    if (!isOverlay) event.preventDefault()
  },
  onInteractOutside: (event: {
    target: EventTarget | null
    preventDefault: () => void
  }) => {
    const target = event.target as HTMLElement | null
    const isOverlay =
      target?.getAttribute?.("data-slot") === "sheet-overlay" ||
      target?.classList?.contains("bg-black/30")
    if (!isOverlay) event.preventDefault()
  },
}

export function InboxCustomerPanel({
  conversation,
  onClose,
  isMobile,
  panelRef,
  onResize,
  openMobile = false,
  onOpenMobileChange,
}: InboxCustomerPanelProps) {
  const body = (
    <div className="flex h-full flex-col gap-5 p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">Customer context</span>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label="Close customer context"
          onClick={onClose}
        >
          <XIcon />
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarImage src={conversation.customer.avatarUrl || undefined} />
          <AvatarFallback>
            {conversation.customer.displayName.slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium">
            {conversation.customer.displayName}
          </p>
          <p className="text-xs text-muted-foreground">
            {conversation.inbox.name}
          </p>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Ask Home to summarize this conversation, save customer details, add
        tags, draft a reply, or plan a follow-up.
      </p>
      <Button
        nativeButton={false}
        render={<Link href={`/home?conversation=${conversation.id}`} />}
      >
        <SparklesIcon />
        Ask Home
      </Button>
    </div>
  )
  if (isMobile)
    return (
      <Sheet open={openMobile} onOpenChange={onOpenMobileChange}>
        <SheetContent side="right" {...sheetPortalGuards}>
          <SheetHeader className="sr-only">
            <SheetTitle>Customer context</SheetTitle>
            <SheetDescription>
              Continue with your assistant in Home.
            </SheetDescription>
          </SheetHeader>
          {body}
        </SheetContent>
      </Sheet>
    )
  return (
    <ResizablePanel
      panelRef={panelRef}
      id="customer-details-panel"
      defaultSize="25%"
      minSize="20%"
      maxSize="40%"
      collapsible
      collapsedSize="0%"
      onResize={onResize}
    >
      {body}
    </ResizablePanel>
  )
}
