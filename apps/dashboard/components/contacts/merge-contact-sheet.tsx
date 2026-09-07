"use client"

import * as React from "react"
import {
  flexRender,
  useTable,
  type ColumnDef,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table"
import { dataGridFeatures, type DataGridFeatures } from "@/components/reui/data-grid/data-grid"
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  GitMergeIcon,
  SearchIcon,
} from "@/components/ui/icons"

import { cn } from "@/lib/utils"
import { ApiError } from "@/lib/api"
import { usePagination } from "@/hooks/use-pagination"
import { Alert, AlertDescription, AlertTitle } from "@/components/reui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { fetchContacts, mergeContact } from "@/components/contacts/api"
import type { ContactListItem } from "@/components/contacts/data"

const PAGE_SIZE_ITEMS = [
  { label: "5 / page", value: "5" },
  { label: "10 / page", value: "10" },
  { label: "25 / page", value: "25" },
]

interface MergeContactSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: number | string
  contactId: number | string
  contactName: string
  onMerged: () => void
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
}

export function MergeContactSheet({
  open,
  onOpenChange,
  organizationId,
  contactId,
  contactName,
  onMerged,
}: MergeContactSheetProps) {
  const [contacts, setContacts] = React.useState<ContactListItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [mergingId, setMergingId] = React.useState<string | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(
    null
  )
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: 5,
  })
  const [sorting, setSorting] = React.useState<SortingState>([
    { id: "name", desc: false },
  ])

  React.useEffect(() => {
    if (!open) return

    let isCurrent = true
    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)
    setSearch("")
    setPagination({ pageIndex: 0, pageSize: 5 })

    fetchContacts(organizationId)
      .then((data) => {
        if (isCurrent) setContacts(data)
      })
      .catch((err) => {
        if (isCurrent) {
          setError(
            err instanceof ApiError ? err.message : "Failed to load contacts."
          )
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [open, organizationId])

  const candidates = React.useMemo(() => {
    const excluded = String(contactId)
    const query = search.trim().toLowerCase()
    return contacts.filter((c) => {
      if (String(c.id) === excluded) return false
      if (!query) return true
      return (
        c.name.toLowerCase().includes(query) ||
        c.company.toLowerCase().includes(query) ||
        c.email.toLowerCase().includes(query)
      )
    })
  }, [contacts, contactId, search])

  const handleMerge = React.useCallback(
    (candidate: ContactListItem) => {
      setMergingId(candidate.id)
      setError(null)
      mergeContact(organizationId, contactId, candidate.id)
        .then(() => {
          onMerged()
          setSuccessMessage(`Merged ${candidate.name} into ${contactName}.`)
          setContacts((prev) => prev.filter((c) => c.id !== candidate.id))
          window.setTimeout(() => onOpenChange(false), 1500)
        })
        .catch((err) => {
          setError(
            err instanceof ApiError ? err.message : "Failed to merge contact."
          )
        })
        .finally(() => setMergingId(null))
    },
    [organizationId, contactId, contactName, onMerged, onOpenChange]
  )

  const columns = React.useMemo<ColumnDef<DataGridFeatures, ContactListItem>[]>(
    () => [
      {
        header: "Contact",
        accessorKey: "name",
        size: 220,
        cell: ({ row }) => {
          const contact = row.original
          return (
            <div className="flex items-center gap-2.5">
              <Avatar className="size-8">
                {contact.avatar ? (
                  <AvatarImage src={contact.avatar} alt="" />
                ) : null}
                <AvatarFallback className="text-xs font-medium">
                  {initials(contact.name)}
                </AvatarFallback>
              </Avatar>
              <span className="truncate text-sm font-medium">
                {contact.name}
              </span>
            </div>
          )
        },
      },
      {
        header: "Company",
        accessorKey: "company",
        size: 160,
        cell: ({ row }) => (
          <span className="truncate text-sm text-muted-foreground">
            {row.original.company || "—"}
          </span>
        ),
      },
      {
        header: "Email",
        accessorKey: "email",
        size: 220,
        cell: ({ row }) => (
          <span className="truncate text-sm text-muted-foreground">
            {row.original.email || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        size: 110,
        enableSorting: false,
        cell: ({ row }) => {
          const contact = row.original
          const isMerging = mergingId === contact.id
          return (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={mergingId !== null}
                onClick={() => handleMerge(contact)}
              >
                {isMerging ? (
                  <Spinner data-icon="inline-start" />
                ) : (
                  <GitMergeIcon data-icon="inline-start" aria-hidden="true" />
                )}
                Merge
              </Button>
            </div>
          )
        },
      },
    ],
    [handleMerge, mergingId]
  )

  const table = useTable({
    features: dataGridFeatures,
    data: candidates,
    columns,
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    onPaginationChange: setPagination,
    state: { sorting, pagination },
  })

  const { pages, showLeftEllipsis, showRightEllipsis } = usePagination({
    currentPage: table.state.pagination.pageIndex + 1,
    totalPages: table.getPageCount(),
    paginationItemsToDisplay: 5,
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="min-w-svh"
      >
        <SheetHeader>
          <SheetTitle>Merge contact</SheetTitle>
          <SheetDescription>
            Search for a contact to merge into {contactName}. This can&apos;t
            be undone.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <SearchIcon
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search contacts by name, company, or email…"
              className="h-auto border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
            />
          </div>

          {successMessage ? (
            <Alert variant="success">
              <CheckCircle2Icon />
              <AlertTitle>Merged</AlertTitle>
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-xl border border-border">
                <Table className="table-fixed">
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow
                        key={headerGroup.id}
                        className="hover:bg-transparent"
                      >
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            style={{ width: header.getSize() }}
                            className="h-10"
                          >
                            {header.isPlaceholder ? null : header.column.getCanSort() ? (
                              <div
                                className={cn(
                                  header.column.getCanSort() &&
                                    "flex h-full cursor-pointer items-center gap-1.5 select-none"
                                )}
                                onClick={header.column.getToggleSortingHandler()}
                                onKeyDown={(e) => {
                                  if (
                                    header.column.getCanSort() &&
                                    (e.key === "Enter" || e.key === " ")
                                  ) {
                                    e.preventDefault()
                                    header.column.getToggleSortingHandler()?.(e)
                                  }
                                }}
                                tabIndex={header.column.getCanSort() ? 0 : undefined}
                              >
                                {flexRender(
                                  header.column.columnDef.header,
                                  header.getContext()
                                )}
                                {{
                                  asc: (
                                    <ChevronUpIcon
                                      className="size-3.5 shrink-0 opacity-60"
                                      aria-hidden="true"
                                    />
                                  ),
                                  desc: (
                                    <ChevronDownIcon
                                      className="size-3.5 shrink-0 opacity-60"
                                      aria-hidden="true"
                                    />
                                  ),
                                }[header.column.getIsSorted() as string] ?? null}
                              </div>
                            ) : (
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows.length > 0 ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                          {row.getVisibleCells().map((cell) => (
                            <TableCell
                              key={cell.id}
                              style={{ width: cell.column.getSize() }}
                            >
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext()
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow className="hover:bg-transparent">
                        <TableCell
                          colSpan={columns.length}
                          className="h-24 text-center text-sm text-muted-foreground"
                        >
                          {search
                            ? "No matching contacts found."
                            : "No other contacts to merge."}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {candidates.length > 0 && (
                <div className="flex items-center justify-between gap-3 max-sm:flex-col">
                  <p
                    className="flex-1 text-sm whitespace-nowrap text-muted-foreground"
                    aria-live="polite"
                  >
                    Page{" "}
                    <span className="text-foreground">
                      {table.state.pagination.pageIndex + 1}
                    </span>{" "}
                    of{" "}
                    <span className="text-foreground">
                      {table.getPageCount() || 1}
                    </span>
                  </p>
                  <Pagination className="mx-0 w-fit">
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => table.previousPage()}
                          disabled={!table.getCanPreviousPage()}
                          aria-label="Go to previous page"
                        >
                          <ChevronLeftIcon aria-hidden="true" />
                        </Button>
                      </PaginationItem>
                      {showLeftEllipsis && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      {pages.map((page) => {
                        const isActive =
                          page === table.state.pagination.pageIndex + 1
                        return (
                          <PaginationItem key={page}>
                            <Button
                              size="icon-sm"
                              variant={isActive ? "outline" : "ghost"}
                              onClick={() => table.setPageIndex(page - 1)}
                              aria-current={isActive ? "page" : undefined}
                            >
                              {page}
                            </Button>
                          </PaginationItem>
                        )
                      })}
                      {showRightEllipsis && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <Button
                          size="icon-sm"
                          variant="outline"
                          className="disabled:pointer-events-none disabled:opacity-50"
                          onClick={() => table.nextPage()}
                          disabled={!table.getCanNextPage()}
                          aria-label="Go to next page"
                        >
                          <ChevronRightIcon aria-hidden="true" />
                        </Button>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <div className="flex flex-1 justify-end">
                    <Select
                      value={String(table.state.pagination.pageSize)}
                      onValueChange={(value) => table.setPageSize(Number(value))}
                    >
                      <SelectTrigger
                        size="sm"
                        className="w-fit whitespace-nowrap"
                        aria-label="Results per page"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="end">
                        {PAGE_SIZE_ITEMS.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
