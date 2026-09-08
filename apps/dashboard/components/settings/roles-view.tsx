"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  type PermissionModule,
  type RoleDetail,
} from "@/components/organization/data"
import {
  createRole,
  deleteRole,
  fetchPermissionCatalog,
  fetchRolesWithMeta,
  updateRole,
} from "@/components/organization/api"
import { RoleDialog } from "@/components/settings/role-dialog"
import { PermissionsSubTable } from "@/components/settings/permissions-sub-table"
import { useOrganization } from "@/contexts/organization-context"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react"
import {
  Edit3Icon,
  LockIcon,
  PlusIcon,
  SearchIcon,
  SparklesIcon,
  Trash2Icon,
  TriangleAlertIcon,
  UsersIcon,
  XIcon,
} from "@/components/ui/icons"
import {
  DataGrid,
  DataGridContainer,
  dataGridFeatures,
  type DataGridFeatures,
} from "@/components/reui/data-grid/data-grid"
import { DataGridColumnHeader } from "@/components/reui/data-grid/data-grid-column-header"
import { DataGridPagination } from "@/components/reui/data-grid/data-grid-pagination"
import { DataGridScrollArea } from "@/components/reui/data-grid/data-grid-scroll-area"
import { DataGridTable } from "@/components/reui/data-grid/data-grid-table"
import {
  ColumnDef,
  ExpandedState,
  PaginationState,
  SortingState,
  useTable,
} from "@tanstack/react-table"

export function RolesView() {
  const router = useRouter()
  const { activeOrganizationId, isOwner, can, canManageCustomRoles } = useOrganization()

  const [roles, setRoles] = React.useState<RoleDetail[]>([])
  const [catalog, setCatalog] = React.useState<PermissionModule[]>([])
  const [loading, setLoading] = React.useState(true)
  const [metaPlanAllowed, setMetaPlanAllowed] = React.useState<boolean | null>(null)
  const isPlanAllowed = metaPlanAllowed ?? canManageCustomRoles
  const [roleDialogOpen, setRoleDialogOpen] = React.useState(false)
  const [editingRole, setEditingRole] = React.useState<RoleDetail | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false)
  const [roleToDelete, setRoleToDelete] = React.useState<RoleDetail | null>(null)
  const [deleting, setDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Data grid state
  const [search, setSearch] = React.useState("")
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [expanded, setExpanded] = React.useState<ExpandedState>({})

  const canCreateRole = isOwner || can("create:role")
  const canUpdateRole = isOwner || can("update:role")
  const canDeleteRole = isOwner || can("delete:role")

  const loadData = React.useCallback(async () => {
    if (!activeOrganizationId) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [rolesRes, catalogData] = await Promise.all([
        fetchRolesWithMeta(activeOrganizationId),
        fetchPermissionCatalog(activeOrganizationId),
      ])
      setRoles(rolesRes.roles)
      setMetaPlanAllowed(rolesRes.canManageCustomRoles)
      setCatalog(catalogData)
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load roles and permissions."
      )
    } finally {
      setLoading(false)
    }
  }, [activeOrganizationId])

  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  const handleOpenCreate = () => {
    setEditingRole(null)
    setRoleDialogOpen(true)
  }

  const handleOpenEdit = (role: RoleDetail) => {
    setEditingRole(role)
    setRoleDialogOpen(true)
  }

  const handleSaveRole = async (data: {
    name: string
    description?: string
  }) => {
    if (!activeOrganizationId) {
      return
    }

    if (editingRole) {
      const updated = await updateRole(
        activeOrganizationId,
        editingRole.id,
        data
      )
      setRoles((prev) =>
        prev.map((r) => (r.id === updated.id ? updated : r))
      )
    } else {
      const created = await createRole(activeOrganizationId, {
        ...data,
        permissions: [],
      })
      setRoles((prev) => [...prev, created])
      const rowKey = created.id || created.name
      if (rowKey) {
        setExpanded((prev) => ({
          ...(typeof prev === "object" && prev !== null ? prev : {}),
          [rowKey]: true,
        }))
      }
    }
  }

  const handleOpenDelete = (role: RoleDetail) => {
    setRoleToDelete(role)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!activeOrganizationId || !roleToDelete) {
      return
    }

    setDeleting(true)
    try {
      await deleteRole(activeOrganizationId, roleToDelete.id)
      setRoles((prev) => prev.filter((r) => r.id !== roleToDelete.id))
      setDeleteDialogOpen(false)
      setRoleToDelete(null)
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to delete custom role."
      )
    } finally {
      setDeleting(false)
    }
  }

  const handleUpdateRolePermissions = React.useCallback(
    async (roleId: string, permissions: string[]) => {
      if (!activeOrganizationId) return

      // Optimistic update
      setRoles((prev) =>
        prev.map((r) =>
          r.id === roleId ? { ...r, permission_keys: permissions } : r
        )
      )

      try {
        const updated = await updateRole(activeOrganizationId, roleId, {
          permissions,
        })
        setRoles((prev) =>
          prev.map((r) => (r.id === updated.id ? updated : r))
        )
      } catch (err: unknown) {
        await loadData()
        throw err
      }
    },
    [activeOrganizationId, loadData]
  )

  const handleSearchChange = (val: string) => {
    setSearch(val)
    setPagination((prev) => ({ ...prev, pageIndex: 0 }))
  }

  const columns = React.useMemo<ColumnDef<DataGridFeatures, RoleDetail>[]>(
    () => [
      {
        id: "expand",
        header: () => null,
        cell: ({ row }) => {
          return row.getCanExpand() ? (
            <Button
              size="icon-xs"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
              onClick={row.getToggleExpandedHandler()}
              aria-label={
                row.getIsExpanded() ? "Collapse details" : "Expand details"
              }
            >
              {row.getIsExpanded() ? (
                <ChevronUpIcon className="size-3.5" />
              ) : (
                <ChevronDownIcon className="size-3.5" />
              )}
            </Button>
          ) : null
        },
        size: 36,
        enableSorting: false,
        enableResizing: false,
        meta: {
          skeleton: <Skeleton className="size-6 rounded-md" />,
          expandedContent: (role: RoleDetail) => (
            <PermissionsSubTable
              role={role}
              catalog={catalog}
              canUpdate={canUpdateRole && isPlanAllowed}
              onPermissionsChange={handleUpdateRolePermissions}
            />
          ),
        },
      },
      {
        accessorKey: "label",
        id: "label",
        header: ({ column }) => (
          <DataGridColumnHeader title="Role" column={column} />
        ),
        cell: ({ row }) => {
          const role = row.original
          return (
            <div className="flex items-center gap-2.5 py-1">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">
                    {role.label}
                  </span>
                  {role.is_owner ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-[11px] h-5"
                    >
                      <LockIcon className="size-3 mr-1" />
                      Owner
                    </Badge>
                  ) : role.is_system ? (
                    <Badge variant="secondary" className="text-[11px] h-5">
                      System Default
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="border-primary/30 text-primary text-[11px] h-5"
                    >
                      Custom Role
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )
        },
        meta: {
          skeleton: (
            <div className="flex items-center gap-2 py-1">
              <Skeleton className="h-5 w-28" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
          ),
        },
        size: 260,
        enableSorting: true,
      },
      {
        accessorKey: "members_count",
        id: "members_count",
        header: ({ column }) => (
          <DataGridColumnHeader title="Teammates" column={column} />
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <UsersIcon className="size-3.5" />
            <span>
              {row.original.members_count}{" "}
              {row.original.members_count === 1 ? "member" : "members"}
            </span>
          </div>
        ),
        meta: {
          skeleton: (
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-4 w-16" />
            </div>
          ),
        },
        size: 140,
        enableSorting: true,
      },
      {
        id: "permissions_count",
        accessorFn: (role) =>
          role.is_owner ? 9999 : role.permission_keys.length,
        header: ({ column }) => (
          <DataGridColumnHeader title="Permissions" column={column} />
        ),
        cell: ({ row }) => {
          if (row.original.is_owner) {
            return (
              <Badge
                variant="outline"
                className="border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-medium"
              >
                All access
              </Badge>
            )
          }
          return (
            <Badge variant="secondary" className="text-xs font-normal">
              {row.original.permission_keys.length} permissions
            </Badge>
          )
        },
        meta: {
          skeleton: <Skeleton className="h-5 w-24 rounded-full" />,
        },
        size: 160,
        enableSorting: true,
      },
      {
        id: "actions",
        header: () => null,
        cell: ({ row }) => {
          const role = row.original
          return (
            <div className="flex items-center justify-end gap-1">
              {canUpdateRole && isPlanAllowed && !role.is_owner && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => handleOpenEdit(role)}
                  className="text-muted-foreground hover:text-foreground"
                  title="Edit role"
                  aria-label={`Edit ${role.label} role`}
                >
                  <Edit3Icon className="size-3.5" />
                </Button>
              )}
              {canDeleteRole && !role.is_system && !role.is_owner && (
                <Button
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => handleOpenDelete(role)}
                  className="text-muted-foreground hover:text-destructive"
                  title="Delete role"
                  aria-label={`Delete ${role.label} role`}
                >
                  <Trash2Icon className="size-3.5" />
                </Button>
              )}
            </div>
          )
        },
        meta: {
          skeleton: (
            <div className="flex items-center justify-end gap-1">
              <Skeleton className="size-6 rounded-md" />
            </div>
          ),
        },
        size: 90,
        enableSorting: false,
        enableResizing: false,
      },
    ],
    [catalog, canUpdateRole, canDeleteRole, handleUpdateRolePermissions, isPlanAllowed]
  )

  const table = useTable<DataGridFeatures, RoleDetail>({
    features: dataGridFeatures,
    columns,
    data: roles,
    getRowId: (row) => row.id || row.name,
    getRowCanExpand: () => true,
    state: {
      pagination,
      sorting,
      expanded,
      globalFilter: search,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onExpandedChange: setExpanded,
    onGlobalFilterChange: setSearch,
    globalFilterFn: (row, _columnId, filterValue) => {
      const query = String(filterValue).trim().toLowerCase()
      if (!query) return true
      const role = row.original
      return (
        role.name.toLowerCase().includes(query) ||
        role.label.toLowerCase().includes(query) ||
        (role.description?.toLowerCase().includes(query) ?? false)
      )
    },
  })

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      {/* Error alert */}
      {error && (
        <div className="shrink-0 border-b border-destructive/20 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TriangleAlertIcon className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="xs"
            variant="ghost"
            onClick={() => setError(null)}
            className="text-destructive hover:bg-destructive/20"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Plan limitation banner for Basic plan */}
      {!loading && !isPlanAllowed && (
        <div className="shrink-0 border-b border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-foreground flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/20 p-1.5 text-amber-600 dark:text-amber-400 shrink-0">
              <SparklesIcon className="size-4" />
            </div>
            <div>
              <p className="font-medium text-sm">
                Custom roles and permissions are available on Growth and higher plans
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Upgrade your plan to create custom roles, tailor fine-grained permissions, and manage access control.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push("/settings?tab=billing")}
            className="shrink-0 gap-1.5 border-amber-500/30 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300 font-medium"
          >
            <SparklesIcon className="size-3.5 text-amber-500" />
            Upgrade plan
          </Button>
        </div>
      )}

      <DataGrid
        table={table}
        recordCount={table.getFilteredRowModel().rows.length}
        isLoading={loading}
        tableLayout={{
          headerBackground: true,
          rowBorder: true,
        }}
      >
        <div className="flex min-h-0 w-full flex-1 flex-col">
          {/* Top Toolbar */}
          <div className="shrink-0 flex items-center justify-between gap-3 border-b border-border px-4 py-2.5 bg-background">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search roles..."
                  className="pl-8 h-8 text-sm"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => handleSearchChange("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-3.5" />
                  </button>
                )}
              </div>
            </div>

            {canCreateRole && (
              isPlanAllowed ? (
                <Button onClick={handleOpenCreate}>
                  <PlusIcon />
                  Create role
                </Button>
              ) : (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="outline"
                        onClick={() => router.push("/settings?tab=billing")}
                        className="gap-1.5 border-amber-500/30 text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        <LockIcon className="size-3.5 text-amber-500" />
                        Create role
                      </Button>
                    }
                  />
                  <TooltipContent>
                    Upgrade to Growth or higher to create custom roles
                  </TooltipContent>
                </Tooltip>
              )
            )}
          </div>

          {/* Scrollable Data Grid Table Area */}
          <div className="min-h-0 flex-1 overflow-auto">
            <DataGridContainer>
              <DataGridScrollArea>
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
          </div>

          {/* Sticky Footer Pagination */}
          <div className="shrink-0 border-t border-border px-4 py-2 bg-background">
            <DataGridPagination sizes={[5, 10, 20]} />
          </div>
        </div>
      </DataGrid>

      {/* Role Create/Edit Dialog */}
      <RoleDialog
        open={roleDialogOpen}
        onOpenChange={setRoleDialogOpen}
        role={editingRole}
        onSave={handleSaveRole}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Custom Role</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the role{" "}
              <strong className="text-foreground">
                &ldquo;{roleToDelete?.label}&rdquo;
              </strong>
              ? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {roleToDelete && roleToDelete.members_count > 0 ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-xs text-destructive space-y-1.5">
              <div className="font-semibold flex items-center gap-1.5">
                <TriangleAlertIcon className="size-4 shrink-0" />
                Cannot delete role with assigned members
              </div>
              <p>
                There are currently{" "}
                <strong>{roleToDelete.members_count} member(s)</strong> assigned to
                this role. Please reassign them to another role in the Teammates tab
                before deleting this role.
              </p>
            </div>
          ) : null}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={
                deleting ||
                (roleToDelete !== null && roleToDelete.members_count > 0)
              }
            >
              {deleting ? (
                <>
                  <Spinner className="size-4 mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Role"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
