import { apiFetch } from "@/lib/api"
import type {
  Contact,
  ContactInsights,
  ContactListItem,
  InsightsState,
  LifecycleStage,
  LifecycleStageSummary,
} from "@/components/contacts/data"

/* -------------------------------------------------------------------------- */
/*                                Contact profile                             */
/* -------------------------------------------------------------------------- */

type RawInsights = {
  state: InsightsState
  summary: string | null
  preferences: ContactInsights["preferences"] | null
  generatedAt: string | null
  basedOnConversations: number | null
}

type RawContactProfile = Omit<Contact, "insights"> & { insights: RawInsights }

export interface ContactProfile {
  contact: Contact
  insightsState: InsightsState
}

function normalizeInsights(raw: RawInsights): {
  insights: ContactInsights | null
  state: InsightsState
} {
  if (
    raw.state !== "ready" ||
    !raw.summary ||
    !raw.preferences ||
    !raw.generatedAt ||
    raw.basedOnConversations == null
  ) {
    return { insights: null, state: raw.state }
  }

  return {
    insights: {
      summary: raw.summary,
      preferences: raw.preferences,
      generatedAt: raw.generatedAt,
      basedOnConversations: raw.basedOnConversations,
    },
    state: raw.state,
  }
}

/**
 * GET .../contacts/{contact}/profile — the composed CRM profile (contact +
 * AI insights + sales history + recent conversations).
 */
export async function fetchContactProfile(
  organizationId: number | string,
  contactId: number | string
): Promise<ContactProfile> {
  const res = await apiFetch<{ data: RawContactProfile }>(
    `/api/v1/organizations/${organizationId}/contacts/${contactId}/profile`
  )
  const { insights, state } = normalizeInsights(res.data.insights)

  return {
    contact: { ...res.data, insights },
    insightsState: state,
  }
}

/**
 * POST .../contacts/{contact}/insights/refresh — force-regenerate the
 * contact's AI insights, bypassing the backend's message-count debounce.
 */
export async function refreshContactInsights(
  organizationId: number | string,
  contactId: number | string
): Promise<InsightsState> {
  const res = await apiFetch<{ data: { state: InsightsState } }>(
    `/api/v1/organizations/${organizationId}/contacts/${contactId}/insights/refresh`,
    { method: "POST" }
  )
  return res.data.state
}

/**
 * POST .../contacts/{contact}/merge — merges another contact into this one.
 * The target contact becomes the surviving "primary"; the merged contact is
 * folded into it.
 */
export async function mergeContact(
  organizationId: number | string,
  primaryContactId: number | string,
  secondaryContactId: number | string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/contacts/${primaryContactId}/merge`,
    { method: "POST", body: { contact_id: secondaryContactId } }
  )
}

/* -------------------------------------------------------------------------- */
/*                              Roster (list view)                            */
/* -------------------------------------------------------------------------- */

type RawLifecycleStage = {
  id: number | string
  name: string | null
  color: string | null
  is_final: boolean
  contacts_count?: number | null
}

type RawCompanySummary = {
  id: string
  name: string
  logo_url: string | null
}

type RawContact = {
  id: string
  display_name: string
  avatar_url: string | null
  company_id: string | null
  company?: RawCompanySummary | null
  email: string | null
  job_title: string | null
  phone: string | null
  timezone: string | null
  last_seen_at: string | null
  updated_at: string | null
  lifecycle_stage: RawLifecycleStage | null
  conversations_count: number | null
}

type RawContactPage = {
  data: RawContact[]
  meta?: { current_page?: number; last_page?: number } | null
}

function mapStage(contact: RawContact): LifecycleStage {
  if (contact.lifecycle_stage?.is_final) {
    return "churned"
  }
  return (contact.conversations_count ?? 0) > 0 ? "active" : "lead"
}

/** Derive the domain portion of an email address, e.g. "acme.io". */
function emailDomain(email: string | null): string {
  if (!email) return ""
  const at = email.lastIndexOf("@")
  return at === -1 ? "" : email.slice(at + 1)
}

/**
 * Proxy a display location from an IANA timezone, since the list endpoint
 * doesn't expose the contact's address. e.g. "Asia/Bangkok" → "Bangkok".
 */
function locationFromTimezone(timezone: string | null): string {
  if (!timezone) return ""
  const city = timezone.split("/").pop() ?? ""
  return city.replace(/_/g, " ")
}

function mapContact(contact: RawContact): ContactListItem {
  return {
    id: contact.id,
    name: contact.display_name,
    avatar: contact.avatar_url ?? "",
    company: contact.company?.name ?? "",
    companyId: contact.company_id ?? null,
    email: contact.email ?? "",
    emailDomain: emailDomain(contact.email),
    jobTitle: contact.job_title ?? "",
    phone: contact.phone ?? "",
    location: locationFromTimezone(contact.timezone),
    stage: mapStage(contact),
    stageId: contact.lifecycle_stage?.id ?? null,
    stageName: contact.lifecycle_stage?.name ?? "",
    stageColor: contact.lifecycle_stage?.color ?? null,
    conversationsCount: contact.conversations_count ?? 0,
    lastActive:
      contact.last_seen_at ?? contact.updated_at ?? new Date(0).toISOString(),
  }
}

/**
 * GET .../contacts — roster of the organization's contacts, adapted into
 * the shape the contact list view renders. The endpoint paginates, so we walk
 * every page and concatenate to give the table the full set (contact counts
 * are small enough that client-side search/sort/paging stays snappy).
 */
export async function fetchContacts(
  organizationId: number | string
): Promise<ContactListItem[]> {
  const base = `/api/v1/organizations/${organizationId}/contacts`
  const contacts: ContactListItem[] = []

  let page = 1
  let lastPage = 1
  do {
    const res = await apiFetch<RawContactPage>(`${base}?page=${page}`)
    contacts.push(...res.data.map(mapContact))
    lastPage = res.meta?.last_page ?? page
    page += 1
  } while (page <= lastPage)

  return contacts
}

/**
 * PATCH .../contacts/{contact}/lifecycle-stage — assign (or clear, with null)
 * the contact's lifecycle stage. The backend records the transition in the
 * contact's stage history.
 */
export async function setContactLifecycleStage(
  organizationId: number | string,
  contactId: number | string,
  lifecycleStageId: number | string | null
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/contacts/${contactId}/lifecycle-stage`,
    { method: "PATCH", body: { lifecycle_stage_id: lifecycleStageId } }
  )
}

type RawLifecycleStagePage = {
  data: RawLifecycleStage[]
}

/**
 * GET .../lifecycle-stages — the organization's lifecycle stages (with contact
 * counts), used to build the contacts filter rail.
 */
export async function fetchLifecycleStages(
  organizationId: number | string
): Promise<LifecycleStageSummary[]> {
  const res = await apiFetch<RawLifecycleStagePage>(
    `/api/v1/organizations/${organizationId}/lifecycle-stages`
  )

  return res.data.map((stage) => ({
    id: stage.id,
    name: stage.name ?? "Untitled",
    color: stage.color,
    contactsCount: stage.contacts_count ?? 0,
  }))
}

export interface CreateContactPayload {
  display_name: string
  avatar?: File | null
  email?: string | null
  /** E.164, e.g. "+6581234567". The server splits it into its parts. */
  phone?: string | null
  handle?: string | null
  company_id?: string | null
  job_title?: string | null
  website?: string | null
  lifecycle_stage_id?: number | string | null
  notes?: string | null
  /** Workspace-defined attribute values, keyed by attribute slug. */
  values?: Record<string, unknown>
}

/**
 * POST .../contacts — creates a new CRM contact for the organization.
 */
export async function createContact(
  organizationId: number | string,
  payload: CreateContactPayload
): Promise<ContactListItem> {
  let body: FormData | Record<string, unknown>

  if (payload.avatar instanceof File) {
    const formData = new FormData()
    formData.append("display_name", payload.display_name)
    formData.append("avatar", payload.avatar)
    if (payload.email) formData.append("email", payload.email)
    if (payload.phone) formData.append("phone", payload.phone)
    if (payload.handle) formData.append("handle", payload.handle)
    if (payload.company_id) formData.append("company_id", payload.company_id)
    if (payload.job_title) formData.append("job_title", payload.job_title)
    if (payload.website) formData.append("website", payload.website)
    if (payload.lifecycle_stage_id) formData.append("lifecycle_stage_id", String(payload.lifecycle_stage_id))
    if (payload.notes) formData.append("notes", payload.notes)
    // Bracket notation is how Laravel reassembles an array from multipart.
    for (const [slug, value] of Object.entries(payload.values ?? {})) {
      formData.append(`values[${slug}]`, value == null ? "" : String(value))
    }
    body = formData
  } else {
    body = {
      display_name: payload.display_name,
      email: payload.email ?? undefined,
      phone: payload.phone ?? undefined,
      handle: payload.handle ?? undefined,
      company_id: payload.company_id ?? undefined,
      job_title: payload.job_title ?? undefined,
      website: payload.website ?? undefined,
      lifecycle_stage_id: payload.lifecycle_stage_id ?? undefined,
      notes: payload.notes ?? undefined,
      values: payload.values ?? undefined,
    }
  }

  const res = await apiFetch<{ data: RawContact }>(
    `/api/v1/organizations/${organizationId}/contacts`,
    { method: "POST", body }
  )
  return mapContact(res.data)
}

