"use client"

import * as React from "react"
import { AlertTriangleIcon } from "@/components/ui/icons"

import { ApiError } from "@/lib/api"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
  fetchContactProfile,
  refreshContactInsights,
} from "@/components/contacts/api"
import type { Contact, InsightsState } from "@/components/contacts/data"
import { ContactHeader } from "@/components/contacts/contact-header"
import { InsightsPanel } from "@/components/contacts/insights-panel"
import { SaleHistoryPanel } from "@/components/contacts/sale-history-panel"
import { ConversationsPanel } from "@/components/contacts/conversations-panel"
import { ContactInboxPanel } from "@/components/inbox/contact-inbox-panel"
import { MOCK_CONVERSATIONS } from "@/components/inbox/data"

/** How often to poll the profile while insights are regenerating. */
const INSIGHTS_POLL_INTERVAL_MS = 3000

export function ContactProfileView({ contactId }: { contactId: string }) {
  const organization = useActiveOrganization()

  const [contact, setContact] = React.useState<Contact | null>(null)
  const [insightsState, setInsightsState] =
    React.useState<InsightsState>("pending")
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const load = React.useCallback(() => {
    if (!organization) return Promise.resolve()
    return fetchContactProfile(organization.id, contactId)
      .then((profile) => {
        setContact(profile.contact)
        setInsightsState(profile.insightsState)
        setError(null)
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load contact."
        )
      })
  }, [organization, contactId])

  React.useEffect(() => {
    setIsLoading(true)
    load().finally(() => setIsLoading(false))
  }, [load])

  React.useEffect(() => {
    if (insightsState !== "generating") return
    const timer = setInterval(() => void load(), INSIGHTS_POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [insightsState, load])

  const handleRefreshInsights = React.useCallback(async () => {
    if (!organization) return
    const previousState = insightsState
    setInsightsState("generating")
    try {
      const state = await refreshContactInsights(organization.id, contactId)
      setInsightsState(state)
    } catch {
      setInsightsState(previousState)
    }
  }, [organization, contactId, insightsState])

  if (!organization) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">No active organisation.</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 lg:px-6">
        <Alert variant="destructive">
          <AlertTriangleIcon className="size-4" />
          <AlertTitle>Failed to load contact</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || !contact) {
    return (
      <div className="flex flex-1 flex-col overflow-auto bg-background text-foreground">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
          <Skeleton className="h-40 w-full rounded-xl" />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="flex flex-col gap-6 lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-56 w-full rounded-xl" />
            </div>
            <Skeleton className="h-96 w-full rounded-xl" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 lg:px-6">
        <ContactHeader
          contact={contact}
          organizationId={organization.id}
          onMerged={load}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main column */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <InsightsPanel
              state={insightsState}
              insights={contact.insights}
              onRefresh={handleRefreshInsights}
            />
            <SaleHistoryPanel sales={contact.sales} />
          </div>

          {/* Side column */}
          <div className="flex flex-col gap-6">
            <ConversationsPanel conversations={contact.conversations} />
            <ContactInboxPanel conversations={MOCK_CONVERSATIONS.filter((c) => c.contactId === contact.id)} />
          </div>
        </div>
      </div>
    </div>
  )
}
