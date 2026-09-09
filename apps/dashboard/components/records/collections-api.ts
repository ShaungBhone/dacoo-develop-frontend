import { apiFetch } from "@/lib/api"
import type { AttributeValues, RecordItem, RecordSummary } from "./api"

export interface Collection {
  id: string
  slug: string
  name: string
  icon: string | null
  iconColor: string | null
  objectId: string
  objectSlug: string
  objectName: string
  boardStatusAttributeId: string | null
  position: number
  entriesCount: number
  createdAt?: string
  updatedAt?: string
}

type RawCollection = {
  id: string
  slug: string
  name: string
  icon: string | null
  icon_color: string | null
  object_id: string
  object_slug: string
  object_name: string
  board_status_attribute_id: string | null
  position: number
  entries_count: number
  created_at?: string
  updated_at?: string
}

function mapCollection(raw: RawCollection): Collection {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    icon: raw.icon,
    iconColor: raw.icon_color,
    objectId: raw.object_id,
    objectSlug: raw.object_slug,
    objectName: raw.object_name,
    boardStatusAttributeId: raw.board_status_attribute_id,
    position: raw.position,
    entriesCount: raw.entries_count ?? 0,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export async function fetchCollections(
  organizationId: number | string,
  objectSlug?: string
): Promise<Collection[]> {
  const query = objectSlug ? `?object=${encodeURIComponent(objectSlug)}` : ""
  const res = await apiFetch<{ data: RawCollection[] }>(
    `/api/v1/organizations/${organizationId}/collections${query}`
  )
  return (res?.data ?? []).map(mapCollection)
}

export async function fetchCollection(
  organizationId: number | string,
  collectionSlug: string
): Promise<Collection> {
  const res = await apiFetch<{ data: RawCollection }>(
    `/api/v1/organizations/${organizationId}/collections/${collectionSlug}`
  )
  return mapCollection(res.data)
}

export interface CreateCollectionInput {
  name: string
  objectId: string
  icon?: string | null
  iconColor?: string | null
}

export async function createCollection(
  organizationId: number | string,
  input: CreateCollectionInput
): Promise<Collection> {
  const res = await apiFetch<{ data: RawCollection }>(
    `/api/v1/organizations/${organizationId}/collections`,
    {
      method: "POST",
      body: {
        name: input.name,
        object_id: input.objectId,
        icon: input.icon,
        icon_color: input.iconColor,
      },
    }
  )
  return mapCollection(res.data)
}

export async function updateCollection(
  organizationId: number | string,
  collectionSlug: string,
  input: { name?: string; icon?: string | null; iconColor?: string | null }
): Promise<Collection> {
  const res = await apiFetch<{ data: RawCollection }>(
    `/api/v1/organizations/${organizationId}/collections/${collectionSlug}`,
    {
      method: "PATCH",
      body: {
        name: input.name,
        icon: input.icon,
        icon_color: input.iconColor,
      },
    }
  )
  return mapCollection(res.data)
}

export async function deleteCollection(
  organizationId: number | string,
  collectionSlug: string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/collections/${collectionSlug}`,
    {
      method: "DELETE",
    }
  )
}

interface RawRecordEntry {
  id: string
  object?: { slug: string }
  title?: string
  display_text?: string
  display_image_url?: string | null
  values?: AttributeValues
  team?: RecordSummary[]
  created_at: string
  updated_at: string
}

export async function fetchCollectionEntries(
  organizationId: number | string,
  collectionSlug: string,
  params?: { search?: string; page?: number; per_page?: number }
): Promise<{ records: RecordItem[]; total: number }> {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.page) searchParams.set("page", String(params.page))
  if (params?.per_page) searchParams.set("per_page", String(params.per_page))

  const qs = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const res = await apiFetch<{ data: RawRecordEntry[]; meta?: { total: number } }>(
    `/api/v1/organizations/${organizationId}/collections/${collectionSlug}/entries${qs}`
  )

  return {
    records: (res?.data ?? []).map((r: RawRecordEntry) => ({
      id: r.id,
      object: r.object?.slug ?? "",
      title: r.title ?? "",
      displayText: r.display_text ?? r.title ?? "",
      displayImageUrl: r.display_image_url ?? null,
      values: r.values ?? {},
      team: r.team,
      createdAt: r.created_at ?? "",
      updatedAt: r.updated_at ?? "",
    })),
    total: res?.meta?.total ?? res?.data?.length ?? 0,
  }
}

export async function addRecordToCollection(
  organizationId: number | string,
  collectionSlug: string,
  recordIds: string | string[]
): Promise<void> {
  const ids = Array.isArray(recordIds) ? recordIds : [recordIds]
  await apiFetch(
    `/api/v1/organizations/${organizationId}/collections/${collectionSlug}/entries`,
    {
      method: "POST",
      body: { record_ids: ids },
    }
  )
}

export async function removeRecordFromCollection(
  organizationId: number | string,
  collectionSlug: string,
  recordId: string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/collections/${collectionSlug}/entries/${recordId}`,
    {
      method: "DELETE",
    }
  )
}

export async function fetchRecordCollections(
  organizationId: number | string,
  recordId: string
): Promise<Collection[]> {
  const res = await apiFetch<{ data: RawCollection[] }>(
    `/api/v1/organizations/${organizationId}/records/${recordId}/collections`
  )
  return (res?.data ?? []).map(mapCollection)
}

export async function attachRecordToCollection(
  organizationId: number | string,
  recordId: string,
  collectionId: string
): Promise<Collection> {
  const res = await apiFetch<{ collection: RawCollection }>(
    `/api/v1/organizations/${organizationId}/records/${recordId}/collections`,
    {
      method: "POST",
      body: { collection_id: collectionId },
    }
  )
  return mapCollection(res.collection)
}

export async function detachRecordFromCollection(
  organizationId: number | string,
  recordId: string,
  collectionId: string
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/records/${recordId}/collections/${collectionId}`,
    {
      method: "DELETE",
    }
  )
}
