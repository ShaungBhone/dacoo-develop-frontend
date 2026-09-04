"use client"

import * as React from "react"
import {
  ArrowRightLeftIcon,
  CheckIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "@/components/ui/icons"

import type {
  Attribute,
  RecordItem,
  RecordViewConfiguration,
  SelectOption,
} from "@/components/records/api"
import {
  type CalculationType,
  CALCULATION_OPTIONS,
  NUMERIC_OPTIONS,
  computeCalculation,
  isNumericAttribute,
} from "@/components/records/record-calculations"
import { StageEditDialog } from "@/components/records/stage-edit-dialog"
import { StageColorPicker } from "@/components/records/stage-color-picker"
import { RecordValueDisplay } from "@/components/records/record-value-display"
import { useCurrencySettings } from "@/contexts/currency-settings-context"
import {
  getSelectOptionSolidColor,
  selectOptionBadgeStyle,
} from "@/components/records/select-option-colors"
import { Badge } from "@/components/reui/badge"
import {
  Frame,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
import {
  Kanban,
  KanbanBoard,
  KanbanColumn,
  KanbanColumnContent,
  KanbanColumnHandle,
  KanbanItem,
  KanbanItemHandle,
  KanbanOverlay,
  type KanbanMoveEvent,
} from "@/components/reui/kanban"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const UNASSIGNED = "__unassigned"

const STAGE_COLORS = [
  { name: "blue", hex: "#3b82f6" },
  { name: "indigo", hex: "#6366f1" },
  { name: "purple", hex: "#a855f7" },
  { name: "pink", hex: "#ec4899" },
  { name: "red", hex: "#ef4444" },
  { name: "orange", hex: "#f97316" },
  { name: "amber", hex: "#f59e0b" },
  { name: "green", hex: "#22c55e" },
  { name: "teal", hex: "#14b8a6" },
  { name: "slate", hex: "#64748b" },
]

function compareValues(left: unknown, right: unknown): number {
  if (left == null && right == null) return 0
  if (left == null) return 1
  if (right == null) return -1
  if (typeof left === "number" && typeof right === "number") {
    return left - right
  }
  return String(left).localeCompare(String(right), undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function initials(name: string): string {
  if (!name) return "?"
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

function sortedRecords(
  records: RecordItem[],
  sorting: RecordViewConfiguration["sorting"]
): RecordItem[] {
  if (!sorting?.length) {
    return [...records].sort((left, right) =>
      left.title.localeCompare(right.title)
    )
  }

  return [...records].sort((left, right) => {
    for (const sort of sorting) {
      const leftValue = sort.id === "title" ? left.title : left.values[sort.id]
      const rightValue =
        sort.id === "title" ? right.title : right.values[sort.id]
      const result = compareValues(leftValue, rightValue)
      if (result !== 0) return sort.desc ? -result : result
    }
    return left.title.localeCompare(right.title)
  })
}

function RecordCard({
  record,
  cardFields,
  attributes,
  options,
  groupBySlug,
  onOpen,
  onMove,
  onDelete,
  asHandle = true,
}: {
  record: RecordItem
  cardFields: string[]
  attributes: Attribute[]
  options: { slug: string; title: string; color?: string | null }[]
  groupBySlug: string
  onOpen: (record: RecordItem) => void
  onMove?: (record: RecordItem, stageSlug: string | null) => void
  onDelete?: (record: RecordItem) => void
  asHandle?: boolean
}) {
  const content = (
    <div className="group/card relative rounded-xl border border-border/50 bg-card p-3 shadow-2xs transition-all hover:border-border hover:shadow-xs">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Avatar className="size-6 shrink-0">
            <AvatarFallback className="text-[10px] font-semibold uppercase">
              {initials(record.displayText)}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-semibold text-foreground hover:underline"
            onClick={(e) => {
              e.stopPropagation()
              onOpen(record)
            }}
          >
            {record.displayText}
          </button>
        </div>

        {asHandle && (
          <div
            className="shrink-0"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="size-6 text-muted-foreground opacity-60 hover:text-foreground hover:opacity-100"
                    aria-label={`Actions for ${record.displayText}`}
                  />
                }
              >
                <MoreHorizontalIcon className="size-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => onOpen(record)}>
                    <PencilIcon data-icon="inline-start" className="size-3.5" />
                    <span>Edit / View details</span>
                  </DropdownMenuItem>

                  {options.length > 0 && onMove && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger>
                        <ArrowRightLeftIcon
                          data-icon="inline-start"
                          className="size-3.5"
                        />
                        <span>Change stage</span>
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="w-48">
                        <DropdownMenuItem
                          disabled={!record.values[groupBySlug]}
                          onClick={() => onMove(record, null)}
                        >
                          <span className="size-2.5 shrink-0 rounded-full border border-dashed border-muted-foreground/80 bg-muted/60" />
                          <span className="flex-1 truncate">Unassigned</span>
                          {!record.values[groupBySlug] && (
                            <CheckIcon className="ml-auto size-3.5 text-primary" />
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {options.map((opt) => {
                          const isCurrent =
                            record.values[groupBySlug] === opt.slug
                          const solidColor = getSelectOptionSolidColor(
                            opt.color
                          )
                          return (
                            <DropdownMenuItem
                              key={opt.slug}
                              disabled={isCurrent}
                              onClick={() => onMove(record, opt.slug)}
                            >
                              <span
                                className="size-2.5 shrink-0 rounded-full shadow-xs"
                                style={{
                                  backgroundColor:
                                    solidColor ?? "var(--muted-foreground)",
                                }}
                              />
                              <span className="flex-1 truncate">
                                {opt.title}
                              </span>
                              {isCurrent && (
                                <CheckIcon className="ml-auto size-3.5 text-primary" />
                              )}
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}
                </DropdownMenuGroup>

                {onDelete && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(record)}
                    >
                      <Trash2Icon
                        data-icon="inline-start"
                        className="size-3.5"
                      />
                      <span>Delete</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      {cardFields
        .filter((slug) => slug !== "title")
        .map((slug) => {
          const attribute = attributes.find(
            (candidate) => candidate.slug === slug
          )
          if (!attribute) return null
          return (
            <div key={slug} className="mt-2.5 min-w-0 text-xs">
              <p className="mb-1 truncate text-muted-foreground">
                {attribute.title}
              </p>
              <RecordValueDisplay
                attribute={attribute}
                value={record.values[slug]}
                className="text-xs"
              />
            </div>
          )
        })}
    </div>
  )

  return (
    <KanbanItem value={record.id}>
      {asHandle ? <KanbanItemHandle>{content}</KanbanItemHandle> : content}
    </KanbanItem>
  )
}

export function RecordKanbanView({
  records,
  attributes,
  groupBy,
  configuration,
  singular,
  onMove,
  onOpen,
  onAddRecord,
  onDeleteRecord,
  onCollapsedLanesChange,
  onLaneOrderChange,
  onAddStage,
  onUpdateStage,
  onDeleteStage,
  calculations,
  onCalculationsChange,
}: {
  records: RecordItem[]
  attributes: Attribute[]
  groupBy: Attribute
  configuration: RecordViewConfiguration
  singular?: string
  calculations?: Record<string, CalculationType>
  onCalculationsChange?: (calculations: Record<string, CalculationType>) => void
  onMove: (record: RecordItem, optionSlug: string | null) => void
  onOpen: (record: RecordItem) => void
  onAddRecord?: (stageSlug?: string) => void
  onDeleteRecord?: (record: RecordItem) => void
  onCollapsedLanesChange?: (lanes: string[]) => void
  onLaneOrderChange?: (order: string[]) => void
  onAddStage?: (title: string, color?: string | null) => Promise<void>
  onUpdateStage?: (
    stageId: string,
    title: string,
    color?: string | null
  ) => Promise<void>
  onDeleteStage?: (stageId: string) => Promise<void>
}) {
  const { settings: currencySettings } = useCurrencySettings()
  const [isAddingStage, setIsAddingStage] = React.useState(false)
  const [newStageTitle, setNewStageTitle] = React.useState("")
  const [selectedColor, setSelectedColor] = React.useState("blue")
  const [isSubmittingStage, setIsSubmittingStage] = React.useState(false)
  const [editingStage, setEditingStage] = React.useState<SelectOption | null>(
    null
  )

  const collapsedLanes = React.useMemo(
    () => new Set(configuration.collapsedLanes ?? []),
    [configuration.collapsedLanes]
  )

  const toggleCollapseLane = React.useCallback(
    (lane: string) => {
      const next = new Set(configuration.collapsedLanes ?? [])
      if (next.has(lane)) {
        next.delete(lane)
      } else {
        next.add(lane)
      }
      onCollapsedLanesChange?.(Array.from(next))
    },
    [configuration.collapsedLanes, onCollapsedLanesChange]
  )

  const options = React.useMemo(() => {
    const usedStages = new Set(
      records.map((record) => String(record.values[groupBy.slug] ?? ""))
    )

    return groupBy.selectOptions.filter(
      (option) => !option.isArchived || usedStages.has(option.slug)
    )
  }, [groupBy, records])

  const cardFields = configuration.cardFields?.length
    ? configuration.cardFields
    : ["title"]

  const calcConfig = calculations ?? configuration.calculations ?? {}
  const activeCalcEntry = Object.entries(calcConfig).find(
    ([, calc]) => calc && calc !== "none"
  )
  const activeTargetSlug = activeCalcEntry
    ? activeCalcEntry[0]
    : (attributes.find(isNumericAttribute)?.slug ?? "title")
  const activeCalcType: CalculationType = (
    activeCalcEntry ? activeCalcEntry[1] : "none"
  ) as CalculationType
  const activeTargetAttribute =
    activeTargetSlug === "title"
      ? undefined
      : attributes.find((a) => a.slug === activeTargetSlug)

  const selectableAttributes = React.useMemo(() => {
    const titleAttr: Attribute = {
      id: "title",
      slug: "title",
      title: "Title",
      type: "text",
      isCustom: false,
      isSystem: true,
      isRequired: true,
      isUnique: false,
      isMultiselect: false,
      position: 0,
      selectOptions: [],
      config: {},
    }
    return [titleAttr, ...attributes.filter((a) => a.slug !== groupBy.slug)]
  }, [attributes, groupBy.slug])

  const filtered = React.useMemo(() => {
    const search = configuration.search?.trim().toLocaleLowerCase()
    const candidates = sortedRecords(records, configuration.sorting)
    if (!search) return candidates
    return candidates.filter((record) =>
      [record.displayText, ...Object.values(record.values)]
        .map((value) => String(value ?? "").toLocaleLowerCase())
        .some((value) => value.includes(search))
    )
  }, [configuration.search, configuration.sorting, records])

  const computedColumns = React.useMemo(() => {
    const defaultOrder = [UNASSIGNED, ...options.map((option) => option.slug)]
    const savedOrder = configuration.laneOrder ?? []
    const allLanes = Array.from(
      new Set([
        ...savedOrder.filter((lane) => defaultOrder.includes(lane)),
        ...defaultOrder,
      ])
    )

    const next: Record<string, RecordItem[]> = Object.fromEntries(
      allLanes.map((lane) => [lane, []])
    )
    const validOptions = new Set(options.map((option) => option.slug))
    for (const record of filtered) {
      const value = record.values[groupBy.slug]
      const lane =
        typeof value === "string" && validOptions.has(value)
          ? value
          : UNASSIGNED
      if (!next[lane]) {
        next[lane] = []
      }
      next[lane].push(record)
    }
    return next
  }, [configuration.laneOrder, filtered, groupBy.slug, options])

  const handleValueChange = React.useCallback(
    (newColumns: Record<string, RecordItem[]>) => {
      const newOrder = Object.keys(newColumns)
      const currentOrder = configuration.laneOrder ?? []
      if (JSON.stringify(newOrder) !== JSON.stringify(currentOrder)) {
        onLaneOrderChange?.(newOrder)
      }
    },
    [configuration.laneOrder, onLaneOrderChange]
  )

  const handleMove = React.useCallback(
    ({ event, activeContainer, overContainer }: KanbanMoveEvent) => {
      if (activeContainer === overContainer) return
      const record = records.find(
        (candidate) => candidate.id === String(event.active.id)
      )
      if (!record) return
      onMove(record, overContainer === UNASSIGNED ? null : overContainer)
    },
    [onMove, records]
  )

  const handleCreateStage = React.useCallback(async () => {
    const title = newStageTitle.trim()
    if (!title || isSubmittingStage || !onAddStage) return
    setIsSubmittingStage(true)
    try {
      await onAddStage(title, selectedColor)
      setNewStageTitle("")
      setIsAddingStage(false)
    } finally {
      setIsSubmittingStage(false)
    }
  }, [isSubmittingStage, newStageTitle, onAddStage, selectedColor])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto bg-muted/15 p-4">
      <Kanban
        value={computedColumns}
        onValueChange={handleValueChange}
        onMove={handleMove}
        getItemValue={(record) => record.id}
        className="flex min-h-full w-fit min-w-full flex-1 flex-col"
      >
        <KanbanBoard className="flex min-h-full w-fit min-w-full flex-1 flex-row items-stretch gap-4">
          {Object.entries(computedColumns).map(([lane, laneRecords]) => {
            const option = options.find((candidate) => candidate.slug === lane)
            const isUnassigned = lane === UNASSIGNED
            const isCollapsed = collapsedLanes.has(lane)
            const solidColor = getSelectOptionSolidColor(option?.color)

            if (isCollapsed) {
              return (
                <KanbanColumn
                  key={lane}
                  value={lane}
                  className="flex h-full min-h-full w-[3.25rem] max-w-[3.25rem] min-w-[3.25rem] shrink-0 flex-col"
                >
                  <div
                    className="flex h-full min-h-full cursor-pointer flex-col items-center gap-3 rounded-xl border border-border/70 bg-muted/30 p-2 transition-colors select-none hover:bg-muted/50"
                    onClick={() => toggleCollapseLane(lane)}
                    title={`Click to expand ${option?.title ?? "Unassigned"}`}
                  >
                    <div className="flex flex-col items-center gap-2 pt-1">
                      <KanbanColumnHandle
                        className="cursor-grab p-0.5 text-muted-foreground/60 transition-opacity hover:text-foreground active:cursor-grabbing"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <GripVerticalIcon className="size-3.5" />
                      </KanbanColumnHandle>
                      <div
                        className={cn(
                          "size-2.5 shrink-0 rounded-full shadow-xs",
                          isUnassigned &&
                            "border border-dashed border-muted-foreground/80 bg-muted/60"
                        )}
                        style={{
                          backgroundColor: solidColor ?? undefined,
                        }}
                      />
                    </div>

                    <Badge variant="outline" size="sm" className="font-medium">
                      {laneRecords.length}
                    </Badge>

                    <div className="my-2 flex min-h-24 flex-1 items-center justify-center">
                      <span className="rotate-180 text-sm font-semibold tracking-tight whitespace-nowrap text-foreground [writing-mode:vertical-lr]">
                        {option?.title ?? "Unassigned"}
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="mt-auto size-6 text-muted-foreground hover:text-foreground"
                      aria-label={`Expand ${option?.title ?? "Unassigned"} column`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleCollapseLane(lane)
                      }}
                    >
                      <ChevronsRightIcon className="size-3.5" />
                    </Button>
                  </div>
                </KanbanColumn>
              )
            }

            return (
              <KanbanColumn
                key={lane}
                value={lane}
                className="flex h-full min-h-full w-72 max-w-sm min-w-72 flex-1 shrink-0 flex-col sm:w-80"
              >
                <div className="flex h-full min-h-full flex-col rounded-xl border border-border/80 bg-muted/40 p-2.5">
                  <header className="flex flex-row items-center gap-1.5 pb-2">
                    <KanbanColumnHandle className="-ml-1 cursor-grab p-0.5 text-muted-foreground/60 opacity-60 transition-opacity hover:text-foreground hover:opacity-100 active:cursor-grabbing">
                      <GripVerticalIcon className="size-3.5" />
                    </KanbanColumnHandle>

                    <div
                      className={cn(
                        "size-2.5 shrink-0 rounded-full shadow-xs",
                        !isUnassigned &&
                          option &&
                          onUpdateStage &&
                          "cursor-pointer transition-transform hover:scale-110",
                        isUnassigned &&
                          "border border-dashed border-muted-foreground/80 bg-muted/60"
                      )}
                      style={{
                        backgroundColor: solidColor ?? undefined,
                      }}
                      onClick={() => {
                        if (!isUnassigned && option && onUpdateStage) {
                          setEditingStage(option)
                        }
                      }}
                      title={
                        !isUnassigned && option
                          ? `Edit ${option.title} stage`
                          : undefined
                      }
                    />
                    {!isUnassigned && option && onUpdateStage ? (
                      <button
                        type="button"
                        className="min-w-0 flex-1 cursor-pointer truncate text-left text-sm font-semibold text-foreground hover:underline"
                        onClick={() => setEditingStage(option)}
                        title={`Edit ${option.title} stage`}
                      >
                        {option.title}
                      </button>
                    ) : (
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
                        {option?.title ?? "Unassigned"}
                      </span>
                    )}

                    <Badge
                      variant="outline"
                      size="sm"
                      className="ml-auto font-medium"
                    >
                      {laneRecords.length}
                    </Badge>

                    {!isUnassigned && option && onUpdateStage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              className="size-6 shrink-0 text-muted-foreground opacity-60 hover:text-foreground hover:opacity-100"
                              aria-label={`Options for ${option.title}`}
                            />
                          }
                        >
                          <MoreHorizontalIcon className="size-3.5" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem
                            onClick={() => setEditingStage(option)}
                          >
                            <PencilIcon
                              data-icon="inline-start"
                              className="size-3.5"
                            />
                            <span>Edit status</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => toggleCollapseLane(lane)}
                          >
                            <ChevronsLeftIcon
                              data-icon="inline-start"
                              className="size-3.5"
                            />
                            <span>Collapse column</span>
                          </DropdownMenuItem>
                          {onDeleteStage && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => setEditingStage(option)}
                              >
                                <Trash2Icon
                                  data-icon="inline-start"
                                  className="size-3.5"
                                />
                                <span>Delete status</span>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
                      aria-label={`Collapse ${option?.title ?? "Unassigned"} column`}
                      onClick={() => toggleCollapseLane(lane)}
                    >
                      <ChevronsLeftIcon className="size-3.5" />
                    </Button>
                  </header>

                  <KanbanColumnContent
                    value={lane}
                    className="flex min-h-32 flex-1 flex-col gap-2"
                  >
                    {laneRecords.map((record) => (
                      <RecordCard
                        key={record.id}
                        record={record}
                        cardFields={cardFields}
                        attributes={attributes}
                        options={options}
                        groupBySlug={groupBy.slug}
                        onOpen={onOpen}
                        onMove={(rec, stageSlug) => onMove(rec, stageSlug)}
                        onDelete={onDeleteRecord}
                        asHandle
                      />
                    ))}

                    {onAddRecord && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="default"
                        className="mt-1 w-full shrink-0 justify-start rounded-lg border border-dashed border-border/70 text-sm font-medium text-muted-foreground hover:border-border hover:bg-background/60 hover:text-foreground"
                        onClick={() =>
                          onAddRecord(isUnassigned ? undefined : lane)
                        }
                      >
                        <PlusIcon data-icon="inline-start" className="size-4" />
                        Add {singular ? singular.toLowerCase() : "item"}
                      </Button>
                    )}
                  </KanbanColumnContent>

                  {/* Column Calculation Footer */}
                  <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <button
                            type="button"
                            className="flex h-6 w-full cursor-pointer items-center justify-between rounded-md px-1.5 text-xs text-muted-foreground transition-colors select-none hover:bg-background/80 hover:text-foreground"
                          />
                        }
                      >
                        <span className="truncate">
                          {activeCalcType !== "none" ? (
                            computeCalculation(
                              laneRecords,
                              activeTargetSlug,
                              activeCalcType,
                              activeTargetAttribute,
                              currencySettings
                            )
                          ) : (
                            <span className="flex items-center gap-1 text-muted-foreground/60">
                              <PlusIcon className="size-3" /> Calculate
                            </span>
                          )}
                        </span>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        side="top"
                        className="w-56"
                      >
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Field to calculate
                          </DropdownMenuLabel>
                          {selectableAttributes.map((attr) => {
                            const isNumeric = isNumericAttribute(attr)
                            return (
                              <DropdownMenuSub key={attr.slug}>
                                <DropdownMenuSubTrigger>
                                  <span className="truncate">{attr.title}</span>
                                </DropdownMenuSubTrigger>
                                <DropdownMenuSubContent className="w-44">
                                  <DropdownMenuLabel className="text-[10px] font-semibold tracking-wider text-muted-foreground uppercase">
                                    {attr.title}
                                  </DropdownMenuLabel>
                                  {isNumeric && (
                                    <>
                                      {NUMERIC_OPTIONS.map((opt) => (
                                        <DropdownMenuItem
                                          key={opt.type}
                                          onClick={() =>
                                            onCalculationsChange?.({
                                              [attr.slug]: opt.type,
                                            })
                                          }
                                        >
                                          <CheckIcon
                                            data-icon="inline-start"
                                            className={cn(
                                              "size-3.5",
                                              activeTargetSlug === attr.slug &&
                                                activeCalcType === opt.type
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                          <span>{opt.label}</span>
                                        </DropdownMenuItem>
                                      ))}
                                      <DropdownMenuSeparator />
                                    </>
                                  )}
                                  {CALCULATION_OPTIONS.map((opt) => (
                                    <DropdownMenuItem
                                      key={opt.type}
                                      onClick={() =>
                                        onCalculationsChange?.({
                                          [attr.slug]: opt.type,
                                        })
                                      }
                                    >
                                      <CheckIcon
                                        data-icon="inline-start"
                                        className={cn(
                                          "size-3.5",
                                          activeTargetSlug === attr.slug &&
                                            activeCalcType === opt.type
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <span>{opt.label}</span>
                                    </DropdownMenuItem>
                                  ))}
                                </DropdownMenuSubContent>
                              </DropdownMenuSub>
                            )
                          })}
                        </DropdownMenuGroup>

                        {activeCalcType !== "none" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onCalculationsChange?.({})}
                            >
                              <span className="text-muted-foreground">
                                None (reset)
                              </span>
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </KanbanColumn>
            )
          })}

          {onAddStage && (
            <div className="flex h-full min-h-80 w-72 min-w-72 shrink-0 flex-col">
              {isAddingStage ? (
                <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-muted/40 p-3 shadow-xs">
                  <p className="text-xs font-semibold text-foreground">
                    New Stage
                  </p>
                  <InputGroup className="h-9 bg-background">
                    <InputGroupAddon
                      align="inline-start"
                      className="pr-0.5 pl-1.5"
                    >
                      <StageColorPicker
                        color={selectedColor}
                        onChange={setSelectedColor}
                        disabled={isSubmittingStage}
                      />
                    </InputGroupAddon>
                    <InputGroupInput
                      placeholder="Stage name (e.g. Follow Up)..."
                      value={newStageTitle}
                      onChange={(e) => setNewStageTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleCreateStage()
                        if (e.key === "Escape") setIsAddingStage(false)
                      }}
                      autoFocus
                      disabled={isSubmittingStage}
                    />
                  </InputGroup>
                  <div className="flex items-center justify-end gap-2 pt-0.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingStage(false)}
                      disabled={isSubmittingStage}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      disabled={!newStageTitle.trim() || isSubmittingStage}
                      onClick={() => void handleCreateStage()}
                    >
                      {isSubmittingStage ? "Adding..." : "Add stage"}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  className="h-10 w-full cursor-pointer justify-start rounded-xl border border-dashed border-border/80 bg-muted/20 text-sm font-medium text-muted-foreground hover:border-border hover:bg-muted/40 hover:text-foreground"
                  onClick={() => {
                    setIsAddingStage(true)
                    setNewStageTitle("")
                    setSelectedColor("blue")
                  }}
                >
                  <PlusIcon data-icon="inline-start" className="size-4" />
                  Add stage
                </Button>
              )}
            </div>
          )}
        </KanbanBoard>

        <KanbanOverlay className="rounded-xl border-2 border-dashed bg-muted/10">
          {({ value, variant }) => {
            if (variant === "column") {
              const lane = String(value)
              const option = options.find(
                (candidate) => candidate.slug === lane
              )
              const isUnassigned = lane === UNASSIGNED
              const isCollapsed = collapsedLanes.has(lane)
              const solidColor = getSelectOptionSolidColor(option?.color)
              const laneRecords = computedColumns[lane] ?? []

              if (isCollapsed) {
                return (
                  <div className="flex h-[min(480px,70vh)] w-[3.25rem] flex-col items-center gap-3 rounded-xl border border-border bg-card/95 p-2 shadow-xl ring-2 ring-primary/20 backdrop-blur-xs">
                    <div
                      className={cn(
                        "size-2.5 shrink-0 rounded-full shadow-xs",
                        isUnassigned &&
                          "border border-dashed border-muted-foreground/80 bg-muted/60"
                      )}
                      style={{
                        backgroundColor: solidColor ?? undefined,
                      }}
                    />
                    <Badge variant="outline" size="sm" className="font-medium">
                      {laneRecords.length}
                    </Badge>
                    <div className="my-2 flex min-h-24 flex-1 items-center justify-center">
                      <span className="rotate-180 text-sm font-semibold tracking-tight whitespace-nowrap text-foreground [writing-mode:vertical-lr]">
                        {option?.title ?? "Unassigned"}
                      </span>
                    </div>
                  </div>
                )
              }

              return (
                <div className="flex h-[min(480px,70vh)] w-72 flex-col rounded-xl border border-border bg-card/95 p-2.5 shadow-xl ring-2 ring-primary/20 backdrop-blur-xs sm:w-80">
                  <header className="flex flex-row items-center gap-1.5 pb-2">
                    <GripVerticalIcon className="size-3.5 text-muted-foreground" />
                    <div
                      className={cn(
                        "size-2.5 shrink-0 rounded-full shadow-xs",
                        isUnassigned &&
                          "border border-dashed border-muted-foreground/80 bg-muted/60"
                      )}
                      style={{
                        backgroundColor: solidColor ?? undefined,
                      }}
                    />
                    <span className="truncate text-sm font-semibold">
                      {option?.title ?? "Unassigned"}
                    </span>
                    <Badge
                      variant="outline"
                      size="sm"
                      className="ml-auto font-medium"
                    >
                      {laneRecords.length}
                    </Badge>
                  </header>
                  <div className="my-2 flex flex-1 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/20 text-xs text-muted-foreground">
                    Moving {option?.title ?? "column"}...
                  </div>
                </div>
              )
            }

            const record = records.find(
              (candidate) => candidate.id === String(value)
            )
            return record ? (
              <RecordCard
                record={record}
                cardFields={cardFields}
                attributes={attributes}
                options={options}
                groupBySlug={groupBy.slug}
                onOpen={onOpen}
                asHandle={false}
              />
            ) : null
          }}
        </KanbanOverlay>
      </Kanban>

      {editingStage && onUpdateStage && (
        <StageEditDialog
          key={editingStage.id}
          stage={editingStage}
          open={!!editingStage}
          onOpenChange={(open) => {
            if (!open) setEditingStage(null)
          }}
          onSave={async (stageId, title, color) => {
            await onUpdateStage(stageId, title, color)
          }}
        />
      )}
    </div>
  )
}
