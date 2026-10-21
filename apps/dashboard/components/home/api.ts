import { apiFetch } from "@/lib/api"

export type HomeStatus =
  "attention" | "planned" | "progress" | "done" | "cancelled"
export type HomeViewMode = "work" | "finance" | "transactions"
export type HomeItem = {
  id: string
  kind:
    | "conversation"
    | "task"
    | "meeting"
    | "follow_up"
    | "finance"
    | "transaction"
  title: string
  description: string | null
  status: HomeStatus
  priority: string
  due_at: string | null
  snoozed_until: string | null
  read_at: string | null
  conversation_id: string | null
  payload: {
    amount?: string
    currency?: string
    direction?: string
    recorded_at?: string
    balance_after?: string
    preview?: string
    insights?: {
      summary?: string
      evidence?: string
      facts?: { key: string; value: string }[]
      meeting_suggestion?: string
    }
  }
}
export type HomeProposal = {
  action: string
  status?: HomeStatus | null
  title?: string | null
  description?: string | null
  conversation_id?: string | null
  item_id?: string | null
  starts_at?: string | null
  tag?: string | null
  amount?: string | null
  currency?: string | null
  fields?: { key: string; value: string }[]
  before?: { name?: string; profile?: Record<string, unknown>; tags?: string[] }
}
export type HomeMessage = {
  id: string
  role: "user" | "assistant"
  body: string
  proposal: HomeProposal | null
  action_status: "pending" | "confirmed" | "cancelled" | "superseded" | null
  result?: { conversation_id?: string; record_id?: string; item_id?: string }
  created_at: string
}
export type HomeSnapshot = {
  items: HomeItem[]
  messages: HomeMessage[]
  briefing: string
  unread_count: number
  finance: {
    id: string
    currency: string
    balance: string
    received: string
    spent: string
  }[]
}
const root = (organization: number | string) =>
  `/api/v1/organizations/${organization}/home`
export const fetchHome = (organization: number | string) =>
  apiFetch<HomeSnapshot>(root(organization))
export const sendHomeMessage = (
  organization: number | string,
  message: string,
  conversation_id?: string
) =>
  apiFetch<{ message: HomeMessage; view: HomeViewMode }>(
    `${root(organization)}/messages`,
    {
      method: "POST",
      body: {
        message,
        conversation_id,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }
  )
export const decideHomeAction = (
  organization: number | string,
  message: string,
  decision: "confirm" | "cancel"
) =>
  apiFetch<{ message: HomeMessage }>(
    `${root(organization)}/messages/${message}/${decision}`,
    { method: "POST" }
  )
export const updateHomeItem = (
  organization: number | string,
  item: string,
  changes: {
    status?: HomeStatus
    snoozed_until?: string | null
    read?: boolean
  }
) =>
  apiFetch<{ item: HomeItem }>(`${root(organization)}/items/${item}`, {
    method: "PATCH",
    body: changes,
  })
export const markHomeRead = (organization: number | string) =>
  apiFetch(`${root(organization)}/read`, { method: "POST" })
