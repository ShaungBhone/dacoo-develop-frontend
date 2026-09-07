export type LifecycleStage = "lead" | "active" | "churned"

export type InsightsState = "pending" | "generating" | "ready"

export interface ContactPreference {
  category: string
  detail: string
}

export interface ContactInsights {
  summary: string
  preferences: ContactPreference[]
  /** ISO timestamp of when the insights were last generated. */
  generatedAt: string
  /** Number of conversations the model had access to. */
  basedOnConversations: number
}

export type OrderStatus =
  | "paid"
  | "refunded"
  | "pending"
  | "cancelled"
  | "fulfilled"

export interface Order {
  number: string
  date: string
  status: OrderStatus
  total: number
}

export interface SaleHistory {
  lifetimeSpend: number
  orderCount: number
  averageOrderValue: number
  lastOrderDate: string
  orders: Order[]
}

export type ConversationStatus = "open" | "pending" | "closed" | "snoozed"

export interface Conversation {
  id: string
  preview: string
  timestamp: string
  status: ConversationStatus
  channel: "chat" | "email" | "whatsapp"
  agent: string
}

export interface Contact {
  id: string
  name: string
  avatar: string
  company: string
  jobTitle: string
  email: string
  phone: string
  location: string
  stage: LifecycleStage
  since: string
  insights: ContactInsights | null
  sales: SaleHistory
  conversations: Conversation[]
}

/* -------------------------------------------------------------------------- */
/*                              Roster (list view)                            */
/* -------------------------------------------------------------------------- */

export interface ContactListItem {
  id: string
  name: string
  avatar: string
  /** Display name of the linked company, or "" when unassigned. */
  company: string
  /** Id of the linked company, or null when unassigned. */
  companyId: string | null
  email: string
  emailDomain: string
  jobTitle: string
  phone: string
  location: string
  stage: LifecycleStage
  /** The contact's lifecycle stage id, or null when unassigned. */
  stageId: number | string | null
  /** Display name of the lifecycle stage (the "Type" column). */
  stageName: string
  /** Hex colour of the lifecycle stage, used to tint the Type badge. */
  stageColor: string | null
  conversationsCount: number
  lastActive: string
}

/** A lifecycle stage as surfaced in the contacts filter rail. */
export interface LifecycleStageSummary {
  id: number | string
  name: string
  color: string | null
  contactsCount: number
}
