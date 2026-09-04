"use client"

import { memo, useMemo } from "react"
import type { HTMLAttributes, ReactNode } from "react"
import {
  getColumnHeaderLabel,
  useDataGrid,
} from "@/components/reui/data-grid/data-grid"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { Subscribe } from "@tanstack/react-table"
import type { Column } from "@tanstack/react-table"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
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
import { ArrowDownIcon, ArrowUpIcon, ChevronsUpDownIcon, CheckIcon, ArrowLeftToLineIcon, ArrowRightToLineIcon, ArrowLeftIcon, ArrowRightIcon, Settings2Icon, PinOffIcon, PencilIcon } from "@/components/ui/icons"

interface DataGridColumnHeaderProps<
  TData extends object,
  TValue,
> extends HTMLAttributes<HTMLDivElement> {
  column: Column<DataGridFeatures, TData, TValue>
  /** When omitted, uses `column.columnDef.meta.headerTitle`, then a string `columnDef.header`, then `column.id`. */
  title?: string
  icon?: ReactNode
  /** Reserved; pin controls are gated by tableLayout.columnsPinnable + column.getCanPin(). */
  pinnable?: boolean
  filter?: ReactNode
  visibility?: boolean
  /** Whether to show the sorting indicator icon in the column header. Defaults to true. */
  showSortIcon?: boolean
  /**
   * Opens a rename affordance for this column. When omitted (e.g. for system
   * fields or grids without rename support), the "Rename" menu item is hidden
   * rather than disabled, keeping the menu focused on actions that exist.
   */
  onRename?: () => void
}

function DataGridColumnHeaderInner<TData extends object, TValue>({
  column,
  title,
  icon,
  className,
  filter,
  visibility = false,
  showSortIcon = true,
  onRename,
}: DataGridColumnHeaderProps<TData, TValue>) {
  const { isLoading, table, props } = useDataGrid()
  const resolvedTitle = title ?? getColumnHeaderLabel(column)

  // TanStack's columnOrder defaults to [] until a consumer seeds it; fall
  // back to the definition order so Move Left/Right work out of the box.
  const columnOrderState = table.state.columnOrder
  const columnOrder =
    columnOrderState.length > 0
      ? columnOrderState
      : table.getAllLeafColumns().map((leafColumn) => leafColumn.id)
  const columnVisibilityKey =
    props.tableLayout?.columnsVisibility && visibility
      ? JSON.stringify(table.state.columnVisibility)
      : ""
  const isSorted = column.getIsSorted()
  const isPinned = column.getIsPinned()
  const canSort = column.getCanSort()
  const canPin = column.getCanPin()
  const canResize = column.getCanResize()

  const columnIndex = columnOrder.indexOf(column.id)
  const canMoveLeft = columnIndex > 0
  const canMoveRight = columnIndex < columnOrder.length - 1

  const handleSort = () => {
    if (isSorted === "asc") {
      column.toggleSorting(true)
    } else if (isSorted === "desc") {
      column.clearSorting()
    } else {
      column.toggleSorting(false)
    }
  }

  const headerLabelClassName = cn(
    "text-muted-foreground inline-flex h-full w-full items-center gap-2 font-semibold text-sm leading-none",
    className
  )

  const headerButtonClassName = cn(
    "flex h-full w-full items-center justify-start gap-2 px-3 font-semibold text-sm rounded-none border-none outline-none select-none text-foreground/90 hover:text-foreground data-[state=open]:text-foreground hover:bg-muted/40 data-[state=open]:bg-muted/50 transition-colors cursor-pointer",
    className
  )

  const sortIcon =
    showSortIcon &&
    canSort &&
    (isSorted === "desc" ? (
      <ArrowDownIcon className="size-3.25" aria-hidden="true" />
    ) : isSorted === "asc" ? (
      <ArrowUpIcon className="size-3.25" aria-hidden="true" />
    ) : (
      <ChevronsUpDownIcon className="mt-px size-3.25" aria-hidden="true" />
    ))

  const hasControls =
    props.tableLayout?.columnsMovable ||
    (props.tableLayout?.columnsVisibility && visibility) ||
    (props.tableLayout?.columnsPinnable && canPin) ||
    filter ||
    onRename

  const menuItems = useMemo(() => {
    const items: ReactNode[] = []
    let hasPreviousSection = false

    // Edit Attribute section — placed first since it's the primary per-column action.
    if (onRename) {
      items.push(
        <DropdownMenuItem key="rename" onClick={onRename}>
          <PencilIcon className="size-3.5!" aria-hidden="true" />
          <span className="grow">Edit attribute</span>
        </DropdownMenuItem>
      )
      hasPreviousSection = true
    }

    // Filter section
    if (filter) {
      items.push(
        <DropdownMenuGroup key="group-filter">
          <DropdownMenuLabel key="filter">{filter}</DropdownMenuLabel>
        </DropdownMenuGroup>
      )
      hasPreviousSection = true
    }

    // Sort section
    if (canSort) {
      if (hasPreviousSection) {
        items.push(<DropdownMenuSeparator key="sep-sort" />)
      }
      items.push(
        <DropdownMenuItem
          key="sort-asc"
          onClick={() => {
            if (isSorted === "asc") {
              column.clearSorting()
            } else {
              column.toggleSorting(false)
            }
          }}
          disabled={!canSort}
        >
          <ArrowUpIcon className="size-3.5!" />
          <span className="grow">Asc</span>
          {isSorted === "asc" && (
            <CheckIcon className="text-primary size-4 opacity-100!" />
          )}
        </DropdownMenuItem>,
        <DropdownMenuItem
          key="sort-desc"
          onClick={() => {
            if (isSorted === "desc") {
              column.clearSorting()
            } else {
              column.toggleSorting(true)
            }
          }}
          disabled={!canSort}
        >
          <ArrowDownIcon className="size-3.5!" />
          <span className="grow">Desc</span>
          {isSorted === "desc" && (
            <CheckIcon className="text-primary size-4 opacity-100!" />
          )}
        </DropdownMenuItem>
      )
      hasPreviousSection = true
    }

    // Pin section
    if (props.tableLayout?.columnsPinnable && canPin) {
      if (hasPreviousSection) {
        items.push(<DropdownMenuSeparator key="sep-pin" />)
      }
      items.push(
        <DropdownMenuItem
          key="pin-left"
          onClick={() => column.pin(isPinned === "start" ? false : "start")}
        >
          <ArrowLeftToLineIcon className="size-3.5!" aria-hidden="true" />
          <span className="grow">Pin to left</span>
          {isPinned === "start" && (
            <CheckIcon className="text-primary size-4 opacity-100!" />
          )}
        </DropdownMenuItem>,
        <DropdownMenuItem
          key="pin-right"
          onClick={() => column.pin(isPinned === "end" ? false : "end")}
        >
          <ArrowRightToLineIcon className="size-3.5!" aria-hidden="true" />
          <span className="grow">Pin to right</span>
          {isPinned === "end" && (
            <CheckIcon className="text-primary size-4 opacity-100!" />
          )}
        </DropdownMenuItem>
      )
      hasPreviousSection = true
    }

    // Move section
    if (props.tableLayout?.columnsMovable) {
      if (hasPreviousSection) {
        items.push(<DropdownMenuSeparator key="sep-move" />)
      }
      items.push(
        <DropdownMenuItem
          key="move-left"
          onClick={() => {
            if (columnIndex > 0) {
              const newOrder = [...columnOrder]
              const [movedColumn] = newOrder.splice(columnIndex, 1)
              newOrder.splice(columnIndex - 1, 0, movedColumn)
              table.setColumnOrder(newOrder)
            }
          }}
          disabled={!canMoveLeft || isPinned !== false}
        >
          <ArrowLeftIcon className="size-3.5!" aria-hidden="true" />
          <span>Move to Left</span>
        </DropdownMenuItem>,
        <DropdownMenuItem
          key="move-right"
          onClick={() => {
            if (columnIndex < columnOrder.length - 1) {
              const newOrder = [...columnOrder]
              const [movedColumn] = newOrder.splice(columnIndex, 1)
              newOrder.splice(columnIndex + 1, 0, movedColumn)
              table.setColumnOrder(newOrder)
            }
          }}
          disabled={!canMoveRight || isPinned !== false}
        >
          <ArrowRightIcon className="size-3.5!" aria-hidden="true" />
          <span>Move to Right</span>
        </DropdownMenuItem>
      )
      hasPreviousSection = true
    }

    // Visibility section
    if (props.tableLayout?.columnsVisibility && visibility) {
      if (hasPreviousSection) {
        items.push(<DropdownMenuSeparator key="sep-visibility" />)
      }
      items.push(
        <DropdownMenuSub key="visibility">
          <DropdownMenuSubTrigger>
            <Settings2Icon className="size-3.5!" />
            <span>Columns</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent side="right">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  checked={col.getIsVisible()}
                  onSelect={(event) => event.preventDefault()}
                  onCheckedChange={(value) => col.toggleVisibility(!!value)}
                  className="capitalize"
                >
                  {getColumnHeaderLabel(col)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
      )
    }

    return items
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    filter,
    canSort,
    isSorted,
    column,
    props.tableLayout?.columnsPinnable,
    props.tableLayout?.columnsMovable,
    props.tableLayout?.columnsVisibility,
    canPin,
    isPinned,
    canMoveLeft,
    canMoveRight,
    visibility,
    onRename,
    table,
    columnIndex,
    columnOrder,
    columnVisibilityKey, // Needed to update checkbox states when visibility changes
  ])

  if (hasControls) {
    return (
      <div className="flex h-full w-full items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="h-full w-full flex-1"
            render={
              <button
                type="button"
                className={headerButtonClassName}
                disabled={isLoading}
              >
                {icon && icon}
                <span className="truncate font-semibold">{resolvedTitle}</span>
                {sortIcon}
              </button>
            }
          />
          <DropdownMenuContent className="w-40" align="start">
            {menuItems}
          </DropdownMenuContent>
        </DropdownMenu>
        {props.tableLayout?.columnsPinnable && canPin && isPinned && (
          <button
            type="button"
            className="relative z-20 me-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
            onClick={() => column.pin(false)}
            aria-label={`Unpin ${resolvedTitle} column`}
            title={`Unpin ${resolvedTitle} column`}
          >
            <PinOffIcon className="size-3.5! opacity-50!" aria-hidden="true" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center">
      <button
        type="button"
        className={headerButtonClassName}
        disabled={isLoading}
        onClick={canSort ? handleSort : undefined}
      >
        {icon && icon}
        <span className="truncate font-semibold">{resolvedTitle}</span>
        {sortIcon}
      </button>
    </div>
  )
}

const DataGridColumnHeaderMemo = memo(DataGridColumnHeaderInner) as <
  TData extends object,
  TValue,
>(
  props: DataGridColumnHeaderProps<TData, TValue> & {
    /** Internal: the state slices the header re-renders on. Not part of the public API. */
    subscribedState?: unknown
  }
) => ReactNode

/**
 * Sort and pin state reaches this header through builder calls on `column`
 * (`getIsSorted()`, `getIsPinned()`), and `column` is a stable reference. That
 * combination is the one v9's fresh-table-per-state-change does NOT cover:
 * React Compiler is free to memoize against the stable column and never
 * re-evaluate those reads, which shows up as frozen sort arrows and pin
 * controls. The `Subscribe` below turns the slices this header actually reads
 * into a real reactive dependency, and threading the selection through as a
 * prop is what lets it past the `memo` - which would otherwise see unchanged
 * props and skip the render anyway.
 */
function DataGridColumnHeader<TData extends object, TValue>(
  props: DataGridColumnHeaderProps<TData, TValue>
) {
  const { table } = useDataGrid()

  return (
    <Subscribe
      source={table.store}
      selector={(state) => ({
        sorting: state.sorting,
        columnPinning: state.columnPinning,
        columnOrder: state.columnOrder,
        columnVisibility: state.columnVisibility,
      })}
    >
      {(subscribed) => (
        <DataGridColumnHeaderMemo {...props} subscribedState={subscribed} />
      )}
    </Subscribe>
  )
}

export { DataGridColumnHeader, type DataGridColumnHeaderProps }
