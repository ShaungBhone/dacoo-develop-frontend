import { apiFetch } from "@/lib/api"

import type { CompanyListItem } from "@/components/companies/data"

type RawCompany = {
  id: string
  name: string
  slug: string
  domain: string | null
  website_url: string | null
  email: string | null
  phone: string | null
  notes: string | null
  logo_url: string | null
  values?: Record<string, unknown> | null
  contacts_count?: number | null
}

type RawCompanyPage = {
  data: RawCompany[]
  meta?: { current_page?: number; last_page?: number } | null
}

function mapCompany(company: RawCompany): CompanyListItem {
  return {
    id: company.id,
    name: company.name,
    slug: company.slug,
    logo: company.logo_url ?? "",
    domain: company.domain ?? "",
    websiteUrl: company.website_url ?? "",
    email: company.email ?? "",
    phone: company.phone ?? "",
    notes: company.notes ?? "",
    values: company.values ?? {},
    contactsCount: company.contacts_count ?? 0,
  }
}

/**
 * GET .../companies — every company in the organization. The endpoint
 * paginates, so we walk each page and concatenate, matching fetchContacts:
 * the lists are small enough that client-side search/sort stays snappy.
 */
export async function fetchCompanies(
  organizationId: number | string
): Promise<CompanyListItem[]> {
  const base = `/api/v1/organizations/${organizationId}/companies`
  const companies: CompanyListItem[] = []

  let page = 1
  let lastPage = 1
  do {
    const res = await apiFetch<RawCompanyPage>(`${base}?page=${page}`)
    companies.push(...res.data.map(mapCompany))
    lastPage = res.meta?.last_page ?? page
    page += 1
  } while (page <= lastPage)

  return companies
}

export interface CompanyPayload {
  name: string
  logo?: File | null
  /** Bare hostname or a full URL — the server normalizes either. */
  domain?: string | null
  email?: string | null
  phone?: string | null
  notes?: string | null
  /** Workspace-defined attribute values, keyed by attribute slug. */
  values?: Record<string, unknown>
}

/**
 * Build the request body. A File forces multipart; everything else goes as
 * JSON. Empty strings are sent rather than dropped so an edit can clear a
 * field — except on create, where there is nothing to clear.
 */
function buildBody(
  payload: CompanyPayload,
  { keepEmpty }: { keepEmpty: boolean }
): FormData | Record<string, unknown> {
  const fields: Array<[string, string | null | undefined]> = [
    ["name", payload.name],
    ["domain", payload.domain],
    ["email", payload.email],
    ["phone", payload.phone],
    ["notes", payload.notes],
  ]

  if (payload.logo instanceof File) {
    const formData = new FormData()
    formData.append("logo", payload.logo)
    for (const [key, value] of fields) {
      if (value || keepEmpty) formData.append(key, value ?? "")
    }
    // Bracket notation is how Laravel reassembles an array from multipart.
    for (const [slug, value] of Object.entries(payload.values ?? {})) {
      formData.append(`values[${slug}]`, value == null ? "" : String(value))
    }
    return formData
  }

  const body: Record<string, unknown> = {}
  for (const [key, value] of fields) {
    if (value || keepEmpty) body[key] = value ?? ""
  }
  if (payload.values !== undefined) body.values = payload.values
  return body
}

/**
 * POST .../companies — creates a company. The slug is derived server-side
 * from the name and is what enforces per-organization uniqueness, so a
 * near-duplicate name comes back as a 422 on `slug`.
 */
export async function createCompany(
  organizationId: number | string,
  payload: CompanyPayload
): Promise<CompanyListItem> {
  const res = await apiFetch<{ data: RawCompany }>(
    `/api/v1/organizations/${organizationId}/companies`,
    { method: "POST", body: buildBody(payload, { keepEmpty: false }) }
  )
  return mapCompany(res.data)
}

/**
 * PATCH .../companies/{company} — updates a company. Sent as POST with a
 * _method override when a logo file is attached, since multipart bodies
 * don't survive a PATCH in PHP.
 */
export async function updateCompany(
  organizationId: number | string,
  companyId: string,
  payload: CompanyPayload
): Promise<CompanyListItem> {
  const body = buildBody(payload, { keepEmpty: true })
  const isMultipart = body instanceof FormData
  if (isMultipart) body.append("_method", "PATCH")

  const res = await apiFetch<{ data: RawCompany }>(
    `/api/v1/organizations/${organizationId}/companies/${companyId}`,
    { method: isMultipart ? "POST" : "PATCH", body }
  )
  return mapCompany(res.data)
}

/**
 * DELETE .../companies/{company} — removes the company. Its contacts survive
 * with an empty company (the FK nulls on delete).
 */
export async function deleteCompany(
  organizationId: number | string,
  companyId: string
): Promise<void> {
  await apiFetch<null>(
    `/api/v1/organizations/${organizationId}/companies/${companyId}`,
    { method: "DELETE" }
  )
}
