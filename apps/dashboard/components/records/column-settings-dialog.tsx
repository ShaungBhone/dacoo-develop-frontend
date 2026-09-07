"use client"

import * as React from "react"
import type { Column, ReactTable } from "@tanstack/react-table"
import {
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "@/components/ui/icons"

import {
  getAttributeIcon,
  type RecordColumnMeta,
} from "@/components/records/record-table-columns"
import type { Attribute, RecordItem } from "@/components/records/api"
import { Frame, FramePanel } from "@/components/reui/frame"
import {
  Sortable,
  SortableItem,
  SortableItemHandle,
} from "@/components/reui/sortable"
import {
  getColumnHeaderLabel,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

interface ColumnItem {
  id: string
  label: string
  enabled: boolean
  canHide: boolean
  canRemove: boolean
  icon?: React.ComponentType<{ className?: string }>
  /** Whether the backing attribute is a system field (rename is locked). */
  isSystem: boolean
  sourceColumnId: string
  isDuplicate: boolean
}

interface ColumnSettingsSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  table: ReactTable<DataGridFeatures, RecordItem>
  attributes?: Attribute[]
  /**
   * Opens the shared rename dialog for a column id (attribute slug, or `"title"`
   * for the primary system field). The sheet only triggers this; it does not
   * render the dialog itself, so there is a single source of truth for rename
   * state in the parent.
   */
  onRenameColumn?: (columnId: string) => void
  onRemoveColumnInstance?: (columnId: string) => void
  onResetColumnInstances?: () => void
}

export function ColumnSettingsSheet({
  open,
  onOpenChange,
  table,
  attributes,
  onRenameColumn,
  onRemoveColumnInstance,
  onResetColumnInstances,
}: ColumnSettingsSheetProps) {
  const allColumns = table.getAllLeafColumns()
  const reorderableColumns = React.useMemo(
    () =>
      allColumns.filter(
        (col) =>
          col.id !== "select" &&
          col.id !== "add_column" &&
          col.id !== "add-column" &&
          col.id !== "actions"
      ),
    [allColumns]
  )

  const [columns, setColumns] = React.useState<ColumnItem[]>([])

  React.useEffect(() => {
    if (open) {
      const currentOrder: string[] = table.state?.columnOrder ?? []
      let orderedCols = reorderableColumns

      if (currentOrder.length > 0) {
        const found = currentOrder
          .map((id: string) => reorderableColumns.find((column) => column.id === id))
          .filter((column): column is Column<DataGridFeatures, RecordItem> =>
            Boolean(column)
          )

        if (found.length > 0) {
          orderedCols = [...found]
          reorderableColumns.forEach((column) => {
            if (!orderedCols.some((existing) => existing.id === column.id)) {
              orderedCols.push(column)
            }
          })
        }
      }

      // The sheet needs a snapshot of the external table state when it opens.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setColumns(
        orderedCols.map((col) => {
          const columnMeta = col.columnDef?.meta as RecordColumnMeta | undefined
          const attr =
            attributes?.find((a) => a.slug === columnMeta?.attributeSlug) ??
            attributes?.find((a) => a.slug === col.id) ??
            (columnMeta?.sourceColumnId === "title" || col.id === "title"
              ? attributes?.[0]
              : undefined)

          const IconComponent = getAttributeIcon(
            attr?.type ?? "text",
            attr?.slug ?? col.id,
            attr?.config?.icon
          )

          return {
            id: col.id,
            label:
              attr?.title ??
              col.columnDef?.meta?.headerTitle ??
              getColumnHeaderLabel(col),
            enabled: col.getIsVisible(),
            canHide: col.getCanHide(),
            canRemove: col.getCanHide() || columnMeta?.isDuplicate === true,
            icon: IconComponent,
            isSystem: !!attr?.isSystem,
            sourceColumnId: columnMeta?.sourceColumnId ?? col.id,
            isDuplicate: columnMeta?.isDuplicate === true,
          }
        })
      )
    }
  }, [open, table, reorderableColumns, attributes])

  const handleValueChange = (
    newColumns: ColumnItem[],
    removedColumnIds: string[] = []
  ) => {
    setColumns(newColumns)
    const newOrderIds = newColumns.map((col) => col.id)
    const fullOrder = [
      "select",
      ...newOrderIds,
      ...allColumns
        .map((column) => column.id)
        .filter(
          (id) =>
            id !== "select" &&
            id !== "add_column" &&
            id !== "add-column" &&
            !removedColumnIds.includes(id) &&
            !newOrderIds.includes(id)
        ),
      "add-column",
    ]
    table.setColumnOrder(fullOrder)
  }

  const toggleColumn = (id: string) => {
    const col = table.getColumn(id)
    if (col) {
      const nextEnabled = !col.getIsVisible()
      col.toggleVisibility(nextEnabled)
      setColumns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, enabled: nextEnabled } : c))
      )
    }
  }

  const handleRemoveColumn = (id: string) => {
    const column = columns.find((item) => item.id === id)
    if (!column?.canRemove) return

    const col = table.getColumn(id)
    if (col) {
      col.toggleVisibility(false)
    }
    const updated = columns.filter((c) => c.id !== id)
    if (column?.isDuplicate) {
      onRemoveColumnInstance?.(id)
    }
    handleValueChange(updated, column?.isDuplicate ? [id] : [])
  }

  const handleReset = () => {
    table.setColumnOrder([])
    table.resetColumnVisibility()
    onResetColumnInstances?.()
    const defaultCols: ColumnItem[] = reorderableColumns
      .filter(
        (col) =>
          (col.columnDef?.meta as RecordColumnMeta | undefined)?.isDuplicate !==
          true
      )
      .map((col) => {
        const columnMeta = col.columnDef?.meta as RecordColumnMeta | undefined
        const attr =
          attributes?.find((a) => a.slug === columnMeta?.attributeSlug) ??
          attributes?.find((a) => a.slug === col.id) ??
          (columnMeta?.sourceColumnId === "title" || col.id === "title"
            ? attributes?.[0]
            : undefined)

        const IconComponent = getAttributeIcon(
          attr?.type ?? "text",
          attr?.slug ?? col.id,
          attr?.config?.icon
        )

        return {
          id: col.id,
          label: attr?.title ?? getColumnHeaderLabel(col),
          enabled: true,
          canHide: col.getCanHide(),
          canRemove: col.getCanHide(),
          icon: IconComponent,
          isSystem: !!attr?.isSystem,
          sourceColumnId: columnMeta?.sourceColumnId ?? col.id,
          isDuplicate: false,
        }
      })
    setColumns(defaultCols)
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="inset-y-3! right-3! flex h-[calc(100vh-1.5rem)]! w-[calc(100%-1.5rem)]! flex-col gap-0 overflow-hidden rounded-2xl border border-border p-0 shadow-2xl sm:max-w-lg!"
          onPointerDownOutside={(event) => {
            const target = event.target as HTMLElement | null
            const isOverlay =
              target?.getAttribute?.("data-slot") === "sheet-overlay" ||
              target?.classList?.contains("bg-black/30")
            if (!isOverlay) event.preventDefault()
          }}
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null
            const isOverlay =
              target?.getAttribute?.("data-slot") === "sheet-overlay" ||
              target?.classList?.contains("bg-black/30")
            if (!isOverlay) event.preventDefault()
          }}
        >
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>Column Settings</SheetTitle>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            <Frame spacing="sm" className="border-0 p-0! shadow-none">
              <Sortable
                value={columns}
                onValueChange={handleValueChange}
                getItemValue={(item) => item.id}
                strategy="vertical"
                className="space-y-1.5"
              >
                {columns.map((column) => {
                  const IconComponent = column.icon
                  return (
                    <SortableItem key={column.id} value={column.id}>
                      <FramePanel className="p-0!">
                        <div className="flex items-center gap-3 px-3 py-2.5">
                          <SortableItemHandle className="text-muted-foreground hover:text-foreground">
                            <GripVerticalIcon className="size-4" />
                          </SortableItemHandle>
                          <div className="flex min-w-0 flex-1 items-center gap-2">
                            {IconComponent && (
                              <IconComponent
                                className="size-4 shrink-0 text-muted-foreground/70"
                                aria-hidden="true"
                              />
                            )}
                            <p className="truncate text-sm leading-none font-medium">
                              {column.label}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            {column.canHide && (
                              <Switch
                                checked={column.enabled}
                                onCheckedChange={() => toggleColumn(column.id)}
                                aria-label={`Toggle ${column.label} column`}
                              />
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    className="text-muted-foreground hover:text-foreground"
                                    aria-label={`Options for ${column.label}`}
                                  >
                                    <MoreHorizontalIcon className="size-3.5" />
                                  </Button>
                                }
                              />
                              <DropdownMenuContent align="end" className="w-44">
                                <DropdownMenuItem
                                  disabled={column.isSystem || !onRenameColumn}
                                  onClick={() =>
                                    !column.isSystem &&
                                    onRenameColumn?.(column.sourceColumnId)
                                  }
                                >
                                  <PencilIcon className="mr-2 size-4" />
                                  Edit attribute
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  variant="destructive"
                                  disabled={!column.canRemove}
                                  onClick={() => handleRemoveColumn(column.id)}
                                >
                                  <Trash2Icon className="mr-2 size-4" />
                                  Remove column
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </FramePanel>
                    </SortableItem>
                  )
                })}
              </Sortable>
            </Frame>
          </div>

          <SheetFooter className="flex flex-row items-center justify-between gap-2 border-t bg-muted/40 px-4 py-3 sm:justify-between sm:px-6">
            <Button
              type="button"
              variant="ghost"
              size="default"
              onClick={handleReset}
              className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcwIcon className="size-3.5" />
              Reset to default
            </Button>
            <Button
              type="button"
              variant="default"
              size="default"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

export const ColumnSettingsDialog = ColumnSettingsSheet
