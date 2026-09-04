import { apiFetch } from "@/lib/api"

export type IntegrationRecord = {
  id: string
  provider: string
  name: string
  created_at: string
  updated_at: string
}

export type IntegrationProvider = {
  provider: string
  name: string
  description: string
  color: string
  connect_mode: string
  requires_oauth: boolean
  connected: boolean
  is_allowed_by_plan: boolean
  min_plan_name?: string
  integration: IntegrationRecord | null
}

export type IntegrationsMeta = {
  plan_name: string
  channels_limit: number
  channels_count: number
  can_connect_more: boolean
}

export type IntegrationsResponse = {
  data: IntegrationProvider[]
  meta: IntegrationsMeta
}

export async function fetchIntegrations(
  organizationId: number
): Promise<IntegrationsResponse> {
  return await apiFetch<IntegrationsResponse>(
    `/api/v1/organizations/${organizationId}/integrations`
  )
}

export type ConnectChannelResult =
  | { requires_oauth: true; connect_url: string }
  | { data: IntegrationRecord }

export async function connectChannel(
  organizationId: number,
  provider: string,
  extra: Record<string, string> = {}
): Promise<ConnectChannelResult> {
  return await apiFetch<ConnectChannelResult>(
    `/api/v1/organizations/${organizationId}/integrations`,
    {
      method: "POST",
      body: { provider, ...extra },
    }
  )
}

export async function connectTelegram(
  organizationId: number,
  botToken: string
): Promise<IntegrationRecord> {
  const res = await apiFetch<{ data: IntegrationRecord }>(
    `/api/v1/organizations/${organizationId}/integrations`,
    { method: "POST", body: { provider: "telegram", bot_token: botToken } }
  )
  return res.data
}

export async function disconnectIntegration(
  organizationId: number,
  provider: string
): Promise<void> {
  await apiFetch<null>(
    `/api/v1/organizations/${organizationId}/integrations/${provider}`,
    { method: "DELETE" }
  )
}
