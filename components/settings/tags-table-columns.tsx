"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import {
  MoreHorizontalIcon,
  PencilIcon,
  TagIcon,
  Trash2Icon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import type { TagRecord } from "@/components/settings/tags-api"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { getTagColor } from "@/lib/tag-colors"

const headerClassName =
  "px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground"
const cellClassName = "px-3 py-3 align-middle"
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: "medium" })

function formatDate(value: string | null): string {
  if (!value) return "—"

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "—" : dateFormat.format(date)
}

export function buildTagColumns({
  onRename,
  onDelete,
}: {
  onRename: (tag: TagRecord) => void
  onDelete: (tag: TagRecord) => void
}): ColumnDef<DataGridFeatures, TagRecord>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const color = getTagColor(row.original.name, row.original.color)
        return (
          <span
            className={cn(
              "inline-flex max-w-full items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              color.bg,
              color.text,
              color.border
            )}
          >
            <TagIcon className="size-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">{row.original.name}</span>
          </span>
        )
      },
      meta: {
        headerTitle: "Name",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[280px]"),
      },
    },
    {
      id: "creator",
      accessorFn: (tag) => tag.creator?.name ?? "",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created by" />
      ),
      cell: ({ row }) => (
        <span className="block truncate text-sm text-muted-foreground">
          {row.original.creator?.name ?? "Unknown"}
        </span>
      ),
      meta: {
        headerTitle: "Created by",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[220px]"),
      },
    },
    {
      accessorKey: "created_at",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created" />
      ),
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
      meta: {
        headerTitle: "Created",
        headerClassName,
        cellClassName,
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Actions for ${row.original.name}`}
                />
              }
            >
              <MoreHorizontalIcon aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-36">
              <DropdownMenuItem onSelect={() => onRename(row.original)}>
                <PencilIcon aria-hidden="true" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => onDelete(row.original)}
              >
                <Trash2Icon aria-hidden="true" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
      meta: {
        headerTitle: "Actions",
        headerClassName: cn(
          headerClassName,
          "sticky right-0 z-20 w-14 min-w-14 bg-inherit pr-4 text-right"
        ),
        cellClassName: cn(
          cellClassName,
          "sticky right-0 z-10 w-14 min-w-14 bg-inherit pr-4 text-right"
        ),
      },
    },
  ]
}
