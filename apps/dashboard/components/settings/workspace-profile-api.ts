import { apiFetch } from "@/lib/api"

export type WorkspaceProfile = {
  id: number
  name: string
  logo_url: string | null
  settings: {
    workspace?: {
      locale?: {
        language?: string
        timezone?: string
      }
    }
  } | null
}

export type WorkspaceLanguage = {
  id: number
  name: string
  native: string
  code: string
}

export type WorkspaceTimezone = {
  id: number
  zone_name: string
  abbreviation: string
  gmt_offset_name: string
}

export type CreatedWorkspace = WorkspaceProfile

export async function createWorkspace(input: {
  name: string
  locale: { language: string; timezone: string }
}): Promise<CreatedWorkspace> {
  const response = await apiFetch<{ data: CreatedWorkspace }>(
    "/api/v1/organizations",
    { method: "POST", body: input }
  )

  return response.data
}

export async function fetchWorkspaceProfile(
  organizationId: number
): Promise<WorkspaceProfile> {
  const response = await apiFetch<{ data: WorkspaceProfile }>(
    `/api/v1/organizations/${organizationId}`
  )
  return response.data
}

export async function fetchWorkspaceLanguages(): Promise<WorkspaceLanguage[]> {
  const response = await apiFetch<{ data: WorkspaceLanguage[] }>(
    "/api/v1/world/languages"
  )
  return response.data
}

export async function fetchWorkspaceTimezones(): Promise<WorkspaceTimezone[]> {
  const response = await apiFetch<{ data: WorkspaceTimezone[] }>(
    "/api/v1/world/timezones"
  )
  return response.data
}

export async function updateWorkspaceProfile(
  organizationId: number,
  input: {
    name: string
    locale: { language: string; timezone: string }
  }
): Promise<WorkspaceProfile> {
  const response = await apiFetch<{ data: WorkspaceProfile }>(
    `/api/v1/organizations/${organizationId}/workspace-profile`,
    { method: "PUT", body: input }
  )
  return response.data
}

export async function uploadWorkspaceLogo(
  organizationId: number,
  logo: File
): Promise<WorkspaceProfile> {
  const body = new FormData()
  body.append("logo", logo)

  const response = await apiFetch<{ data: WorkspaceProfile }>(
    `/api/v1/organizations/${organizationId}/workspace-logo`,
    { method: "POST", body }
  )
  return response.data
}

export async function removeWorkspaceLogo(
  organizationId: number
): Promise<WorkspaceProfile> {
  const response = await apiFetch<{ data: WorkspaceProfile }>(
    `/api/v1/organizations/${organizationId}/workspace-logo`,
    { method: "DELETE" }
  )
  return response.data
}

export async function transferWorkspaceOwnership(
  organizationId: number,
  memberId: number
): Promise<WorkspaceProfile> {
  const response = await apiFetch<{ data: WorkspaceProfile }>(
    `/api/v1/organizations/${organizationId}/ownership`,
    { method: "PUT", body: { member_id: memberId } }
  )
  return response.data
}

export async function leaveWorkspace(organizationId: number): Promise<void> {
  await apiFetch(`/api/v1/organizations/${organizationId}/membership`, {
    method: "DELETE",
  })
}
