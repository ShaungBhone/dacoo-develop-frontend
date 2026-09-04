"use client"

import type { Column, RowData } from "@tanstack/react-table"
import {
  ChevronDownIcon,
  ChevronsUpDownIcon,
  ChevronUpIcon,
} from "@/components/ui/icons"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"

interface DataTableColumnHeaderProps<TData extends RowData, TValue> {
  column: Column<DataGridFeatures, TData, TValue>
  title: string
  className?: string
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <span className={className}>{title}</span>
  }

  const direction = column.getIsSorted()

  return (
    <Button
      type="button"
      variant="ghost"
      size="xs"
      className={cn("-mx-2 h-6 py-0.5", className)}
      onClick={column.getToggleSortingHandler()}
      aria-label={`Sort by ${title}`}
    >
      {title}
      {direction === "asc" ? (
        <ChevronUpIcon aria-hidden="true" />
      ) : direction === "desc" ? (
        <ChevronDownIcon aria-hidden="true" />
      ) : (
        <ChevronsUpDownIcon aria-hidden="true" />
      )}
    </Button>
  )
}
