"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import {
  AlignLeftIcon,
  CalendarIcon,
  CheckSquareIcon,
  CircleDotIcon,
  ClockIcon,
  CoinsIcon,
  GlobeIcon,
  HashIcon,
  Link2Icon,
  MailIcon,
  MapPinIcon,
  MessageSquareIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  TagIcon,
  UserIcon,
} from "@/components/ui/icons"

import type {
  Attribute,
  AttributeType,
  RecordColumnInstance,
  RecordItem,
} from "@/components/records/api"
import { formatLocationLabel } from "@/components/records/location-value"
import {
  socialHandle,
  socialHref,
  socialPlatformFor,
} from "@/components/records/social-attributes"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Checkbox } from "@/components/ui/checkbox"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { Skeleton } from "@/components/ui/skeleton"
import type { CurrencySettings } from "@/components/settings/currency-api"
import { formatCurrencyAttribute } from "@/components/records/currency-attribute"
import { AddColumnPopover } from "@/components/records/add-column-popover"

const headerClassName =
  "p-0 text-sm font-semibold tracking-wide text-muted-foreground whitespace-nowrap"
const cellClassName = "px-3 py-2 align-middle text-sm whitespace-nowrap"

/**
 * Icon picker keys shared with the Column Settings rename dialog. A user can
 * pin any of these to a column via `config.icon`; the grid renderer reads the
 * same map so the header and the picker stay in sync.
 */
export const ATTRIBUTE_ICON_OPTIONS = [
  { key: "text", label: "Text", icon: AlignLeftIcon },
  { key: "number", label: "Number", icon: HashIcon },
  { key: "date", label: "Date", icon: CalendarIcon },
  { key: "email", label: "Email", icon: MailIcon },
  { key: "phone", label: "Phone", icon: PhoneIcon },
  { key: "currency", label: "Currency", icon: CoinsIcon },
  { key: "globe", label: "Link", icon: GlobeIcon },
  { key: "user", label: "User", icon: UserIcon },
  { key: "tag", label: "Tag", icon: TagIcon },
  { key: "checkbox", label: "Checkbox", icon: CheckSquareIcon },
] as const

const ATTRIBUTE_ICON_BY_KEY: Record<
  string,
  React.ComponentType<{ className?: string }>
> = Object.fromEntries(ATTRIBUTE_ICON_OPTIONS.map((opt) => [opt.key, opt.icon]))

/** Resolve an icon component from a `config.icon` override key. */
export function attributeIconByKey(
  iconKey: unknown
): React.ComponentType<{ className?: string }> | undefined {
  return typeof iconKey === "string"
    ? ATTRIBUTE_ICON_BY_KEY[iconKey]
    : undefined
}

/**
 * Widths matter more than they look: the grid derives each pinned column's
 * sticky offset from the running total of the sizes before it, so a wrong
 * `size` here shows up as a misaligned frozen column, not just a wide one.
 */
const SELECT_COLUMN_WIDTH = 36
const TITLE_COLUMN_WIDTH = 260
const ATTRIBUTE_COLUMN_WIDTH = 200
const ADD_COLUMN_WIDTH = 230

export const ADD_COLUMN_ID = "add-column"

/** Standard objects whose system Name field is the primary record column. */
export function usesStandardNameIdentity(objectSlug?: string | null) {
  return objectSlug === "person" || objectSlug === "company"
}

/** Resolve the protected Name attribute used by a standard object table. */
export function getStandardNameIdentityAttribute(
  attributes: Attribute[],
  objectSlug?: string | null
) {
  if (!usesStandardNameIdentity(objectSlug)) return undefined

  return attributes.find(
    (attribute) => attribute.slug === "name" && attribute.isSystem
  )
}

/** The immutable base column ID for an attribute in a record table. */
export function getRecordAttributeColumnId(
  attribute: Attribute,
  primaryAttributeSlug?: string
) {
  return attribute.slug === primaryAttributeSlug ? "title" : attribute.slug
}

export type RecordColumnMeta = {
  attributeSlug?: string
  sourceColumnId?: string
  isDuplicate?: boolean
}

/**
 * Resolve the icon for an attribute. An explicit `config.icon` override (a key
 * from {@link ATTRIBUTE_ICON_OPTIONS}) wins over both the type default and the
 * slug heuristic, so a user-picked icon persists across reloads.
 */
export function getAttributeIcon(
  type: AttributeType,
  slug?: string,
  iconKey?: unknown
) {
  const fromConfig = attributeIconByKey(iconKey)
  if (fromConfig) return fromConfig

  // Social attributes are plain `text` on the wire, so only the slug tells us
  // to use a brand mark. Checked after the config override so a user who
  // deliberately re-pinned an icon keeps it.
  const social = socialPlatformFor(slug)
  if (social) return social.icon

  if (slug === "domain" || slug === "website") {
    return GlobeIcon
  }

  switch (type) {
    case "domain":
      return GlobeIcon
    case "email-address":
      return MailIcon
    case "phone-number":
      return PhoneIcon
    case "location":
      return MapPinIcon
    case "number":
      return HashIcon
    case "currency":
      return CoinsIcon
    case "date":
      return CalendarIcon
    case "timestamp":
      return ClockIcon
    case "checkbox":
      return CheckSquareIcon
    case "select":
      return TagIcon
    case "status":
      return CircleDotIcon
    case "rating":
      return StarIcon
    case "actor-reference":
    case "personal-name":
      return UserIcon
    case "record-reference":
      return Link2Icon
    case "interaction":
      return MessageSquareIcon
    default:
      return AlignLeftIcon
  }
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
}

/** Render a value according to its attribute's type. */
function formatValue(
  attribute: Attribute,
  value: unknown,
  currencySettings: CurrencySettings | null
): string {
  if (value == null || value === "") return ""

  if (Array.isArray(value)) {
    return value
      .map((entry) => formatValue(attribute, entry, currencySettings))
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
      const option = attribute.selectOptions?.find(
        (candidate) => candidate.slug === value || candidate.id === value
      )
      return option?.title ?? String(value)
    }
    case "date": {
      const d = new Date(String(value))
      return Number.isNaN(d.getTime())
        ? String(value)
        : d.getFullYear().toString()
    }
    case "timestamp":
    case "interaction":
      return new Date(String(value)).toLocaleString()
    case "location":
      return formatLocationLabel(value) ?? String(value)
    case "image":
      return ""
    default:
      return String(value)
  }
}

interface ColumnOptions {
  attributes: Attribute[]
  objectSlug?: string | null
  columnInstances?: RecordColumnInstance[]
  onAddColumn?: () => void
  currencySettings: CurrencySettings | null
  /**
   * Opens the rename dialog for a column. Receives the column id (the
   * attribute slug, or `"title"` for the primary system field). The receiver
   * is responsible for looking up the attribute and refusing system fields.
   */
  onRename?: (columnId: string) => void
  organizationId?: number | string
  objectId?: string
  objectSingular?: string
  onAttributeCreated?: (newAttribute: Attribute) => Promise<void> | void
  onAddExistingAttribute?: (attribute: Attribute) => void
}

/**
 * Builds Attio-style spreadsheet grid columns from attribute metadata.
 */
export function buildRecordColumns({
  attributes,
  objectSlug,
  columnInstances = [],
  onAddColumn,
  currencySettings,
  onRename,
  organizationId,
  objectId,
  objectSingular,
  onAttributeCreated,
  onAddExistingAttribute,
}: ColumnOptions): ColumnDef<DataGridFeatures, RecordItem>[] {
  const standardName = getStandardNameIdentityAttribute(attributes, objectSlug)
  const primaryAttributeSlug = standardName?.slug
  const rest = primaryAttributeSlug
    ? attributes.filter((attribute) => attribute.slug !== primaryAttributeSlug)
    : attributes
  const PrimaryHeaderIcon = standardName
    ? getAttributeIcon(
        standardName.type,
        standardName.slug,
        standardName.config?.icon
      )
    : UserIcon
  const primaryHeaderTitle = standardName?.title ?? "Record"

  const columns: ColumnDef<DataGridFeatures, RecordItem>[] = [
    {
      id: "select",
      enableSorting: false,
      enableHiding: false,
      enableResizing: false,
      size: SELECT_COLUMN_WIDTH,
      minSize: SELECT_COLUMN_WIDTH,
      maxSize: SELECT_COLUMN_WIDTH,
      header: ({ table }) => {
        const allSelected = table.getIsAllPageRowsSelected()
        const someSelected = table.getIsSomePageRowsSelected()
        return (
          <div className="flex justify-center">
            <Checkbox
              // `checked` alone would paint a full tick when a single row is
              // selected, claiming the whole page is. Indeterminate is the
              // honest state for a partial selection.
              checked={allSelected}
              indeterminate={!allSelected && someSelected}
              onCheckedChange={(value) =>
                table.toggleAllPageRowsSelected(value === true)
              }
              aria-label="Select all rows"
            />
          </div>
        )
      },
      cell: ({ row }) => (
        <div
          className="flex justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(value === true)}
            aria-label={`Select ${row.original.title}`}
          />
        </div>
      ),
      meta: {
        // No horizontal padding on either side. The grid's head cell carries
        // `[&:has([role=checkbox])]:pe-0`, so a symmetric `px-2` would leave
        // the header's centring box 8px wider than the body's and sit the
        // checkbox 4px to the right of the column beneath it.
        headerTitle: "Select",
        headerClassName: "px-0 py-1.5",
        cellClassName: "px-0 py-2 align-middle",
      },
    },
    {
      id: "title",
      accessorFn: (record) => record.displayText,
      enableHiding: false,
      size: TITLE_COLUMN_WIDTH,
      minSize: 180,
      header: ({ column }) => {
        return (
          <DataGridColumnHeader
            column={column}
            title={primaryHeaderTitle}
            showSortIcon={false}
            onRename={
              undefined
            }
            icon={
              <PrimaryHeaderIcon className="size-3.5 shrink-0 text-muted-foreground/70" aria-hidden="true" />
            }
          />
        )
      },
      cell: ({ row }) => {
        const record = row.original
        return (
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar className="size-6 shrink-0">
              {record.displayImageUrl ? <AvatarImage src={record.displayImageUrl} alt="" /> : null}
              <AvatarFallback className="text-[10px] font-semibold uppercase">
                {initials(record.displayText)}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium text-foreground">
              {record.displayText}
            </span>
          </div>
        )
      },
      meta: {
        headerTitle: primaryHeaderTitle,
        headerClassName,
        cellClassName,
        skeleton: (
          <div className="flex min-w-0 items-center gap-2.5">
            <Skeleton className="size-6 shrink-0 rounded-full" />
            <Skeleton className="h-4 w-32" />
          </div>
        ),
        attributeSlug: standardName?.slug,
        sourceColumnId: "title",
      },
    },
    ...rest.map<ColumnDef<DataGridFeatures, RecordItem>>((attribute) => {
      const HeaderIcon = getAttributeIcon(
        attribute.type,
        attribute.slug,
        attribute.config?.icon
      )
      const isDomainOrLink = attribute.type === "domain"
      const socialPlatform = socialPlatformFor(attribute.slug)
      return {
        id: attribute.slug,
        accessorFn: (record) =>
          formatValue(
            attribute,
            record.values[attribute.slug],
            currencySettings
          ),
        enableSorting: true,
        size: ATTRIBUTE_COLUMN_WIDTH,
        minSize: 120,
        header: ({ column }) => (
          <DataGridColumnHeader
            column={column}
            title={attribute.title}
            showSortIcon={false}
            onRename={
              onRename && !attribute.isSystem
                ? () => onRename(attribute.slug)
                : undefined
            }
            icon={
              <HeaderIcon
                className="size-3.5 shrink-0 text-muted-foreground/70"
                aria-hidden="true"
              />
            }
          />
        ),
        cell: ({ row }) => {
          const text = formatValue(
            attribute,
            row.original.values[attribute.slug],
            currencySettings
          )

          if (!text || text === "—") {
            return <span className="text-sm text-muted-foreground/50">—</span>
          }

          // Single-valued and free-form, so it is not split the way a domain
          // list is — a profile URL can legitimately contain a comma.
          if (socialPlatform) {
            return (
              <a
                href={socialHref(text)}
                target="_blank"
                rel="noreferrer noopener"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                <socialPlatform.icon className="size-4 shrink-0" />
                <span className="truncate">
                  {socialHandle(text, socialPlatform)}
                </span>
              </a>
            )
          }

          if (isDomainOrLink) {
            const list = text.split(/[\s,]+/).filter(Boolean)
            return (
              <div
                className="flex flex-wrap items-center gap-1.5"
                onClick={(e) => e.stopPropagation()}
              >
                {list.map((item, idx) => {
                  const href = item.startsWith("http")
                    ? item
                    : `https://${item}`
                  return (
                    <a
                      key={`${item}-${idx}`}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                    >
                      {item}
                    </a>
                  )
                })}
              </div>
            )
          }

          return (
            <span className="block truncate text-sm text-foreground">
              {text}
            </span>
          )
        },
        meta: {
          headerTitle: attribute.title,
          headerClassName,
          cellClassName,
          skeleton: <Skeleton className="h-4 w-full max-w-[120px]" />,
          attributeSlug: attribute.slug,
          sourceColumnId: attribute.slug,
        },
      }
    }),
  ]

  const duplicateColumns = columnInstances.flatMap((instance) => {
    const attribute = attributes.find(
      (candidate) => candidate.slug === instance.attributeSlug
    )
    if (!attribute) return []

    const sourceColumnId = getRecordAttributeColumnId(
      attribute,
      primaryAttributeSlug
    )
    const sourceColumn = columns.find((column) => column.id === sourceColumnId)
    if (!sourceColumn) return []

    const duplicateColumn = {
      ...(sourceColumn as ColumnDef<DataGridFeatures, RecordItem>),
      id: instance.id,
      enableHiding: true,
      meta: {
        ...(sourceColumn.meta as RecordColumnMeta | undefined),
        attributeSlug: attribute.slug,
        sourceColumnId,
        isDuplicate: true,
      } satisfies RecordColumnMeta,
    } as ColumnDef<DataGridFeatures, RecordItem>

    return [duplicateColumn]
  })

  return [
    ...columns,
    ...duplicateColumns,
    {
      id: ADD_COLUMN_ID,
      enableSorting: false,
      enableHiding: false,
      enablePinning: false,
      enableResizing: false,
      size: ADD_COLUMN_WIDTH,
      minSize: ADD_COLUMN_WIDTH,
      maxSize: ADD_COLUMN_WIDTH,
      header: () => {
        if (organizationId && objectId && objectSingular) {
          return (
            <AddColumnPopover
              organizationId={organizationId}
              objectId={objectId}
              objectSingular={objectSingular}
              attributes={attributes}
              primaryAttributeSlug={primaryAttributeSlug}
              onAttributeCreated={onAttributeCreated}
              onAddExistingAttribute={onAddExistingAttribute}
            />
          )
        }

        return (
          <button
            type="button"
            onClick={onAddColumn}
            className="flex h-full w-full items-center gap-1.5 px-3 text-left text-muted-foreground/70 transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <PlusIcon className="size-3.5" aria-hidden="true" />
            Add column
          </button>
        )
      },
      cell: () => null,
      meta: {
        headerTitle: "Add column",
        headerClassName: "p-0",
        cellClassName: "p-0",
      },
    },
  ]
}
