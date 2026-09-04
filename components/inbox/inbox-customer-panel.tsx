"use client"

import * as React from "react"
import type { PanelImperativeHandle } from "react-resizable-panels"
import { toast } from "sonner"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BriefcaseIcon,
  CopyIcon,
  GlobeIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  TagIcon,
  UserRoundPlusIcon,
  XIcon,
} from "@/components/ui/icons"
import { ResizablePanel } from "@/components/ui/resizable"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { formatRelative } from "@/components/contacts/format"
import { cn } from "@/lib/utils"
import { getTagColor } from "@/lib/tag-colors"
import { getChannelMeta } from "./channel-icon"
import {
  fetchConversation,
  syncConversationToRecord,
  type Conversation,
} from "./api"

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

function customerIdentifier(conversation: Conversation): string {
  return `${conversation.inbox.provider}:${conversation.customer.externalId}`
}

function extractCustomerMeta(
  metadata?: Record<string, unknown>,
  keyGroup: string[] = []
): string | null {
  if (!metadata || typeof metadata !== "object") return null
  for (const key of keyGroup) {
    for (const [k, v] of Object.entries(metadata)) {
      if (
        k.toLowerCase() === key.toLowerCase() &&
        v !== null &&
        v !== undefined &&
        String(v).trim() !== ""
      ) {
        return String(v).trim()
      }
    }
  }
  return null
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
}

export function InboxCustomerPanel({
  conversation,
  conversations,
  organizationId,
  onSelectConversation,
  onConversationUpdate,
  onClose,
  isMobile,
  panelRef,
  onResize,
  openMobile = false,
  onOpenMobileChange,
}: InboxCustomerPanelProps) {
  const [detail, setDetail] = React.useState<Conversation | null>(null)
  const [isSyncing, setIsSyncing] = React.useState(false)

  const displayed = detail?.id === conversation.id ? detail : conversation
  const { customer } = displayed
  const channel = getChannelMeta(displayed.inbox.provider)

  React.useEffect(() => {
    let isCurrent = true

    fetchConversation(organizationId, conversation.id)
      .then((loaded) => {
        if (isCurrent) setDetail(loaded)
      })
      .catch(() => {
        // The list representation is still enough to render the profile.
      })

    return () => {
      isCurrent = false
    }
  }, [conversation.id, organizationId])

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(customerIdentifier(displayed))
      toast.success("Customer ID copied")
    } catch {
      toast.error("Couldn't copy the customer ID")
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const record = await syncConversationToRecord(organizationId, displayed.id)
      toast.success(`${record.title} synced to People`)
    } catch {
      toast.error("Couldn't sync this customer to People")
    } finally {
      setIsSyncing(false)
    }
  }

  const body = (
    <>
      <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
        <p className="text-sm font-semibold text-foreground">Customer profile</p>
        <Button aria-label="Close customer details" size="icon-sm" variant="ghost" onClick={onClose}>
          <XIcon />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="relative p-4 pb-6">
          <div
            className={cn(
              "relative h-32 overflow-hidden rounded-xl bg-gradient-to-br",
              channel.bannerGradient
            )}
          >
            <div className="absolute -top-16 -right-12 size-52 rounded-full bg-white/15 blur-2xl" />
            <div className="absolute -bottom-20 left-1/4 size-48 rounded-full bg-white/10 blur-2xl" />
          </div>
          <div className="relative -mt-10 ml-4 inline-block">
            <Avatar className="size-20 rounded-full ring-4 ring-background shadow-md">
              {customer.avatarUrl ? <AvatarImage src={customer.avatarUrl} alt={customer.displayName} /> : null}
              <AvatarFallback className="text-lg font-semibold">
                {initials(customer.displayName)}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="mt-3 px-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="truncate text-xl font-semibold tracking-tight text-foreground">
                  {customer.displayName}
                </h2>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <channel.Icon className="size-4 shrink-0" aria-hidden="true" />
                  <span>{channel.label}</span>
                  <span aria-hidden="true">·</span>
                  <span className={customer.isOnline ? "text-emerald-600 font-medium" : undefined}>
                    {customer.isOnline ? "Online" : "Offline"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button className="flex-1" size="lg" onClick={handleSync} disabled={isSyncing}>
                <UserRoundPlusIcon />
                {isSyncing ? "Syncing…" : "Sync to record"}
              </Button>
              <Button className="flex-1" size="lg" variant="secondary" disabled title="Email is coming soon">
                <MailIcon />
                Send email
              </Button>
            </div>
          </div>
        </div>

        <section className="border-t border-border px-5 py-5">
          <h3 className="text-sm font-semibold text-foreground">User details</h3>

          <div className="mt-4 flex flex-col gap-3.5 text-sm">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="flex w-24 shrink-0 items-center gap-2 text-muted-foreground">
                <BriefcaseIcon className="size-4 shrink-0" />
                <span>Company:</span>
              </div>
              <span className="font-semibold text-foreground truncate min-w-0">
                {extractCustomerMeta(customer.metadata, ["company", "company_name", "organization", "org"]) ?? "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="flex w-24 shrink-0 items-center gap-2 text-muted-foreground">
                <MapPinIcon className="size-4 shrink-0" />
                <span>Country:</span>
              </div>
              <span className="font-semibold text-foreground truncate min-w-0">
                {extractCustomerMeta(customer.metadata, ["country", "country_name", "location", "nation", "region"]) ?? "N/A"}
              </span>
            </div>

            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="flex w-24 shrink-0 items-center gap-2 text-muted-foreground">
                <MailIcon className="size-4 shrink-0" />
                <span>Email:</span>
              </div>
              {(() => {
                const email = extractCustomerMeta(customer.metadata, ["email", "mail", "email_address"]) ?? "N/A"
                return email !== "N/A" ? (
                  <a
                    href={`mailto:${email}`}
                    className="font-semibold text-foreground hover:underline truncate min-w-0"
                  >
                    {email}
                  </a>
                ) : (
                  <span className="font-semibold text-foreground truncate min-w-0">
                    {email}
                  </span>
                )
              })()}
            </div>

            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="flex w-24 shrink-0 items-center gap-2 text-muted-foreground">
                <PhoneIcon className="size-4 shrink-0" />
                <span>Phone:</span>
              </div>
              {(() => {
                const phone = extractCustomerMeta(customer.metadata, ["phone", "phone_number", "mobile", "tel"]) ?? "N/A"
                return phone !== "N/A" ? (
                  <a
                    href={`tel:${phone}`}
                    className="font-semibold text-foreground hover:underline truncate min-w-0"
                  >
                    {phone}
                  </a>
                ) : (
                  <span className="font-semibold text-foreground truncate min-w-0">
                    {phone}
                  </span>
                )
              })()}
            </div>

            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="flex w-24 shrink-0 items-center gap-2 text-muted-foreground">
                <GlobeIcon className="size-4 shrink-0" />
                <span>Site:</span>
              </div>
              {(() => {
                const site = extractCustomerMeta(customer.metadata, ["site", "website", "url", "web", "domain"]) ?? "N/A"
                return site !== "N/A" ? (
                  <a
                    href={site.startsWith("http") ? site : `https://${site}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-primary hover:underline truncate min-w-0"
                  >
                    {site}
                  </a>
                ) : (
                  <span className="font-semibold text-foreground truncate min-w-0">
                    {site}
                  </span>
                )
              })()}
            </div>
          </div>
        </section>

        <section className="border-t border-border px-5 py-5">
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-1.5">
              <TagIcon className="size-3.5 text-muted-foreground" />
              <h3 className="text-sm font-semibold text-foreground">Tags</h3>
            </div>
            {displayed.tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {displayed.tags.map((tag) => {
                  const color = getTagColor(tag.name, tag.color)
                  return (
                    <span
                      key={tag.id}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors",
                        color.bg,
                        color.text,
                        color.border
                      )}
                    >
                      <span
                        className={cn("size-1.5 rounded-full", color.dot)}
                      />
                      {tag.name}
                    </span>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No tags attached.</p>
            )}
          </div>
        </section>

        <section className="border-t border-border px-5 py-5">
          <h3 className="text-sm font-semibold text-foreground">Previous conversations</h3>
          {detail === null ? (
            <div className="mt-3 flex flex-col gap-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : customer.previousConversations.length > 0 ? (
            <ul className="mt-3 flex flex-col gap-2">
              {customer.previousConversations.map((previous) => {
                const loadedConversation = conversations.find((item) => item.id === previous.id)
                return (
                  <li key={previous.id}>
                    <button
                      type="button"
                      disabled={!loadedConversation}
                      onClick={() => loadedConversation && onSelectConversation(loadedConversation)}
                      className="flex w-full flex-col gap-1 rounded-lg border border-border p-3 text-left transition-colors enabled:hover:bg-muted disabled:cursor-default"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Badge variant="outline" className="capitalize">{previous.status}</Badge>
                        {previous.lastMessageAt ? <span className="text-xs text-muted-foreground">{formatRelative(previous.lastMessageAt)}</span> : null}
                      </div>
                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {previous.lastMessagePreview ?? "No messages yet"}
                      </p>
                    </button>
                  </li>
                )
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">No previous conversations for this customer.</p>
          )}
        </section>
      </div>
    </>
  )

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={onOpenMobileChange}>
        <SheetContent side="right" showCloseButton={false} className="bg-background p-0" {...sheetPortalGuards}>
          <SheetHeader className="sr-only">
            <SheetTitle>Customer profile</SheetTitle>
            <SheetDescription>Details for this inbox customer.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col overflow-hidden">{body}</div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <ResizablePanel panelRef={panelRef} id="customer-details-panel" defaultSize="35%" minSize="20%" maxSize="50%" collapsible collapsedSize="0%" onResize={onResize}>
      <div className="flex h-full flex-col overflow-hidden bg-background">{body}</div>
    </ResizablePanel>
  )
}
