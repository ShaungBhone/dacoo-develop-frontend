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
  integration: IntegrationRecord | null
}

export async function fetchIntegrations(
  organizationId: number
): Promise<IntegrationProvider[]> {
  const res = await apiFetch<{ data: IntegrationProvider[] }>(
    `/api/v1/organizations/${organizationId}/integrations`
  )
  return res.data
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
