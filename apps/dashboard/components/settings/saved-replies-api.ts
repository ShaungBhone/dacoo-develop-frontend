import { apiFetch } from "@/lib/api"

export type SavedReply = {
  id: string
  title: string
  body: string
  created_at: string | null
  updated_at: string | null
}

export type SavedReplyInput = Pick<SavedReply, "title" | "body">

export async function fetchSavedReplies(
  organizationId: number
): Promise<SavedReply[]> {
  const response = await apiFetch<{ data: SavedReply[] }>(
    `/api/v1/organizations/${organizationId}/saved-replies`
  )

  return response.data
}

export async function createSavedReply(
  organizationId: number,
  input: SavedReplyInput
): Promise<SavedReply> {
  const response = await apiFetch<{ data: SavedReply }>(
    `/api/v1/organizations/${organizationId}/saved-replies`,
    { method: "POST", body: input }
  )

  return response.data
}

export async function updateSavedReply(
  organizationId: number,
  savedReplyId: string,
  input: SavedReplyInput
): Promise<SavedReply> {
  const response = await apiFetch<{ data: SavedReply }>(
    `/api/v1/organizations/${organizationId}/saved-replies/${savedReplyId}`,
    { method: "PATCH", body: input }
  )

  return response.data
}

export async function deleteSavedReply(
  organizationId: number,
  savedReplyId: string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/saved-replies/${savedReplyId}`,
    { method: "DELETE" }
  )
}
