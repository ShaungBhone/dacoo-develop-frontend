"use client"

import * as React from "react"
import {
  type PermissionModule,
  type RoleDetail,
} from "@/components/organization/data"
import { Badge } from "@/components/reui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  CheckIcon,
  LockIcon,
} from "@/components/ui/icons"
import {
  FunnelIcon,
  SearchIcon,
  XIcon,
} from "lucide-react"
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame"
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
  PaginationState,
  SortingState,
  useTable,
} from "@tanstack/react-table"
import { TypographySmall } from "../ui/typography"

export type PermissionRow = {
  key: string
  label: string
  description: string
  moduleKey: string
  moduleLabel: string
}

type PermissionsSubTableProps = {
  role: RoleDetail
  catalog: PermissionModule[]
  canUpdate: boolean
  onPermissionsChange: (roleId: string, permissions: string[]) => Promise<void>
}

export function PermissionsSubTable({
  role,
  catalog,
  canUpdate,
  onPermissionsChange,
}: PermissionsSubTableProps) {
  const isOwner = role.is_owner

  const allPermissions = React.useMemo<PermissionRow[]>(() => {
    return catalog.flatMap((mod) =>
      mod.permissions.map((p) => ({
        key: p.key,
        label: p.label,
        description: p.description,
        moduleKey: mod.key,
        moduleLabel: mod.label,
      }))
    )
  }, [catalog])

  const [selectedModules, setSelectedModules] = React.useState<string[]>([])
  const [searchQuery, setSearchQuery] = React.useState<string>("")
  const [saving, setSaving] = React.useState<boolean>(false)
  const [saveStatus, setSaveStatus] = React.useState<"idle" | "saving" | "saved">("idle")

  const currentKeys = React.useMemo(
    () => new Set(role.permission_keys ?? []),
    [role.permission_keys]
  )

  const filteredPermissions = React.useMemo(() => {
    return allPermissions.filter((item) => {
      // Filter by module
      const matchesModule =
        !selectedModules?.length || selectedModules.includes(item.moduleKey)

      // Filter by search query (case-insensitive)
      const searchLower = searchQuery.toLowerCase()
      const matchesSearch =
        !searchQuery ||
        item.label.toLowerCase().includes(searchLower) ||
        item.key.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower)

      return matchesModule && matchesSearch
    })
  }, [allPermissions, searchQuery, selectedModules])

  const handleModuleChange = (checked: boolean, value: string) => {
    setSelectedModules((prev = []) =>
      checked ? [...prev, value] : prev.filter((v) => v !== value)
    )
    setPagination((p) => ({ ...p, pageIndex: 0 }))
  }

  const allVisibleGranted =
    filteredPermissions.length > 0 &&
    filteredPermissions.every((p) => currentKeys.has(p.key))
  const someVisibleGranted =
    filteredPermissions.some((p) => currentKeys.has(p.key))

  const handleToggle = React.useCallback(
    async (key: string, enabled: boolean) => {
      if (isOwner || !canUpdate || saving) return
      const next = new Set(currentKeys)
      if (enabled) {
        next.add(key)
      } else {
        next.delete(key)
      }
      const nextKeys = Array.from(next)

      setSaving(true)
      setSaveStatus("saving")
      try {
        await onPermissionsChange(role.id, nextKeys)
        setSaveStatus("saved")
        setTimeout(() => {
          setSaveStatus("idle")
        }, 2000)
      } catch {
        setSaveStatus("idle")
      } finally {
        setSaving(false)
      }
    },
    [isOwner, canUpdate, saving, currentKeys, onPermissionsChange, role.id]
  )

  const handleToggleAllVisible = React.useCallback(
    async (enableAll: boolean) => {
      if (isOwner || !canUpdate || saving) return
      const next = new Set(currentKeys)
      for (const p of filteredPermissions) {
        if (enableAll) {
          next.add(p.key)
        } else {
          next.delete(p.key)
        }
      }
      const nextKeys = Array.from(next)

      setSaving(true)
      setSaveStatus("saving")
      try {
        await onPermissionsChange(role.id, nextKeys)
        setSaveStatus("saved")
        setTimeout(() => {
          setSaveStatus("idle")
        }, 2000)
      } catch {
        setSaveStatus("idle")
      } finally {
        setSaving(false)
      }
    },
    [
      isOwner,
      canUpdate,
      saving,
      currentKeys,
      filteredPermissions,
      onPermissionsChange,
      role.id,
    ]
  )

  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 8,
  })
  const [sorting, setSorting] = React.useState<SortingState>([])

  const columns = React.useMemo<ColumnDef<DataGridFeatures, PermissionRow>[]>(
    () => [
      {
        id: "select",
        header: () => (
          <div className="flex items-center justify-center p-1">
            <Checkbox
              checked={allVisibleGranted}
              indeterminate={!allVisibleGranted && someVisibleGranted}
              onCheckedChange={(checked) =>
                handleToggleAllVisible(Boolean(checked))
              }
              disabled={isOwner || !canUpdate || saving}
              aria-label="Select or deselect all visible permissions"
            />
          </div>
        ),
        cell: ({ row }) => {
          const item = row.original
          const checked = isOwner || currentKeys.has(item.key)

          return (
            <div className="flex items-center justify-center p-1">
              <Checkbox
                checked={checked}
                onCheckedChange={(val) => handleToggle(item.key, Boolean(val))}
                disabled={isOwner || !canUpdate || saving}
                aria-label={`Toggle ${item.label} permission`}
              />
            </div>
          )
        },
        size: 35,
        enableSorting: false,
        enableResizing: false,
        meta: {
          headerClassName: "",
          cellClassName: "",
          skeleton: (
            <div className="flex items-center justify-center p-1">
              <Skeleton className="size-4 rounded-xs" />
            </div>
          ),
        },
      },
      {
        accessorKey: "label",
        id: "label",
        header: ({ column }) => (
          <DataGridColumnHeader title="Permission" column={column} />
        ),
        cell: ({ row }) => {
          const item = row.original
          return (
            <div className="flex flex-col items-start gap-1">
              <span className="text-sm font-medium text-foreground whitespace-nowrap">
                {item.key}
              </span>
              <code className="text-[11px] font-medium text-muted-foreground">
                {item.label}
              </code>
            </div>
          )
        },
        meta: {
          skeleton: (
            <div className="flex items-center gap-2 py-0.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          ),
        },
        size: 280,
        enableSorting: true,
      },
      {
        accessorKey: "moduleLabel",
        id: "moduleLabel",
        header: ({ column }) => (
          <DataGridColumnHeader title="Module" column={column} />
        ),
        cell: ({ row }) => (
          <TypographySmall>{row.original.moduleLabel}</TypographySmall>
        ),
        meta: {
          skeleton: <Skeleton className="h-5 w-16 rounded-full" />,
        },
        size: 130,
        enableSorting: true,
      },
      {
        accessorKey: "description",
        id: "description",
        header: ({ column }) => (
          <DataGridColumnHeader title="Description" column={column} />
        ),
        cell: ({ row }) => (
          <div className="text-muted-foreground text-xs line-clamp-2 leading-relaxed">
            {row.original.description}
          </div>
        ),
        meta: {
          skeleton: <Skeleton className="h-4 w-56" />,
        },
        size: 320,
        enableSorting: false,
      },
    ],
    [
      allVisibleGranted,
      someVisibleGranted,
      currentKeys,
      isOwner,
      canUpdate,
      saving,
      handleToggle,
      handleToggleAllVisible,
    ]
  )

  const table = useTable<DataGridFeatures, PermissionRow>({
    features: dataGridFeatures,
    columns,
    data: filteredPermissions,
    getRowId: (row) => row.key,
    state: {
      pagination,
      sorting,
    },
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
  })

  return (
    <div className="p-3.5 sm:p-5 min-w-0 max-w-full">
      <DataGrid
        table={table}
        recordCount={filteredPermissions.length}
        tableLayout={{
          columnsVisibility: true,
          headerSticky: true,
          width: "fixed",
        }}
        tableClassNames={{
          base: "min-w-[765px]"
        }}
      >
        <Frame className="w-full bg-muted/50" stacked dense>
          <FrameHeader className="flex w-full flex-row flex-wrap items-center justify-between gap-3">
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2.5">
                <FrameTitle>Permissions Matrix</FrameTitle>
                {isOwner ? (
                  <Badge size="sm" variant="warning-outline">
                    <LockIcon className="size-3 mr-1" />
                    Full Access Locked
                  </Badge>
                ) : !canUpdate ? (
                  <>
                    <Badge size="sm" variant="primary-light">
                      {currentKeys.size} of {allPermissions.length} granted
                    </Badge>
                    <Badge
                      size="sm"
                      variant="outline"
                      className="border-amber-500/30 text-amber-600 dark:text-amber-400 gap-1 text-[11px]"
                    >
                      <LockIcon className="size-3" />
                      Read-only
                    </Badge>
                  </>
                ) : (
                  <Badge size="sm" variant="primary-light">
                    {currentKeys.size} of {allPermissions.length} granted
                  </Badge>
                )}
              </div>
              <FrameDescription>
                {role.description ||
                  "Configure fine-grained access permissions for this workspace role."}
              </FrameDescription>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Live Saving Status */}
              {saveStatus === "saving" && (
                <div
                  className="flex items-center gap-1.5 text-xs text-muted-foreground animate-pulse"
                  aria-live="polite"
                >
                  <Spinner className="size-3" />
                  <span>Saving…</span>
                </div>
              )}
              {saveStatus === "saved" && (
                <div
                  className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium"
                  aria-live="polite"
                >
                  <CheckIcon className="size-3.5" />
                  <span>All changes saved</span>
                </div>
              )}

              <InputGroup className="bg-background w-48">
                <InputGroupAddon align="inline-start">
                  <SearchIcon className="size-4 text-muted-foreground" />
                </InputGroupAddon>

                <InputGroupInput
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPagination((p) => ({ ...p, pageIndex: 0 }))
                  }}
                />

                {searchQuery.length > 0 && (
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label="Clear search"
                      title="Clear"
                      size="icon-xs"
                      onClick={() => {
                        setSearchQuery("")
                        setPagination((p) => ({ ...p, pageIndex: 0 }))
                      }}
                    >
                      <XIcon className="size-3.5" />
                    </InputGroupButton>
                  </InputGroupAddon>
                )}
              </InputGroup>

              <Popover>
                <PopoverTrigger
                  render={
                    <Button variant="outline">
                      <FunnelIcon className="size-3.5" />
                      Module
                      {selectedModules.length > 0 && (
                        <Badge size="sm" variant="info-outline">
                          {selectedModules.length}
                        </Badge>
                      )}
                    </Button>
                  }
                />
                <PopoverContent className="w-48" align="start">
                  <div className="space-y-3">
                    <div className="text-muted-foreground text-xs font-medium">
                      Filter by Module
                    </div>
                    <div className="space-y-3">
                      {catalog.map((mod) => (
                        <div key={mod.key} className="flex items-center gap-2.5">
                          <Checkbox
                            id={`mod-${mod.key}`}
                            checked={selectedModules.includes(mod.key)}
                            onCheckedChange={(checked) =>
                              handleModuleChange(checked === true, mod.key)
                            }
                          />
                          <Label
                            htmlFor={`mod-${mod.key}`}
                            className="flex grow items-center justify-between gap-1.5 font-normal text-xs"
                          >
                            {mod.label}
                            <span className="text-muted-foreground">
                              {mod.permissions.length}
                            </span>
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              {!isOwner && canUpdate && (
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={() => handleToggleAllVisible(!allVisibleGranted)}
                >
                  {allVisibleGranted ? "Revoke visible" : "Grant visible"}
                </Button>
              )}
            </div>
          </FrameHeader>

          <FramePanel className="p-0 shadow-none">
            <DataGridContainer>
              <DataGridScrollArea className="max-h-96 **:data-[slot=scroll-area-viewport]:max-h-96">
                <DataGridTable />
              </DataGridScrollArea>
            </DataGridContainer>
          </FramePanel>

          <FrameFooter className="py-1.5 pr-2 pl-2.5">
            <DataGridPagination sizes={[5, 8, 15, 30]} />
          </FrameFooter>
        </Frame>
      </DataGrid>
    </div>
  )
}
