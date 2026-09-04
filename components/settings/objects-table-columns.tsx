"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import {
  BoxIcon,
  LockIcon,
  MoreHorizontalIcon,
  SettingsIcon,
  Trash2Icon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import type {
  Attribute,
  AttributeType,
  RecordObject,
} from "@/components/records/api"
import { DataTableColumnHeader } from "@/components/data-table-column-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const headerClassName =
  "px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground"
const cellClassName = "px-3 py-3 align-middle"

const TYPE_LABELS: Record<AttributeType, string> = {
  "actor-reference": "User",
  checkbox: "Checkbox",
  currency: "Currency",
  date: "Date",
  domain: "Domain",
  "email-address": "Email",
  interaction: "Interaction",
  image: "Image",
  location: "Location",
  number: "Number",
  "personal-name": "Text",
  "phone-number": "Phone",
  rating: "Rating",
  "record-reference": "Relationship",
  select: "Select",
  status: "Status",
  tags: "Tags",
  text: "Text",
  timestamp: "Timestamp",
}

export function buildObjectColumns({
  onOpen,
  onActivate,
  onDeactivate,
  canManageActivation,
}: {
  onOpen: (object: RecordObject) => void
  onActivate: (object: RecordObject) => void
  onDeactivate: (object: RecordObject) => void
  canManageActivation: boolean
}): ColumnDef<DataGridFeatures, RecordObject>[] {
  return [
    {
      accessorKey: "pluralNoun",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Object" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium text-foreground">
          <BoxIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span>{row.original.pluralNoun}</span>
        </div>
      ),
      meta: {
        headerTitle: "Object",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[280px]"),
      },
    },
    {
      accessorKey: "isSystem",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.isSystem ? "secondary" : "outline"}>
          {row.original.isSystem ? "Standard" : "Custom"}
        </Badge>
      ),
      meta: {
        headerTitle: "Type",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[140px]"),
      },
    },
    {
      accessorKey: "isActive",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const object = row.original
        const isAlwaysActive = object.isSystem && !object.isDeactivatable

        return (
          <Badge
            variant={object.isActive ? "secondary" : "outline"}
            className={cn(!object.isActive && "text-muted-foreground")}
          >
            {isAlwaysActive
              ? "Always active"
              : object.isActive
                ? "Active"
                : "Inactive"}
          </Badge>
        )
      },
      meta: {
        headerTitle: "Status",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[140px]"),
      },
    },
    {
      accessorKey: "recordsCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Records" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.original.recordsCount > 0
            ? row.original.recordsCount
            : "No records"}
        </span>
      ),
      meta: {
        headerTitle: "Records",
        headerClassName,
        cellClassName,
      },
    },
    {
      accessorKey: "attributesCount",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Attributes" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground tabular-nums">
          {row.original.attributesCount}
        </span>
      ),
      meta: {
        headerTitle: "Attributes",
        headerClassName,
        cellClassName,
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        if (!row.original.isActive && !canManageActivation) return null

        return (
          <div
            className="flex justify-end"
            onClick={(e) => e.stopPropagation()}
          >
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${row.original.pluralNoun}`}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                {row.original.isActive && (
                  <DropdownMenuItem onSelect={() => onOpen(row.original)}>
                    <SettingsIcon aria-hidden="true" />
                    Manage object
                  </DropdownMenuItem>
                )}
                {!row.original.isActive && canManageActivation && (
                  <DropdownMenuItem onSelect={() => onActivate(row.original)}>
                    Activate
                  </DropdownMenuItem>
                )}
                {row.original.isActive &&
                  row.original.isDeactivatable &&
                  canManageActivation && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onSelect={() => onDeactivate(row.original)}
                    >
                      Deactivate
                    </DropdownMenuItem>
                  )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )
      },
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

export function buildAttributeColumns({
  onDelete,
}: {
  onDelete: (attribute: Attribute) => void
}): ColumnDef<DataGridFeatures, Attribute>[] {
  return [
    {
      accessorKey: "title",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => (
        <div className="flex items-center gap-2 font-medium text-foreground">
          <span>{row.original.title}</span>
          {row.original.isMultiselect && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-normal text-muted-foreground">
              multi
            </span>
          )}
        </div>
      ),
      meta: {
        headerTitle: "Name",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[280px]"),
      },
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Type" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {TYPE_LABELS[row.original.type] ?? row.original.type}
        </span>
      ),
      meta: {
        headerTitle: "Type",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[160px]"),
      },
    },
    {
      accessorKey: "isRequired",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Constraints" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.original.isRequired ? "Required" : "—"}
        </span>
      ),
      meta: {
        headerTitle: "Constraints",
        headerClassName,
        cellClassName,
      },
    },
    {
      accessorKey: "isSystem",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Properties" />
      ),
      cell: ({ row }) =>
        row.original.isSystem ? (
          <Badge variant="secondary" className="gap-1">
            <LockIcon className="size-3" aria-hidden="true" />
            System
          </Badge>
        ) : null,
      meta: {
        headerTitle: "Properties",
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
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          {!row.original.isSystem && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Actions for ${row.original.title}`}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => onDelete(row.original)}
                >
                  <Trash2Icon aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
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
