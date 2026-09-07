import { apiFetch } from "@/lib/api"

export type TagRecord = {
  id: number
  name: string
  type: string | null
  color: string | null
  created_at: string | null
  updated_at: string | null
  creator: {
    id: number
    name: string
  } | null
}

export async function fetchTags(organizationId: number): Promise<TagRecord[]> {
  const response = await apiFetch<{ data: TagRecord[] }>(
    `/api/v1/organizations/${organizationId}/tags`
  )

  return response.data
}

export async function createTag(
  organizationId: number,
  name: string,
  color?: string | null
): Promise<TagRecord> {
  const response = await apiFetch<{ data: TagRecord }>(
    `/api/v1/organizations/${organizationId}/tags`,
    { method: "POST", body: { name, color } }
  )

  return response.data
}

export async function updateTag(
  organizationId: number,
  tagId: number,
  name: string,
  color?: string | null
): Promise<TagRecord> {
  const response = await apiFetch<{ data: TagRecord }>(
    `/api/v1/organizations/${organizationId}/tags/${tagId}`,
    { method: "PUT", body: { name, color } }
  )

  return response.data
}

export async function deleteTag(
  organizationId: number,
  tagId: number
): Promise<void> {
  await apiFetch(`/api/v1/organizations/${organizationId}/tags/${tagId}`, {
    method: "DELETE",
  })
}
