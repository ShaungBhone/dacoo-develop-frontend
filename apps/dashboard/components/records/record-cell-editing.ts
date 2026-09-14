import type { DataGridColumnCellEdit } from "@/components/reui/data-grid/data-grid"
import type { Attribute, RecordItem } from "@/components/records/api"
import { formatCurrencyAttribute } from "@/components/records/currency-attribute"
import { formatLocationLabel } from "@/components/records/location-value"
import { recordReferenceLabel } from "@/components/records/record-reference"
import type { CurrencySettings } from "@/components/settings/currency-api"
import { normalizeDomain } from "@/lib/domain"

const READ_ONLY_ATTRIBUTE_TYPES = new Set<Attribute["type"]>(["interaction"])

const READ_ONLY_ATTRIBUTE_SLUGS = new Set([
  "record-id",
  "created-at",
  "created-by",
  "last-seen-at",
])

/** Share the grid's editing state so its selection outline rests under custom editors. */
export function beginRecordCellEditing(cellElement: HTMLElement): () => void {
  const viewport = cellElement.closest<HTMLElement>(
    '[data-slot="data-grid-table-viewport"]'
  )
  if (!viewport) return () => undefined

  const wasAlreadyEditing = viewport.hasAttribute("data-cell-editing")
  viewport.setAttribute("data-cell-editing", "")

  return () => {
    if (!wasAlreadyEditing) viewport.removeAttribute("data-cell-editing")
  }
}

export function isRecordAttributeEditable(attribute: Attribute): boolean {
  return (
    !READ_ONLY_ATTRIBUTE_TYPES.has(attribute.type) &&
    !READ_ONLY_ATTRIBUTE_SLUGS.has(attribute.slug)
  )
}

function emptyValue(attribute: Attribute): unknown {
  if (attribute.type === "checkbox") return false
  if (attribute.isMultiselect) return []
  return null
}

function parseOptionValue(attribute: Attribute, raw: string): unknown {
  const values = attribute.isMultiselect
    ? raw.split(",").map((value) => value.trim())
    : [raw.trim()]

  if (values.every((value) => value === "")) return emptyValue(attribute)

  const slugs = values.map((value) => {
    const normalized = value.toLowerCase()
    return attribute.selectOptions.find(
      (option) =>
        option.slug.toLowerCase() === normalized ||
        option.title.toLowerCase() === normalized ||
        option.id.toLowerCase() === normalized
    )?.slug
  })

  if (slugs.some((slug) => slug === undefined)) return undefined
  return attribute.isMultiselect ? slugs : slugs[0]
}

function parseDomainValue(attribute: Attribute, raw: string): unknown {
  const domains = raw
    .split(/[\s,]+/)
    .map((value) => normalizeDomain(value))
    .filter(Boolean)

  if (raw.trim() && domains.length === 0) return undefined
  if (attribute.isMultiselect) return [...new Set(domains)]
  return domains[0] ?? null
}

/** Convert spreadsheet input into the same payload shape as AttributeInput. */
export function parseRecordCellValue(
  attribute: Attribute,
  raw: string
): unknown {
  const trimmed = raw.trim()

  switch (attribute.type) {
    case "checkbox": {
      if (
        ["true", "yes", "1", "checked", "on"].includes(trimmed.toLowerCase())
      ) {
        return true
      }
      if (
        ["false", "no", "0", "unchecked", "off", ""].includes(
          trimmed.toLowerCase()
        )
      ) {
        return false
      }
      return undefined
    }
    case "currency":
    case "number":
    case "rating": {
      if (!trimmed) return null
      const parsed = Number(trimmed.replace(/[^0-9.-]/g, ""))
      return Number.isFinite(parsed) ? parsed : undefined
    }
    case "date": {
      if (!trimmed) return null
      const parsed = new Date(trimmed)
      if (Number.isNaN(parsed.getTime())) return undefined
      const year = parsed.getFullYear()
      const month = String(parsed.getMonth() + 1).padStart(2, "0")
      const day = String(parsed.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }
    case "domain":
      return parseDomainValue(attribute, raw)
    case "select":
    case "status":
      return parseOptionValue(attribute, raw)
    case "actor-reference":
    case "image":
    case "record-reference":
      return trimmed ? undefined : emptyValue(attribute)
    case "tags": {
      if (!trimmed) return emptyValue(attribute)
      const tags = raw
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean)
      return attribute.isMultiselect ? tags : (tags[0] ?? null)
    }
    default:
      return trimmed ? raw : null
  }
}

/** Stable display/clipboard text for a raw record attribute value. */
export function formatRecordCellValue(
  attribute: Attribute,
  value: unknown,
  currencySettings: CurrencySettings | null
): string {
  if (value == null || value === "") return ""

  if (Array.isArray(value)) {
    return value
      .map((entry) => formatRecordCellValue(attribute, entry, currencySettings))
      .filter(Boolean)
      .join(", ")
  }

  switch (attribute.type) {
    case "checkbox":
      return value === true ? "Yes" : "No"
    case "currency":
      return formatCurrencyAttribute(
        value as string | number,
        attribute,
        currencySettings
      )
    case "select":
    case "status": {
      const option = attribute.selectOptions.find(
        (candidate) => candidate.slug === value || candidate.id === value
      )
      return option?.title ?? String(value)
    }
    case "actor-reference":
    case "record-reference":
      return recordReferenceLabel(value)
    case "timestamp":
    case "interaction": {
      const parsed = new Date(String(value))
      return Number.isNaN(parsed.getTime())
        ? String(value)
        : parsed.toLocaleString()
    }
    case "location":
      return formatLocationLabel(value) ?? ""
    case "image":
      return ""
    default:
      return String(value)
  }
}

/** Build the ReUI spreadsheet contract for an editable record attribute. */
export function createRecordCellEdit(
  attribute: Attribute,
  currencySettings: CurrencySettings | null
): DataGridColumnCellEdit<RecordItem> | undefined {
  if (!isRecordAttributeEditable(attribute)) return undefined

  const requiresTypedSelection = [
    "actor-reference",
    "image",
    "record-reference",
  ].includes(attribute.type)

  return {
    batchEditable: !requiresTypedSelection,
    parse: (raw) => parseRecordCellValue(attribute, raw),
    format: (value) =>
      formatRecordCellValue(attribute, value, currencySettings),
    clearValue: emptyValue(attribute),
  }
}
