"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  AlertTriangleIcon,
  ArrowDownUpIcon,
  CheckIcon,
  ChevronDownIcon,
  CopyIcon,
  FilterIcon,
  Globe2Icon,
  LockIcon,
  MoreVerticalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  SettingsIcon,
  SquareKanbanIcon,
  Table2Icon,
  Trash2Icon,
  TriangleAlertIcon,
  XIcon,
} from "@/components/ui/icons"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"
import { nanoid } from "nanoid"
import {
  useTable,
  type ColumnDef,
  type ColumnPinningState,
  type ColumnSizingState,
  type ColumnVisibilityState,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
} from "@tanstack/react-table"

import { ApiError } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useActiveOrganization } from "@/hooks/use-active-organization"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import {
  createRecordView,
  createSelectOption,
  updateSelectOption,
  deleteSelectOption,
  deleteRecordView,
  deleteRecord,
  fetchObjects,
  fetchRecords,
  fetchRecordViews,
  updateLastRecordView,
  updateRecord,
  updateRecordView,
  type Attribute,
  type RecordItem,
  type RecordObject,
  type RecordColumnInstance,
  type RecordView,
  type RecordViewConfiguration,
  type RecordViewType,
  type RecordViewVisibility,
} from "@/components/records/api"
import { RecordKanbanView } from "@/components/records/record-kanban-view"
import { RecordKanbanSkeleton } from "@/components/records/record-kanban-skeleton"
import {
  type CalculationType,
  CALCULATION_OPTIONS,
  NUMERIC_OPTIONS,
  computeCalculation,
} from "@/components/records/record-calculations"
import {
  buildRecordColumns,
  getAttributeIcon,
  getStandardNameIdentityAttribute,
  type RecordColumnMeta,
  usesStandardNameIdentity,
} from "@/components/records/record-table-columns"
import { RecordSheet } from "@/components/records/record-sheet"
import { ColumnSettingsDialog } from "@/components/records/column-settings-dialog"
import { EditAttributeSheet } from "@/components/records/edit-attribute-sheet"
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import { createFilter, type Filter } from "@/components/reui/filters"
import { Filters } from "@/components/reui/filters/filters"
import {
  createFilterQuery,
  createFilterRule,
  flattenFilterRules,
} from "@/components/reui/filters/filters-query"
import type {
  FilterField,
  FilterQuery,
} from "@/components/reui/filters/filters-types"
import {
  Cascader,
  CascaderContent,
  CascaderEmpty,
  CascaderList,
  CascaderPanel,
  CascaderStatus,
  CascaderTrigger,
} from "@/components/reui/cascader/cascader"
import { CascaderFooter } from "@/components/reui/cascader/cascader-footer"
import {
  CascaderItem,
  CascaderItems,
} from "@/components/reui/cascader/cascader-item"
import {
  CascaderBreadcrumb,
  CascaderInput,
  CascaderNav,
} from "@/components/reui/cascader/cascader-nav"
import type {
  CascaderActionItem,
  CascaderNode,
} from "@/components/reui/cascader/cascader-types"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

const SKELETON_ROWS = 20
const ALL_ROWS = 100000
const ALL_RECORDS_VIEW_ID = "all"
type BuiltInRecordViewId = string

export interface BuiltInRecordView {
  id: string
  label: string
  configuration?: RecordViewConfiguration
}

const DEFAULT_BUILT_IN_VIEWS: BuiltInRecordView[] = [
  { id: ALL_RECORDS_VIEW_ID, label: "All records" },
]

type RecordViewOption = {
  value: string
  label: string
  recordView: RecordView | null
  viewType: RecordViewType
}

function sanitizeViewFilters(
  filters?: RecordViewConfiguration["filters"]
): NonNullable<RecordViewConfiguration["filters"]> {
  if (!Array.isArray(filters)) return []
  return filters.map((filter) => {
    const rawValues = Array.isArray(filter.values)
      ? filter.values
      : filter.value !== undefined && filter.value !== null
        ? [filter.value]
        : []

    const stringValues = rawValues
      .map((val) => (val === null || val === undefined ? "" : String(val)))
      .filter((val) => val !== "")

    return {
      id: String(filter.id ?? ""),
      value: stringValues.join(" "),
      values: stringValues,
      operator: filter.operator ? String(filter.operator) : "contains",
    }
  })
}

function normalizeViewConfiguration(
  viewType: RecordViewType,
  configuration: RecordViewConfiguration,
  hasStandardNameIdentity = false
): RecordViewConfiguration {
  const common = {
    search: configuration.search ?? "",
    sorting: configuration.sorting ?? [],
    filters: sanitizeViewFilters(configuration.filters),
  }

  if (viewType === "kanban") {
    return {
      ...common,
      groupByAttributeId: configuration.groupByAttributeId ?? null,
      cardFields: configuration.cardFields?.length
        ? configuration.cardFields
        : ["title"],
      collapsedLanes: configuration.collapsedLanes ?? [],
      laneOrder: configuration.laneOrder ?? [],
    }
  }

  const tableConfiguration: RecordViewConfiguration = {
    ...common,
    columnOrder: configuration.columnOrder ?? [],
    columnVisibility: configuration.columnVisibility ?? {},
    columnPinning: {
      start: configuration.columnPinning?.start ?? ["select", "title"],
      end: configuration.columnPinning?.end ?? [],
    },
    columnSizing: configuration.columnSizing ?? {},
    columnInstances: configuration.columnInstances ?? [],
    calculations: configuration.calculations ?? {},
  }

  if (!hasStandardNameIdentity) return tableConfiguration

  const withoutBaseName = <T,>(values: Record<string, T>) =>
    Object.fromEntries(
      Object.entries(values).filter(([columnId]) => columnId !== "name")
    ) as Record<string, T>
  const mapNameToTitle = <T,>(values: Record<string, T>) => {
    const next = withoutBaseName(values)
    if (values.name !== undefined && next.title === undefined) {
      next.title = values.name
    }
    return next
  }
  const mappedSorting = (tableConfiguration.sorting ?? []).map((sort) => ({
    ...sort,
    id: sort.id === "name" ? "title" : sort.id,
  }))
  const dedupedSorting = mappedSorting.filter(
    (sort, index) =>
      mappedSorting.findIndex((candidate) => candidate.id === sort.id) === index
  )

  return {
    ...tableConfiguration,
    sorting: dedupedSorting,
    filters: (tableConfiguration.filters ?? []).map((filter) => ({
      ...filter,
      id: filter.id === "name" ? "title" : filter.id,
    })),
    columnOrder: (tableConfiguration.columnOrder ?? []).filter(
      (columnId) => columnId !== "name"
    ),
    // Attio keeps the public record identifier available but out of the
    // standard People/Company layout. An explicit saved preference still wins.
    columnVisibility: {
      "record-id": false,
      ...withoutBaseName(tableConfiguration.columnVisibility ?? {}),
    },
    columnPinning: {
      start: (tableConfiguration.columnPinning?.start ?? []).filter(
        (columnId) => columnId !== "name"
      ),
      end: (tableConfiguration.columnPinning?.end ?? []).filter(
        (columnId) => columnId !== "name"
      ),
    },
    columnSizing: withoutBaseName(tableConfiguration.columnSizing ?? {}),
    calculations: mapNameToTitle(tableConfiguration.calculations ?? {}),
  }
}

function serializeRecordFilters(filters: Filter<unknown>[]) {
  return filters.map((filter) => {
    const stringValues = (filter.values ?? [])
      .map((val) => (val === null || val === undefined ? "" : String(val)))
      .filter((val) => val !== "")

    return {
      id: String(filter.field),
      value: stringValues.join(" "),
      values: stringValues,
      operator: filter.operator,
    }
  })
}

function hydrateRecordFilters(
  filters: NonNullable<RecordViewConfiguration["filters"]>
) {
  return sanitizeViewFilters(filters).map((filter) =>
    createFilter(filter.id, filter.operator ?? "contains", filter.values)
  )
}

type RecordFilterValue = string | string[]

function normalizeRecordFilterOperator(operator: string): string {
  switch (operator) {
    case "includes":
    case "includes_any_of":
      return "has_any_of"
    case "includes_all":
    case "includes_all_of":
      return "has_all_of"
    case "excludes":
    case "excludes_all":
      return "has_none_of"
    case "is_not_any_of":
      return "is_none_of"
    default:
      return operator
  }
}

function recordFiltersToQuery(
  filters: Filter<string>[]
): FilterQuery<RecordFilterValue> {
  return createFilterQuery(
    filters.map((filter) => {
      const operator = normalizeRecordFilterOperator(filter.operator)
      const hasManyValues =
        operator === "is_any_of" ||
        operator === "is_none_of" ||
        operator === "has_any_of" ||
        operator === "has_all_of" ||
        operator === "has_none_of"
      const takesNoValue = operator === "empty" || operator === "not_empty"

      return createFilterRule<RecordFilterValue>({
        id: filter.id,
        path: [filter.field],
        operator,
        value: takesNoValue
          ? undefined
          : hasManyValues
            ? filter.values
            : filter.values[0],
      })
    })
  )
}

function queryToRecordFilters(
  query: FilterQuery<RecordFilterValue>
): Filter<string>[] {
  return flattenFilterRules(query).map((rule) => ({
    id: rule.id,
    field: rule.path[0] ?? "",
    operator: rule.operator,
    values: (Array.isArray(rule.value) ? rule.value : [rule.value])
      .filter((value): value is string => value != null && value !== "")
      .map(String),
  }))
}

function recordMatchesFilter(record: RecordItem, filter: Filter<string>) {
  const value =
    filter.field === "title" ? record.title : record.values[filter.field]
  const values = filter.values.map((item) => item.toLocaleLowerCase())
  const isEmpty =
    value == null ||
    value === "" ||
    (Array.isArray(value) && value.length === 0)

  if (filter.operator === "empty") return isEmpty
  if (filter.operator === "not_empty") return !isEmpty
  if (values.length === 0) return true
  if (isEmpty) return false

  const actualValues = (Array.isArray(value) ? value : [value]).map((item) =>
    String(item).toLocaleLowerCase()
  )
  const text = actualValues.join(" ")
  const hasExact = (query: string) => actualValues.includes(query)
  const hasText = (query: string) => text.includes(query)

  switch (filter.operator) {
    case "is":
      return values.some(hasExact)
    case "is_not":
      return values.every((query) => !hasExact(query))
    case "is_any_of":
      return values.some(hasExact)
    case "is_not_any_of":
    case "is_none_of":
      return values.every((query) => !hasExact(query))
    case "includes_all":
    case "includes_all_of":
    case "has_all_of":
      return values.every(hasExact)
    case "excludes_all":
    case "has_none_of":
      return values.every((query) => !hasExact(query))
    case "includes_any_of":
    case "includes":
    case "has_any_of":
      return values.some(hasExact)
    case "excludes":
      return values.every((query) => !hasExact(query))
    case "not_contains":
      return values.every((query) => !hasText(query))
    case "starts_with":
      return values.some((query) => text.startsWith(query))
    case "ends_with":
      return values.some((query) => text.endsWith(query))
    case "contains":
    default:
      return values.some(hasText)
  }
}

export interface RecordsListViewProps {
  /** Which object to list — "person", "company", or a custom one. */
  objectSlug: string
  /** Override the object's own singular noun. */
  singular?: string
  /** Override the object's own plural noun. */
  plural?: string
  loadRecords?: (
    organizationId: number | string,
    objectSlug: string
  ) => Promise<RecordItem[]>
  getRecordHref?: (record: RecordItem) => string
  createHref?: string
  deleteRecordItem?: (
    organizationId: number | string,
    record: RecordItem
  ) => Promise<void>
  builtInViews?: BuiltInRecordView[]
  filterRecord?: (record: RecordItem) => boolean
  columnTransform?: (
    columns: ColumnDef<DataGridFeatures, RecordItem>[],
    attributes: Attribute[]
  ) => ColumnDef<DataGridFeatures, RecordItem>[]
  deleteDescription?: string
}

interface RecordsCalculationFooterProps {
  records: RecordItem[]
  table: ReturnType<typeof useTable<DataGridFeatures, RecordItem>>
  attributes: Attribute[]
  calculations: Record<string, CalculationType>
  setCalculations: React.Dispatch<
    React.SetStateAction<Record<string, CalculationType>>
  >
}

function RecordsCalculationFooter({
  records,
  table,
  attributes,
  calculations,
  setCalculations,
}: RecordsCalculationFooterProps) {
  const { settings: currencySettings } = useCurrencySettings()
  const visibleColumns = table.getVisibleLeafColumns()

  return (
    <div className="flex w-max min-w-full" role="row">
      {visibleColumns.map((column) => {
        const pinned = column.getIsPinned()
        const style: React.CSSProperties = {
          flex: `0 0 ${column.getSize()}px`,
          width: column.getSize(),
          left: pinned === "start" ? column.getStart("start") : undefined,
          right: pinned === "end" ? column.getAfter("end") : undefined,
          position: pinned ? "sticky" : undefined,
          zIndex: pinned ? 30 : undefined,
        }

        if (column.id === "select" || column.id === "add-column") {
          return (
            <div
              key={column.id}
              role="cell"
              style={style}
              className={cn("h-9 shrink-0 bg-background", pinned && "bg-muted")}
            />
          )
        }

        const columnMeta = column.columnDef.meta as RecordColumnMeta | undefined
        const sourceColumnId = columnMeta?.sourceColumnId ?? column.id
        const attribute = columnMeta?.attributeSlug
          ? attributes.find((item) => item.slug === columnMeta.attributeSlug)
          : attributes.find((item) => item.slug === column.id)
        const isNumeric =
          attribute?.type === "number" ||
          attribute?.type === "currency" ||
          attribute?.type === "rating"
        const activeCalc = calculations[column.id] ?? "none"
        const calculatedNode = computeCalculation(
          records,
          sourceColumnId,
          activeCalc,
          attribute,
          currencySettings
        )

        return (
          <div
            key={column.id}
            role="cell"
            style={style}
            className={cn(
              "flex h-9 shrink-0 items-center bg-background px-3 text-sm text-muted-foreground",
              pinned && "bg-muted"
            )}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex cursor-pointer items-center gap-1 text-left text-sm text-muted-foreground/60 transition-colors outline-none select-none hover:text-foreground"
                  >
                    {calculatedNode ?? "+ Add calculation"}
                  </button>
                }
              />
              <DropdownMenuContent
                align="start"
                side="top"
                className="min-w-40"
              >
                <DropdownMenuLabel>Calculate</DropdownMenuLabel>
                {CALCULATION_OPTIONS.map((opt) => (
                  <DropdownMenuItem
                    key={opt.type}
                    onClick={() =>
                      setCalculations((prev) => ({
                        ...prev,
                        [column.id]: opt.type,
                      }))
                    }
                  >
                    {opt.label}
                  </DropdownMenuItem>
                ))}
                {isNumeric && (
                  <>
                    <DropdownMenuSeparator />
                    {NUMERIC_OPTIONS.map((opt) => (
                      <DropdownMenuItem
                        key={opt.type}
                        onClick={() =>
                          setCalculations((prev) => ({
                            ...prev,
                            [column.id]: opt.type,
                          }))
                        }
                      >
                        {opt.label}
                      </DropdownMenuItem>
                    ))}
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() =>
                    setCalculations((prev) => ({
                      ...prev,
                      [column.id]: "none",
                    }))
                  }
                >
                  None
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Lists and edits records of one object in an Attio-style spreadsheet grid view.
 */
export function RecordsListView({
  objectSlug,
  singular: singularOverride,
  plural: pluralOverride,
  loadRecords: loadRecordsOverride,
  getRecordHref,
  createHref,
  deleteRecordItem,
  builtInViews = DEFAULT_BUILT_IN_VIEWS,
  filterRecord,
  columnTransform,
  deleteDescription,
}: RecordsListViewProps) {
  const organization = useActiveOrganization()
  const { settings: currencySettings } = useCurrencySettings()
  const router = useRouter()

  const [records, setRecords] = React.useState<RecordItem[]>([])
  const [attributes, setAttributes] = React.useState<Attribute[]>([])
  const [recordObject, setRecordObject] = React.useState<RecordObject | null>(
    null
  )
  const [nouns, setNouns] = React.useState({
    singular: "Record",
    plural: "Records",
  })
  const singular = singularOverride ?? nouns.singular
  const plural = pluralOverride ?? nouns.plural
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [viewError, setViewError] = React.useState<string | null>(null)
  const [recordViews, setRecordViews] = React.useState<RecordView[]>([])
  const [activeViewId, setActiveViewId] =
    React.useState<string>(ALL_RECORDS_VIEW_ID)
  const [viewCascaderOpen, setViewCascaderOpen] = React.useState(false)
  const [viewType, setViewType] = React.useState<RecordViewType>("table")
  const [cardFields, setCardFields] = React.useState<string[]>(["title"])
  const [collapsedLanes, setCollapsedLanes] = React.useState<string[]>([])
  const [laneOrder, setLaneOrder] = React.useState<string[]>([])
  const [savedConfiguration, setSavedConfiguration] =
    React.useState<RecordViewConfiguration | null>(null)
  const [viewsReadyForObject, setViewsReadyForObject] = React.useState<
    string | null
  >(null)
  const [savingView, setSavingView] = React.useState(false)
  const [saveDialog, setSaveDialog] = React.useState<{
    mode: "create" | "rename"
    visibility: RecordViewVisibility
    sourceView?: RecordView
    targetView?: RecordView
    isFromScratch?: boolean
  } | null>(null)
  const [viewName, setViewName] = React.useState("")
  const [saveViewType, setSaveViewType] =
    React.useState<RecordViewType>("table")
  const [viewToDelete, setViewToDelete] = React.useState<RecordView | null>(
    null
  )

  const [isSheetOpen, setIsSheetOpen] = React.useState(false)
  const [initialCreateValues, setInitialCreateValues] = React.useState<
    Record<string, unknown> | undefined
  >(undefined)
  const [deleteTargets, setDeleteTargets] = React.useState<RecordItem[]>([])
  const [rowSelection, setRowSelection] = React.useState<RowSelectionState>({})
  const [deleting, setDeleting] = React.useState(false)

  const [calculations, setCalculations] = React.useState<
    Record<string, CalculationType>
  >({})

  const load = React.useCallback(() => {
    if (!organization) return Promise.resolve()
    return Promise.all([
      loadRecordsOverride
        ? loadRecordsOverride(organization.id, objectSlug)
        : fetchRecords(organization.id, objectSlug),
      fetchObjects(organization.id),
    ])
      .then(([recordList, objects]) => {
        const object = objects.find(
          (candidate) => candidate.slug === objectSlug
        )
        setRecords(recordList)
        setAttributes(object?.attributes ?? [])
        setRecordObject(object ?? null)
        if (object) {
          setNouns({
            singular: object.singularNoun,
            plural: object.pluralNoun,
          })
        }
        setError(null)
      })
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load records."
        )
      })
  }, [loadRecordsOverride, organization, objectSlug])

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: SKELETON_ROWS,
  })

  React.useEffect(() => {
    if (!organization) return
    let active = true
    Promise.resolve().then(() => {
      if (!active) return
      setIsLoading(true)
      setPagination((p) => ({ ...p, pageSize: SKELETON_ROWS }))
    })
    load().finally(() => {
      if (!active) return
      setIsLoading(false)
      setPagination((p) => ({ ...p, pageSize: ALL_ROWS }))
    })
    return () => {
      active = false
    }
  }, [organization, load])

  const [isColumnSettingsOpen, setIsColumnSettingsOpen] = React.useState(false)
  const [skipAttemptCount, setSkipAttemptCount] = React.useState(0)
  const [renameTarget, setRenameTarget] = React.useState<Attribute | null>(null)
  const [columnOrder, setColumnOrder] = React.useState<string[]>([])
  const [columnInstances, setColumnInstances] = React.useState<
    RecordColumnInstance[]
  >([])
  const hasStandardNameIdentity = usesStandardNameIdentity(recordObject?.slug)
  const primaryIdentityAttribute = React.useMemo(
    () =>
      getStandardNameIdentityAttribute(attributes, recordObject?.slug) ??
      attributes[0],
    [attributes, recordObject?.slug]
  )

  const triggerDockSkipAttempt = React.useCallback(() => {
    setSkipAttemptCount((current) => current + 1)
  }, [])

  /**
   * Open the rename dialog for a column id. Maps the grid's column id back to
   * its attribute; `"title"` is the primary identity field. System attributes
   * are guarded out at the entry points, but
   * we re-check here so a stray call can't put a system attribute into the
   * dialog (the backend would 403 anyway).
   */
  const openRename = React.useCallback(
    (columnId: string) => {
      const target =
        columnId === "title"
          ? primaryIdentityAttribute
          : attributes.find((attribute) => attribute.slug === columnId)
      if (!target || target.isSystem) return
      setRenameTarget(target)
    },
    [attributes, primaryIdentityAttribute]
  )

  /**
   * Merge a renamed/updated attribute back into state. Rebuilding `attributes`
   * is what makes the change durable: `columns` is memoized on `attributes`,
   * so a new reference rebuilds the column defs with the updated `title` and
   * `config.icon`, and the grid headers re-render from the authoritative prop
   * instead of a fragile local mutation.
   */
  const handleAttributeUpdated = React.useCallback((updated: Attribute) => {
    setAttributes((prev) =>
      prev.map((attribute) =>
        attribute.id === updated.id ? updated : attribute
      )
    )
  }, [])

  const handleAttributeDeleted = React.useCallback((deletedId: string) => {
    setAttributes((prev) =>
      prev.filter((attribute) => attribute.id !== deletedId)
    )
    setRenameTarget(null)
  }, [])

  const handleAddExistingAttribute = React.useCallback(
    (attribute: Attribute) => {
      const instance: RecordColumnInstance = {
        id: `attribute-instance:${nanoid()}`,
        attributeSlug: attribute.slug,
      }
      setColumnInstances((instances) => [...instances, instance])
      setColumnOrder((order) => {
        if (order.length === 0) return order
        const nextOrder = [...order]
        const addColumnIndex = nextOrder.indexOf("add-column")
        if (addColumnIndex >= 0) {
          nextOrder.splice(addColumnIndex, 0, instance.id)
        } else {
          nextOrder.push(instance.id)
        }
        return nextOrder
      })
    },
    []
  )

  const validColumnInstances = React.useMemo(
    () =>
      columnInstances.filter((instance) =>
        attributes.some(
          (attribute) => attribute.slug === instance.attributeSlug
        )
      ),
    [attributes, columnInstances]
  )

  const columns = React.useMemo(() => {
    const base = buildRecordColumns({
      attributes,
      objectSlug: recordObject?.slug,
      columnInstances: validColumnInstances,
      currencySettings,
      onRename: openRename,
      organizationId: organization?.id,
      objectId: recordObject?.id,
      objectSingular: singular,
      onAttributeCreated: async () => {
        await load()
      },
      onAddExistingAttribute: handleAddExistingAttribute,
    })

    return columnTransform ? columnTransform(base, attributes) : base
  }, [
    attributes,
    columnTransform,
    validColumnInstances,
    currencySettings,
    load,
    handleAddExistingAttribute,
    openRename,
    organization?.id,
    recordObject?.id,
    recordObject?.slug,
    singular,
  ])

  const [sorting, setSorting] = React.useState<SortingState>([])
  const [recordFilters, setRecordFilters] = React.useState<Filter<string>[]>([])
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [columnSizing, setColumnSizing] = React.useState<ColumnSizingState>({})

  // Freeze the row's identity on the left and its actions on the right; the
  // attribute columns in between are what scroll. Controlled rather than
  // initialState so the pin/unpin controls `columnsPinnable` adds to each
  // column header menu actually move columns instead of no-opping.
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({
    start: ["select", "title"],
    end: [],
  })

  const filteredRecords = React.useMemo(
    () =>
      records.filter(
        (record) =>
          (!filterRecord || filterRecord(record)) &&
          recordFilters.every((filter) => recordMatchesFilter(record, filter))
      ),
    [filterRecord, recordFilters, records]
  )

  const table = useTable<DataGridFeatures, RecordItem>({
    features: dataGridFeatures,
    data: filteredRecords,
    columns: columns as ColumnDef<DataGridFeatures, RecordItem, unknown>[],
    getRowId: (record) => record.id,
    enableRowSelection: true,
    state: {
      pagination,
      sorting,
      columnVisibility,
      columnSizing,
      columnOrder,
      columnPinning,
      rowSelection,
    },
    onPaginationChange: setPagination,
    onColumnPinningChange: setColumnPinning,
    onColumnOrderChange: setColumnOrder,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnSizingChange: setColumnSizing,
  })

  const removeColumnInstanceState = React.useCallback(
    (instanceIds: string[]) => {
      if (instanceIds.length === 0) return
      const ids = new Set(instanceIds)
      const removeIds = <T extends Record<string, unknown>>(value: T) =>
        Object.fromEntries(
          Object.entries(value).filter(([id]) => !ids.has(id))
        ) as T

      setColumnOrder((order) => order.filter((id) => !ids.has(id)))
      setColumnVisibility((visibility) => removeIds(visibility))
      setColumnSizing((sizing) => removeIds(sizing))
      setCalculations((current) => removeIds(current))
      setSorting((current) => current.filter((sort) => !ids.has(sort.id)))
      setColumnPinning((pinning) => ({
        start: (pinning.start ?? []).filter((id) => !ids.has(id)),
        end: (pinning.end ?? []).filter((id) => !ids.has(id)),
      }))
    },
    []
  )

  const handleRemoveColumnInstance = React.useCallback(
    (instanceId: string) => {
      setColumnInstances((instances) =>
        instances.filter((instance) => instance.id !== instanceId)
      )
      removeColumnInstanceState([instanceId])
    },
    [removeColumnInstanceState]
  )

  const handleResetColumnInstances = React.useCallback(() => {
    const instanceIds = columnInstances.map((instance) => instance.id)
    setColumnInstances([])
    removeColumnInstanceState(instanceIds)
  }, [columnInstances, removeColumnInstanceState])

  const recordFields = React.useMemo(
    () => [
      { id: "title", label: primaryIdentityAttribute?.title ?? "Record" },
      ...attributes
        .filter(
          (attribute) => attribute.slug !== primaryIdentityAttribute?.slug
        )
        .map((attribute) => ({
          id: attribute.slug,
          label: attribute.title,
        })),
    ],
    [attributes, primaryIdentityAttribute]
  )
  const filterFields = React.useMemo<FilterField<RecordFilterValue>[]>(
    () => [
      {
        id: "title",
        label: primaryIdentityAttribute?.title ?? "Record",
        icon: <Table2Icon />,
        type: "text",
        defaultOperator: "contains",
        className: "w-48",
        placeholder: "Contains…",
      },
      ...attributes
        .filter(
          (attribute) => attribute.slug !== primaryIdentityAttribute?.slug
        )
        .map((attribute) => {
          const Icon = getAttributeIcon(
            attribute.type,
            attribute.slug,
            attribute.config?.icon
          )

          const options = attribute.selectOptions.map((option) => ({
            value: option.slug,
            label: option.title,
          }))
          const isSelect =
            attribute.type === "select" || attribute.type === "status"
          const isCheckbox = attribute.type === "checkbox"

          return {
            id: attribute.slug,
            label: attribute.title,
            icon: <Icon />,
            type: isSelect
              ? attribute.isMultiselect
                ? ("multiselect" as const)
                : ("select" as const)
              : isCheckbox
                ? ("select" as const)
                : ("text" as const),
            defaultOperator: isSelect || isCheckbox ? "is" : "contains",
            options: isSelect
              ? options
              : isCheckbox
                ? [
                    { value: "true", label: "Yes" },
                    { value: "false", label: "No" },
                  ]
                : undefined,
            className: "w-48",
            placeholder: isSelect || isCheckbox ? undefined : "Contains…",
          }
        }),
    ],
    [attributes, primaryIdentityAttribute]
  )
  const recordFilterQuery = React.useMemo(
    () => recordFiltersToQuery(recordFilters),
    [recordFilters]
  )
  const handleRecordFilterQueryChange = React.useCallback(
    (query: FilterQuery<RecordFilterValue>) => {
      setRecordFilters(queryToRecordFilters(query))
    },
    []
  )
  const activeView = React.useMemo(
    () => recordViews.find((view) => view.id === activeViewId) ?? null,
    [activeViewId, recordViews]
  )
  const activeRecordViewOption = React.useMemo<RecordViewOption>(() => {
    if (activeView) {
      return {
        value: activeView.id,
        label: activeView.name,
        recordView: activeView,
        viewType: activeView.viewType,
      }
    }
    const builtIn = builtInViews.find((v) => v.id === activeViewId)
    return {
      value: activeViewId,
      label:
        activeViewId === ALL_RECORDS_VIEW_ID &&
        (builtIn?.label === "All records" || !builtIn)
          ? `All ${plural}`
          : builtIn?.label ?? "All records",
      recordView: null,
      viewType: "table",
    }
  }, [activeView, activeViewId, builtInViews, plural])
  const boardStatusAttribute = React.useMemo(
    () =>
      attributes.find(
        (attribute) => attribute.id === recordObject?.boardStatusAttributeId
      ) ?? null,
    [attributes, recordObject?.boardStatusAttributeId]
  )
  const currentConfiguration = React.useMemo<RecordViewConfiguration>(
    () =>
      normalizeViewConfiguration(viewType, {
        search: "",
        sorting,
        filters: serializeRecordFilters(recordFilters),
        columnOrder,
        columnVisibility,
        columnPinning: {
          start: columnPinning.start ?? [],
          end: columnPinning.end ?? [],
        },
        columnSizing,
        columnInstances: validColumnInstances,
        calculations,
        groupByAttributeId: boardStatusAttribute?.id ?? null,
        cardFields,
        collapsedLanes,
        laneOrder,
      }, hasStandardNameIdentity),
    [
      calculations,
      cardFields,
      collapsedLanes,
      laneOrder,
      columnOrder,
      columnPinning.end,
      columnPinning.start,
      columnSizing,
      validColumnInstances,
      columnVisibility,
      boardStatusAttribute?.id,
      recordFilters,
      sorting,
      viewType,
      hasStandardNameIdentity,
    ]
  )
  const isViewDirty = React.useMemo(
    () =>
      savedConfiguration !== null &&
      JSON.stringify(currentConfiguration) !==
        JSON.stringify(savedConfiguration),
    [currentConfiguration, savedConfiguration]
  )

  const applyView = React.useCallback(
    (
      view: RecordView | null,
      builtInViewId: BuiltInRecordViewId = ALL_RECORDS_VIEW_ID
    ) => {
      const nextType = view?.viewType ?? "table"
      const builtInView = builtInViews.find(
        (candidate) => candidate.id === builtInViewId
      )
      const configuration = normalizeViewConfiguration(
        nextType,
        view?.configuration ??
          builtInView?.configuration ??
          (nextType === "kanban"
            ? { groupByAttributeId: boardStatusAttribute?.id ?? null }
            : {}),
        hasStandardNameIdentity
      )
      if (nextType === "kanban") {
        configuration.groupByAttributeId = boardStatusAttribute?.id ?? null
      }
      configuration.columnInstances = (
        configuration.columnInstances ?? []
      ).filter((instance) =>
        attributes.some(
          (attribute) => attribute.slug === instance.attributeSlug
        )
      )
      setActiveViewId(view?.id ?? builtInViewId)
      setViewType(nextType)
      setSorting(configuration.sorting ?? [])
      setRecordFilters(hydrateRecordFilters(configuration.filters ?? []))
      setColumnOrder(configuration.columnOrder ?? [])
      setColumnVisibility(configuration.columnVisibility ?? {})
      setColumnPinning({
        start: configuration.columnPinning?.start ?? ["select", "title"],
        end: configuration.columnPinning?.end ?? [],
      })
      setColumnSizing(configuration.columnSizing ?? {})
      setColumnInstances(configuration.columnInstances ?? [])
      setCalculations(
        (configuration.calculations ?? {}) as Record<string, CalculationType>
      )
      setCardFields(configuration.cardFields ?? ["title"])
      setCollapsedLanes(configuration.collapsedLanes ?? [])
      setLaneOrder(configuration.laneOrder ?? [])
      setSavedConfiguration(configuration)
      setSkipAttemptCount(0)
      setViewError(null)
    },
    [
      attributes,
      boardStatusAttribute,
      builtInViews,
      hasStandardNameIdentity,
    ]
  )

  const organizationId = organization?.id
  const recordObjectId = recordObject?.id

  React.useEffect(() => {
    if (!organizationId || !recordObjectId) return
    let active = true
    fetchRecordViews(organizationId, recordObjectId)
      .then(({ views, lastViewId }) => {
        if (!active) return
        setRecordViews(views)
        const requestedViewId =
          typeof window === "undefined"
            ? null
            : new URLSearchParams(window.location.search).get("view")
        const isRequestedDefault = requestedViewId === ALL_RECORDS_VIEW_ID
        const requestedBuiltIn = builtInViews.find(
          (view) => view.id === requestedViewId
        )
        const selected =
          isRequestedDefault || requestedBuiltIn
            ? null
            : (views.find((view) => view.id === requestedViewId) ??
              views.find((view) => view.id === lastViewId) ??
              null)
        applyView(selected, requestedBuiltIn?.id ?? ALL_RECORDS_VIEW_ID)
        setViewsReadyForObject(recordObjectId)
      })
      .catch((err) => {
        if (!active) return
        applyView(null, ALL_RECORDS_VIEW_ID)
        setViewError(
          err instanceof ApiError ? err.message : "Failed to load saved views."
        )
        setViewsReadyForObject(recordObjectId)
      })
    return () => {
      active = false
    }
  }, [applyView, builtInViews, organizationId, recordObjectId])

  const updateViewUrl = React.useCallback((viewId: string) => {
    if (typeof window === "undefined") return
    const url = new URL(window.location.href)
    url.searchParams.set("view", viewId)
    window.history.replaceState(null, "", url)
  }, [])

  const selectRecordView = React.useCallback(
    (option: RecordViewOption) => {
      if (isViewDirty) {
        triggerDockSkipAttempt()
        return
      }
      const builtInViewId = option.recordView
        ? ALL_RECORDS_VIEW_ID
        : (option.value as BuiltInRecordViewId)
      applyView(option.recordView, builtInViewId)
      updateViewUrl(option.value)
      if (organization && recordObject) {
        void updateLastRecordView(
          organization.id,
          recordObject.id,
          option.recordView
            ? { recordViewId: option.recordView.id }
            : { builtInViewType: option.viewType }
        ).catch(() => setViewError("Could not remember the selected view."))
      }
    },
    [
      applyView,
      isViewDirty,
      organization,
      recordObject,
      triggerDockSkipAttempt,
      updateViewUrl,
    ]
  )

  const saveExistingView = React.useCallback(async () => {
    if (!organization || !recordObject || !activeView?.canUpdate) return
    if (viewType === "kanban" && !boardStatusAttribute) {
      setViewError("This object does not have a board Status field.")
      return
    }
    setSavingView(true)
    setViewError(null)
    try {
      const updated = await updateRecordView(
        organization.id,
        recordObject.id,
        activeView.id,
        { viewType, configuration: currentConfiguration }
      )
      setRecordViews((views) =>
        views.map((view) => (view.id === updated.id ? updated : view))
      )
      setSavedConfiguration(currentConfiguration)
      setSkipAttemptCount(0)
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "Could not save view."
      )
    } finally {
      setSavingView(false)
    }
  }, [
    activeView,
    currentConfiguration,
    boardStatusAttribute,
    organization,
    recordObject,
    viewType,
  ])

  const discardViewChanges = React.useCallback(() => {
    if (!savedConfiguration) return
    setSkipAttemptCount(0)
    setSorting(savedConfiguration.sorting ?? [])
    setRecordFilters(hydrateRecordFilters(savedConfiguration.filters ?? []))
    setColumnOrder(savedConfiguration.columnOrder ?? [])
    setColumnVisibility(savedConfiguration.columnVisibility ?? {})
    setColumnPinning({
      start: savedConfiguration.columnPinning?.start ?? ["select", "title"],
      end: savedConfiguration.columnPinning?.end ?? [],
    })
    setColumnSizing(savedConfiguration.columnSizing ?? {})
    setColumnInstances(savedConfiguration.columnInstances ?? [])
    setCalculations(
      (savedConfiguration.calculations ?? {}) as Record<string, CalculationType>
    )
    setCardFields(savedConfiguration.cardFields ?? ["title"])
    setCollapsedLanes(savedConfiguration.collapsedLanes ?? [])
    setLaneOrder(savedConfiguration.laneOrder ?? [])
  }, [savedConfiguration])

  const openCreateViewDialog = React.useCallback(
    (
      visibility: RecordViewVisibility,
      sourceView?: RecordView,
      fromScratch = false
    ) => {
      if (fromScratch) {
        setViewName(`${plural} view`)
        setSaveViewType("table")
        setSaveDialog({ mode: "create", visibility, isFromScratch: true })
        return
      }

      const source = sourceView ?? activeView
      const sourceViewType = source?.viewType ?? viewType

      const defaultName = sourceView
        ? `${sourceView.name} copy`
        : activeView
          ? activeView.name
          : `${plural} view`

      setViewName(defaultName)
      setViewError(null)
      setSaveViewType(sourceViewType)
      setSaveDialog({
        mode: "create",
        visibility,
        sourceView: source ?? undefined,
        isFromScratch: false,
      })
    },
    [activeView, plural, viewType]
  )

  const openRenameViewDialog = React.useCallback((view: RecordView) => {
    setViewName(view.name)
    setViewError(null)
    setSaveDialog({
      mode: "rename",
      visibility: view.visibility,
      targetView: view,
    })
  }, [])

  const submitViewDialog = React.useCallback(async () => {
    if (!organization || !recordObject || !saveDialog || !viewName.trim())
      return

    const nameTrimmed = viewName.trim()
    const isDuplicateName = recordViews.some(
      (v) =>
        v.name.trim().toLowerCase() === nameTrimmed.toLowerCase() &&
        (saveDialog.mode === "rename"
          ? v.id !== saveDialog.targetView?.id
          : true)
    )

    if (isDuplicateName) {
      setViewError("A view with this name already exists")
      return
    }

    setSavingView(true)
    setViewError(null)
    try {
      if (saveDialog.mode === "rename" && saveDialog.targetView) {
        const updated = await updateRecordView(
          organization.id,
          recordObject.id,
          saveDialog.targetView.id,
          { name: viewName.trim() }
        )
        setRecordViews((views) =>
          views.map((view) => (view.id === updated.id ? updated : view))
        )
      } else {
        const sourceConfiguration =
          saveDialog.mode === "create" && !saveDialog.isFromScratch
            ? currentConfiguration
            : saveDialog.sourceView?.viewType === saveViewType
              ? saveDialog.sourceView.configuration
              : normalizeViewConfiguration(saveViewType, {
                  search: "",
                  sorting,
                  filters: serializeRecordFilters(recordFilters),
                  groupByAttributeId: boardStatusAttribute?.id ?? null,
                }, hasStandardNameIdentity)
        const configuration = normalizeViewConfiguration(
          saveViewType,
          sourceConfiguration,
          hasStandardNameIdentity
        )
        const created = await createRecordView(
          organization.id,
          recordObject.id,
          {
            name: viewName.trim(),
            viewType: saveViewType,
            visibility: saveDialog.visibility,
            configuration,
          }
        )
        setRecordViews((views) => [...views, created])
        applyView(created)
        updateViewUrl(created.id)
        await updateLastRecordView(organization.id, recordObject.id, {
          recordViewId: created.id,
        })
      }
      setSaveDialog(null)
      setViewName("")
    } catch (err) {
      setViewError(
        err instanceof ApiError
          ? (err.errors?.name?.[0] ?? err.message)
          : "Could not save view."
      )
    } finally {
      setSavingView(false)
    }
  }, [
    applyView,
    currentConfiguration,
    organization,
    recordObject,
    recordFilters,
    recordViews,
    saveDialog,
    boardStatusAttribute,
    hasStandardNameIdentity,
    saveViewType,
    sorting,
    updateViewUrl,
    viewName,
  ])

  const removeRecordView = React.useCallback(async () => {
    const view = viewToDelete
    if (!view) return
    if (!organization || !recordObject || !view.canDelete) return
    setSavingView(true)
    try {
      await deleteRecordView(organization.id, recordObject.id, view.id)
      setRecordViews((views) =>
        views.filter((candidate) => candidate.id !== view.id)
      )
      if (activeViewId === view.id) {
        applyView(null, ALL_RECORDS_VIEW_ID)
        updateViewUrl(ALL_RECORDS_VIEW_ID)
        await updateLastRecordView(organization.id, recordObject.id, {
          builtInViewType: "table",
        })
      }
      setViewToDelete(null)
    } catch (err) {
      setViewError(
        err instanceof ApiError ? err.message : "Could not delete view."
      )
    } finally {
      setSavingView(false)
    }
  }, [
    activeViewId,
    applyView,
    organization,
    recordObject,
    updateViewUrl,
    viewToDelete,
  ])

  const requestRecordViewDeletion = React.useCallback((view: RecordView) => {
    if (view.canDelete) setViewToDelete(view)
  }, [])

  const moveKanbanRecord = React.useCallback(
    async (record: RecordItem, optionSlug: string | null) => {
      if (!organization || !boardStatusAttribute) return
      const previous = record.values[boardStatusAttribute.slug]
      setRecords((items) =>
        items.map((item) =>
          item.id === record.id
            ? {
                ...item,
                values: {
                  ...item.values,
                  [boardStatusAttribute.slug]: optionSlug,
                },
              }
            : item
        )
      )
      try {
        const updated = await updateRecord(organization.id, record.id, {
          [boardStatusAttribute.slug]: optionSlug,
        })
        setRecords((items) =>
          items.map((item) => (item.id === updated.id ? updated : item))
        )
      } catch (err) {
        setRecords((items) =>
          items.map((item) =>
            item.id === record.id
              ? {
                  ...item,
                  values: {
                    ...item.values,
                    [boardStatusAttribute.slug]: previous,
                  },
                }
              : item
          )
        )
        setViewError(
          err instanceof ApiError ? err.message : "Could not move the record."
        )
      }
    },
    [boardStatusAttribute, organization]
  )

  const calculationFooter = React.useMemo(
    () => (
      <RecordsCalculationFooter
        records={records}
        table={table}
        attributes={attributes}
        calculations={calculations}
        setCalculations={setCalculations}
      />
    ),
    [records, table, attributes, calculations]
  )

  const cascaderViewItems = React.useMemo<
    CascaderNode<RecordView | null>[]
  >(() => {
    const defaultLabel = `All ${plural}`
    const defaultNodes: CascaderNode<RecordView | null>[] = builtInViews.map(
      (view) => ({
        value: view.id,
        label:
          view.id === ALL_RECORDS_VIEW_ID && view.label === "All records"
            ? defaultLabel
            : view.label,
        icon: <Table2Icon className="size-4" />,
        keywords: ["default", "table", "all", plural],
        data: null,
      })
    )

    const customNodes: CascaderNode<RecordView | null>[] = recordViews.map(
      (view) => {
        const ViewIcon =
          view.viewType === "kanban"
            ? SquareKanbanIcon
            : view.visibility === "shared"
              ? Globe2Icon
              : LockIcon

        return {
          value: view.id,
          label: view.name,
          icon: <ViewIcon className="size-4" />,
          keywords: [view.name, view.visibility, view.viewType],
          data: view,
        }
      }
    )

    return [...defaultNodes, ...customNodes]
  }, [builtInViews, plural, recordViews])

  const cascaderActions = React.useMemo<CascaderActionItem[]>(
    () => [
      {
        value: "create-new-view",
        label: "Create new view",
        icon: <PlusIcon className="size-4" />,
        onSelect: () => {
          setViewCascaderOpen(false)
          openCreateViewDialog("personal", undefined, true)
        },
      },
    ],
    [openCreateViewDialog]
  )

  const cascaderLabels = React.useMemo(
    () => ({
      empty: "No views found.",
      actionsLabel: "View actions",
    }),
    []
  )

  const handleCascaderValueChange = React.useCallback(
    (nextValue: string) => {
      if (!nextValue) return
      const foundNode = cascaderViewItems.find(
        (node) => node.value === nextValue
      )
      if (!foundNode) return
      if (foundNode.data) {
        selectRecordView({
          value: foundNode.data.id,
          label: foundNode.data.name,
          recordView: foundNode.data,
          viewType: foundNode.data.viewType,
        })
      } else {
        selectRecordView({
          value: foundNode.value,
          label: foundNode.label,
          recordView: null,
          viewType: "table",
        })
      }
    },
    [cascaderViewItems, selectRecordView]
  )

  if (!organization) {
    return (
      <div className="flex flex-1 items-center justify-center p-8">
        <p className="text-muted-foreground">No active organization.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background text-foreground">
      {error ? (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertTriangleIcon className="size-4" />
            <AlertTitle>Failed to load {plural.toLowerCase()}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center bg-background">
            <div className="col-start-1 row-start-1 flex items-center gap-2 py-2.5 pl-4">
              <Cascader
                items={cascaderViewItems}
                value={activeViewId}
                onValueChange={handleCascaderValueChange}
                open={viewCascaderOpen}
                onOpenChange={setViewCascaderOpen}
                indicator={false}
                searchScope="deep"
                labels={cascaderLabels}
                actions={cascaderActions}
              >
                <CascaderTrigger
                  showIcon={false}
                  aria-label={`Current view: ${activeRecordViewOption.label}`}
                  render={
                    <Button
                      variant="outline"
                      className="max-w-60 justify-between gap-2"
                    />
                  }
                >
                  <div className="flex min-w-0 items-center gap-2">
                    {viewsReadyForObject !== recordObject?.id ? (
                      <Spinner />
                    ) : activeRecordViewOption.viewType === "kanban" ? (
                      <SquareKanbanIcon />
                    ) : activeView?.visibility === "shared" ? (
                      <Globe2Icon />
                    ) : activeView ? (
                      <LockIcon />
                    ) : (
                      <Table2Icon />
                    )}
                    <span className="truncate">
                      {activeRecordViewOption.label}
                      {isViewDirty ? " •" : ""}
                    </span>
                  </div>
                  <ChevronDownIcon className="text-muted-foreground size-4 shrink-0" />
                </CascaderTrigger>

                <CascaderContent
                  align="start"
                  side="bottom"
                  sideOffset={4}
                  className="w-80"
                >
                  <CascaderPanel>
                    <CascaderNav>
                      <CascaderInput
                        placeholder="Search views..."
                        aria-label="Search views"
                      />
                    </CascaderNav>
                    <CascaderBreadcrumb />
                    <CascaderEmpty />
                    <CascaderList>
                      <CascaderItems>
                        {(node) => {
                          const recordView =
                            (node.data as RecordView | null) ?? null
                          return (
                            <div
                              key={node.value}
                              className="group/item relative flex items-center"
                            >
                              <CascaderItem
                                node={node}
                                className={recordView ? "pe-8!" : undefined}
                              />
                              {recordView && (
                                <div className="absolute inset-y-0 right-1 flex items-center opacity-0 transition-opacity group-hover/item:opacity-100 focus-within:opacity-100">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger
                                      render={
                                        <Button
                                          variant="ghost"
                                          size="icon-xs"
                                          aria-label={`Actions for ${node.label}`}
                                          onClick={(e) => {
                                            e.stopPropagation()
                                          }}
                                        />
                                      }
                                    >
                                      <MoreVerticalIcon />
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                      side="right"
                                      align="start"
                                      className="min-w-36"
                                    >
                                      <DropdownMenuGroup>
                                        {recordView.canUpdate && (
                                          <DropdownMenuItem
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setViewCascaderOpen(false)
                                              openRenameViewDialog(recordView)
                                            }}
                                          >
                                            <PencilIcon /> Rename
                                          </DropdownMenuItem>
                                        )}
                                        <DropdownMenuItem
                                          onClick={(e) => {
                                            e.stopPropagation()
                                            setViewCascaderOpen(false)
                                            openCreateViewDialog(
                                              "personal",
                                              recordView
                                            )
                                          }}
                                        >
                                          <CopyIcon /> Duplicate
                                        </DropdownMenuItem>
                                      </DropdownMenuGroup>
                                      {recordView.canDelete && (
                                        <>
                                          <DropdownMenuSeparator />
                                          <DropdownMenuGroup>
                                            <DropdownMenuItem
                                              variant="destructive"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                setViewCascaderOpen(false)
                                                requestRecordViewDeletion(
                                                  recordView
                                                )
                                              }}
                                            >
                                              <Trash2Icon /> Delete
                                            </DropdownMenuItem>
                                          </DropdownMenuGroup>
                                        </>
                                      )}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              )}
                            </div>
                          )
                        }}
                      </CascaderItems>
                    </CascaderList>
                    <CascaderFooter />
                    <CascaderStatus />
                  </CascaderPanel>
                </CascaderContent>
              </Cascader>
            </div>

            <Separator className="col-span-full col-start-1 row-start-2" />

            <div className="col-span-full col-start-1 row-start-3 flex items-center gap-2 px-4 py-2">
              <Popover>
                <PopoverTrigger render={<Button variant="outline" />}>
                  <ArrowDownUpIcon data-icon="inline-start" />
                  Sort
                  {sorting.length > 0 && (
                    <span className="text-muted-foreground">
                      {sorting.length}
                    </span>
                  )}
                </PopoverTrigger>
                <PopoverContent align="start" className="w-80">
                  <PopoverHeader className="flex-row items-center justify-between">
                    <PopoverTitle>Sort records</PopoverTitle>
                    {sorting.length > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        onClick={() => setSorting([])}
                      >
                        Clear
                      </Button>
                    )}
                  </PopoverHeader>
                  <div className="flex flex-col gap-2">
                    {sorting.map((sort, index) => (
                      <div key={`${sort.id}-${index}`} className="flex gap-2">
                        <Select
                          value={sort.id}
                          onValueChange={(id) => {
                            if (!id) return
                            setSorting((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index ? { ...item, id } : item
                              )
                            )
                          }}
                        >
                          <SelectTrigger className="min-w-0 flex-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                              {recordFields.map((field) => (
                                <SelectItem key={field.id} value={field.id}>
                                  {field.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Select
                          value={sort.desc ? "desc" : "asc"}
                          onValueChange={(value) =>
                            setSorting((current) =>
                              current.map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, desc: value === "desc" }
                                  : item
                              )
                            )
                          }
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent alignItemWithTrigger={false}>
                            <SelectGroup>
                              <SelectItem value="asc">Ascending</SelectItem>
                              <SelectItem value="desc">Descending</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${recordFields.find((field) => field.id === sort.id)?.label ?? "sort"} sort`}
                          onClick={() =>
                            setSorting((current) =>
                              current.filter(
                                (_, itemIndex) => itemIndex !== index
                              )
                            )
                          }
                        >
                          <XIcon />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-fit"
                      disabled={
                        recordFields.length === 0 ||
                        sorting.length >= recordFields.length
                      }
                      onClick={() => {
                        const nextField = recordFields.find(
                          (field) =>
                            !sorting.some((sort) => sort.id === field.id)
                        )
                        if (nextField) {
                          setSorting((current) => [
                            ...current,
                            { id: nextField.id, desc: false },
                          ])
                        }
                      }}
                    >
                      <PlusIcon data-icon="inline-start" />
                      Add sort
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>

              <Filters
                size="sm"
                fields={filterFields}
                query={recordFilterQuery}
                onQueryChange={handleRecordFilterQueryChange}
                showClear
                trigger={
                  <Button variant="outline" size="icon-sm">
                    <FilterIcon />
                    <span className="sr-only">Filter records</span>
                  </Button>
                }
              />
            </div>

            <Separator className="col-span-full col-start-1 row-start-4" />

            <div className="col-start-3 row-start-1 mr-4 flex items-center gap-2">
              {table.getSelectedRowModel().rows.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setDeleteTargets(
                      table
                        .getSelectedRowModel()
                        .rows.map((row) => row.original)
                    )
                  }
                >
                  <Trash2Icon data-icon="inline-start" />
                  Delete {table.getSelectedRowModel().rows.length}
                </Button>
              )}
              <ButtonGroup>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={`Create ${singular}`}
                  onClick={() =>
                    createHref ? router.push(createHref) : setIsSheetOpen(true)
                  }
                >
                  <PlusIcon aria-hidden="true" />
                </Button>
                {viewType === "table" ? (
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Table settings"
                    onClick={() => setIsColumnSettingsOpen(true)}
                  >
                    <SettingsIcon aria-hidden="true" />
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label="Kanban card fields"
                        />
                      }
                    >
                      <SettingsIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-52">
                      <DropdownMenuLabel>Card fields</DropdownMenuLabel>
                      {attributes.map((attribute) => (
                        <DropdownMenuCheckboxItem
                          key={attribute.id}
                          checked={
                            attribute.slug === "name" ||
                            attribute.slug === "title" ||
                            cardFields.includes(attribute.slug)
                          }
                          disabled={
                            attribute.slug === "name" ||
                            attribute.slug === "title"
                          }
                          onCheckedChange={(checked) =>
                            setCardFields((fields) =>
                              checked
                                ? [...new Set([...fields, attribute.slug])]
                                : fields.filter(
                                    (slug) => slug !== attribute.slug
                                  )
                            )
                          }
                        >
                          {attribute.title}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </ButtonGroup>
            </div>
          </div>

          {viewError && (
            <Alert variant="destructive" className="m-3 mb-0 shrink-0">
              <AlertTriangleIcon className="size-4" />
              <AlertTitle>View could not be updated</AlertTitle>
              <AlertDescription>{viewError}</AlertDescription>
            </Alert>
          )}

          {viewType === "table" ? (
            <div className="relative flex min-h-0 flex-1">
              <DataGrid
                table={table}
                recordCount={table.getFilteredRowModel().rows.length}
                isLoading={isLoading}
                loadingMode="skeleton"
                emptyMessage={
                  <span className="sr-only">
                    No {plural.toLowerCase()} yet.
                  </span>
                }
                onRowClick={(record) => {
                  router.push(
                    getRecordHref?.(record) ??
                      `/records/${objectSlug}/${record.id}`
                  )
                }}
                tableLayout={{
                  headerSticky: true,
                  columnsPinnable: true,
                  columnsResizable: true,
                  columnsVisibility: true,
                  headerBackground: false,
                  cellBorder: false,
                  rowBorder: true,
                  width: "fixed",
                }}
                tableClassNames={{
                  headerSticky: "sticky top-0 z-40 bg-background",
                  bodyRow: "[&:last-child>td]:border-b",
                }}
                className="flex min-h-0 flex-1 flex-col gap-0"
              >
                <DataGridContainer className="flex min-h-0 flex-1 flex-col border-0">
                  <DataGridScrollArea
                    footer={calculationFooter}
                    className="flex min-h-0 flex-1 flex-col [&_[data-slot=data-grid-table-viewport]]:flex [&_[data-slot=data-grid-table-viewport]]:flex-1 [&_[data-slot=data-grid-table-viewport]]:flex-col [&_[data-slot=scroll-area-viewport]]:h-full [&_[data-slot=scroll-area-viewport]>div]:flex [&_[data-slot=scroll-area-viewport]>div]:min-h-full [&_[data-slot=scroll-area-viewport]>div]:flex-col"
                  >
                    <DataGridTable />
                  </DataGridScrollArea>
                </DataGridContainer>
              </DataGrid>
              {!isLoading && table.getRowModel().rows.length === 0 && (
                <div className="pointer-events-none absolute inset-x-0 top-10 bottom-0 flex items-center justify-center text-sm text-muted-foreground">
                  No {plural.toLowerCase()} found.
                </div>
              )}
            </div>
          ) : isLoading ? (
            <RecordKanbanSkeleton />
          ) : boardStatusAttribute ? (
            <RecordKanbanView
              records={table
                .getSortedRowModel()
                .rows.map((row) => row.original)}
              attributes={attributes}
              groupBy={boardStatusAttribute}
              configuration={currentConfiguration}
              calculations={calculations}
              onCalculationsChange={setCalculations}
              singular={singular}
              onMove={(record, option) => void moveKanbanRecord(record, option)}
              onCollapsedLanesChange={setCollapsedLanes}
              onLaneOrderChange={setLaneOrder}
              onAddStage={async (title, color) => {
                if (
                  !organization?.id ||
                  !recordObject?.id ||
                  !boardStatusAttribute?.id
                )
                  return
                await createSelectOption(
                  organization.id,
                  recordObject.id,
                  boardStatusAttribute.id,
                  { title, color }
                )
                toast.success(`Stage "${title}" created`)
                await load()
              }}
              onUpdateStage={async (stageId, title, color) => {
                if (
                  !organization?.id ||
                  !recordObject?.id ||
                  !boardStatusAttribute?.id
                )
                  return
                await updateSelectOption(
                  organization.id,
                  recordObject.id,
                  boardStatusAttribute.id,
                  stageId,
                  { title, color }
                )
                toast.success(`Stage "${title}" updated`)
                await load()
              }}
              onDeleteStage={async (stageId) => {
                if (
                  !organization?.id ||
                  !recordObject?.id ||
                  !boardStatusAttribute?.id
                )
                  return
                await deleteSelectOption(
                  organization.id,
                  recordObject.id,
                  boardStatusAttribute.id,
                  stageId
                )
                toast.success("Stage deleted")
                await load()
              }}
              onOpen={(record) =>
                router.push(
                  getRecordHref?.(record) ??
                    `/records/${objectSlug}/${record.id}`
                )
              }
              onAddRecord={(stageSlug) => {
                setInitialCreateValues(
                  stageSlug && boardStatusAttribute
                    ? { [boardStatusAttribute.slug]: stageSlug }
                    : undefined
                )
                setIsSheetOpen(true)
              }}
              onDeleteRecord={(record) => setDeleteTargets([record])}
            />
          ) : (
            <div className="flex min-h-0 flex-1 items-center justify-center p-8 text-center">
              <div className="max-w-md">
                <SquareKanbanIcon className="mx-auto size-8 text-muted-foreground" />
                <h2 className="mt-3 font-medium">Board unavailable</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Add a designated Status field to create a board.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      <ColumnSettingsDialog
        open={isColumnSettingsOpen}
        onOpenChange={setIsColumnSettingsOpen}
        table={table}
        attributes={attributes}
        onRenameColumn={openRename}
        onRemoveColumnInstance={handleRemoveColumnInstance}
        onResetColumnInstances={handleResetColumnInstances}
      />

      <EditAttributeSheet
        open={!!renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null)
        }}
        attribute={renameTarget}
        organizationId={organization?.id}
        objectId={recordObject?.id}
        onSaved={handleAttributeUpdated}
        onDeleted={(deletedId) => {
          const deletedAttribute = attributes.find(
            (attribute) => attribute.id === deletedId
          )
          const deletedInstanceIds = columnInstances
            .filter(
              (instance) => instance.attributeSlug === deletedAttribute?.slug
            )
            .map((instance) => instance.id)
          handleAttributeDeleted(deletedId)
          setColumnInstances((instances) =>
            instances.filter(
              (instance) => !deletedInstanceIds.includes(instance.id)
            )
          )
          removeColumnInstanceState(deletedInstanceIds)
        }}
      />

      {isSheetOpen && !createHref && (
        <RecordSheet
          organizationId={organization.id}
          objectSlug={objectSlug}
          objectId={recordObject?.id ?? ""}
          objectLabel={singular}
          attributes={attributes}
          initialValues={initialCreateValues}
          onOpenChange={(open) => {
            setIsSheetOpen(open)
            if (!open) setInitialCreateValues(undefined)
          }}
          onSaved={() => {
            void load()
          }}
        />
      )}

      <Dialog
        open={saveDialog !== null}
        onOpenChange={(open) => {
          if (!open && !savingView) {
            setSaveDialog(null)
            setViewName("")
            setViewError(null)
          }
        }}
      >
        <DialogContent>
          <form
            onSubmit={(event) => {
              event.preventDefault()
              void submitViewDialog()
            }}
          >
            <DialogHeader>
              <DialogTitle>
                {saveDialog?.mode === "rename"
                  ? "Rename view"
                  : saveDialog?.visibility === "shared"
                    ? "Save for everyone"
                    : "Save for me"}
              </DialogTitle>
              <DialogDescription>
                {saveDialog?.mode === "rename"
                  ? "Choose the name shown in the view selector."
                  : saveDialog?.visibility === "shared"
                    ? "Everyone in this organization will be able to use this view."
                    : "Only you will be able to see this view."}
              </DialogDescription>
            </DialogHeader>
            <FieldGroup className="py-4">
              <Field>
                <FieldLabel htmlFor="record-view-name">View name</FieldLabel>
                <Input
                  id="record-view-name"
                  autoFocus
                  value={viewName}
                  onChange={(event) => {
                    setViewName(event.target.value)
                    if (viewError) setViewError(null)
                  }}
                  placeholder="View name"
                  maxLength={100}
                  aria-invalid={Boolean(viewError)}
                />
                {viewError && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-destructive">
                    <AlertTriangleIcon
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {viewError}
                  </p>
                )}
              </Field>
              {saveDialog?.mode === "create" && saveDialog.isFromScratch && (
                <>
                  <Field>
                    <FieldLabel>Layout</FieldLabel>
                    <FieldGroup className="grid grid-cols-2 gap-3">
                      <FieldLabel className="relative cursor-pointer p-0">
                        <Field orientation="horizontal">
                          <Checkbox
                            checked={saveViewType === "table"}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                setSaveViewType("table")
                              }
                            }}
                            aria-label="Table layout"
                            className="absolute top-3 right-3 size-5 rounded-full"
                          />
                          <FieldTitle className="flex flex-col items-start gap-2 pr-7">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-xs shadow-black/5">
                              <Table2Icon className="size-4" />
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-sm font-semibold">
                                Table
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Rows and columns
                              </span>
                            </div>
                          </FieldTitle>
                        </Field>
                      </FieldLabel>
                      <FieldLabel className="relative cursor-pointer p-0">
                        <Field orientation="horizontal">
                          <Checkbox
                            checked={saveViewType === "kanban"}
                            disabled={!recordObject?.supportsBoard}
                            onCheckedChange={(checked) => {
                              if (checked === true) {
                                setSaveViewType("kanban")
                              }
                            }}
                            aria-label="Board layout"
                            className="absolute top-3 right-3 size-5 rounded-full"
                          />
                          <FieldTitle className="flex flex-col items-start gap-2 pr-7">
                            <div className="flex size-8 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-xs shadow-black/5">
                              <SquareKanbanIcon className="size-4" />
                            </div>
                            <div className="flex flex-col items-start gap-0.5">
                              <span className="text-sm font-semibold">
                                Board
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {recordObject?.supportsBoard
                                  ? "Cards in columns"
                                  : "Requires a board Status field"}
                              </span>
                            </div>
                          </FieldTitle>
                        </Field>
                      </FieldLabel>
                    </FieldGroup>
                  </Field>
                </>
              )}
            </FieldGroup>
            <DialogFooter>
              <Button
                type="submit"
                disabled={
                  !viewName.trim() ||
                  savingView ||
                  (saveDialog?.mode === "create" &&
                    saveViewType === "kanban" &&
                    !boardStatusAttribute)
                }
              >
                {savingView && <Spinner />}
                {saveDialog?.mode === "rename" ? "Rename" : "Save view"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {viewToDelete && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open && !savingView) setViewToDelete(null)
          }}
        >
          <DialogContent showCloseButton={!savingView}>
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <AlertTriangleIcon className="size-5" aria-hidden="true" />
                </div>
                <div className="flex flex-col gap-1">
                  <DialogTitle>Delete view?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. The “{viewToDelete.name}” view
                    will be permanently deleted.
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <DialogFooter>
              <DialogClose
                render={<Button variant="outline" disabled={savingView} />}
              >
                Cancel
              </DialogClose>
              <Button
                variant="destructive"
                disabled={savingView}
                onClick={() => void removeRecordView()}
              >
                {savingView ? <Spinner /> : <Trash2Icon />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deleteTargets.length > 0 && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!deleting && !open) setDeleteTargets([])
          }}
        >
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                  <TriangleAlertIcon className="size-4" aria-hidden="true" />
                </span>
                Delete{" "}
                {deleteTargets.length === 1
                  ? singular.toLowerCase()
                  : `${deleteTargets.length} ${plural.toLowerCase()}`}
              </DialogTitle>
              <DialogDescription>
                Delete{" "}
                <span className="font-medium text-foreground">
                  {deleteTargets.length === 1
                    ? deleteTargets[0].title
                    : `${deleteTargets.length} ${plural.toLowerCase()}`}
                </span>
                {"? "}
                {deleteDescription ??
                  "This also removes their conversations and history, and cannot be undone."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeleteTargets([])}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={deleting}
                onClick={async () => {
                  setDeleting(true)
                  try {
                    // Sequential rather than Promise.all: the API is
                    // per-record, and a burst of parallel deletes is the kind
                    // of thing rate limiting exists to stop.
                    for (const target of deleteTargets) {
                      if (deleteRecordItem) {
                        await deleteRecordItem(organization.id, target)
                      } else {
                        await deleteRecord(organization.id, target.id)
                      }
                    }
                    setDeleteTargets([])
                    setRowSelection({})
                    await load()
                  } catch (err) {
                    setError(
                      err instanceof ApiError
                        ? err.message
                        : "Failed to delete."
                    )
                  } finally {
                    setDeleting(false)
                  }
                }}
              >
                {deleting ? <Spinner /> : <Trash2Icon aria-hidden="true" />}
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <AnimatePresence>
        {isViewDirty && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 26 }}
            className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2"
          >
            <motion.div
              key={skipAttemptCount}
              animate={
                skipAttemptCount >= 2
                  ? {
                      x: [0, -12, 12, -9, 9, -5, 5, 0],
                      boxShadow: [
                        "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        "0 0 0 3px rgba(245, 158, 11, 0.45), 0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        "0 0 0 3px rgba(245, 158, 11, 0.45), 0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                      ],
                    }
                  : {}
              }
              transition={{ duration: 0.5, ease: "easeInOut" }}
              className="flex items-center gap-2 rounded-full border border-border/80 bg-background/95 p-1.5 shadow-2xl backdrop-blur-md dark:bg-background/90"
            >
              <div className="flex items-center gap-2 border-r border-border/60 px-3 text-xs font-semibold text-muted-foreground">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500"></span>
                </span>
                Unsaved changes
              </div>
              <div className="flex items-center gap-1.5">
                <Button
                  size="sm"
                  variant="default"
                  disabled={savingView}
                  onClick={() => {
                    if (activeView?.canUpdate) {
                      void saveExistingView()
                    } else {
                      openCreateViewDialog(activeView?.visibility ?? "personal")
                    }
                  }}
                  className="rounded-full shadow-xs"
                >
                  {savingView ? (
                    <Spinner />
                  ) : (
                    <CheckIcon className="size-3.5" />
                  )}
                  Save changes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCreateViewDialog("personal")}
                  className="rounded-full"
                >
                  <LockIcon className="size-3.5" />
                  Save for me
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openCreateViewDialog("shared")}
                  className="rounded-full"
                >
                  <Globe2Icon className="size-3.5" />
                  Save for everyone
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={discardViewChanges}
                  className="rounded-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                  <RotateCcwIcon className="size-3.5" />
                  Discard
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
