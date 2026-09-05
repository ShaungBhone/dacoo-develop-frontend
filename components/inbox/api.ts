import { apiFetch } from "@/lib/api"

export type ContactAddress = {
  label: string | null
  is_primary?: boolean
  is_billing?: boolean
  is_shipping?: boolean
  street_address1: string | null
  street_address2: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string | null
}

export type LifecycleStage = {
  id: number | string
  name: string
  color: string | null
}

export type ContactMergeSummary = {
  id: number | string
  display_name: string | null
  avatar_url: string | null
  handle: string | null
}

export type ContactConversationSummary = {
  id: number | string
  status: string
  last_message_at: string | null
  last_message_preview: string | null
}

export type InboxContact = {
  id: number | string
  display_name: string | null
  avatar_url: string | null
  handle: string | null
  phone: string | null
  phone_number: string | null
  company: string | null
  email: string | null
  job_title: string | null
  website: string | null
  external_id: string | null
  is_online: boolean
  last_seen_at: string | null
  timezone: string | null
  language: string | null
  tax_number: string | null
  notes: string | null
  conversations_count: number | null
  inbox: { id: number | string; name: string; provider: string } | null
  addresses: ContactAddress[]
  lifecycle_stage: LifecycleStage | null
  merged_into: ContactMergeSummary | null
  merged_contacts: ContactMergeSummary[]
  conversations: ContactConversationSummary[]
}

export async function fetchInboxContact(
  organizationId: number | string,
  contactId: number | string
): Promise<InboxContact> {
  const response = await apiFetch<{ data: InboxContact }>(
    `/api/v1/organizations/${organizationId}/contacts/${contactId}`
  )

  return response.data
}

/** PATCH .../contacts/{contact} — updates contact fields, e.g. notes. */
export async function updateInboxContact(
  organizationId: number | string,
  contactId: number | string,
  patch: { notes: string }
): Promise<InboxContact> {
  const response = await apiFetch<{ data: InboxContact }>(
    `/api/v1/organizations/${organizationId}/contacts/${contactId}`,
    { method: "PATCH", body: patch }
  )

  return response.data
}

/* -------------------------------------------------------------------------- */
/*                                Conversations                               */
/* -------------------------------------------------------------------------- */

export type ConversationStatus = "open" | "pending" | "resolved" | "closed"
export type ConversationPriority = "low" | "normal" | "high" | "urgent"
export type AiHandlerState = "human" | "ai-active" | "needs-attention"

export type ConversationParticipant = {
  id: number | string
  name: string
  avatarUrl: string | null
}

export type CustomerConversationSummary = {
  id: number | string
  status: ConversationStatus
  lastMessageAt: string | null
  lastMessagePreview: string | null
  inboxName: string | null
}

export type ConversationCustomer = {
  id: number | string
  displayName: string
  avatarUrl: string | null
  isOnline: boolean
  externalId: string
  metadata: Record<string, unknown>
  lastSeenAt: string | null
  previousConversations: CustomerConversationSummary[]
}

export type AiStateHistoryEntry = {
  from: AiHandlerState | null
  to: AiHandlerState
  reason: string | null
  changedBy: { id: number | string; name: string } | null
  changedAt: string
}

export type ConversationTag = {
  id: number | string
  name: string
  color?: string | null
}

export type Conversation = {
  id: number | string
  lastMessageAt: string | null
  lastMessagePreview: string | null
  status: ConversationStatus
  priority: ConversationPriority
  unreadCount: number
  aiHandler: AiHandlerState
  aiStateReason: string | null
  aiStateHistory: AiStateHistoryEntry[]
  assignee: ConversationParticipant | null
  customer: ConversationCustomer
  inbox: { id: number | string; name: string; provider: string }
  tags: ConversationTag[]
}

type RawAiStateHistoryEntry = {
  from: AiHandlerState | null
  to: AiHandlerState
  reason: string | null
  changed_by: { id: number | string; name: string } | null
  changed_at: string
}

type RawConversation = {
  id: number | string
  last_message_at: string | null
  last_message_preview: string | null
  status: string
  priority: string
  unread_count: number
  ai_handler: string
  ai_state_history?: RawAiStateHistoryEntry[]
  assignee: { id: number | string; name: string; avatar_url: string | null } | null
  customer: {
    id: number | string
    display_name: string
    avatar_url: string | null
    is_online: boolean
    external_id: string
    metadata: Record<string, unknown>
    last_seen_at: string | null
    previous_conversations?: {
      id: number | string
      status: string
      last_message_at: string | null
      last_message_preview: string | null
      inbox_name: string | null
    }[]
  }
  inbox: { id: number | string; name: string; provider: string }
  tags: unknown[]
}

function mapTag(tag: unknown): ConversationTag {
  if (typeof tag === "string") return { id: tag, name: tag, color: null }
  if (tag && typeof tag === "object" && "name" in tag) {
    const t = tag as { id?: number | string; name: unknown; color?: string | null }
    return {
      id: t.id ?? String(t.name),
      name: String(t.name),
      color: t.color ?? null,
    }
  }
  return { id: String(tag), name: String(tag), color: null }
}

function mapAiStateHistory(raw: RawAiStateHistoryEntry): AiStateHistoryEntry {
  return {
    from: raw.from,
    to: raw.to,
    reason: raw.reason,
    changedBy: raw.changed_by,
    changedAt: raw.changed_at,
  }
}

function mapConversation(raw: RawConversation): Conversation {
  const aiHandler = raw.ai_handler as AiHandlerState
  const aiStateHistory = (raw.ai_state_history ?? []).map(mapAiStateHistory)
  const currentStateEntry = [...aiStateHistory]
    .reverse()
    .find((entry) => entry.to === aiHandler)

  return {
    id: raw.id,
    lastMessageAt: raw.last_message_at,
    lastMessagePreview: raw.last_message_preview,
    status: raw.status as ConversationStatus,
    priority: raw.priority as ConversationPriority,
    unreadCount: raw.unread_count,
    aiHandler,
    aiStateReason: currentStateEntry?.reason ?? null,
    aiStateHistory,
    assignee: raw.assignee
      ? { id: raw.assignee.id, name: raw.assignee.name, avatarUrl: raw.assignee.avatar_url }
      : null,
    customer: {
      id: raw.customer.id,
      displayName: raw.customer.display_name,
      avatarUrl: raw.customer.avatar_url,
      isOnline: raw.customer.is_online,
      externalId: raw.customer.external_id,
      metadata: raw.customer.metadata ?? {},
      lastSeenAt: raw.customer.last_seen_at,
      previousConversations: (raw.customer.previous_conversations ?? []).map(
        (item) => ({
          id: item.id,
          status: item.status as ConversationStatus,
          lastMessageAt: item.last_message_at,
          lastMessagePreview: item.last_message_preview,
          inboxName: item.inbox_name,
        })
      ),
    },
    inbox: raw.inbox,
    tags: raw.tags.map(mapTag),
  }
}

/** GET .../conversations — the inbox list, ordered by most recent activity. */
export async function fetchConversations(
  organizationId: number | string
): Promise<Conversation[]> {
  const response = await apiFetch<{ data: RawConversation[] }>(
    `/api/v1/organizations/${organizationId}/conversations`
  )
  return response.data.map(mapConversation)
}

/** GET .../conversations/{id} — includes the customer's previous inbox conversations. */
export async function fetchConversation(
  organizationId: number | string,
  conversationId: number | string
): Promise<Conversation> {
  const response = await apiFetch<{ data: RawConversation }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}`
  )
  return mapConversation(response.data)
}

/** PATCH .../conversations/{id} — updates AI-handler state or assignment. */
export async function updateConversation(
  organizationId: number | string,
  conversationId: number | string,
  patch: {
    status?: ConversationStatus
    priority?: ConversationPriority
    ai_handler?: AiHandlerState
    assigned_to_user_id?: number | string | null
    read?: boolean
  }
): Promise<Conversation> {
  const response = await apiFetch<{ data: RawConversation }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}`,
    { method: "PATCH", body: patch }
  )
  return mapConversation(response.data)
}

/** Explicitly export the customer to People; no conversation-to-record link is saved. */
export async function syncConversationToRecord(
  organizationId: number | string,
  conversationId: number | string
): Promise<{ id: number | string; title: string }> {
  const response = await apiFetch<{ record: { id: number | string; title: string } }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}/sync-record`,
    { method: "POST" }
  )

  return response.record
}

/** POST .../conversations/{id}/read — marks the conversation as read, clearing its unread count. */
export async function markConversationRead(
  organizationId: number | string,
  conversationId: number | string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}/read`,
    { method: "POST" }
  )
}

/** DELETE .../conversations/{id} — permanently deletes a conversation and its messages. */
export async function deleteConversation(
  organizationId: number | string,
  conversationId: number | string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}`,
    { method: "DELETE" }
  )
}

/* -------------------------------------------------------------------------- */
/*                              Organization members                          */
/* -------------------------------------------------------------------------- */

export type OrganizationMember = {
  id: number | string
  name: string
  email: string
  avatarUrl: string | null
  isOwner: boolean
}

type RawOrganizationMember = {
  id: number | string
  name: string
  email: string
  avatar_url: string | null
  is_owner: boolean
}

/** GET .../members — the organization's members, for assigning a conversation. */
export async function fetchOrganizationMembers(
  organizationId: number | string
): Promise<OrganizationMember[]> {
  const response = await apiFetch<{ data: RawOrganizationMember[] }>(
    `/api/v1/organizations/${organizationId}/members`
  )
  return response.data.map((member) => ({
    id: member.id,
    name: member.name,
    email: member.email,
    avatarUrl: member.avatar_url,
    isOwner: member.is_owner,
  }))
}

/* -------------------------------------------------------------------------- */
/*                                  Messages                                  */
/* -------------------------------------------------------------------------- */

export type MessageAttachment = {
  id: number | string
  filename: string
  url: string
  mediaType: string | null
  size: number | null
}

export type ConversationMessage = {
  id: number | string
  direction: "inbound" | "outbound"
  sender: ConversationParticipant | null
  body: string
  status: string
  type: string
  attachments: MessageAttachment[]
  sentAt: string
}

type RawMessageAttachment = {
  id: number | string
  filename: string
  url: string
  media_type: string | null
  size: number | null
}

type RawMessage = {
  id: number | string
  direction: "inbound" | "outbound"
  sender: { id: number | string; name: string; avatar_url: string | null } | null
  body: string
  status: string
  type: string
  attachments?: RawMessageAttachment[]
  sent_at: string
}

type RawConversationNote = {
  id: string
  body: string
  author: { id: number | string; name: string; avatar_url: string | null } | null
  created_at: string | null
}

function mapAttachment(raw: RawMessageAttachment): MessageAttachment {
  return {
    id: raw.id,
    filename: raw.filename,
    url: raw.url,
    mediaType: raw.media_type,
    size: raw.size,
  }
}

function mapMessage(raw: RawMessage): ConversationMessage {
  return {
    id: raw.id,
    direction: raw.direction,
    sender: raw.sender
      ? { id: raw.sender.id, name: raw.sender.name, avatarUrl: raw.sender.avatar_url }
      : null,
    body: raw.body,
    status: raw.status,
    type: raw.type,
    attachments: (raw.attachments ?? []).map(mapAttachment),
    sentAt: raw.sent_at,
  }
}

function mapConversationNote(raw: RawConversationNote): ConversationMessage {
  return {
    // Notes live in a separate table, so make their timeline IDs distinct
    // from message IDs before combining both collections for display.
    id: `note-${raw.id}`,
    direction: "outbound",
    sender: raw.author
      ? {
          id: raw.author.id,
          name: raw.author.name,
          avatarUrl: raw.author.avatar_url,
        }
      : null,
    body: raw.body,
    status: "sent",
    type: "internal_note",
    attachments: [],
    sentAt: raw.created_at ?? new Date(0).toISOString(),
  }
}

/** GET .../conversations/{id}/messages — returned oldest first for display. */
export async function fetchConversationMessages(
  organizationId: number | string,
  conversationId: number | string
): Promise<ConversationMessage[]> {
  const response = await apiFetch<{ data: RawMessage[] }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}/messages`
  )
  return response.data.map(mapMessage).reverse()
}

/** GET .../conversations/{id}/notes — returned newest first for display. */
export async function fetchConversationNotes(
  organizationId: number | string,
  conversationId: number | string
): Promise<ConversationMessage[]> {
  const response = await apiFetch<{ data: RawConversationNote[] }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}/notes`
  )
  return response.data.map(mapConversationNote).reverse()
}

/** POST .../conversations/{id}/messages — sends an outbound reply. */
export async function sendConversationMessage(
  organizationId: number | string,
  conversationId: number | string,
  payload: {
    body: string
    files?: File[]
  }
): Promise<ConversationMessage> {
  const { body, files } = payload

  let requestBody: FormData | Record<string, string>
  if (files && files.length > 0) {
    const formData = new FormData()
    formData.append("body", body)
    for (const file of files) {
      formData.append("attachments[]", file)
    }
    requestBody = formData
  } else {
    requestBody = { body }
  }

  const response = await apiFetch<{ data: RawMessage }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}/messages`,
    { method: "POST", body: requestBody }
  )
  return mapMessage(response.data)
}

/** POST .../conversations/{id}/notes — saves a team-only internal note. */
export async function createConversationNote(
  organizationId: number | string,
  conversationId: number | string,
  body: string
): Promise<ConversationMessage> {
  const response = await apiFetch<{ data: RawConversationNote }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}/notes`,
    { method: "POST", body: { body } }
  )
  return mapConversationNote(response.data)
}

/* -------------------------------------------------------------------------- */
/*                                     Tags                                   */
/* -------------------------------------------------------------------------- */

/** GET .../tags — list tags for the organization. */
export async function fetchOrganizationTags(
  organizationId: number | string
): Promise<ConversationTag[]> {
  const response = await apiFetch<{
    data: { id: number | string; name: string; color?: string | null }[]
  }>(`/api/v1/organizations/${organizationId}/tags`)
  return response.data.map((item) => ({
    id: item.id,
    name: item.name,
    color: item.color ?? null,
  }))
}

/** POST .../tags — create a tag in the organization. */
export async function createOrganizationTag(
  organizationId: number | string,
  name: string,
  color?: string | null
): Promise<ConversationTag> {
  const response = await apiFetch<{
    data: { id: number | string; name: string; color?: string | null }
  }>(`/api/v1/organizations/${organizationId}/tags`, {
    method: "POST",
    body: { name, color },
  })
  return {
    id: response.data.id,
    name: response.data.name,
    color: response.data.color ?? null,
  }
}

/** POST .../conversations/{id}/tags — attach tags to a conversation. */
export async function attachConversationTags(
  organizationId: number | string,
  conversationId: number | string,
  tagIds: (number | string)[]
): Promise<Conversation> {
  const response = await apiFetch<{ data: RawConversation }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}/tags`,
    { method: "POST", body: { tag_ids: tagIds } }
  )
  return mapConversation(response.data)
}

/** DELETE .../conversations/{id}/tags/{tag} — detach a tag from a conversation. */
export async function detachConversationTag(
  organizationId: number | string,
  conversationId: number | string,
  tagId: number | string
): Promise<Conversation> {
  const response = await apiFetch<{ data: RawConversation }>(
    `/api/v1/organizations/${organizationId}/conversations/${conversationId}/tags/${tagId}`,
    { method: "DELETE" }
  )
  return mapConversation(response.data)
}

/* -------------------------------------------------------------------------- */
/*                                   Inboxes                                  */
/* -------------------------------------------------------------------------- */

export type InboxSummary = {
  id: number | string
  name: string
  provider: string
}

/** GET .../inboxes — list inboxes for the organization. */
export async function fetchInboxes(
  organizationId: number | string
): Promise<InboxSummary[]> {
  const response = await apiFetch<{
    data: { id: number | string; name: string; provider?: string }[]
  }>(`/api/v1/organizations/${organizationId}/inboxes`)
  return response.data.map((item) => ({
    id: item.id,
    name: item.name,
    provider: item.provider ?? "unknown",
  }))
}

