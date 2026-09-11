import { apiFetch } from "@/lib/api"

export type ViberLocale = "en" | "my"
export type LocalizedText = Partial<Record<ViberLocale, string>>
export type ViberMenuAction = "reply" | "open_url" | "share-phone" | "handoff"
export type ViberCardAction = "reply" | "open_url" | "handoff"
export type ViberResponseType = "text" | "menu" | "carousel" | "handoff"

export type ViberCarouselCard = {
  id?: string
  title: LocalizedText
  description: LocalizedText | null
  cta_label: LocalizedText
  action_type: ViberCardAction
  action_value: LocalizedText
  sort_order?: number
  image_url?: string | null
}

export type ViberAutomation = {
  id?: string
  name: string
  response_type: ViberResponseType
  triggers: Partial<Record<ViberLocale, string[]>>
  response_text: LocalizedText | null
  show_menu: boolean
  is_enabled: boolean
  sort_order?: number
  cards: ViberCarouselCard[]
}

export type ViberMenuButton = {
  id?: string
  label: LocalizedText
  action_type: ViberMenuAction
  action_value: LocalizedText | null
  background_color: string
  sort_order?: number
}

export type ViberExperienceRevision = {
  id: string
  default_locale: ViberLocale
  enabled_locales: ViberLocale[]
  welcome_text: LocalizedText
  menu_text: LocalizedText
  fallback_text: LocalizedText
  handoff_text: LocalizedText
  menu_buttons: ViberMenuButton[]
  automations: ViberAutomation[]
  updated_at?: string | null
}

export type ViberExperience = {
  id: string | null
  supported_locales: ViberLocale[]
  draft: ViberExperienceRevision | null
  published: ViberExperienceRevision | null
  published_at: string | null
  published_by: { name: string } | null
}

type ExperienceResponse = { data: ViberExperience }

const endpoint = (organizationId: number | string) =>
  `/api/v1/organizations/${organizationId}/integrations/viber/experience`

export async function fetchViberExperience(
  organizationId: number | string
): Promise<ViberExperience> {
  return (await apiFetch<ExperienceResponse>(endpoint(organizationId))).data
}

export async function createViberDraft(
  organizationId: number | string
): Promise<ViberExperience> {
  return (
    await apiFetch<ExperienceResponse>(`${endpoint(organizationId)}/draft`, {
      method: "POST",
    })
  ).data
}

export async function saveViberDraft(
  organizationId: number | string,
  draft: Omit<ViberExperienceRevision, "id" | "updated_at">
): Promise<ViberExperience> {
  return (
    await apiFetch<ExperienceResponse>(`${endpoint(organizationId)}/draft`, {
      method: "PUT",
      body: draft,
    })
  ).data
}

export async function publishViberExperience(
  organizationId: number | string
): Promise<ViberExperience> {
  return (
    await apiFetch<ExperienceResponse>(`${endpoint(organizationId)}/publish`, {
      method: "POST",
    })
  ).data
}

export async function uploadViberCardImage(
  organizationId: number | string,
  cardId: string,
  file: File
): Promise<ViberExperience> {
  const body = new FormData()
  body.append("image", file)

  return (
    await apiFetch<ExperienceResponse>(
      `${endpoint(organizationId)}/cards/${cardId}/image`,
      { method: "POST", body }
    )
  ).data
}

export async function removeViberCardImage(
  organizationId: number | string,
  cardId: string
): Promise<ViberExperience> {
  return (
    await apiFetch<ExperienceResponse>(
      `${endpoint(organizationId)}/cards/${cardId}/image`,
      { method: "DELETE" }
    )
  ).data
}

export async function startViberPreview(
  organizationId: number | string,
  conversationId: number | string,
  locale: ViberLocale
): Promise<{
  expires_at: string
  conversation_id: string
  locale: ViberLocale
}> {
  return (
    await apiFetch<{
      data: { expires_at: string; conversation_id: string; locale: ViberLocale }
    }>(`${endpoint(organizationId)}/preview`, {
      method: "POST",
      body: { conversation_id: String(conversationId), locale },
    })
  ).data
}

export async function stopViberPreview(
  organizationId: number | string,
  conversationId: number | string
): Promise<void> {
  await apiFetch<null>(
    `${endpoint(organizationId)}/preview/${conversationId}`,
    { method: "DELETE" }
  )
}
