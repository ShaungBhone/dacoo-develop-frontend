"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import { MoreHorizontalIcon, ShieldCheckIcon, Trash2Icon } from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import {
  roleLabel,
  type MemberRow,
  type OrgListRow,
  type RoleOption,
} from "@/components/organization/data"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DataTableColumnHeader } from "@/components/data-table-column-header"

function initials(nameOrEmail: string): string {
  const source = nameOrEmail.trim()
  if (!source) return "?"
  const parts = source.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return source.slice(0, 2).toUpperCase()
}

const headerClassName =
  "px-3 py-1 text-xs font-medium tracking-wide text-muted-foreground"
const cellClassName = "px-3 py-3 align-middle"

interface ColumnOptions {
  roles: RoleOption[]
  currentUserId: number
  canManage: boolean
  onRoleChange: (member: MemberRow, role: string) => void
  onRemove: (row: OrgListRow) => void
}

export function buildTeammateColumns({
  roles,
  currentUserId,
  canManage,
  onRoleChange,
  onRemove,
}: ColumnOptions): ColumnDef<DataGridFeatures, OrgListRow>[] {
  return [
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const item = row.original
        const isMember = item.kind === "member"
        const isSelf = isMember && item.id === currentUserId
        const isPending = item.kind === "invitation"
        return (
          <div className="flex min-w-0 items-center gap-3">
            <Avatar className="size-8 shrink-0">
              <AvatarFallback className="text-xs font-medium">
                {initials(item.name || item.email)}
              </AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {item.name || item.email}
                </span>
                {isSelf && (
                  <Badge variant="secondary" className="text-xs shadow-none">
                    You
                  </Badge>
                )}
                {isPending && (
                  <Badge variant="outline" className="text-xs shadow-none">
                    Pending
                  </Badge>
                )}
              </div>
              <span className="truncate text-xs text-muted-foreground">
                {item.email || "—"}
              </span>
            </div>
          </div>
        )
      },
      meta: {
        headerTitle: "Name",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[220px]"),
      },
    },
    {
      accessorKey: "email",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Email" />
      ),
      cell: ({ row }) => (
        <span className="block truncate text-sm text-foreground">
          {row.original.email || "—"}
        </span>
      ),
      meta: {
        headerTitle: "Email",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[200px]"),
      },
    },
    {
      id: "status",
      accessorFn: (row) => (row.kind === "invitation" ? "Pending" : "Active"),
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Status" />
      ),
      cell: ({ row }) => {
        const isPending = row.original.kind === "invitation"
        return (
          <Badge
            variant={isPending ? "outline" : "secondary"}
            className="text-xs shadow-none"
          >
            {isPending ? "Pending" : "Active"}
          </Badge>
        )
      },
      meta: {
        headerTitle: "Status",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[120px]"),
      },
    },
    {
      id: "role",
      accessorFn: (row) => row.role ?? "",
      enableSorting: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Role" />
      ),
      cell: ({ row }) => {
        const item = row.original
        const isMember = item.kind === "member"
        const isOwnerRow = isMember && item.isOwner

        if (canManage && isMember && !isOwnerRow && roles.length > 0) {
          return (
            <Select
              value={item.role ?? ""}
              onValueChange={(value) => onRoleChange(item, value)}
            >
              <SelectTrigger className="h-8 w-28 text-xs">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((option) => (
                  <SelectItem key={option.name} value={option.name}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        }

        return (
          <Badge
            variant={isOwnerRow ? "default" : "secondary"}
            className="gap-1 text-xs shadow-none"
          >
            {isOwnerRow && (
              <ShieldCheckIcon className="size-3" aria-hidden="true" />
            )}
            {isOwnerRow ? "Owner" : roleLabel(item.role, roles)}
          </Badge>
        )
      },
      meta: {
        headerTitle: "Role",
        headerClassName,
        cellClassName: cn(cellClassName, "max-w-[140px]"),
      },
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => {
        const item = row.original
        const isMember = item.kind === "member"
        const isSelf = isMember && item.id === currentUserId
        const isOwnerRow = isMember && item.isOwner
        const isPending = item.kind === "invitation"
        const canRemove = canManage && !isOwnerRow && !isSelf

        return (
          <div className="flex items-center justify-end gap-0.5">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={!canRemove}
                    aria-label={`More actions for ${item.name || item.email}`}
                  />
                }
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </DropdownMenuTrigger>
              {canRemove ? (
                <DropdownMenuContent align="end" className="min-w-40">
                  <DropdownMenuItem
                    variant="destructive"
                    onSelect={() => onRemove(item)}
                  >
                    <Trash2Icon aria-hidden="true" />
                    {isPending ? "Revoke invite" : "Remove member"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              ) : null}
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
