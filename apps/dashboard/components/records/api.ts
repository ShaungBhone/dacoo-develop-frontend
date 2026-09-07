import { apiFetch } from "@/lib/api"

/** The attribute types the record engine understands, mirroring Attio's set. */
export type AttributeType =
  | "actor-reference"
  | "checkbox"
  | "currency"
  | "date"
  | "domain"
  | "email-address"
  | "interaction"
  | "image"
  | "location"
  | "number"
  | "personal-name"
  | "phone-number"
  | "rating"
  | "record-reference"
  | "select"
  | "status"
  | "tags"
  | "text"
  | "timestamp"

/** Persisted common settings plus the fixed-currency presentation snapshot. */
export type AttributeConfig = {
  description?: string
  default_value?: unknown
  currency_code?: string
  currency_display?: "code" | "symbol"
  currency_grouping?: "default" | "none"
  currency_decimal_places?: number
  currency_symbol?: string | null
  currency_symbol_first?: boolean
  currency_decimal_mark?: string | null
  currency_thousands_separator?: string | null
  [key: string]: unknown
}

export interface SelectOption {
  id: string
  slug: string
  title: string
  color: string | null
  position: number
  isArchived: boolean
}

export interface Attribute {
  id: string
  slug: string
  title: string
  type: AttributeType
  isSystem: boolean
  /** False for column-backed system fields, which the typed UI renders itself. */
  isCustom: boolean
  isMultiselect: boolean
  isRequired: boolean
  isUnique: boolean
  position: number
  selectOptions: SelectOption[]
  /**
   * Free-form config object set per attribute. The record UI uses
   * `config.icon` (a key from ATTRIBUTE_ICON_KEYS) and optionally
   * `config.icon_color` to override the default per-type icon.
   */
  config: AttributeConfig | null
}

export interface RecordObject {
  id: string
  slug: string
  singularNoun: string
  pluralNoun: string
  icon: string
  iconColor: string
  isSystem: boolean
  isActive: boolean
  isDeactivatable: boolean
  isHidden: boolean
  boardStatusAttributeId: string | null
  recordTextAttributeId: string | null
  recordImageAttributeId: string | null
  supportsBoard: boolean
  recordsCount: number
  attributesCount: number
  attributes: Attribute[]
}

export interface RecordTemplate {
  key: "crm" | "sales"
  name: string
  description: string
  category: string
  objectSlug: string
  installedVersion: number | null
}

/** A record's values, keyed by attribute slug. */
export type AttributeValues = Record<string, unknown>

/** A lightweight related record embedded in a record response. */
export interface RecordSummary {
  id: string
  title: string
}

export type LocationResultKind = "city" | "state" | "country"

/** One normalized geographic result from the world location search. */
export interface LocationSearchResult {
  id: string
  kind: LocationResultKind
  title: string
  city: string | null
  state: string | null
  country: string | null
  lat: number | null
  lng: number | null
}

/**
 * One instance of an object. `values` merges the record's own columns with its
 * attribute values — which is which is not the client's concern.
 */
export interface RecordItem {
  id: string
  object: string
  title: string
  displayText: string
  displayImageUrl: string | null
  values: AttributeValues
  /** People related through this company's Person → Company relationship. */
  team?: RecordSummary[]
  createdAt: string
  updatedAt: string
}

export type RecordViewType = "table" | "kanban"
export type RecordViewVisibility = "personal" | "shared"

/** An independently configured extra rendering of an existing attribute. */
export interface RecordColumnInstance {
  id: string
  attributeSlug: string
}

export interface RecordViewConfiguration {
  search?: string
  sorting?: Array<{ id: string; desc: boolean }>
  filters?: Array<{
    id: string
    value?: string
    values?: string[]
    operator?: string
  }>
  columnOrder?: string[]
  columnVisibility?: Record<string, boolean>
  columnPinning?: { start?: string[]; end?: string[] }
  columnSizing?: Record<string, number>
  columnInstances?: RecordColumnInstance[]
  calculations?: Record<string, string>
  groupByAttributeId?: string | null
  cardFields?: string[]
  collapsedLanes?: string[]
  laneOrder?: string[]
}

export interface RecordView {
  id: string
  name: string
  viewType: RecordViewType
  visibility: RecordViewVisibility
  configuration: RecordViewConfiguration
  creator: { id: string; name: string }
  canUpdate: boolean
  canDelete: boolean
  createdAt: string
  updatedAt: string
}

type RawRecordViewConfiguration = {
  search?: string
  sorting?: Array<{ id: string; desc: boolean }>
  filters?: Array<{
    id: string
    value?: string
    values?: string[]
    operator?: string
  }>
  column_order?: string[]
  column_visibility?: Record<string, boolean>
  column_pinning?: { start?: string[]; end?: string[] }
  column_sizing?: Record<string, number>
  column_instances?: Array<{
    id: string
    attribute_slug: string
  }>
  calculations?: Record<string, string>
  group_by_attribute_id?: string | null
  card_fields?: string[]
  collapsed_lanes?: string[]
  lane_order?: string[]
}

type RawRecordView = {
  id: string
  name: string
  view_type: RecordViewType
  visibility: RecordViewVisibility
  configuration: RawRecordViewConfiguration
  creator: { id: string; name: string }
  can_update: boolean
  can_delete: boolean
  created_at: string
  updated_at: string
}

function mapRecordView(view: RawRecordView): RecordView {
  return {
    id: view.id,
    name: view.name,
    viewType: view.view_type,
    visibility: view.visibility,
    configuration: {
      search: view.configuration.search,
      sorting: view.configuration.sorting,
      filters: view.configuration.filters,
      columnOrder: view.configuration.column_order,
      columnVisibility: view.configuration.column_visibility,
      columnPinning: view.configuration.column_pinning,
      columnSizing: view.configuration.column_sizing,
      columnInstances: view.configuration.column_instances?.map((instance) => ({
        id: instance.id,
        attributeSlug: instance.attribute_slug,
      })),
      calculations: view.configuration.calculations,
      groupByAttributeId: view.configuration.group_by_attribute_id,
      cardFields: view.configuration.card_fields,
      collapsedLanes: view.configuration.collapsed_lanes,
      laneOrder: view.configuration.lane_order,
    },
    creator: view.creator,
    canUpdate: view.can_update,
    canDelete: view.can_delete,
    createdAt: view.created_at,
    updatedAt: view.updated_at,
  }
}

function serializeRecordViewConfiguration(
  configuration: RecordViewConfiguration
): RawRecordViewConfiguration {
  return {
    search: configuration.search,
    sorting: configuration.sorting,
    filters: configuration.filters,
    column_order: configuration.columnOrder,
    column_visibility: configuration.columnVisibility,
    column_pinning: configuration.columnPinning,
    column_sizing: configuration.columnSizing,
    column_instances: configuration.columnInstances?.map((instance) => ({
      id: instance.id,
      attribute_slug: instance.attributeSlug,
    })),
    calculations: configuration.calculations,
    group_by_attribute_id: configuration.groupByAttributeId,
    card_fields: configuration.cardFields,
    collapsed_lanes: configuration.collapsedLanes,
    lane_order: configuration.laneOrder,
  }
}

export async function fetchRecordViews(
  organizationId: number | string,
  objectId: string
): Promise<{
  views: RecordView[]
  lastViewId: string | null
  lastBuiltInViewType: RecordViewType | null
}> {
  const res = await apiFetch<{
    data: RawRecordView[]
    meta?: {
      last_view_id?: string | null
      last_builtin_view_type?: RecordViewType | null
    }
  }>(`/api/v1/organizations/${organizationId}/objects/${objectId}/record-views`)

  return {
    views: res.data.map(mapRecordView),
    lastViewId: res.meta?.last_view_id ?? null,
    lastBuiltInViewType: res.meta?.last_builtin_view_type ?? null,
  }
}

export async function createRecordView(
  organizationId: number | string,
  objectId: string,
  input: {
    name: string
    viewType: RecordViewType
    visibility: RecordViewVisibility
    configuration: RecordViewConfiguration
  }
): Promise<RecordView> {
  const res = await apiFetch<{ data: RawRecordView }>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/record-views`,
    {
      method: "POST",
      body: {
        name: input.name,
        view_type: input.viewType,
        visibility: input.visibility,
        configuration: serializeRecordViewConfiguration(input.configuration),
      },
    }
  )
  return mapRecordView(res.data)
}

export async function updateRecordView(
  organizationId: number | string,
  objectId: string,
  viewId: string,
  input: {
    name?: string
    viewType?: RecordViewType
    configuration?: RecordViewConfiguration
  }
): Promise<RecordView> {
  const body: Record<string, unknown> = {}
  if (input.name !== undefined) body.name = input.name
  if (input.viewType !== undefined) body.view_type = input.viewType
  if (input.configuration !== undefined) {
    body.configuration = serializeRecordViewConfiguration(input.configuration)
  }

  const res = await apiFetch<{ data: RawRecordView }>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/record-views/${viewId}`,
    { method: "PATCH", body }
  )
  return mapRecordView(res.data)
}

export async function deleteRecordView(
  organizationId: number | string,
  objectId: string,
  viewId: string
): Promise<void> {
  await apiFetch<null>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/record-views/${viewId}`,
    { method: "DELETE" }
  )
}

export async function updateLastRecordView(
  organizationId: number | string,
  objectId: string,
  preference: { recordViewId: string } | { builtInViewType: RecordViewType }
): Promise<void> {
  const body =
    "recordViewId" in preference
      ? { record_view_id: preference.recordViewId }
      : { built_in_view_type: preference.builtInViewType }

  await apiFetch<null>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/record-view-preference`,
    { method: "PUT", body }
  )
}

type RawSelectOption = {
  id: string
  slug: string
  title: string
  color: string | null
  position: number
  is_archived: boolean
}

type RawAttribute = {
  id: string
  slug: string
  title: string
  type: AttributeType
  is_system: boolean
  is_custom: boolean
  is_multiselect: boolean
  is_required: boolean
  is_unique: boolean
  position: number
  select_options?: RawSelectOption[] | null
  config?: AttributeConfig | null
}

type RawObject = {
  id: string
  slug: string
  singular_noun: string
  plural_noun: string
  icon?: string | null
  icon_color?: string | null
  is_system: boolean
  is_active?: boolean
  is_deactivatable?: boolean
  is_hidden?: boolean
  board_status_attribute_id?: string | null
  record_text_attribute_id?: string | null
  record_image_attribute_id?: string | null
  supports_board?: boolean
  records_count?: number | null
  attributes_count?: number | null
  attributes?: RawAttribute[] | null
}

type RawRecordTemplate = {
  key: RecordTemplate["key"]
  name: string
  description: string
  category: string
  object_slug: string
  installed_version: number | null
}

function mapAttribute(attribute: RawAttribute): Attribute {
  return {
    id: attribute.id,
    slug: attribute.slug,
    title: attribute.title,
    type: attribute.type,
    isSystem: attribute.is_system,
    isCustom: attribute.is_custom,
    isMultiselect: attribute.is_multiselect,
    isRequired: attribute.is_required,
    isUnique: attribute.is_unique,
    position: attribute.position,
    config: attribute.config ?? null,
    selectOptions: (attribute.select_options ?? []).map((option) => ({
      id: option.id,
      slug: option.slug,
      title: option.title,
      color: option.color,
      position: option.position,
      isArchived: option.is_archived,
    })),
  }
}

function mapObject(object: RawObject): RecordObject {
  return {
    id: object.id,
    slug: object.slug,
    singularNoun: object.singular_noun,
    pluralNoun: object.plural_noun,
    icon: object.icon ?? "box",
    iconColor: object.icon_color ?? "blue",
    isSystem: object.is_system,
    isActive: object.is_active ?? true,
    isDeactivatable: object.is_deactivatable ?? false,
    isHidden: object.is_hidden ?? false,
    boardStatusAttributeId: object.board_status_attribute_id ?? null,
    recordTextAttributeId: object.record_text_attribute_id ?? null,
    recordImageAttributeId: object.record_image_attribute_id ?? null,
    supportsBoard: object.supports_board ?? false,
    recordsCount: object.records_count ?? 0,
    attributesCount: object.attributes_count ?? 0,
    attributes: (object.attributes ?? []).map(mapAttribute),
  }
}

function mapRecordTemplate(template: RawRecordTemplate): RecordTemplate {
  return {
    key: template.key,
    name: template.name,
    description: template.description,
    category: template.category,
    objectSlug: template.object_slug,
    installedVersion: template.installed_version,
  }
}

export async function fetchRecordTemplates(
  organizationId: number | string
): Promise<RecordTemplate[]> {
  const res = await apiFetch<{ data: RawRecordTemplate[] }>(
    `/api/v1/organizations/${organizationId}/record-templates`
  )
  return res.data.map(mapRecordTemplate)
}

export async function installRecordTemplate(
  organizationId: number | string,
  templateKey: Exclude<RecordTemplate["key"], "crm">
): Promise<void> {
  await apiFetch(
    `/api/v1/organizations/${organizationId}/record-templates/${templateKey}`,
    { method: "POST" }
  )
}

/**
 * GET .../objects — the organization's schema: every object and its attribute
 * definitions. This is what lets the UI render workspace-defined fields
 * without knowing them at build time.
 */
export async function fetchObjects(
  organizationId: number | string,
  options?: { includeInactiveStandard?: boolean }
): Promise<RecordObject[]> {
  const query = options?.includeInactiveStandard
    ? "?include_inactive_standard=1"
    : ""
  const res = await apiFetch<{ data: RawObject[] }>(
    `/api/v1/organizations/${organizationId}/objects${query}`
  )
  return res.data.map(mapObject)
}

export async function updateStandardObjectActivation(
  organizationId: number | string,
  objectId: string,
  isActive: boolean
): Promise<RecordObject> {
  const res = await apiFetch<{ data: RawObject }>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/activation`,
    { method: "PATCH", body: { is_active: isActive } }
  )

  return mapObject(res.data)
}

/**
 * The custom (value-backed) attributes of one object, in display order.
 * System fields are excluded — those have hand-built inputs already.
 */
export async function fetchCustomAttributes(
  organizationId: number | string,
  objectSlug: string
): Promise<Attribute[]> {
  const objects = await fetchObjects(organizationId)
  return (
    objects
      .find((object) => object.slug === objectSlug)
      ?.attributes.filter((attribute) => attribute.isCustom) ?? []
  )
}

/** Every attribute of one object, system and custom, in display order. */
export async function fetchObjectAttributes(
  organizationId: number | string,
  objectSlug: string
): Promise<Attribute[]> {
  const objects = await fetchObjects(organizationId)
  return objects.find((object) => object.slug === objectSlug)?.attributes ?? []
}

type RawRecord = {
  id: string
  object: string
  title: string
  display_text?: string | null
  display_image_url?: string | null
  values: AttributeValues | null
  team?: RecordSummary[] | null
  created_at: string | null
  updated_at: string | null
}

type RawRecordPage = {
  data: RawRecord[]
  meta?: { current_page?: number; last_page?: number } | null
}

function mapRecord(record: RawRecord): RecordItem {
  return {
    id: record.id,
    object: record.object,
    title: record.title,
    displayText: record.display_text ?? record.title,
    displayImageUrl: record.display_image_url ?? null,
    values: record.values ?? {},
    team: record.team ?? [],
    createdAt: record.created_at ?? new Date(0).toISOString(),
    updatedAt: record.updated_at ?? new Date(0).toISOString(),
  }
}

/**
 * GET .../records/{record} — one record by its Sqids key. The list endpoint
 * returns the same shape, so this is only worth calling when arriving directly
 * at a record's URL without the list in hand.
 */
export async function fetchRecord(
  organizationId: number | string,
  recordId: string
): Promise<RecordItem> {
  const res = await apiFetch<{ data: RawRecord }>(
    `/api/v1/organizations/${organizationId}/records/${recordId}`
  )
  return mapRecord(res.data)
}

/** Search the world dataset for city, state, and country location choices. */
export async function fetchLocationResults(
  query: string
): Promise<LocationSearchResult[]> {
  const res = await apiFetch<{ data: LocationSearchResult[] }>(
    `/api/v1/world/locations?query=${encodeURIComponent(query)}`
  )

  return res.data
}

/**
 * GET .../records — every record of one object. Walks the pages, matching the
 * approach the contacts list used: the tables are small enough that
 * client-side search and sort stay snappy.
 */
export async function fetchRecords(
  organizationId: number | string,
  objectSlug: string
): Promise<RecordItem[]> {
  const base = `/api/v1/organizations/${organizationId}/records?object=${encodeURIComponent(objectSlug)}`
  const records: RecordItem[] = []

  let page = 1
  let lastPage = 1
  do {
    const res = await apiFetch<RawRecordPage>(`${base}&page=${page}`)
    records.push(...res.data.map(mapRecord))
    lastPage = res.meta?.last_page ?? page
    page += 1
  } while (page <= lastPage)

  return records
}

export async function createRecord(
  organizationId: number | string,
  objectSlug: string,
  values: AttributeValues
): Promise<RecordItem> {
  const res = await apiFetch<{ data: RawRecord }>(
    `/api/v1/organizations/${organizationId}/records`,
    { method: "POST", body: { object: objectSlug, values } }
  )
  return mapRecord(res.data)
}

export async function updateRecord(
  organizationId: number | string,
  recordId: string,
  values: AttributeValues
): Promise<RecordItem> {
  const res = await apiFetch<{ data: RawRecord }>(
    `/api/v1/organizations/${organizationId}/records/${recordId}`,
    { method: "PATCH", body: { values } }
  )
  return mapRecord(res.data)
}

export async function deleteRecord(
  organizationId: number | string,
  recordId: string
): Promise<void> {
  await apiFetch<null>(
    `/api/v1/organizations/${organizationId}/records/${recordId}`,
    { method: "DELETE" }
  )
}

export interface CreateObjectPayload {
  singularNoun: string
  pluralNoun: string
  icon?: string
  iconColor?: string
}

/** POST .../objects — define a custom object. */
export async function createObject(
  organizationId: number | string,
  payload: CreateObjectPayload
): Promise<RecordObject> {
  const res = await apiFetch<{ data: RawObject }>(
    `/api/v1/organizations/${organizationId}/objects`,
    {
      method: "POST",
      body: {
        singular_noun: payload.singularNoun,
        plural_noun: payload.pluralNoun,
        icon: payload.icon,
        icon_color: payload.iconColor,
      },
    }
  )
  return mapObject(res.data)
}

export interface CreateAttributePayload {
  title: string
  type: AttributeType
  isMultiselect?: boolean
  isRequired?: boolean
  isUnique?: boolean
  config?: AttributeConfig | null
  selectOptions?: Array<{ title: string; color?: string | null }>
}

/** POST .../objects/{object}/attributes — define a custom attribute. */
export async function createAttribute(
  organizationId: number | string,
  objectId: string,
  payload: CreateAttributePayload
): Promise<Attribute> {
  const res = await apiFetch<{ data: RawAttribute }>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/attributes`,
    {
      method: "POST",
      body: {
        title: payload.title,
        type: payload.type,
        is_multiselect: payload.isMultiselect ?? false,
        is_required: payload.isRequired ?? false,
        is_unique: payload.isUnique ?? false,
        config: payload.config,
        select_options: payload.selectOptions,
      },
    }
  )
  return mapAttribute(res.data)
}

export interface UpdateAttributePayload {
  title?: string
  isRequired?: boolean
  isUnique?: boolean
  /** Updated config; sending `null` clears config. */
  config?: AttributeConfig | null
}

/**
 * PATCH .../objects/{object}/attributes/{attribute} — rename an attribute and/or
 * update its config. The backend rejects this for system attributes (403), and
 * rewrites `slug` from `title`. Type and slug-identity are not editable here.
 */
export async function updateAttribute(
  organizationId: number | string,
  objectId: string,
  attributeId: string,
  payload: UpdateAttributePayload
): Promise<Attribute> {
  const body: Record<string, unknown> = {}
  if (payload.title !== undefined) body.title = payload.title
  if (payload.isRequired !== undefined) body.is_required = payload.isRequired
  if (payload.isUnique !== undefined) body.is_unique = payload.isUnique
  if (payload.config !== undefined) body.config = payload.config

  const res = await apiFetch<{ data: RawAttribute }>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/attributes/${attributeId}`,
    { method: "PATCH", body }
  )
  return mapAttribute(res.data)
}

/** DELETE .../objects/{object}/attributes/{attribute} */
export async function deleteAttribute(
  organizationId: number | string,
  objectId: string,
  attributeId: string
): Promise<void> {
  await apiFetch<null>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/attributes/${attributeId}`,
    { method: "DELETE" }
  )
}

export async function uploadRecordAttributeImage(
  organizationId: number | string,
  recordId: string,
  objectId: string,
  attributeId: string,
  image: File
): Promise<{ id: string; url: string }> {
  const body = new FormData()
  body.append("image", image)
  const res = await apiFetch<{ data: { id: string; url: string } }>(
    `/api/v1/organizations/${organizationId}/records/${recordId}/objects/${objectId}/attributes/${attributeId}/image`,
    { method: "POST", body }
  )
  return res.data
}

export async function deleteRecordAttributeImage(
  organizationId: number | string,
  recordId: string,
  objectId: string,
  attributeId: string
): Promise<void> {
  await apiFetch<null>(
    `/api/v1/organizations/${organizationId}/records/${recordId}/objects/${objectId}/attributes/${attributeId}/image`,
    { method: "DELETE" }
  )
}

export async function createSelectOption(
  organizationId: number | string,
  objectId: string,
  attributeId: string,
  payload: { title: string; color?: string | null; description?: string | null }
): Promise<{ option: SelectOption; attribute: Attribute }> {
  const res = await apiFetch<{
    data: {
      id: string
      slug: string
      title: string
      description?: string | null
      color?: string | null
      position: number
      is_final: boolean
      is_archived: boolean
    }
    attribute: RawAttribute
  }>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/attributes/${attributeId}/options`,
    { method: "POST", body: payload }
  )

  return {
    option: {
      id: res.data.id,
      slug: res.data.slug,
      title: res.data.title,
      color: res.data.color ?? null,
      position: res.data.position,
      isArchived: res.data.is_archived,
    },
    attribute: mapAttribute(res.attribute),
  }
}

export async function updateSelectOption(
  organizationId: number | string,
  objectId: string,
  attributeId: string,
  optionId: string,
  payload: {
    title?: string
    color?: string | null
    description?: string | null
  }
): Promise<{ option: SelectOption; attribute: Attribute }> {
  const res = await apiFetch<{
    data: {
      id: string
      slug: string
      title: string
      color?: string | null
      position: number
      is_final: boolean
      is_archived: boolean
    }
    attribute: RawAttribute
  }>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/attributes/${attributeId}/options/${optionId}`,
    { method: "PATCH", body: payload }
  )

  return {
    option: {
      id: res.data.id,
      slug: res.data.slug,
      title: res.data.title,
      color: res.data.color ?? null,
      position: res.data.position,
      isArchived: res.data.is_archived,
    },
    attribute: mapAttribute(res.attribute),
  }
}

export async function deleteSelectOption(
  organizationId: number | string,
  objectId: string,
  attributeId: string,
  optionId: string
): Promise<void> {
  await apiFetch<null>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}/attributes/${attributeId}/options/${optionId}`,
    { method: "DELETE" }
  )
}

export interface UpdateObjectPayload {
  singularNoun?: string
  pluralNoun?: string
  icon?: string
  iconColor?: string
  recordTextAttributeId?: string | null
  recordImageAttributeId?: string | null
  /** Rejected by the server on system objects. */
  slug?: string
}

/** PATCH .../objects/{object} — rename an object, or re-slug a custom one. */
export async function updateObject(
  organizationId: number | string,
  objectId: string,
  payload: UpdateObjectPayload
): Promise<RecordObject> {
  const body: Record<string, unknown> = {}
  if (payload.singularNoun !== undefined)
    body.singular_noun = payload.singularNoun
  if (payload.pluralNoun !== undefined) body.plural_noun = payload.pluralNoun
  if (payload.icon !== undefined) body.icon = payload.icon
  if (payload.iconColor !== undefined) body.icon_color = payload.iconColor
  if (payload.recordTextAttributeId !== undefined)
    body.record_text_attribute_id = payload.recordTextAttributeId
  if (payload.recordImageAttributeId !== undefined)
    body.record_image_attribute_id = payload.recordImageAttributeId
  if (payload.slug !== undefined) body.slug = payload.slug

  const res = await apiFetch<{ data: RawObject }>(
    `/api/v1/organizations/${organizationId}/objects/${objectId}`,
    { method: "PATCH", body }
  )
  return mapObject(res.data)
}
