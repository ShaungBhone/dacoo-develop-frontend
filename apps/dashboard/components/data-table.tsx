"use client"

import * as React from "react"
import {
  flexRender,
  useTable,
  type ColumnDef,
  type ColumnVisibilityState,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table as TableInstance,
} from "@tanstack/react-table"
import { Columns3Icon, SearchIcon } from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"

interface DataTableProps<TData extends RowData, TValue> {
  columns: ColumnDef<DataGridFeatures, TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  searchableColumnIds?: string[]
  initialPageSize?: number
  emptyMessage?: React.ReactNode
  className?: string
  tableClassName?: string
  headerClassName?: string
  rowClassName?: string
  showToolbar?: boolean
  showFooter?: boolean
  columnsLabel?: string
  /** Applied to the scroll container wrapping the table. */
  containerClassName?: string
  toolbarClassName?: string
  footerClassName?: string
  /** Extra controls rendered on the trailing edge of the toolbar. */
  toolbarActions?: React.ReactNode
  /** Replaces the whole toolbar — used to swap in a bulk-selection bar. */
  toolbarOverride?: React.ReactNode
  /** Stable row id, so selection survives sorting, paging and filtering. */
  getRowId?: (row: TData, index: number) => string
  onRowClick?: (row: TData) => void
  renderTableFooter?: (
    table: TableInstance<DataGridFeatures, TData>
  ) => React.ReactNode
  rowSelection?: RowSelectionState
  onRowSelectionChange?: OnChangeFn<RowSelectionState>
}

export function DataTable<TData extends RowData, TValue>({
  columns,
  data,
  searchPlaceholder = "Search…",
  searchableColumnIds,
  initialPageSize = 10,
  emptyMessage = "No matching results.",
  className,
  tableClassName,
  headerClassName,
  rowClassName,
  showToolbar = true,
  showFooter = true,
  columnsLabel = "Columns",
  containerClassName,
  toolbarClassName,
  footerClassName,
  toolbarActions,
  toolbarOverride,
  getRowId,
  onRowClick,
  renderTableFooter,
  rowSelection,
  onRowSelectionChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<ColumnVisibilityState>({})
  const [globalFilter, setGlobalFilter] = React.useState("")

  const table = useTable<DataGridFeatures, TData>({
    features: dataGridFeatures,
    data,
    columns: columns as ColumnDef<DataGridFeatures, TData, unknown>[],
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      globalFilter,
      ...(rowSelection ? { rowSelection } : {}),
    },
    getRowId,
    onRowSelectionChange,
    initialState: {
      pagination: { pageIndex: 0, pageSize: initialPageSize },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLocaleLowerCase()
      if (!query) return true

      const searchableCells = row
        .getAllCells()
        .filter((cell) =>
          searchableColumnIds
            ? searchableColumnIds.includes(cell.column.id)
            : cell.column.id !== "actions"
        )

      return searchableCells.some((cell) => {
        const value = cell.getValue()
        return String(value ?? "")
          .toLocaleLowerCase()
          .includes(query)
      })
    },
  })

  const tableState = table.state as typeof table.state & {
    pagination: PaginationState
  }
  const hideableColumns = table
    .getAllColumns()
    .filter((column) => column.getCanHide())
  const filteredRowCount = table.getFilteredRowModel().rows.length
  const firstVisibleRow =
    filteredRowCount === 0
      ? 0
      : tableState.pagination.pageIndex * tableState.pagination.pageSize + 1
  const lastVisibleRow = Math.min(
    firstVisibleRow + table.getRowModel().rows.length - 1,
    filteredRowCount
  )

  return (
    <div className={cn("flex min-w-0 flex-col gap-3", className)}>
      {showToolbar && (
        <div
          className={cn(
            "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
            toolbarClassName
          )}
        >
          {toolbarOverride ?? (
            <>
              <div className="relative w-full sm:max-w-xs">
                <SearchIcon
                  className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  value={globalFilter}
                  onChange={(event) => setGlobalFilter(event.target.value)}
                  placeholder={searchPlaceholder}
                  aria-label={searchPlaceholder}
                  className="pl-8"
                />
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {hideableColumns.length > 0 && (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button type="button" variant="outline" />}
                    >
                      <Columns3Icon aria-hidden="true" />
                      {columnsLabel}
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-44">
                      <DropdownMenuLabel>Visible columns</DropdownMenuLabel>
                      {hideableColumns.map((column) => (
                        <DropdownMenuCheckboxItem
                          key={column.id}
                          checked={column.getIsVisible()}
                          onCheckedChange={(value) =>
                            column.toggleVisibility(value)
                          }
                        >
                          {column.columnDef.meta?.headerTitle ?? column.id}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {toolbarActions}
              </div>
            </>
          )}
        </div>
      )}

      <Table
        className={tableClassName}
        containerClassName={cn("relative", containerClassName)}
      >
        <TableHeader
          className={cn(
            // Make the header opaque at the component boundary. Applying the
            // background to each cell prevents body rows from showing through
            // while a header is sticky (including under pinned columns).
            "sticky top-0 z-20 bg-muted [&_tr]:bg-muted",
            headerClassName
          )}
        >
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "sticky top-0 z-20 bg-muted",
                    header.column.columnDef.meta?.headerClassName
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length > 0 ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                className={cn(rowClassName, onRowClick && "cursor-pointer")}
                onClick={
                  onRowClick ? () => onRowClick(row.original) : undefined
                }
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cell.column.columnDef.meta?.cellClassName}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow className="hover:bg-transparent">
              <TableCell
                colSpan={table.getVisibleLeafColumns().length}
                className="h-24 text-center text-sm text-muted-foreground"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
        {renderTableFooter && (
          <TableFooter className="border-t border-border bg-background font-normal">
            {renderTableFooter(table)}
          </TableFooter>
        )}
      </Table>

      {showFooter && (
        <div
          className={cn(
            "flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between",
            footerClassName
          )}
        >
          <span aria-live="polite">
            Showing {firstVisibleRow}–{lastVisibleRow} of {filteredRowCount}
          </span>
          <div className="flex items-center justify-between gap-2 sm:justify-end">
            <Select
              value={String(tableState.pagination.pageSize)}
              onValueChange={(value) => table.setPageSize(Number(value))}
            >
              <SelectTrigger size="sm" aria-label="Rows per page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {[10, 20, 50].map((pageSize) => (
                  <SelectItem key={pageSize} value={String(pageSize)}>
                    {pageSize} rows
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
